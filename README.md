# 山海行歌 · Interactive Courseware

李白《行路难·其一》×《蜀道难》的中英双语沉浸式互动课件。最新版 **V3.0**，修订日期 **2026-10-30**。

李太白邀君同游，诗吟蜀道之险峻，歌咏云海之壮丽。

## 使用课件

**推荐下载 [V3.0 完整离线包](https://github.com/Royal44-k/Interactive-Courseware/releases/download/v3.0-20261030/shanhai-xingge-v3.0-offline.zip)**，完整解压后用 Edge 或 Chrome 打开 `index.html`。画面、吟声、配乐和环境声均在本地，可断网使用。不要在压缩包内部直接运行。

也可以克隆仓库后打开 [courseware/V3.0/index.html](courseware/V3.0/index.html)。使用本地 HTTP 预览时，安装 Node.js 后在仓库根目录执行：

```sh
npm start
```

随后访问 `http://127.0.0.1:4180`。这只是本机预览，不会把课件开放到公网。

## V3.0 内容

- 24 幕双诗行游，中 / 中英对照 / 英文三种显示模式，中文与英文吟说、补充释读、氛围音乐和环境声。
- 手动交互与自动吟游，暂停与续行，全屏、章节地图、前后导航，以及带七个节点的流体进度。
- 首页局部云海卷舒、随鸟鸣起落的子规动作；飞湍一幕结合扑面飞溅、挂珠汇流和渐退水痕。
- 顶栏原诗、研习、字句赏析与行游小记；终章引导研读并进入必修考核。
- 100 分考核：8 道选择、8 道默写、6 组连线、六片完整图拼图及辨认题、3 道赏析、阅读感悟。客观题 60 分自动判定；表达题 40 分为明确标识的学生自评，供教师复核。
- 草稿、已读状态与成绩保存在当前浏览器，可导出 JSON。没有账号后台、云同步或教师集中收卷服务。

详细操作见 [使用说明](courseware/V3.0/使用说明.md)，题目出处与分值见 [考核说明与依据](courseware/V3.0/考核说明与依据.md)。

## 归档结构

| 目录 / 入口 | 内容 |
| --- | --- |
| [courseware/V3.0](courseware/V3.0/) | 已验证的最新版，268 个文件，含完整离线资源 |
| [history](history/) | V1.0、V2.0 及早期制作阶段；V3.0 工作目录额外资产另存 |
| [reference](reference/) | 对话开始提供的交付资料、石栈道参考截图；原始录屏见 Releases |
| [production](production/) | 分镜、抽帧、生成提示、吟说、制作脚本、检查结果与验收记录 |
| [docs](docs/) | 版本记录、架构与数据说明、归档方式 |
| [catalog/asset-manifest.json](catalog/asset-manifest.json) | 全部来源路径、大小、SHA-256 与去重映射 |
| [Releases](https://github.com/Royal44-k/Interactive-Courseware/releases/tag/v3.0-20261030) | 最新与历史离线 ZIP、原始参考录屏及制作录像 |

参见 [资产目录](docs/ASSETS.md) 和 [发布附件索引](docs/RELEASE-ASSETS.md)。相同内容保留一份并记录映射；需要重建原始目录时使用 [restore-sources.py](scripts/restore-sources.py)。可重新安装的开发依赖、缓存与进程编号未纳入；原始本机资料不受此整理影响。

## 验证

归档前已对实际离线包验证：176 个音频、54 张 PNG 成功加载；三种语言、六种屏幕的首页布局通过；拼图悬浮像素一致，点击、拖拽、键盘交换和草稿恢复通过；满分 100 与零分边界通过。V1.0、V2.0 原始文件与压缩包校验保持一致。

仓库内可执行：

```sh
python scripts/verify-assets.py
npm install
npx playwright install chromium
npm test
```

归档制作脚本保留原工作目录语境，部分依赖当时的本机路径；`scripts/` 下的验证和预览入口适用于本仓库结构。检查记录中的示例答卷是自动测试数据，不是学生提交记录。

## 许可与素材

保留仓库原有 [MIT License](LICENSE)。Three.js 的 MIT 许可、子规录音的 CC BY-SA 3.0 署名等第三方条款分别保留，详见 [素材署名](courseware/V3.0/素材署名.md) 与各资产原有说明。用户提供的参考录屏和第三方交付资料仅作来源归档，不以仓库代码许可替代其原有权利。

诗歌原文、教学译读、生成式画面与教学编排的边界见 [吟说依据](courseware/V3.0/吟说依据.md)。
