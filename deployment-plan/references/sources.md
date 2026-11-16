# 设计参考

查阅日期：2026-10-14。以下为公开的一手资料；本技能独立编写，不是厂商官方技能，也不依赖这些技能已安装。

| 来源 | 借鉴点 | 本技能中的取舍 |
| --- | --- | --- |
| [Anthropic skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) | 用真实任务评估技能并据结果迭代 | 提供行为用例与检查标准，不把格式校验当成效果验证 |
| [Microsoft Azure Prepare](https://github.com/microsoft/azure-skills/blob/main/.github/plugins/azure-skills/skills/azure-prepare/SKILL.md) | 持久化部署计划，区分准备、验证与执行 | 保留计划交付和状态边界；移除 Azure 专用依赖，不自动生成 IaC 或启动部署 |
| [Google SRE Workbook：Canarying Releases](https://sre.google/workbook/canarying-releases/) | 小范围验证、对照分析与阶段性放量 | 用于支持灰度的项目；按实际流量与指标设门禁，不套固定比例或时间 |
| [Anthropic webapp-testing](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md) | 分离服务生命周期与测试逻辑，保留浏览器证据 | 复用已有入口；就绪条件扩展为依赖、数据和业务检查，不将端口开放等同于可测试 |
| [Docker Compose 启停顺序](https://docs.docker.com/compose/how-tos/startup-order/) | 容器启动顺序与服务健康条件不同 | 在环境计划中列明依赖就绪门禁，不依靠固定延时 |
| [pytest 输出与报告](https://docs.pytest.org/en/stable/how-to/output.html) | 测试报告可指定输出位置 | 要求报告参数、实际目录和 CI 归档一致；其他技术栈使用各自原生报告 |

本次补充直接查阅了 webapp-testing、azure-prepare、Docker Compose 和 pytest 的上述页面。数据集版本、获取验证、耗时估算及归档约定是面向本需求的独立设计，不声称这些 Skill 已完整覆盖这些要求，也不以来源知名度代替项目验证。

平台命令、云服务能力和 CLI 参数可能变化。生成具体命令时优先查项目锁定版本及当前官方文档；无法核验时明确标为待核验。上述来源是设计依据，不是对任意项目部署安全性的证明。
