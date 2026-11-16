#!/usr/bin/env node
// diagram.mjs — 把结构化架构定义渲染为 Mermaid(.mmd) + 自包含 HTML(.html)
// 零第三方依赖（仅用 node 内置模块）。可单独拷贝到 DSH skill 目录使用。
//
// 用法:  node diagram.mjs <input.json> [--out <dir>]
//
// 输入 JSON 支持两种模式:
//   单架构:  { title, layers:[{name, nodes:[{label, anchor, id}]}], flow:[{from,to,label}] }
//   对照:    { title, readOnce, A:{layers,flow}, B:{layers,flow} }
//
// 约定: anchor 是 文件:行号；脚本不校验其真实性，真实性由调用方(模型)先读代码保证。

import fs from 'node:fs'
import path from 'node:path'

const [, , inputPath, ...rest] = process.argv
if (!inputPath) {
  console.error('usage: node diagram.mjs <input.json> [--out <dir>]')
  process.exit(1)
}
const outDirIdx = rest.indexOf('--out')
const outDir = outDirIdx >= 0 ? rest[outDirIdx + 1] : path.dirname(path.resolve(inputPath))
fs.mkdirSync(outDir, { recursive: true })

const spec = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
const base = path.basename(inputPath).replace(/\.json$/i, '')
const isCompare = !!(spec.A && spec.B)

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const mid = (n) => (n.id || n.label)   // mermaid-safe node id
const clean = (s) => String(s ?? '').replace(/[^a-zA-Z0-9_]/g, '_')

function mmdGraph(layers, flow) {
  const lines = ['flowchart TD']
  layers.forEach((layer, i) => {
    const g = `subgraph L${i}["${layer.name}"]`
    lines.push(g)
    layer.nodes.forEach((n) => lines.push(`  ${clean(mid(n))}["${(n.label || mid(n)).replace(/"/g, "'")}"]`))
    lines.push('end')
  })
  ;(flow || []).forEach((e) => {
    const lbl = e.label ? ` -->|${e.label.replace(/"/g, "'")}| ` : ' --> '
    lines.push(`${clean(e.from)}${lbl}${clean(e.to)}`)
  })
  return lines.join('\n')
}

function buildMmd() {
  if (!isCompare) return mmdGraph(spec.layers, spec.flow)
  return [
    `%% A: ${spec.A.title || 'A'}`,
    mmdGraph(spec.A.layers, spec.A.flow),
    '',
    `%% B: ${spec.B.title || 'B'}`,
    mmdGraph(spec.B.layers, spec.B.flow),
  ].join('\n')
}

// ---- HTML ----
const css = `
:root{--bg:#fafafa;--fg:#1a1a1a;--muted:#666;--line:#d0d0d0;--accent:#2563eb;--accent2:#0f766e;--panel:#fff}
*{box-sizing:border-box}
body{margin:0;padding:24px;background:var(--bg);color:var(--fg);font:14px/1.5 -apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif}
h1{font-size:18px;margin:0 0 4px}
.sub{color:var(--muted);font-size:12px;margin-bottom:20px}
.readonce{background:#fef9c3;border-left:4px solid #ca8a04;padding:10px 14px;margin:0 0 20px;border-radius:4px}
.cols{display:grid;gap:24px}
.cols.cmp{grid-template-columns:1fr 1fr}
.col{min-width:0}
.col h2{font-size:15px;margin:0 0 12px;padding:6px 10px;border-radius:4px;color:#fff;display:inline-block}
.col.a h2{background:var(--accent)}.col.b h2{background:var(--accent2)}
.stack{display:flex;flex-direction:column;gap:12px}
.layer{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:10px 12px}
.layer h3{font-size:13px;margin:0 0 8px;color:var(--muted);font-weight:600}
.nodes{display:flex;flex-wrap:wrap;gap:8px}
.node{background:#f3f4f6;border:1px solid var(--line);border-radius:4px;padding:5px 8px;font-size:12.5px}
.node .a{display:block;color:var(--muted);font:11px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;margin-top:2px}
.steps{margin-top:10px;padding:10px 12px;background:var(--panel);border:1px solid var(--line);border-radius:6px}
.steps h3{font-size:13px;margin:0 0 6px;color:var(--muted)}
.steps ol{margin:0;padding-left:20px}
.steps li{margin:2px 0;font-size:12.5px}
.steps .a{color:var(--muted);font:11px ui-monospace,Menlo,monospace}
.flow{color:var(--accent)}
`

function nodesHtml(nodes) {
  return `<div class="nodes">` + nodes.map((n) =>
    `<div class="node"><span>${esc(n.label || mid(n))}</span>` +
    (n.anchor ? `<span class="a">${esc(n.anchor)}</span>` : '') + `</div>`
  ).join('') + `</div>`
}
function stackHtml(layers) {
  return `<div class="stack">` + layers.map((l) =>
    `<div class="layer"><h3>${esc(l.name)}</h3>${nodesHtml(l.nodes)}</div>`
  ).join('') + `</div>`
}
function stepsHtml(layers, flow) {
  if (!flow || !flow.length) return ''
  const byId = {}
  layers.forEach((l) => l.nodes.forEach((n) => { byId[mid(n)] = n }))
  const items = flow.map((e) => {
    const f = byId[e.from] || { label: e.from }, t = byId[e.to] || { label: e.to }
    const an = f.anchor && t.anchor ? ` <span class="a">${esc(f.anchor)} → ${esc(t.anchor)}</span>` : ''
    return `<li><span class="flow">${esc(f.label || mid(f))}</span>${e.label ? ` <em>${esc(e.label)}</em> ` : ' → '}<span class="flow">${esc(t.label || mid(t))}</span>${an}</li>`
  }).join('')
  return `<div class="steps"><h3>执行流程</h3><ol>${items}</ol></div>`
}
function colHtml(cls, title, arch) {
  return `<div class="col ${cls}"><h2>${esc(title)}</h2>${stackHtml(arch.layers)}${stepsHtml(arch.layers, arch.flow)}</div>`
}

function buildHtml() {
  const head = `<!doctype html><meta charset="utf-8"><title>${esc(spec.title || base)}</title><style>${css}</style>`
  const h1 = `<h1>${esc(spec.title || base)}</h1>`
  const sub = `<div class="sub">由 diagram.mjs 生成 · 锚点为 文件:行号（真实性由调用方先读代码保证）</div>`
  if (!isCompare) {
    return `${head}${h1}${sub}${stackHtml(spec.layers)}${stepsHtml(spec.layers, spec.flow)}</body>`
  }
  const ro = spec.readOnce ? `<div class="readonce"><b>一句话读法：</b>${esc(spec.readOnce)}</div>` : ''
  return `${head}${h1}${sub}${ro}<div class="cols cmp">${colHtml('a', spec.A.title || 'A', spec.A)}${colHtml('b', spec.B.title || 'B', spec.B)}</div></body>`
}

fs.writeFileSync(path.join(outDir, `${base}.mmd`), buildMmd() + '\n')
fs.writeFileSync(path.join(outDir, `${base}.html`), buildHtml())
console.log(`wrote: ${base}.mmd, ${base}.html  (${isCompare ? 'compare' : 'single'} mode)`)
