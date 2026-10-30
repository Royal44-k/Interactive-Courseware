# Anatomy 能力卡

检查日期：2026-10-15。证据等级：`reviewed`。本次已读官方说明，未执行上游代码。当前 `main` 已核实为 [`bc943e40c59998be5da61f9d39c6a983b1116099`](https://github.com/wheresryan22/anatomy/commit/bc943e40c59998be5da61f9d39c6a983b1116099)，提交时间 2026-10-14T22:24:31Z。已审阅版本与本次核实的上游版本相同，`needs_review=false`；历史 AED 使用版本仍单独记录，不能自动视为该提交的验证。

仓库：[wheresryan22/anatomy](https://github.com/wheresryan22/anatomy)，分支 `main`，技能入口 `SKILL.md`。机器可读字段与完整证据在 [anatomy.json](anatomy.json)。

## 它能承担什么

用有厚度和细节的等距设备图解释结构与机制。可输出 SVG、独立 HTML 或 React 组件；WebGL 与测试版 3D 是可选路径。适合用作课程里的设备观察台、结构探索和参数实验，不承担整个课程播放器。[官方 README](https://github.com/wheresryan22/anatomy/blob/bc943e40c59998be5da61f9d39c6a983b1116099/README.md)

| 选型维度 | 记录 |
|---|---|
| 教学用途 | 原理展示、设备认识、结构探索、输入与结果关系、机制类比 |
| 交互方向 | 分层、滑轨、旋钮、部件热点、动态读数；旋转与铰链需评估测试版 3D |
| 输入 | 教学目标、真实结构与参数、可操作部件、状态边界、输出环境 |
| 输出 | 可编辑构建源码、SVG/HTML 或 React 组件；验收记录须实际运行后另存 |
| 不适合 | 写实人物表演、精确地图、统计图表、没有机制对应关系的概念，以及未经验证的复杂 3D 整场景 |

选型判断：优先让学习者操作真实有意义的部件，观察同一模型驱动的运动与读数。将其接入场景课程时，主流程、语音、进度和评价仍由课程维护。上游要求先确定事实和部件，再建立几何与交互；这不是医学或具体型号设备的事实来源。[官方 SKILL](https://raw.githubusercontent.com/wheresryan22/anatomy/bc943e40c59998be5da61f9d39c6a983b1116099/SKILL.md)

## 构建与最终使用分开看

构建端：上游标明 Node.js 20.10+；无框架 kit 不依赖第三方 npm 包或 API 密钥。官方截图、操作回放与浏览器检查需要 Chrome/Chromium。React 18+ 只用于 React 输出路径。[官方要求](https://github.com/wheresryan22/anatomy/blob/bc943e40c59998be5da61f9d39c6a983b1116099/README.md#requirements)

成品端：独立 SVG/HTML 不要求学习者安装 Node。着色器需要 WebGL，3D 与 React 路径需要打包相应运行时。几何审计只检查记录的几何，不能替代浏览器线端检查、页面可读性或课程流程验证。[kit API](https://raw.githubusercontent.com/wheresryan22/anatomy/bc943e40c59998be5da61f9d39c6a983b1116099/references/kit.md)

离线与双击属于**有条件支持、当前未实测**：把脚本、样式与媒体完整随包交付；移除 CDN 和在线 API；避免依赖本地 HTTP 服务的模块导入或 fetch。最终需在目标浏览器通过 `file://` 打开并走完整流程。上游的内嵌工具可以提供 kit 源文本，但是否真正满足双击条件取决于具体成品。[内嵌工具源码](https://raw.githubusercontent.com/wheresryan22/anatomy/bc943e40c59998be5da61f9d39c6a983b1116099/scripts/inline-kit.mjs)

## 视觉与交互适配

可调整投影、画幅、色阶、强调色和局部说明，使其融入课件视觉。保持部件与操控的明确关系；接入键盘、暂停、离屏停止及减少动画。[运动说明](https://raw.githubusercontent.com/wheresryan22/anatomy/bc943e40c59998be5da61f9d39c6a983b1116099/references/motion.md)

历史 AED 定制采用“厂家原图外观＋功能示意内部层”。这是项目适配经验，不是上游内置的真实设备拆解能力。后续项目仍须独立核对素材、事实与几何范围。

## 当前版本与历史证据

| 范围 | 已有证据 | 不能据此声称 |
|---|---|---|
| 本次读取的上游 `main` | README、SKILL、kit 与运动说明、内嵌工具、LICENSE 已读；没有执行 | 当前版本构建成功、双击可用、效果或性能已验证 |
| AED V1.0 历史本地 kit | 历史记录为 70 实体、21 姿态，几何审计各项为零；清单有逐文件 SHA-256 | 已知仓库 SHA，或等同于当前上游 |
| AED V1.1 历史本地 kit | 历史记录为 61 内部实体、21 姿态；有构建、语法及 DOM 桩状态检查记录 | 这些检查覆盖照片、信号示意、真实浏览器排版或当前上游 |

历史证据见 JSON 中的 `historical_verified_versions`，路径以工作区根目录为基准。本次仅复核记录，没有重跑历史代码。

版本依据为 GitHub 官方 `commits/main` API。取得提交号后，重新读取该 SHA 下六个固定路径文件，与检查时 `main` 的返回文本逐一比对，全部相同；JSON 保存了文件路径、固定 URL、字节数与 SHA-256。这里只核验来源文本，没有执行上游代码。历史下载仍缺仓库提交号，不能以部分文件哈希相同推定其完整版本。

以后检查新提交只更新 `upstream_current`。仅当新 SHA 与已审阅 SHA 均存在且一致时，才能确认版本未变；任一缺失或不同，都应重新审阅。历史成果始终留在历史字段中。

## 许可与本次边界

[MIT License](https://raw.githubusercontent.com/wheresryan22/anatomy/bc943e40c59998be5da61f9d39c6a983b1116099/LICENSE)，版权标注为 2026 Ryan。实际复用或分发需保留许可与版权声明；图片、字体和声音等外部素材另行处理。

本能力池仅保存这份分析、结构化卡片和索引，没有复制整个上游、安装技能、执行外部代码或修改全局 skills。
