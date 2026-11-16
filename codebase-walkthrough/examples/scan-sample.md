# Repo skeleton: dsh-migration
- root: `C:\Users\a\.qwenworkcn\workspace\2026-11-16\mwbtgv8lu82cj5cp\outputs\dsh-migration`   ·   files: 17   ·   maxDepth: 4

## 扩展名分布 (count · total lines)
| ext | files | lines |
|---|--:|--:|
| .md | 8 | 447 |
| .mjs | 3 | 362 |
| .html | 2 | 50 |
| .json | 2 | 104 |
| .mmd | 2 | — |

## 疑似入口 (先读这些建立主线)
_未命中常见入口命名，建议从测试或 package/build 配置反推_

## 核心大文件 Top 15 (行数 · 相对大小)
-    126  `skills/architecture-diagram/scripts/diagram.mjs`
-    126  `skills/visual-arch-compare/scripts/diagram.mjs`
-    110  `skills/codebase-walkthrough/scripts/scan.mjs`
-     87  `README.md`
-     81  `plugin-designs/media-generation.md`
-     65  `skills/visual-arch-compare/examples/deer-flow-vs-dsh.json`
-     60  `DESIGN.md`
-     58  `plugin-designs/dingtalk-dws.md`
-     46  `plugin-designs/artifact-delivery.md`
-     45  `skills/architecture-diagram/SKILL.md`
-     39  `skills/architecture-diagram/examples/dsh-core.json`
-     37  `skills/codebase-walkthrough/SKILL.md`
-     33  `skills/visual-arch-compare/SKILL.md`
-     25  `skills/architecture-diagram/examples/dsh-core.html`
-     25  `skills/visual-arch-compare/examples/deer-flow-vs-dsh.html`

## README 摘要
```
# QwenWork 能力 → DeepSeek Harness (DSH) 移植包
> 目标：把 QwenWork 现有的能力，按 DSH「Everything is a Plugin」的理念，
> 优先整理成 **SKILL.md**；SKILL.md 无法保证的能力，判断能否做成 **Cordis plugin**，
> 并给出设计文档。全量覆盖。
## 一、DSH 的两类扩展机制（已核实）
| 机制 | 形态 | 触发 | 适用 |
|---|---|---|---|
| **Skill** | `SKILL.md`（YAML frontmatter + 正文），渐进披露 | 模型按 description 匹配任务后按需加载正文 | 方法论、工作流、prompt 编排、纯文本可表达的操作步骤 |
| **Plugin (Cordis)** | TS 模块：`export const name` + `export function apply(ctx: Context)`，在 `ctx` 上注册 tool/command/UI node；`package.json` 声明 `dsh.bundle` | `dsh plugin add <pkg>` 安装后常驻 | 需要新的**可执行能力**：调外部 API/服务、注册新工具、改 UI、接入新数据源 |
官方参考：`deepseek-ai/deepseek-harness`（核心 repo，由 Cordis 驱动）。
最小插件骨架：
```ts
import type { Context } from '@deepseek-ai/cordis'
export const name = 'hello-plugin'
export function apply(ctx: Context) {
  // register a tool, a command, a UI node, ...
}
```
## 二、能力分层：哪些 QwenWork 能力对应 DSH 的什么
先给一个总判据，再给映射矩阵。
### 判据：SKILL vs PLUGIN vs REUSE
- **REUSE（复用，无需移植）**：DSH 内核已经自带同类底层工具，QwenWork 只是它的另一套封装。移植这些只需写 prompt/skill 层，不必造工具。
- **SKILL（写成 SKILL.md）**：能力的「知识/流程」部分。只要该能力 = 「如何用已有工具组合出某个结果」，就能写成 skill，**不依赖任何 QwenWork 私有运行时**。
- **PLUGIN（必须造插件）**：能力背后要调用**只有 QwenWork/千问办公才能访问的服务**（媒体生成网关、钉钉 DWS、artifact 呈现、宜搭/Pages 发布）。这些服务不随 DSH 分发，SKILL.md 无法凭空保证 → 需要 plugin 去对接外部 API 或注入新工具。
### 映射矩阵
```

> 说明：本清单为机械扫描，不含语义判断。带读时把它当起点，再用 grep/read 沿「疑似入口 → 调用链」建立真实生命周期主线并补 file:line 锚点。
