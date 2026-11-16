# 可直接粘贴给工具的取数脚本

在**已登录**的 `https://console.enterprise.trae.cn` 页面上，把下面的函数交给浏览器工具的
`evaluate`（Playwright MCP 的 `browser_evaluate`、chrome-devtools MCP 的 `evaluate_script`）执行。
它只做同源只读 `POST`，不写任何数据。

## 完整取数（含周期换算与剩余额度）

```js
async () => {
  const base = '/trae/gtm/tob/api/v1/config/'
  const post = async (path, body = {}) => {
    const response = await fetch(base + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    return await response.json()
  }

  const [quota, core, usage] = await Promise.all([
    post('get_personal_quota'),
    post('get_personal_core_data'),
    post('get_user_model_usage'),
  ])

  const limit = quota?.user_model_quota?.seat_pool_currency_quota ?? null
  const details = usage?.user_usage_list?.[0]?.in_seat_detail?.chat_usage_details ?? []
  const models = details
    .filter((m) => (m.total_cost_currency ?? 0) > 0)
    .map((m) => ({ name: m.display_name, cost: m.total_cost_currency, tokens: m.total_token_usage }))
    .sort((a, b) => b.cost - a.cost)
  const used = models.reduce((sum, m) => sum + m.cost, 0)
  const round = (value) => Math.round(value * 1000) / 1000
  const iso = (ms) => (ms ? new Date(ms).toLocaleString('sv-SE') : null)

  return {
    tenant: quota?.user_model_quota?.tenant_id,
    userId: quota?.user_model_quota?.user_id,
    hasPersonalQuota: quota?.user_model_quota?.has_user_quota,
    limit,
    used: round(used),
    remaining: limit === null ? null : round(limit - used),
    remainingPct: limit ? Math.round(((limit - used) / limit) * 1000) / 10 : null,
    periodStart: iso(core?.Data?.ChatStartTime),
    periodEnd: iso(core?.Data?.ChatEndTime),
    resetAt: iso(core?.Data?.ResetTime),
    totalSeats: core?.Data?.TotalSeats,
    chatTokens: core?.Data?.TokenUsage?.ChatUsageTokens,
    completionTokens: core?.Data?.TokenUsage?.CompletionUsageTokens,
    cueTokens: usage?.user_usage_list?.[0]?.in_seat_detail?.cue_token_usage,
    topModels: models.slice(0, 5),
  }
}
```

## 只取汇总（返回体最小，适合先看一眼）

```js
async () => {
  const post = async (path, body = {}) => {
    const response = await fetch('/trae/gtm/tob/api/v1/config/' + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    return await response.json()
  }
  const quota = await post('get_personal_quota')
  const core = await post('get_personal_core_data')
  return { quota: quota?.user_model_quota, core: core?.Data }
}
```

## 明细流水（按天）

```js
async () => {
  const response = await fetch('/trae/gtm/tob/api/v1/config/get_user_token_usage_detail', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // 必须是 epoch 毫秒；下面是 2026-10-13 00:00:00 → 23:59:59 (+08:00)
    body: JSON.stringify({ start_time: 1791820800000, end_time: 1791907199999 }),
    credentials: 'include',
  })
  const body = await response.json()
  return { code: body.code, rows: body.items?.length ?? 0 }
}
```

`start_time` / `end_time` 的算法：取本地当天 00:00 与次日 00:00 的 epoch 毫秒，`end_time = 次日00:00 - 1`。
JS 里可以直接用 `new Date('2026-10-13T00:00:00+08:00').getTime()` 生成，避免手算。

## 判定账号账本（不需要登录）

在 PowerShell 里读桌面端快照，看是不是企业版：

```powershell
$storage = Get-Content "$env:APPDATA\Trae CN\User\globalStorage\storage.json" -Raw | ConvertFrom-Json
$entitlement = $storage.'iCubeServerData://icube.cloudide' | ConvertFrom-Json
$entitlement.saasEntitlementInfo | Select-Object productType, plan
$entitlement.saasEntitlementInfo.attributes.PSObject.Properties.Name -match '^ent_|^product_'
```

出现 `ent_*` / `product_cli` 等属性即企业版；`plan` 为空对企业版席位是正常值。
