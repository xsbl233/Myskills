#!/usr/bin/env python3
"""标点归一:把 pptx 中文语境里的半角标点转成全角(，。：；（）),不碰标签/代码/文件名/实体。

用法:
    python punct-normalize.py deck.pptx            # 就地改
    python punct-normalize.py deck.pptx --dry-run  # 只报告不改

规则(见 pptx-pro SKILL.md §三.8「标点跟随文种」):
  - 只处理 <a:t>…</a:t> 里的正文,绝不动 XML 标签/属性。
  - 只在含中文的 run 里转;纯拉丁/数字/代码/文件名的 run 原样保留。
  - 括号成对处理:( ) 内容含中文才转 （ ）(保护 f(x) 之类)。
  - 逗号/分号/冒号:相邻(跳空格)有中文才转;保护 &amp; 之类实体。
  - 斜杠 / 、连字符 - 、点 . 、中点 · 、破折号 —— 不动(它们是分隔符,非文种标点)。
"""
import sys, re, os, zipfile


def has_cjk(t): return any(0x4E00 <= ord(c) <= 0x9FFF or 0x3400 <= ord(c) <= 0x4DBF for c in t)
def is_cjk(c): return bool(c) and (0x4E00 <= ord(c) <= 0x9FFF or 0x3400 <= ord(c) <= 0x4DBF)

FULL = {',': '，', ';': '；', ':': '：'}


def _nearest(t, i, step):
    j = i + step
    while 0 <= j < len(t) and t[j] == ' ':
        j += step
    return t[j] if 0 <= j < len(t) else ''


def norm_text(t):
    if not has_cjk(t):
        return t
    # 括号成对:内容含中文 → 全角
    t = re.sub(r'\(([^()]*)\)', lambda m: '（' + m.group(1) + '）' if has_cjk(m.group(1)) else m.group(0), t)
    out = []
    for i, ch in enumerate(t):
        if ch in FULL:
            if ch == ';' and re.search(r'&[A-Za-z#0-9]+$', t[:i]):   # 保护 &amp; 等实体
                out.append(ch); continue
            L, R = _nearest(t, i, -1), _nearest(t, i, 1)
            out.append(FULL[ch] if (is_cjk(L) or is_cjk(R)) else ch)
        else:
            out.append(ch)
    return ''.join(out)


def process(path, dry_run=False):
    zin = zipfile.ZipFile(path)
    slides = sorted([n for n in zin.namelist() if re.match(r'ppt/slides/slide\d+\.xml$', n)],
                    key=lambda s: int(re.findall(r'\d+', s)[0]))
    changes, new_items = 0, {}
    for name in slides:
        xml = zin.read(name).decode('utf-8')
        cnt = [0]
        def repl(m):
            ni = norm_text(m.group(2))
            if ni != m.group(2):
                cnt[0] += 1
            return m.group(1) + ni + m.group(3)
        new = re.sub(r'(<a:t>)(.*?)(</a:t>)', repl, xml, flags=re.S)
        if cnt[0]:
            new_items[name] = new.encode('utf-8')
            changes += cnt[0]
            print(f"  {name}: {cnt[0]} run(s) normalized")
        # 残留自查
        left = [r for r in re.findall(r'<a:t>(.*?)</a:t>', new, re.S) if has_cjk(r) and re.search(r'[,:;()]', r)]
        if left:
            print(f"  ! {name} 仍含半角(需人工看): {left}")
    if dry_run:
        print(f"[dry-run] 共可归一 {changes} run(s),未写入。")
        return
    if not new_items:
        print("无需改动。"); return
    tmp = path + ".tmp"
    zout = zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED)
    for it in zin.infolist():
        zout.writestr(it, new_items.get(it.filename, zin.read(it.filename)))
    zout.close(); zin.close()
    os.replace(tmp, path)
    print(f"已写入 {path}:共归一 {changes} run(s)。")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    process(sys.argv[1], dry_run='--dry-run' in sys.argv[2:])
