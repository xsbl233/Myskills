---
name: architecture-diagram
description: 绘制架构图 / 流程图 / 分层对照图 / 系统拓扑示意图。当用户说「画个图」「架构图」「流程图」「分层对照」「执行流程」「拓扑」「示意图」「把这套设计可视化」或需要把一段系统结构、调用链、模块分层转成可读图形时使用。优先输出交互式 HTML（带 file:line 锚点），无 UI 环境降级为 Mermaid 或独立 HTML 文件。
version: "1.0.0"
license: MIT
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
---

# 架构图 / 流程图绘制

把系统结构、调用链、模块分层转成清晰、可读、带代码锚点的图。

## 何时用
- 需求讲解某框架/仓库的分层、模块边界、一次请求的生命周期。
- 对比两套架构：先「分层对照图」，再「两套各自独立的执行流程图」。
- 用户明确要「画个图 / 可视化 / 示意图 / 流程图」。

## 输出偏好（默认）
1. 先给**整体骨架图**（顶层分层），再按需**逐层下钻**。
2. 每个节点尽量挂 **`文件:行号`** 锚点（来自真实源码，先 grep/read 确认再标）。
3. 结尾附**一句话读法总结**（如「A 是图内 6 步，B 是跨服务 10 步」）+ 推荐阅读顺序。
4. 图要扁平：不用渐变/阴影/模糊，色调用中性变量。

## 工作流
1. **先读再画**：用文件搜索 / 读取工具确认结构与行号，不凭空标锚点。
2. **选渲染方式**（按当前环境择一）：
   - 有生成式 UI / widget 能力：直接渲染交互式 HTML 图（首选）。
   - 无 UI：产出 `.html` 文件（内联样式，可直接双击打开）或 Mermaid 代码块。
3. **构图规范**：
   - 分层图：自上而下分「接入层 / 调度层 / 执行层 / 存储层」等真实层次，每层列组件 + `file:line`。
   - 流程图：横向/纵向编号步骤，标注「谁调用谁、传什么、回流到哪」。
   - 对照图：左右两栏同构对齐，差异处高亮。
4. **交付**：若产出的是文件，把最终文件呈现给用户；若是内联图，正文里直接给出。

## DSH 适配
- DSH 里渲染交互式 HTML 图对应生成式 UI 能力（社区 `dsh-visualize` / `dsh-genui` 插件，或官方内置 UI）。若该插件不可用，**降级为写一个自包含 `.html` 到工作区并用本地预览/浏览器打开**，或直接输出 Mermaid（DSH Web GUI 可渲染 mermaid 时）。
- 「先读再画」用 DSH 的文件读取 / grep / glob 工具完成；锚点来自实际安装的 DSH 版本源码或目标仓库。
- 不要在本 skill 正文里写 QwenWork 专有工具名；用「生成式 UI / 文件读取」等中性描述，落地时映射到 DSH 真实工具（见 DESIGN.md 第 1 档）。

## 反模式
- 没读代码就标 `file:line`（锚点会错）。
- 只给图不给「一句话读法」和阅读顺序。
- 用花哨样式掩盖结构不清。

## 验证
图能在无联网/无专有渲染器的环境下以 HTML 或 Mermaid 正常显示；每个关键节点有可跳转锚点；结尾有读法总结。

## 脚本与样例（scripts/ · examples/）
- `scripts/diagram.mjs` — 把结构化定义渲染成 Mermaid(`.mmd`) + 自包含 HTML(`.html`)。**零第三方依赖，仅需 Node ≥18**，可直接拷贝进 DSH skill 目录运行。
  - 用法：`node scripts/diagram.mjs <input.json> [--out <dir>]`
  - 输入 schema（单架构）：`{ title, layers:[{name, nodes:[{label, anchor, id}]}], flow:[{from,to,label}] }`
  - 也支持对照模式（见 visual-arch-compare）：`{ title, readOnce, A:{layers,flow}, B:{layers,flow} }`
- `examples/dsh-core.{json,html,mmd}` — 单架构样例（DSH 分层），已用脚本真实生成，可直接打开 `.html` 查看。
- **约定**：示例里的 anchor 用 `—` 占位。真实使用时，模型必须先用文件搜索/read 核对 `文件:行号` 再填入，脚本本身不校验锚点真实性。
- **DSH 落地**：优先让模型产出符合上面 schema 的 JSON，再跑脚本得到稳定结构的图，避免纯手写 HTML 抖动；无 Node 沙箱时退化为直接输出 `.mmd` 或手写自包含 `.html`。
