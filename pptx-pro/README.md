# pptx-pro — PPT 制作规范 Skill

`pptx-pro` 把「做一份能直接交付的中文决策胶片」这件事标准化:配色、版式、内容口径、渲染核对、版本策略,全部固化成可执行的红线,叠加在 Agent 平台官方 `pptx` skill 之上。

它解决的不是「怎么用 pptxgenjs 画一个框」,而是**怎么让画出来的东西第一遍就不用返工**——每一条红线背后都有一次「渲染出来才发现不对、推倒重做」的代价。

## 主要能力

- **默认设计基线**:深灰底 + 单一强调色、卡片式版式、统一内边距、字号收敛到三个角色,不用每次从零想设计。
- **11 条版式红线**:对齐一致、卡内留白、图文间距、内容密度、贴图不变形、标点跟随文种等,都是渲染出图后才暴露的问题。
- **内容与结论口径**:不盲从原始材料、结论必须有明确观点(推荐哪个 + 为何不选其他)、版本策略(大改留版本、小改就地改)。
- **可复现构建**:`references/deck-scaffold.js` 起步,产出 `build_*.js` 脚本,内置几何审计与 `[OUTSIDE-CARD]` 检查。
- **标点批量归一**:`references/punct-normalize.py` 把 pptx 中文语境里的半角标点转全角,自动保护标签 / 代码 / 文件名 / 实体。
- **收尾门禁**:定稿前起一个独立 subagent 跑 `humanize-check`,做「人性化 · 易读」复检。

## 目录说明

| 文件 | 说明 |
|---|---|
| `SKILL.md` | 主规范:偏好、版式红线、内容红线、细节基准、快速起步、故障排除 |
| `README.md` | 本文件 |
| `references/deck-scaffold.js` | pptxgenjs 起步脚手架(palette / card / cardTitle / sectionTag / 审计埋点) |
| `references/punct-normalize.py` | pptx 标点归一脚本,支持 `--dry-run` |
| `references/feedback-patterns.md` | 反馈模式档案:规则背后的「为什么」与判据 |

## 依赖

| 依赖 | 用途 | 缺了会怎样 |
|---|---|---|
| 官方 `pptx` skill | 读取 / 缩略图 / pptxgenjs / 模板编辑等底层能力 | 底层依赖需自行准备,本 skill 的规范部分仍适用 |
| Node.js + pptxgenjs | 从零构建 deck | 无法用脚手架构建,只能走模板编辑路线 |
| LibreOffice(`soffice`) | 渲染核对(pptx → pdf) | **渲染核对是硬性红线,不能跳过**;容器渲不出图就到有图形栈的机器上渲 |
| poppler(`pdftoppm`) | pdf → png 逐页目检 | 同上 |
| Python + markitdown | 读取已有 pptx 正文 | 只影响读取,不影响构建 |

## 快速使用

```bash
# 1. 起步:复制脚手架
cp references/deck-scaffold.js ./build_mydeck.js

# 2. 填内容后构建 + 过几何审计
AUDIT=1 OUT=/abs/path/mydeck.pptx node build_mydeck.js

# 3. 渲染出图逐页目检(硬性红线,不可省)
soffice --headless --convert-to pdf --outdir /tmp/render /abs/path/mydeck.pptx
pdftoppm -png -r 150 /tmp/render/mydeck.pdf /tmp/render/slide

# 4. 已有 deck 的标点归一(先看再改)
python references/punct-normalize.py mydeck.pptx --dry-run
python references/punct-normalize.py mydeck.pptx
```

定稿前,再起一个独立 subagent 跑 `humanize-check mydeck.pptx` 做人性化复检。

## 与官方 `pptx` skill 的关系

官方 skill 提供**机制**(怎么读、怎么写、怎么改),本 skill 提供**规范**(该长什么样、什么不许出现)。两者叠加使用,规范优先于官方的「设计自由发挥」。纯粹只读提取 pptx 文本,直接用官方 skill 即可,不必加载本 skill。
