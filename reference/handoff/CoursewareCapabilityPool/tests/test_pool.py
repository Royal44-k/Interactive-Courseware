"""Version and record invariants; fixtures never fetch or execute upstream code."""
import copy
import importlib.util
import json
import shutil
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("pool", ROOT / "scripts/pool.py")
pool = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pool)


class PoolTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        self.root = self.base / "pool"
        self.root.mkdir()
        shutil.copy(ROOT / "registry.json", self.root)
        shutil.copytree(ROOT / "entries", self.root / "entries")
        self.path, self.card = pool.find(self.root, "anatomy")
        self.sha = self.card["evidence"]["current_version"]["commit_sha"]
        self.new_sha = "f" * 40 if self.sha != "f" * 40 else "a" * 40
        self.project = self.base / "project"

    def tearDown(self):
        self.tmp.cleanup()

    def changed(self):
        return pool.check(self.root, "anatomy", lambda c: {
            "sha": self.new_sha, "source": "https://api.github.com/fixture", "etag": "new"})

    def result(self, **overrides):
        data = {"project": "fixture", "commit_sha": self.sha, "purpose": "module",
                "status": "tested", "checks": ["fixture check"], "evidence": ["fixture report"], "limitations": []}
        data.update(overrides)
        p = self.base / "result.json"
        pool.write(p, data)
        return p

    def test_seed_catalog_valid(self):
        self.assertEqual(pool.validate_pool(self.root), {"valid": True, "entries": 1})

    def test_null_is_not_version_match(self):
        c = copy.deepcopy(self.card)
        c["evidence"]["current_version"]["commit_sha"] = None
        c["upstream_current"]["commit_sha"] = None
        c["upstream_current"]["needs_review"] = False
        with self.assertRaises(ValueError): pool.validate_card(c)
        c["upstream_current"]["needs_review"] = True
        pool.write(self.path, c)
        with self.assertRaises(ValueError): pool.lock(self.root, "anatomy", self.project, True)

    def test_new_head_never_promotes_review_or_history(self):
        old_evidence = copy.deepcopy(self.card["evidence"])
        state = self.changed()
        c = pool.read(self.path)
        self.assertTrue(state["needs_review"])
        self.assertEqual(c["evidence"], old_evidence)
        self.assertEqual(c["upstream_current"]["sources"], [])
        self.assertIn(self.new_sha, c["upstream_current"]["version_label"])

    def test_remote_failure_leaves_records_byte_identical(self):
        old_card = self.path.read_bytes()
        old_index = (self.root / "registry.json").read_bytes()
        def fail(c): raise urllib.error.URLError("offline")
        with self.assertRaises(OSError): pool.check(self.root, "anatomy", fail)
        self.assertEqual(self.path.read_bytes(), old_card)
        self.assertEqual((self.root / "registry.json").read_bytes(), old_index)

    def test_invalid_remote_sha_does_not_write(self):
        before = self.path.read_bytes()
        with self.assertRaises(ValueError):
            pool.check(self.root, "anatomy", lambda c: {"sha": "main", "source": "fixture"})
        self.assertEqual(self.path.read_bytes(), before)

    def test_lock_writes_only_project_and_pins_url(self):
        before = self.path.read_bytes()
        result = pool.lock(self.root, "anatomy", self.project)
        saved = pool.read(result["lock"])
        self.assertIn("/" + self.sha + "/", saved["skill_url"])
        self.assertEqual(saved["selection"], "reviewed-current")
        self.assertEqual(self.path.read_bytes(), before)
        self.assertEqual(len(list(self.project.rglob("*.json"))), 1)

    def test_changed_head_requires_analysis_or_explicit_old_selection(self):
        self.changed()
        with self.assertRaises(ValueError): pool.lock(self.root, "anatomy", self.project)
        result = pool.lock(self.root, "anatomy", self.project, True)
        self.assertEqual(pool.read(result["lock"])["selection"], "explicit-reviewed-version")
        self.assertEqual(result["sha"], self.sha)

    def test_existing_project_not_silently_upgraded(self):
        original = pool.lock(self.root, "anatomy", self.project)
        c = pool.read(self.path)
        c["upstream_current"]["commit_sha"] = self.new_sha
        c["evidence"]["current_version"]["commit_sha"] = self.new_sha
        pool.write(self.path, c)
        with self.assertRaises(ValueError): pool.lock(self.root, "anatomy", self.project)
        self.assertEqual(pool.read(original["lock"])["commit_sha"], self.sha)

    def test_repeat_lock_is_idempotent(self):
        first = pool.lock(self.root, "anatomy", self.project)
        before = Path(first["lock"]).read_bytes()
        second = pool.lock(self.root, "anatomy", self.project)
        self.assertTrue(second["unchanged"])
        self.assertEqual(Path(first["lock"]).read_bytes(), before)

    def test_record_preserves_current_evidence(self):
        before = self.path.read_bytes()
        pool.record_use(self.root, "anatomy", self.result())
        self.assertEqual(self.path.read_bytes(), before)
        records = (self.root / "usage/anatomy.jsonl").read_text().splitlines()
        self.assertEqual(len(records), 1)
        self.assertEqual(json.loads(records[0])["commit_sha"], self.sha)

    def test_unknown_used_version_requires_explanation(self):
        with self.assertRaises(ValueError):
            pool.record_use(self.root, "anatomy", self.result(commit_sha=None))
        pool.record_use(self.root, "anatomy", self.result(commit_sha=None, version_note="legacy unrecorded"))

    def test_tested_record_requires_evidence(self):
        with self.assertRaises(ValueError):
            pool.record_use(self.root, "anatomy", self.result(evidence=[]))

    def test_add_new_entry_updates_index_without_touching_anatomy(self):
        c = copy.deepcopy(self.card)
        c["id"], c["repository"] = "fixture", "https://github.com/example/fixture"
        source = self.base / "new.json"
        pool.write(source, c)
        detail = self.base / "detail.md"
        detail.write_text("fixture analysis")
        before = self.path.read_bytes()
        pool.add(self.root, source, detail)
        self.assertEqual(pool.validate_pool(self.root)["entries"], 2)
        self.assertEqual(self.path.read_bytes(), before)

    def test_duplicate_repository_entry_rejected(self):
        c = copy.deepcopy(self.card)
        c["id"] = "duplicate"
        source = self.base / "new.json"
        pool.write(source, c)
        detail = self.base / "detail.md"
        detail.write_text("fixture")
        with self.assertRaises(ValueError): pool.add(self.root, source, detail)

    def test_registry_path_cannot_escape_pool(self):
        data = pool.registry(self.root)
        data["entries"][0]["card"] = "../outside.json"
        pool.write(self.root / "registry.json", data)
        with self.assertRaises(ValueError): pool.validate_pool(self.root)

    def test_304_keeps_known_sha(self):
        c = copy.deepcopy(self.card)
        c["upstream_current"]["etag"] = "fixture-etag"
        error = urllib.error.HTTPError("https://api.github.com/fixture", 304, "Not Modified", {}, None)
        with patch.object(pool.urllib.request, "urlopen", side_effect=error):
            result = pool.fetch_head(c)
        self.assertEqual(result["sha"], self.sha)


if __name__ == "__main__":
    unittest.main(verbosity=2)
