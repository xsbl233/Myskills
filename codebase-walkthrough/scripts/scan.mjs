#!/usr/bin/env node
// scan.mjs — 陌生仓库的骨架扫描，产出「源码带读」的起点清单（markdown）。
// 零第三方依赖（仅 node 内置模块）。不读语义，只做机械统计，帮模型快速建立鸟瞰。
//
// 用法:  node scan.mjs [dir] [--out report.md] [--depth N] [--top N]
//        dir 默认当前目录；--out 默认打印到 stdout。

import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const pos = args.filter((a) => !a.startsWith('--'))
const flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const root = path.resolve(pos[0] || '.')
const maxDepth = Number(flag('--depth', 4))
const topN = Number(flag('--top', 15))
const out = flag('--out', null)

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv', 'target', 'coverage', '.next', '.cache', 'out', '.idea', '.vscode'])
const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.kt', '.c', '.h', '.cpp', '.cc', '.rb', '.php', '.swift', '.scala', '.sh', '.ps1', '.cs', '.vue', '.svelte', '.html', '.css', '.json', '.yaml', '.yml', '.toml', '.md', '.rs', '.ex', '.exs'])
const ENTRY_PATTERNS = [
  [/^__main__\.py$/, 'python 入口'],
  [/^main\.(py|go|rs)$/, 'main 入口'],
  [/(^|\/)(cli|command)\.(py|ts|js|go)$/, 'CLI 入口'],
  [/(^|\/)(app|server|main|index)\.(py|ts|js)$/, 'app/server 入口'],
  [/^manage\.py$/, 'Django CLI'],
  [/package\.json$/, 'Node manifest'],
]

const files = []
;(function walk(dir, depth) {
  if (depth > maxDepth) return
  let ents
  try { ents = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of ents) {
    const full = path.join(dir, e.name)
    const rel = path.relative(root, full).replace(/\\/g, '/')
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.has(e.name)) walk(full, depth + 1)
    } else {
      let size = 0
      try { size = fs.statSync(full).size } catch {}
      files.push({ rel, full, ext: path.extname(e.name).toLowerCase(), size })
    }
  }
})(root, 1)

const countLines = (f) => {
  if (!TEXT_EXT.has(f.ext) || f.size > 2_000_000) return null
  try { return fs.readFileSync(f.full, 'utf8').split('\n').length } catch { return null }
}

// 扩展名分布
const byExt = new Map()
const lineMap = new Map()
for (const f of files) {
  byExt.set(f.ext || '(no ext)', (byExt.get(f.ext || '(no ext)') || 0) + 1)
  const ln = countLines(f)
  if (ln) f.lines = ln
}
for (const f of files) if (f.lines) lineMap.set(f.ext, (lineMap.get(f.ext) || 0) + f.lines)
const extRows = [...byExt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)

// 疑似入口
const entries = []
for (const f of files) {
  for (const [re, reason] of ENTRY_PATTERNS) {
    if (re.test(f.rel)) { entries.push({ ...f, reason }); break }
  }
}
if (fs.existsSync(path.join(root, 'package.json'))) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
    if (pkg.bin) for (const k of Object.keys(pkg.bin)) entries.push({ rel: `package.json#bin.${k}=${pkg.bin[k]}`, reason: 'npm bin' })
    if (pkg.main) entries.push({ rel: `package.json#main=${pkg.main}`, reason: 'npm main' })
  } catch {}
}

// 核心大文件
const biggest = files.filter((f) => f.lines).sort((a, b) => b.lines - a.lines).slice(0, topN)

// README 摘要
let readme = ''
for (const name of ['README.md', 'readme.md', 'README.rst', 'README']) {
  const p = path.join(root, name)
  if (fs.existsSync(p)) {
    readme = fs.readFileSync(p, 'utf8').split('\n').filter((l) => l.trim()).slice(0, 25).join('\n')
    break
  }
}

const rootName = path.basename(root)
const L = []
L.push(`# Repo skeleton: ${rootName}`)
L.push(`- root: \`${root}\`   ·   files: ${files.length}   ·   maxDepth: ${maxDepth}`)
L.push(`\n## 扩展名分布 (count · total lines)`)
L.push('| ext | files | lines |')
L.push('|---|--:|--:|')
for (const [ext, c] of extRows) L.push(`| ${ext} | ${c} | ${lineMap.get(ext) || '—'} |`)
L.push(`\n## 疑似入口 (先读这些建立主线)`)
if (!entries.length) L.push('_未命中常见入口命名，建议从测试或 package/build 配置反推_')
for (const e of entries.slice(0, 25)) L.push(`- \`${e.rel}\`  — ${e.reason}`)
L.push(`\n## 核心大文件 Top ${topN} (行数 · 相对大小)`)
for (const f of biggest) L.push(`- ${String(f.lines).padStart(6)}  \`${f.rel}\``)
if (readme) { L.push(`\n## README 摘要`); L.push('```'); L.push(readme); L.push('```') }
L.push(`\n> 说明：本清单为机械扫描，不含语义判断。带读时把它当起点，再用 grep/read 沿「疑似入口 → 调用链」建立真实生命周期主线并补 file:line 锚点。`)

const report = L.join('\n')
if (out) { const od = path.resolve(out); fs.mkdirSync(path.dirname(od), { recursive: true }); fs.writeFileSync(od, report + '\n'); console.error(`wrote: ${out}`) } else { console.log(report) }
