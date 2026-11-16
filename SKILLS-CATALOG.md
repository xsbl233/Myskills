# Skills 清单

拉取日期：2026-10-05。以下 8 个 skill 按独立目录保存，上游内容保持原样，配套脚本和参考文件一并保留。

| 目录 | 用途 | 上游仓库 | 上游路径 |
| --- | --- | --- | --- |
| literature-review | 文献检索策略、筛选、综述与引用核验 | [K-Dense](https://github.com/K-Dense-AI/scientific-agent-skills) | skills/literature-review |
| citation-management | 论文元数据、DOI、BibTeX、去重与引用检查 | [K-Dense](https://github.com/K-Dense-AI/scientific-agent-skills) | skills/citation-management |
| mcp-builder | Python / TypeScript MCP 服务开发 | [Anthropic](https://github.com/anthropics/skills) | skills/mcp-builder |
| doc-coauthoring | 技术方案、设计文档、提案的协作写作 | [Anthropic](https://github.com/anthropics/skills) | skills/doc-coauthoring |
| internal-comms | 工作总结、进展报告、项目更新与内部汇报 | [Anthropic](https://github.com/anthropics/skills) | skills/internal-comms |
| property-based-testing | 属性测试、输入生成与边界条件验证 | [Trail of Bits](https://github.com/trailofbits/skills) | plugins/property-based-testing/skills/property-based-testing |
| systematic-debugging | 复现问题、收集证据、定位根因与验证修复 | [Superpowers](https://github.com/obra/superpowers) | skills/systematic-debugging |
| verification-before-completion | 在报告完成前运行检查并提供验证证据 | [Superpowers](https://github.com/obra/superpowers) | skills/verification-before-completion |

## 固定的上游版本

- K-Dense：`154988403bb5a18e9d3c0ce4e6d5e2e4b184a298`
- Anthropic：`8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4`
- Trail of Bits：`82fe8226252622fa807643bdca1710901198553a`
- Superpowers：`8ca22dba9a94f28898bbce59f2537ff4d87c747d`

## 依赖与使用说明

- 文献类脚本需要 Python、requests 和网络；Google Scholar 查询额外需要 scholarly。literature-review 自带 PDF 导出需要 Pandoc 和 XeLaTeX；可选服务的认证要求见各自 SKILL.md。
- MCP 开发按项目选择 Python 或 Node.js / TypeScript 环境；属性测试按语言选择 Hypothesis、fast-check、proptest 等库。
- 本次仅拉取 skill 文件，没有安装运行依赖、配置服务密钥或执行下载的脚本。
- skill 内容以英文为主，使用时可要求中文输出。internal-comms 可进一步适配个人周报/月报格式。
- Superpowers 的这两个 skill 可能引用同仓库的其他 skills；本次按选择仅下载这两个，不包含完整 Superpowers 插件和启动流程。
- skill 文件中的工具名称及部分命令针对其他 Agent 或 Unix 环境；在 Windows 上执行时应使用当前环境对应的工具与命令。
- 各 skill 的许可证以其自带 LICENSE 文件和上游仓库许可为准。

现有 architecture-driven-development、requirements-to-delivery 等目录继续用于架构与需求交付；本清单只记录本次新增内容。

## 自建 skill

| 目录 | 用途 | 来源 |
| --- | --- | --- |
| trae-enterprise-usage | 查询 TRAE 企业版席位的剩余额度与用量（含个人版/企业版账本判定、企业控制台只读接口） | 自建，2026-10-13 |
| deployment-plan | 生成部署与测试计划：环境启动、数据集获取、就绪判定、测试命令、结果归档、耗时估算及回滚 | 自建，2026-10-14；参考来源见技能内 references/sources.md |
| architecture-diagram | 架构图/流程图/分层对照图：结构化 JSON → Mermaid(.mmd) + 自包含 HTML(.html)，零依赖 Node 脚本 `scripts/diagram.mjs`，带 file:line 锚点 | 自建（QwenWork 能力移植），2026-11-16；见 examples/dsh-core.* |
| codebase-walkthrough | 陌生仓库「源码带读」：`scripts/scan.mjs` 先出骨架清单（入口启发式/扩展名分布/大文件），再建一次请求生命周期主线与锚点 | 自建（QwenWork 能力移植），2026-11-16；见 examples/scan-sample.md |
| visual-arch-compare | 两套架构对照：分层对照图 + 各自独立执行流程 + 一句话读法，用 diagram.mjs 对照模式（A/B） | 自建（QwenWork 能力移植），2026-11-16；见 examples/deer-flow-vs-dsh.* |

自建 skill 与上游拉取的内容分开维护：上游目录保持原样，自建目录可随时按实际使用情况修订。

## Codex 全局加载

已创建 Windows 目录联接：`C:\Users\Admin\.agents\skills` → `D:\code\skills`。
Codex 通过用户级 skills 路径读取本目录，其他项目也可使用；后续新增或修改 skill 只需维护本目录。
若界面的 skill 列表未刷新，重启 Codex。可在请求中明确指定，例如“使用 literature-review 整理这个主题的文献”。
官方说明：https://learn.chatgpt.com/docs/build-skills

## 2026-10-19 整理：个人 skills 全量并入本目录

本次把分散在 `~/.dsh/skills`、`~/.codex/skills` 的个人 skills 与新装的华为社区设计文档类 skills 一并并入本目录，形成单一技能仓。

### 新装：boostkit 设计文档类（上游 gitcode.com/boostkit/skills，master@`8b71299fb0fd2e916648ceeb8b89bb5ec1766d13`）

| 目录 | 用途 | 上游路径 |
| --- | --- | --- |
| feature-design-doc | 读特性/优化源码，产出图文并茂、可交付的设计文档（Markdown + docx）：SVG 结构图 + PlantUML 行为图，支持中/英/双语，docx 严格排版（中文宋体五号/英文 Times New Roman 五号） | BoostCoreSkills/skills/feature-design-doc |
| spark-omnioperator-test-devdoc-review | 检查开发设计文档是否具备下游测试设计所需信息；用于需求/设计文档评审与可测试性检查 | skills/domain/bigdata/OmniSkills/spark-omnioperator-test-devdoc-review |
| patent-writing | 专利从 idea 到递交：可专利性预评估与打包决策 + 交底书（docx）+ idea 胶片（pptx）撰写规范 | BoostCoreSkills/skills/patent-writing |
| pptx-pro | 幻灯片/决策胶片/汇报页制作规范与硬性红线（配色、版式、内容口径），叠加在官方 pptx skill 之上 | BoostCoreSkills/skills/pptx-pro |
| humanize-check | 胶片/文档/网页定稿前的「人性化 · 易读」独立复检门禁 | BoostCoreSkills/skills/humanize-check |

上游内容保持原样。feature-design-doc 的作图与 docx 脚本依赖（cairosvg、python-docx、Pillow、plantuml.jar、中英字体）按其 `scripts/setup_env.sh` 安装后再使用。

### 迁入：原 `~/.dsh/skills`（17 个 skill + `_shared`）

asking-with-evidence、brooks-audit、brooks-debt、brooks-health、brooks-review、brooks-sweep、brooks-test、configuring-vision、distilly、extracting-structure、learning-from-mistakes、recovering-from-errors、sharing-results、the-loop、video-memory、watch、watching-videos，以及共享资源目录 `_shared`（brooks 系列按 `../_shared/` 读取共享文件，必须与各 skill 同级平铺）。

`~/.dsh/skills` 已清空并留有说明 README；原内容备份于 `~/.dsh/skills.backup-20261019`，确认无误后可自行删除。

### 迁入：原 `~/.codex/skills`

- technology-insight：业界新技术调研与项目级落地分析，迁入本目录。
- deployment-plan：与本目录既有内容完全一致（SKILL.md MD5 相同），按重复项处理，原件移入 `~/.codex/skills.backup-20261019`。
- `.system`（Codex 系统技能）保持原地不动，仍由 Codex 自行管理。

### 范围说明

- 插件管理的技能（aegis、genui、archify、office、openviking-* 等，位于 DSH profile 的 node_modules）不并入本目录，仍按插件机制维护。
- DSH 的 skill 根发现顺序：项目级 `.dsh/skills` > 项目级 `.agents/skills` > `~/.dsh/skills` > `~/.agents/skills`（即本目录）；合并后所有个人 skills 经由 `~/.agents/skills` 联接对 DSH 仍可见，Codex 继续按既有方式读取。
- 本次未做 git 提交；仓库中尚有整理前遗留的未提交改动，建议 review 后一并提交。
