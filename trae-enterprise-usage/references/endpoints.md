# TRAE 企业控制台只读接口参考

基址：`https://console.enterprise.trae.cn`，路径前缀 `/trae/gtm/tob/api/v1/config/`。
全部为 `POST`，请求体通常为 `{}`，`content-type: application/json`，同源 `fetch` 需 `credentials: 'include'`。

统一响应外壳：`{ "code": 0, "message": "success", "Data": ... }`；部分接口把载荷直接放在顶层而不是 `Data` 里（见下）。`code !== 0` 时 `message` 给原因。

返回体积参考：`get_personal_quota` ≈ 0.4 KB，`get_personal_core_data` ≈ 0.4 KB，`get_user_model_usage` ≈ 7 KB（逐模型）。只要汇总时取前两个即可。

## 1. `get_personal_quota`

个人额度设置。返回 `user_model_quota`：

| 字段 | 含义 |
| --- | --- |
| `tenant_id` / `user_id` | 租户与成员标识 |
| `seat_pool_currency_quota` | **该席位本周期的人民币额度**（旗舰版 400，团队版 40） |
| `seat_pool_token_quota` | 席位 token 额度（观察值 5000） |
| `paygo_currency_quota` | 按量付费额度；`9999999999` 为「未设上限」哨兵 |
| `has_user_quota` | 是否给该成员单独设了个人额度；`false` 表示走席位池 |
| `system_model_quota_granularity` | 配额粒度，`all` 表示按整体 |

## 2. `get_model_quota`

企业侧模型配额。返回 `tenant_model_quota_list[0]`：

- `seat_pool_per_user_money_quota` —— 每席位人民币额度，与上面 `seat_pool_currency_quota` 同值。
- `all_system_model_per_user_seat_pool_quota` —— 每席位 token 池。
- `all_system_model_total_money_quota` / `all_system_model_per_user_money_quota` —— 企业总量与每用户量；`9999999999` 为不限量。
- `system_model_quota_list[]` —— 逐模型：`config_name`、`display_name`、`total_token_quota`、`per_user_token_quota`、`total_money_quota`、`per_user_money_quota`。
- `custom_model_quota_list[]` —— 自定义模型（BYOM）配额。

`total_token_quota: 1` 这类值出现在未启用的模型行上，不表示「只剩 1 个 token」；判定可用性看 `per_user_token_quota`。

## 3. `get_user_model_usage`

本周期逐模型用量。返回 `user_usage_list[]`，每项含：

- `entitlement_id` —— 权益对象 id。
- `in_seat_detail.chat_usage_details[]` —— 逐模型：`display_name`、`config_name`、`total_token_usage`、`total_cost_currency`（折后实际扣减）、`input_token_usage` / `output_token_usage`（当前实现恒为 0，不要据此报输入输出拆分）。
- `in_seat_detail.cue_token_usage` —— CUE 的 token 总量（CUE 花费恒为 0）。
- `seat_total_cost_currency` / `extra_total_cost_currency` —— 席位内合计与增购合计，可能为 `null`。

**合计消耗**：把 `chat_usage_details[].total_cost_currency` 求和；`total_cost_currency` 为 0 的模型行直接跳过。

## 4. `get_personal_core_data`

周期与总量。返回 `Data`：

| 字段 | 含义 |
| --- | --- |
| `ChatStartTime` / `ChatEndTime` | 本周期起止（epoch 毫秒） |
| `ResetTime` | 额度重置时刻（epoch 毫秒） |
| `ChatUsed` / `ChatTotal` | 已用 / 总额（观察值为 0 / 500，口径与人民币额度不同，别混用） |
| `PayAsYouGoUsed` / `PayAsYouGoTotal` | 按量付费已用 / 总额 |
| `TokenUsage.ChatUsageTokens` | 对话累计 token |
| `TokenUsage.CompletionUsageTokens` | 补全（CUE）累计 token |
| `TokenUsage.ChatUsageQuota` / `CompletionUsageQuota` | 对应配额 |
| `TotalSeats` | 企业席位总数（**这是全企业信息，成员账号也能读到**） |

**周期计算**：`ChatEndTime` 的次日 00:00 本地时间即 `ResetTime`。例：`ChatStartTime 1791561599000` = 2026-10-09 23:59:59，`ChatEndTime 1794239999000` = 2026-11-09 23:59:59，`ResetTime 1794240000000` = 2026-11-10 00:00:00 (+08:00)。UI 顶部显示「模型消耗统计区间：2026/10/09 至 2026/11/09，席位额度将于 2026/11/10 重置」。

## 5. `get_user_token_usage_detail`

明细流水（分页在页面里做）。请求体用 epoch **毫秒**：

```json
{ "start_time": 1791820800000, "end_time": 1791907199999 }
```

传日期字符串会得到 `code: 4001 参数错误`。返回顶层 `items[]`，每行：

| 字段 | 含义 |
| --- | --- |
| `request_time` | 秒级 epoch |
| `app` / `scene` | 客户端（`IDE`）与场景（`chat` / `cue` / `cuepro`） |
| `model_name` / `display_name` | 模型；CUE 行 `model_name` 为空 |
| `session_id` | 会话 id；CUE 行为 `null` |
| `tokens_usage` | 原始 token |
| `discounted_tokens_usage` | 折后 token（UI 显示的就是这个） |
| `input_tokens` / `output_tokens` | 原始输入输出 |
| `cache_input_tokens` / `cache_storage_tokens` | 缓存命中 / 写入 |
| `pre_discount_money_cost` | 折前金额 |
| `total_cost_currency` | **折后实际扣减** |
| `discount_factor` | 折扣系数，`0.5` 表示半价在生效 |
| `billing_source` | `seat` 表示走席位额度 |
| `source` | `基础用量` 等 |

## 6. `get_sub_plan`

订阅计划。**不稳定**：实测偶发返回 `code: 30017 "网络异常"`，与账号状态无关。额度查询不依赖它，失败时重试或直接忽略。

## 其它已知接口（未逐一验证字段）

`get_personal_trend_data`（趋势）、`get_analysis_overview_v2`（看板概览）、`cloudide/api/v3/trae/GetUserInfo`（登录态与用户信息）。

## 权限边界

- **成员账号**只能访问「账户中心 / 个人设置」下的页面；`get_personal_*` 返回的是**本人**数据（例外：`get_personal_core_data.TotalSeats` 是全企业席位总数）。
- 企业级视图（部门、全员用量、共享池总额）需要**管理员**账号，接口前缀不同（`/trae/gtm/tob/api/v1/...` 之外的管理端点）。不要用成员视角的数字冒充企业总额。

## 安全约束

这些接口全部是**只读**查询。查询过程中不要调用任何写接口（签到、改配额、改成员等），不要修改控制台设置，也不要索要或代填用户账号密码。
