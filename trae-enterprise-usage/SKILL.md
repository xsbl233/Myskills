---
name: trae-enterprise-usage
description: 查询 TRAE 企业版（团队版/旗舰版）席位的剩余额度与用量。当用户问「我的 Trae 额度/余额还剩多少」「企业版额度池」「这个账号是个人版还是企业版」「插件显示积分 0 是不是额度用完了」，或需要按周期统计模型花费时使用。企业版额度在企业控制台，不在个人版积分接口。
---

# 查询 TRAE 企业版额度与用量

TRAE 有**两套互不相通的账本**，先分清再用对应口径，否则会得出错误的「额度为 0」。

| | 个人版 | 企业版（团队版 / 旗舰版） |
| --- | --- | --- |
| 计费单位 | 积分（credit） | 人民币额度（¥），按 token 折算 |
| 查询位置 | `api.trae.cn` 的 pay/ug 接口 | `console.enterprise.trae.cn` 的 gtm/tob 接口 |
| 谁能查 | 本人 | 本人席位（成员）／全企业池（管理员） |
| 常见工具 | `dsh-connect-trae` 插件卡片 | 企业控制台「个人用量 → 用量管理」 |

**关键陷阱**：对企业版账号，个人版积分接口返回的是一份**空文档**（`total/consumed/available` 全 0、积分包列表为空），`dsh-connect-trae` 会据此渲染成「积分 0 + 免费包」。这**不是**额度耗尽，只是读错了账本。

## 步骤 0：判断账号属于哪一套账本

不必登录，直接读桌面端的权益快照（明文 JSON）：

```
%APPDATA%\Trae CN\User\globalStorage\storage.json
```

取键 `iCubeServerData://icube.cloudide`（值是明文 JSON，不是加密串），看 `saasEntitlementInfo`：

- `productType: 231` 且 `attributes` 里出现 `ent_*`（`ent_open_platform`、`ent_department_management`、`ent_command_blacklist`、`ent_mcp_whitelist`、`ent_overseas_access`…）与 `product_cli`、`product_solo` → **企业版**。
  - `plan: ""` 对企业版席位是**正常值**，不代表没套餐；档位由 `ent_*` 属性组合体现（旗舰版独有 CLI / OpenAPI / 部门管理 / 命令黑名单 / MCP 白名单 / 专属域名）。
- 个人版则是 Lite / Pro / Pro+ / Ultra 档位，属性里没有 `ent_*`。

其它安装形态的 storage 路径：`Trae`（国际版）、`TRAE SOLO CN`、`TRAE SOLO`。判定只看 `saasEntitlementInfo`，与安装形态无关。

判定为企业版后，**不要**再用个人版积分接口下结论。

## 步骤 1：打开企业控制台并登录

用浏览器工具打开 `https://console.enterprise.trae.cn/`。

- 已登录 → 直接进 `/personal/usage`。
- 未登录 → 会出现「企业版登录」（邮箱+密码）或「企业 SSO 登录」。**登录必须由用户本人完成**：不要索要、不要代填账号密码，也不要用桌面端凭据去登录（桌面端的 `Cloud-IDE-JWT` 在企业控制台不被接受，实测相关路径返回 404/405）。
- 浏览器工具的 profile 通常是临时的（Playwright MCP 的 `--isolated`、chrome-devtools MCP 的 puppeteer 临时目录），**cookie 不跨会话保留**，所以每次新会话大概率要请用户重新登录一次。让用户在**工具自己打开的那个窗口**里登录，登完再继续。要免去这一步，见下节「固化登录态」。

登录成功的判据：侧边栏出现企业名与档位（如「华为 / 旗舰版」）和成员身份。

### 固化登录态（可选，按需选择）

会话凭据是**单个 cookie**：`X-Cloudide-Tob-Session`（HttpOnly、Secure、SameSite=Lax），有效期约 13 个月（实测到期日 2027-11-17），不是会话级。实测把**仅此一个** cookie 注入全新浏览器上下文后，额度接口仍返回 200，因此登录态可以固化。

| 方案 | 做法 | 取舍 |
| --- | --- | --- |
| **持久化 profile（推荐）** | 把浏览器 MCP 的启动参数从 `--isolated` 改为 `--user-data-dir <专用目录>`（Playwright MCP 还可用 `--storage-state <path>`） | 凭据留在浏览器自身的加密存储（Windows 走 DPAPI），**没有明文密钥文件**，Agent 无需接触其值；代价是该目录成为长期凭据载体，且改动需重启宿主进程才生效 |
| storage-state 文件 | `--storage-state <path>`，cookie 以 JSON 落盘 | 配置简单，但该 JSON 是**明文**长期凭据，安全性明显更差 |
| 官方 CLI 登录令牌 | 控制台「访问令牌 → 生成登录令牌」 | 页面明确写「**只用于 TRAE CLI 登录身份验证**」；**未验证**它对控制台额度接口是否有效，且生成属写操作 |
| 挂到用户日常浏览器 | `--cdp-endpoint` / `--extension` 连接既有浏览器 | 不新增凭据存储；代价是驱动用户真实浏览器（含其它标签与会话） |

**安全约束（无论选哪种）**：

- 这是**完整账号凭据**，不是只读令牌 —— 它授予该角色在控制台的全部权限（含写操作），不只是查额度。
- **绝不要把凭据值写进文件、日志或工具调用上下文**：DSH 会话记录持久且模型可见。正确做法是让浏览器工具自己持有它，Agent 始终看不到值。
- 撤销方式：在控制台**登出**即令 cookie 失效；这是用户的 kill switch。
- 固化前先确认宿主进程的文件权限面（例如 DSH 处于 `danger-full-access` 时，任何落盘长期凭据都暴露在同一权限面下），这也是不推荐明文落盘的原因。

### 本机已落地的配置（2026-10-13）

本机已按「持久化 profile」配置完成，**重启宿主进程后生效**：

- Playwright MCP：`--user-data-dir C:/Users/Admin/.dsh-local/browser-profiles/trae-console`
- chrome-devtools MCP：`--userDataDir C:/Users/Admin/.dsh-local/browser-profiles/trae-console-devtools`
- 覆盖写在**用户层** `~/.dsh/profiles/web/cordis.patch.yml`（该层在 bundle 层之后应用，可覆盖 bundle 用 `insert` 建的行）；bundle 文件保持原样。
- 落点选择理由：profile 里已有「用户层覆盖 bundle 配置」的既有约定，且 `dsh --profile web --dump-config` 是权威校验手段 —— 它会打印每行「被哪个层 patch 过」。

**首次仍需登录一次**：持久化只保证「登一次、以后免登」，不提供初始凭据。登录必须由用户本人完成。

**实测结论**（2026-10-13）：

- 会话凭据确为单个 cookie `X-Cloudide-Tob-Session`，有效期约 13 个月（到 2027-11-17）。
- 仅注入该 cookie 到全新上下文 → 额度接口返回 200 / quota 400，不跳登录页。
- 持久化 profile 跨进程保留已用**探针 cookie** 验证：写入 → 完全关闭浏览器 → 重新启动同目录 → cookie 仍在且值一致（PASS）。

**运维注意**：

- 同一 profile 目录**不能被两个进程同时打开**。若上一个浏览器进程未正常退出，会留下 `lockfile` 并让下次启动失败（Chrome 退出码 21）；处理办法是结束占用该目录的 `chrome.exe` 进程并删除 `lockfile`。
- 该目录约 15 MB 起，会随使用增长；不需要时直接删目录即可（等于清除已保存的登录态）。
- 排查启动问题时用独立脚本 `chromium.launchPersistentContext(dir, { channel: 'chrome' })` 验证，比在 MCP 进程内部再启动浏览器更可靠。


## 步骤 2：读取数据

**推荐做法**：把页面导航到 `https://console.enterprise.trae.cn/personal/usage`，然后在**页面上下文里**用同源 `fetch` 取数（`credentials: 'include'` 带上会话 cookie）。比逐页点 UI 更快、更准，且全程只读。

```
async () => {
  const post = async (p, body = {}) => {
    const r = await fetch(p, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    return { status: r.status, body: await r.json() }
  }
  const base = '/trae/gtm/tob/api/v1/config/'
  return {
    quota: await post(base + 'get_personal_quota'),
    modelQuota: await post(base + 'get_model_quota'),
    usage: await post(base + 'get_user_model_usage'),
    core: await post(base + 'get_personal_core_data'),
  }
}
```

`get_user_model_usage` 与 `get_personal_core_data` 的返回体积可能很大；只要数字时改用 `get_personal_core_data`（含周期与总 token），要逐模型金额时再用 `get_user_model_usage`。

**实测踩坑**：在同一页面连续执行多次取数脚本时，偶发 `TypeError: Failed to fetch`；重试一次即恢复，**不是**登录失效（判据：同一页面上单条 `fetch` 仍返回 200）。取数脚本里对每个 `post` 加一次重试即可。可直接复制的完整脚本（含周期换算、剩余额度与百分比）见 `scripts/query.md`。

接口字段含义、周期字段与明细流水见 `references/endpoints.md`。

**备选做法**：走 UI。`/personal/usage` → 点「用量管理」页签 → 读「总用量 ￥已用 | ￥额度」与逐模型列表。UI 与接口同源，数字应一致；不一致时以接口为准，并说明差异。

## 步骤 3：计算与解读

- **剩余额度 = `seat_pool_currency_quota` − Σ 各模型 `total_cost_currency`**（同一统计周期内）。
- **统计周期**取自 `get_personal_core_data` 的 `ChatStartTime` / `ChatEndTime`，重置时刻取 `ResetTime`（epoch 毫秒，按本地时区换算）。UI 顶部会写明「统计区间 … 席位额度将于 … 重置」。
- **CUE / CUE Pro 花费为 0**，但会消耗 token：算金额时不要把它计入消耗，报 token 时不要漏掉它。
- 流水里 `discount_factor: 0.5` 表示折扣在生效（企业版内置模型半价活动），`pre_discount_money_cost` 是折前价、`total_cost_currency` 是折后实际扣减。**报数用折后值**。
- `9999999999` 是「未设置上限／不限量」的哨兵值，不是真实额度，不要原样报给用户。
- `has_user_quota: false` 表示没有给该成员单独设个人额度，走的是席位池。
- 成员账号看不到企业级视图（侧边栏只有「账户中心 / 个人设置」）。要查**全企业共享池总额与各席消耗**需要管理员账号；不要拿成员视角的数字冒充企业总额。

## 报告口径

给用户的答复至少包含：账号/租户与档位、本周期已用与额度、剩余（绝对值与百分比）、统计区间与重置日、花费最高的模型、以及「额度是否充足」的结论。若数字来自接口而非 UI，说明一句数据来源。

## 常见坑

1. **拿个人版接口回答企业版账号** → 永远得 0。先做步骤 0。
2. **`get_sub_plan` 偶发返回 `code: 30017 网络异常`** → 该接口不稳定，失败不代表账号异常；重试或忽略，额度不依赖它。
3. **`get_user_token_usage_detail` 报 `4001 参数错误`** → 它要的是 epoch **毫秒**的 `start_time` / `end_time`（如 `{"start_time":1791820800000,"end_time":1791907199999}`），不是日期字符串；页面的「今天/近7天/近30天」按钮就是在算这个区间。
4. **`/personal/token`（访问令牌）页面可能渲染为空** → 企业版 OpenAPI 令牌页在成员视角下可能无内容，不影响额度查询。
5. **别把登录失效当成额度问题**：桌面端席位 token 过期后，插件与 DSH 会话会先报登录错误，症状很像「额度耗尽」。先确认登录态，再看额度。
6. **只读**：这套接口全部是读操作。不要调用任何写接口，也不要改动企业控制台里的设置。

## 证据与版本

2026-10-13 实测：企业版旗舰版席位，租户 `269612032`，成员账号，`productType: 231`；`seat_pool_currency_quota: 400`，周期 2026-10-09 → 2026-11-09，重置 2026-11-10，已用 ￥42.831（GLM-5.3 ￥26.946 + DeepSeek-V4.1-Flash ￥15.885），剩余 ￥357.169。环境：Trae CN 2.3.86566 / app 3.3.103。
