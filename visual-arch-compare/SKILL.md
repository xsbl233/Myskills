---
name: visual-arch-compare
description: 两套（或多套）架构的可视化对比。当用户说「对比这两个框架」「A 和 B 是什么区别」「是不是同一种架构范式」「库 vs 产品级」「画个对照图」「各自的执行流程」「横向比较这两套系统」时使用。产出三段：①分层对照示意图 ②两套架构各自独立的执行流程图 ③一句话读法总结；图示带 文件:行号 锚点。
version: "1.0.0"
license: MIT
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
---

# 架构对比可视化（Visual Arch Compare）

把「两套架构有什么不同」讲清楚，靠图而非长篇文字。

## 固定三段产出
1. **分层对照示意图**：左右/上下同构对齐两套系统的层次，逐层标出各自的组件与差异点，组件挂 `文件:行号`。
2. **各自独立的执行流程图**：为 A、B 分别画一条端到端流程图（步骤编号 + 谁调用谁 + 回流点），保持两套独立、不混画。
3. **一句话读法总结**：用一句话点破差异（如「A 是图内 6 步闭环，B 是跨服务 10 步、靠 Router/Worker 双层调度」）；再补一句「架构范式异同」的判断。

## 工作流
1. **两边都先读**：对 A、B 各自用文件搜索/读取（必要时探索子智能体）确认真实结构与行号；先建各自骨架，再对齐。
2. **对齐维度**：固定按「接入/触发 → 调度/编排 → 执行 → 上下文与记忆 → 结果交付」同构维度排两栏，差异高亮。
3. **范式判断**：显式回答「是不是同一种架构范式」，指出共享的模式与关键分歧。
4. 具体画图技巧复用 `architecture-diagram`（分层图 + 流程图的规范、扁平样式、锚点要求）。

## DSH 适配
- 渲染交互式对照图依赖 DSH 生成式 UI（`dsh-visualize` / `dsh-genui`）；无 UI 时降级为两个自包含 `.html`（A/B 各一，同维度对齐）或 Mermaid 双图。
- 若对比对象就是 DSH 自身 vs 另一框架，DSH 侧结构以官方 feature 手册章节 + 源码为准，QwenWork 侧结构以本包 README/DESIGN 的机制说明为参考，但**不能当作已验证事实**——需实际读取确认后再标锚点。

## 反模式
- 只画对照表不画执行流程图（用户明确要两者）。
- 两套流程混在一张图里，看不出各自闭环。
- 结尾漏「一句话读法」和范式判断。

## 验证
三段齐全、两套流程各自独立成图、每个组件有锚点、末尾有一句话差异总结 + 范式判断。

## 脚本与样例（scripts/ · examples/）
- `scripts/diagram.mjs` — 与 architecture-diagram 同款脚本的自包含副本（便于单 skill 拷贝）。走**对照模式**：
  - 用法：`node scripts/diagram.mjs <input.json> [--out <dir>]`
  - 输入 schema：`{ title, readOnce, A:{title, layers:[{name,nodes:[{label,anchor,id}]}], flow:[{from,to,label}]}, B:{...} }`
  - 产出：`A`/`B` 左右同构对齐的分层对照 + 各自独立「执行流程」编号段 + `readOnce` 高亮；同时输出两张 `.mmd`（A、B 用注释分隔）。
- `examples/deer-flow-vs-dsh.{json,html,mmd}` — 已生成的对照样例（DeerFlow 2.0 vs DSH），可打开 `.html` 看三段结构。
- **约定**：示例 anchor 为占位；范式判断与 `readOnce` 需模型实际读两边源码后填写，脚本只负责排版。
- **DSH 落地**：模型分别扫描 A、B 两仓库（可用 codebase-walkthrough 的 scan.mjs 起步），产出同一 schema 的两组 layers/flow，交给脚本出对照图，再补一句话读法与范式判断。
