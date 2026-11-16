// deck-scaffold.js —— pptx-pro 起步脚手架(pptxgenjs)
// 用法:复制到项目里改名 build_<name>.js,填内容;
//   AUDIT=1 OUT=/abs/out.pptx node build_<name>.js
// 依赖:pptxgenjs(NODE_PATH 指向装有 pptxgenjs 的 node_modules)
// 渲染核对:soffice --headless --convert-to pdf --outdir <dir> out.pptx
//           && pdftoppm -png -r 150 <dir>/out.pdf <dir>/slide

const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5

// ---- 配色:深灰 charcoal + 单一墨绿(我方默认)----
const C = {
  bg: "F5F6F7", band: "2B3A42", ink: "27333A", body: "515D64", muted: "8B959B",
  line: "E2E6E8", green: "3C7D5E", greenSoft: "EAF1ED", panel: "FFFFFF",
  soft: "EEF1F2", bandSub: "C6CDD1",
};
const FONT = "Microsoft YaHei";           // CJK 统一字体
const FS = { title: 12.5, body: 10.5, small: 9.5, tiny: 9 };

// ---- 统一内边距(红线①②③④)----
const PAD = 0.26, TIT_Y = 0.13, TIT_H = 0.30, BODY_Y = 0.46, BOT_PAD = 0.14;

// ---- 几何 ----
const W = 13.333, H = 7.5, MX = 0.5, GAP = 0.4;
const COLW = (W - 2 * MX - GAP) / 2;       // 双栏等宽 ≈5.97
const LX = MX, RX = MX + COLW + GAP;
const CW = COLW - 2 * PAD;                  // 卡内内容宽

// ---- 审计埋点(AUDIT=1)----
const AUDIT = process.env.AUDIT === "1";
const REC = [], CARDS = [];
const flat = (t) => Array.isArray(t) ? t.map(r => typeof r === "string" ? r : (r.text || "")).join("") : String(t == null ? "" : t);
function instrument(slide, i) {
  const oT = slide.addText.bind(slide);
  slide.addText = (t, o) => { REC.push({ s: i, kind: "text", x: o.x, y: o.y, w: o.w, h: o.h, fs: o.fontSize || 18, bold: !!o.bold, lsm: o.lineSpacingMultiple || 1, text: flat(t) }); return oT(t, o); };
  const oS = slide.addShape.bind(slide);
  slide.addShape = (sh, o) => { REC.push({ s: i, kind: "shape", x: o.x, y: o.y, w: o.w, h: o.h }); return oS(sh, o); };
}

// ---- 复用组件 ----
function card(slide, x, y, w, h, opts = {}) {          // 卡片:白底 + 左侧绿条;rec=推荐高亮
  if (AUDIT) CARDS.push({ x, y, w, h });
  const rec = !!opts.rec;
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.panel }, line: { color: rec ? C.green : C.line, width: rec ? 1.75 : 1 } });
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w: rec ? 0.12 : 0.06, h, fill: { color: C.green } });
}
function cardTitle(slide, x, y, w, text, sub) {        // 卡标题(左对齐);sub=右上角小注
  slide.addText(text, { x: x + PAD, y: y + TIT_Y, w: w - 2 * PAD - (sub ? 2.1 : 0), h: TIT_H, fontFace: FONT, fontSize: FS.title, bold: true, color: C.ink, valign: "middle", margin: 0 });
  if (sub) slide.addText(sub, { x: x + w - PAD - 2.0, y: y + TIT_Y, w: 2.0, h: TIT_H, fontFace: FONT, fontSize: FS.tiny, color: C.muted, align: "right", valign: "middle", margin: 0 });
}
function sectionTag(slide, x, y, label, sub) {         // 章节标签:绿底 label + 灰 sub
  slide.addText(label, { x, y, w: 0.9, h: 0.32, fill: { color: C.green }, color: C.panel, fontFace: FONT, fontSize: 12, bold: true, align: "center", valign: "middle", margin: 0 });
  slide.addText(sub, { x: x + 1.02, y, w: COLW - 1.1, h: 0.32, fontFace: FONT, fontSize: 11, bold: true, color: C.muted, valign: "middle", margin: 0 });
}
function topBand(slide, title, subtitle, rightTag) {   // 顶部深灰标题带
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 1.05, fill: { color: C.band } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.14, h: 1.05, fill: { color: C.green } });
  slide.addText(title, { x: MX, y: 0.16, w: 10.8, h: 0.48, fontFace: FONT, fontSize: 23, bold: true, color: C.panel, valign: "middle", margin: 0 });
  if (subtitle) slide.addText(subtitle, { x: MX + 0.02, y: 0.66, w: 10.8, h: 0.28, fontFace: FONT, fontSize: 12, color: C.bandSub, valign: "middle", margin: 0 });
  if (rightTag) slide.addText(rightTag, { x: W - MX - 1.5, y: 0.35, w: 1.5, h: 0.36, fill: { color: C.green }, fontFace: FONT, fontSize: 11.5, bold: true, color: C.panel, align: "center", valign: "middle", margin: 0 });
}

// ================= 示例:双栏一页(把内容替换成你的)=================
const s = pres.addSlide();
if (AUDIT) instrument(s, 1);
topBand(s, "标题 · 副标题放这里", "一句话副标题 —— 左:… 右:…", "标签");
sectionTag(s, LX, 1.2, "左", "左栏说明");
sectionTag(s, RX, 1.2, "右", "右栏说明");

const colTop = 1.58, colBot = 6.16;
card(s, LX, colTop, COLW, colBot - colTop);
cardTitle(s, LX, colTop, COLW, "左栏卡标题", "小注");
s.addText("左栏正文 —— 统一在 LX+PAD 左对齐,单行 valign middle,别贴卡底。",
  { x: LX + PAD, y: colTop + BODY_Y, w: CW, h: 0.4, fontFace: FONT, fontSize: FS.body, color: C.body, valign: "middle", margin: 0 });

card(s, RX, colTop, COLW, colBot - colTop, { rec: true });   // rec:推荐高亮示例
cardTitle(s, RX, colTop, COLW, "右栏卡标题(推荐)");
s.addText("推荐项:绿描边 + 粗左条,配 ★ 推荐 徽章。",
  { x: RX + PAD, y: colTop + BODY_Y, w: CW, h: 0.4, fontFace: FONT, fontSize: FS.body, color: C.body, valign: "middle", margin: 0 });

// ================= 写文件 + 审计 =================
const out = process.env.OUT || "/tmp/deck-scaffold-demo.pptx";
pres.writeFile({ fileName: out }).then(() => { console.log("WROTE " + out); if (AUDIT) runAudit(); });

function estWidthIn(text, fs, bold) {   // 粗估文本英寸宽(CJK≈1、拉丁≈0.52 字宽)
  let u = 0;
  for (const ch of String(text)) {
    const cp = ch.codePointAt(0);
    u += (cp > 0x2E7F || cp === 0x201C || cp === 0x201D || cp === 0x2018 || cp === 0x2019) ? 1.0 : 0.52;
  }
  return (u * fs * (bold ? 1.03 : 1)) / 72;
}
function runAudit() {
  const issues = [];
  for (const e of REC) {                         // 越界
    if (e.x < -0.02 || e.y < -0.02 || e.x + e.w > W + 0.03 || e.y + e.h > H + 0.03)
      issues.push(`[BOUNDS] ${e.kind} (${e.x.toFixed(2)},${e.y.toFixed(2)} ${e.w.toFixed(2)}x${e.h.toFixed(2)}) "${(e.text || "").slice(0, 24)}"`);
  }
  for (const e of REC.filter(e => e.kind === "text" && e.text && e.text.trim())) {   // 换行溢出
    const estW = estWidthIn(e.text, e.fs, e.bold);
    const lines = Math.max(1, Math.ceil(estW / (e.w - 0.02)));
    const lineH = (e.fs / 72) * 1.17 * (e.lsm || 1);
    const availLines = Math.max(1, Math.floor((e.h + 0.03) / lineH));
    if (lines > availLines)
      issues.push(`[OVERFLOW] need ${lines}L fit ${availLines}L box ${e.w.toFixed(2)}x${e.h.toFixed(2)} fs${e.fs} "${e.text.slice(0, 26)}"`);
  }
  const inCard = (e) => CARDS.some(c =>            // 文字须落在某卡框内(几何审计漏检的那类)
    e.x >= c.x - 0.01 && e.y >= c.y - 0.01 && e.x + e.w <= c.x + c.w + 0.01 && e.y + e.h <= c.y + c.h + 0.01);
  for (const e of REC.filter(e => e.kind === "text" && e.text && e.text.trim() && e.y > colTop - 0.05 && e.y < colBot)) {
    if (!inCard(e)) issues.push(`[OUTSIDE-CARD] (${e.x.toFixed(2)},${e.y.toFixed(2)} ${e.w.toFixed(2)}x${e.h.toFixed(2)}) "${e.text.slice(0, 26)}"`);
  }
  console.log("\n===== AUDIT (" + REC.length + " elements, " + CARDS.length + " cards) =====");
  console.log(issues.length ? issues.length + " issue(s):\n  " + issues.join("\n  ") : "PASS — no bounds / overflow / outside-card issues.");
}
