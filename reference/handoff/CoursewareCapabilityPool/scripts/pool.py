#!/usr/bin/env python3
"""Manage a local courseware capability index. Never installs or executes upstream code."""
import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
ID = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")
SHA = re.compile(r"[0-9a-f]{40}\Z")
LEVELS = {"unreviewed", "reviewed", "tested", "used"}


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def local(root, relative):
    p = (root / relative).resolve()
    if not p.is_relative_to(root.resolve()):
        raise ValueError("池内引用不得指向池外: " + relative)
    return p


def repo_parts(url):
    u = urllib.parse.urlparse(url)
    parts = u.path.rstrip("/").removesuffix(".git").strip("/").split("/")
    if u.scheme != "https" or u.netloc != "github.com" or len(parts) != 2:
        raise ValueError("repository须为HTTPS GitHub仓库根地址")
    if any(not re.fullmatch(r"[A-Za-z0-9_.-]+", x) or x in {".", ".."} for x in parts):
        raise ValueError("仓库路径无效")
    if u.query or u.fragment:
        raise ValueError("仓库根地址不能带查询参数或片段")
    return parts


def valid_sha(value):
    return isinstance(value, str) and bool(SHA.fullmatch(value))


def validate_card(card):
    required = {"schema_version", "id", "name", "repository", "branch", "skill_path",
                "summary", "tags", "inputs", "outputs", "suitable_for", "unsuitable_for",
                "dependencies", "offline", "visual_adaptation", "license", "upstream_current", "evidence"}
    missing = required - card.keys()
    if missing:
        raise ValueError("卡片缺字段: " + ", ".join(sorted(missing)))
    if card["schema_version"] != "1.0" or not ID.fullmatch(card["id"]):
        raise ValueError("卡片版本或id无效")
    repo_parts(card["repository"])
    sp = Path(card["skill_path"])
    if sp.is_absolute() or ".." in sp.parts or not card["skill_path"]:
        raise ValueError("skill_path须为仓库内相对入口")
    for field in ("name", "branch", "summary"):
        if not isinstance(card[field], str) or not card[field].strip():
            raise ValueError(field + "须为非空文本")
    for field in ("inputs", "outputs", "suitable_for", "unsuitable_for", "visual_adaptation"):
        if not isinstance(card[field], list):
            raise ValueError(field + "须为列表")
    if any(not isinstance(card["tags"].get(k), list) for k in ("teaching", "interaction", "output")):
        raise ValueError("tags须含teaching/interaction/output列表")
    if any(not isinstance(card["dependencies"].get(k), list) for k in ("build", "runtime")):
        raise ValueError("dependencies须区分build/runtime")
    evidence = card["evidence"]
    if evidence.get("level") not in LEVELS:
        raise ValueError("证据level无效")
    if not isinstance(evidence.get("historical_verified_versions"), list):
        raise ValueError("缺少独立的历史证据列表")
    current = evidence.get("current_version", {})
    upstream = card["upstream_current"]
    for value in (current.get("commit_sha"), upstream.get("commit_sha")):
        if value is not None and not valid_sha(value):
            raise ValueError("commit_sha必须为40位小写SHA或null")
    reviewed = current.get("commit_sha")
    observed = upstream.get("commit_sha")
    needs_review = not reviewed or not observed or reviewed != observed
    if upstream.get("needs_review") != needs_review:
        raise ValueError("needs_review与上游/已分析版本不一致；null不能视为匹配")
    if not isinstance(current.get("executed"), bool) or not isinstance(current.get("tested"), bool):
        raise ValueError("当前版本须明确executed/tested布尔值")
    if evidence["level"] in {"tested", "used"} and (not reviewed or not current["tested"]):
        raise ValueError("tested/used必须有固定版本及实际测试声明")
    return card


def registry(root):
    data = read(root / "registry.json")
    if data.get("schema_version") != "1.0" or not isinstance(data.get("entries"), list):
        raise ValueError("registry结构无效")
    return data


def find(root, entry_id):
    rows = [x for x in registry(root)["entries"] if x["id"] == entry_id]
    if len(rows) != 1:
        raise ValueError("找不到唯一条目: " + entry_id)
    path = local(root, rows[0]["card"])
    return path, validate_card(read(path))


def validate_pool(root):
    data = registry(root)
    seen = set()
    for row in data["entries"]:
        if row["id"] in seen:
            raise ValueError("重复id: " + row["id"])
        seen.add(row["id"])
        card = validate_card(read(local(root, row["card"])))
        if card["id"] != row["id"] or not isinstance(row.get("summary"), str) or not row["summary"].strip():
            raise ValueError("索引与卡片不一致: " + row["id"])
        if not local(root, row["detail"]).is_file():
            raise ValueError("缺少说明卡: " + row["detail"])
    return {"valid": True, "entries": len(seen)}


def add(root, card_path, detail_path):
    card = validate_card(read(card_path))
    detail = Path(detail_path).read_text(encoding="utf-8")
    if not detail.strip():
        raise ValueError("说明卡不能为空")
    data = registry(root)
    for row in data["entries"]:
        old = read(local(root, row["card"]))
        if row["id"] != card["id"] and (old["repository"], old["skill_path"]) == (card["repository"], card["skill_path"]):
            raise ValueError("同一仓库入口已有条目，请更新原id")
    entry_id = card["id"]
    row = {"id": entry_id, "summary": card["summary"],
           "tags": [prefix + "/" + tag for key, prefix in (("teaching", "教学"), ("interaction", "交互"), ("output", "输出")) for tag in card["tags"][key]],
           "card": "entries/" + entry_id + ".json", "detail": "entries/" + entry_id + ".md"}
    write(local(root, row["card"]), card)
    local(root, row["detail"]).write_text(detail, encoding="utf-8")
    data["entries"] = [x for x in data["entries"] if x["id"] != entry_id] + [row]
    data["updated_at"] = now()
    write(root / "registry.json", data)
    return {"saved": entry_id}


def fetch_head(card):
    owner, name = repo_parts(card["repository"])
    ref = urllib.parse.quote(card["branch"], safe="")
    url = "https://api.github.com/repos/" + owner + "/" + name + "/commits/" + ref
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "InteractiveCourseware/1.2"}
    previous = card["upstream_current"]
    if previous.get("etag") and valid_sha(previous.get("commit_sha")):
        headers["If-None-Match"] = previous["etag"]
    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.load(response)
            sha, etag = result.get("sha"), response.headers.get("ETag")
            commit_date = result.get("commit", {}).get("committer", {}).get("date")
            commit_url = result.get("html_url")
    except urllib.error.HTTPError as error:
        if error.code != 304 or not valid_sha(previous.get("commit_sha")):
            raise
        sha, etag = previous["commit_sha"], previous.get("etag")
        commit_date, commit_url = previous.get("commit_date"), previous.get("commit_url")
    if not valid_sha(sha):
        raise ValueError("GitHub未返回有效精确提交，保留旧记录")
    return {"sha": sha, "etag": etag, "source": url, "commit_date": commit_date, "commit_url": commit_url}


def check(root, entry_id, fetcher=fetch_head):
    path, card = find(root, entry_id)
    result = fetcher(card)
    if not valid_sha(result["sha"]):
        raise ValueError("上游提交无效，未更新记录")
    old = card["upstream_current"].get("commit_sha")
    reviewed = card["evidence"]["current_version"].get("commit_sha")
    needs_review = not reviewed or result["sha"] != reviewed
    card["upstream_current"].update({"checked_on": now(), "commit_sha": result["sha"],
        "commit_status": "verified", "commit_source": result["source"], "etag": result.get("etag"),
        "version_label": card["branch"] + "@" + result["sha"],
        "commit_date": result.get("commit_date"), "commit_url": result.get("commit_url"),
        "needs_review": needs_review, "needs_review_reason": "上游与已分析版本不同或缺少分析版本" if needs_review else None})
    if old != result["sha"]:
        card["upstream_current"]["sources"] = []
    validate_card(card)
    write(path, card)
    data = registry(root)
    data["updated_at"] = now()
    write(root / "registry.json", data)
    return {"id": entry_id, "sha": result["sha"], "changed": old != result["sha"],
            "needs_review": card["upstream_current"]["needs_review"]}


def lock(root, entry_id, project, reviewed_version=False):
    _, card = find(root, entry_id)
    reviewed = card["evidence"]["current_version"].get("commit_sha")
    if not valid_sha(reviewed) or card["evidence"]["level"] == "unreviewed":
        raise ValueError("缺少已分析的精确版本，不能锁定")
    upstream = card["upstream_current"]
    if not reviewed_version and (upstream["needs_review"] or upstream["commit_sha"] != reviewed):
        raise ValueError("上游版本待分析；先更新能力卡，或明确选择--reviewed-version")
    owner, name = repo_parts(card["repository"])
    record = {"schema_version": "1.0", "id": entry_id, "repository": card["repository"],
              "commit_sha": reviewed, "skill_path": card["skill_path"], "locked_at": now(),
              "selection": "explicit-reviewed-version" if reviewed_version else "reviewed-current",
              "upstream_last_checked": upstream.get("checked_on"),
              "skill_url": "https://raw.githubusercontent.com/" + owner + "/" + name + "/" + reviewed + "/" + card["skill_path"],
              "note": "仅固定引用，不下载、不安装、不执行上游代码；不代表本课效果已验证。"}
    destination = Path(project).resolve() / ".courseware-capabilities" / (entry_id + ".lock.json")
    if destination.exists():
        old = read(destination)
        if old.get("commit_sha") != reviewed:
            raise ValueError("项目已锁定另一版本；评估升级并备份原锁后才能更新，不静默升级")
        return {"lock": str(destination), "sha": reviewed, "unchanged": True}
    write(destination, record)
    return {"lock": str(destination), "sha": reviewed, "unchanged": False}


def record_use(root, entry_id, result_path):
    find(root, entry_id)
    result = read(result_path)
    required = {"project", "commit_sha", "purpose", "status", "checks", "evidence", "limitations"}
    if required - result.keys():
        raise ValueError("使用记录缺字段: " + ", ".join(sorted(required - result.keys())))
    if result["status"] not in {"reference_only", "generated", "run", "tested", "delivered", "failed"}:
        raise ValueError("使用状态无效")
    if result["commit_sha"] is not None and not valid_sha(result["commit_sha"]):
        raise ValueError("使用版本无效")
    if result["commit_sha"] is None and not result.get("version_note"):
        raise ValueError("未知版本必须说明原因")
    if any(not isinstance(result[k], list) for k in ("checks", "evidence", "limitations")):
        raise ValueError("checks/evidence/limitations须为列表")
    if result["status"] in {"tested", "delivered"} and (not result["checks"] or not result["evidence"]):
        raise ValueError("测试或交付记录须有检查方法及证据")
    path = root / "usage" / (entry_id + ".jsonl")
    path.parent.mkdir(parents=True, exist_ok=True)
    result.update({"id": entry_id, "recorded_at": now()})
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(result, ensure_ascii=False) + "\n")
    return {"recorded": str(path), "note": "未自动提升当前版本证据等级"}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("list")
    commands.add_parser("validate")
    p = commands.add_parser("add")
    p.add_argument("card", type=Path)
    p.add_argument("--detail", required=True, type=Path)
    p = commands.add_parser("check")
    p.add_argument("id")
    p = commands.add_parser("lock")
    p.add_argument("id")
    p.add_argument("--project", required=True, type=Path)
    p.add_argument("--reviewed-version", action="store_true")
    p = commands.add_parser("record")
    p.add_argument("id")
    p.add_argument("--result", required=True, type=Path)
    args = parser.parse_args(argv)
    root = args.root.resolve()
    try:
        if args.command == "list": result = registry(root)["entries"]
        elif args.command == "validate": result = validate_pool(root)
        elif args.command == "add": result = add(root, args.card, args.detail)
        elif args.command == "check": result = check(root, args.id)
        elif args.command == "lock": result = lock(root, args.id, args.project, args.reviewed_version)
        else: result = record_use(root, args.id, args.result)
    except (OSError, ValueError, KeyError, TypeError) as error:
        print("未完成: " + str(error), file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
