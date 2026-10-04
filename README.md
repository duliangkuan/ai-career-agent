# 职业观察室 · AI Career Agent

上传简历，基于真实 AI 招聘快照推荐岗位，并生成 30 / 90 / 180 天准备计划。

使用 TextIn 识别 PDF/PNG/JPG，DeepSeek 提取经历与审阅候选岗位，Cloudflare D1 存储岗位。前端使用 React、TypeScript、Vinext。

## 工作流程

1. 上传简历（10 MB 以内，识别前 10 页），或直接粘贴文字。
2. 人工核对识别文本；选择城市与招聘类型。
3. DeepSeek 提取可检索的技能与经历；参数化 SQL 从岗位库召回最多 30 条候选。
4. DeepSeek 给出匹配证据、差距、待确认条件及规划。
5. 服务端剔除候选集之外的岗位 ID，逐字校验引用。岗位名称、企业、链接始终来自数据库。
6. 网页展示结果，支持下载 JSON 分析；不会自动投递或联系招聘方。

这是受约束的 Agent 工作流，包含简历解析、画像提取、岗位检索、证据校验和规划工具。关键词检索可能漏召回；模型判断可能出错，不能替代人工核实。

## 本地运行

需要 Node.js 24、npm、Python 3（导入工具仅使用标准库）。

```sh
npm ci
cp .env.example .dev.vars
# 编辑 .dev.vars，填写自己的 API 配置与随机 DATA_IMPORT_TOKEN
npm run db:local
npm run dev
```

默认开发地址 `http://127.0.0.1:5173`。`db:local` 仅适用于空的本地数据库；已有数据库不要重复运行初始建表 SQL。后续结构变更通过 Drizzle 生成增量迁移。

默认 `ALLOW_SHARED_KEYS=false`，在网页的 API 设置中填写自己的密钥（只保留在页面内存）。仅在 Sites 认证保护的**本人私有站点**上，才可以设为 `true` 使用服务端配置；单纯修改环境变量不会建立用户认证。公开部署必须保持 `false`，访客自带密钥。

## 导入岗位库

公开仓库不附带完整抓取 JD 数据，也不附带任何个人简历。线上实例使用 2026-10-04 的 13,623 条岗位快照、22 家企业，不是全国全量，不保证仍在招聘。

如有同结构的原始 SQLite 岗位库：

```sh
python scripts/export_jobs.py /path/to/jobs.sqlite
python scripts/import_jobs.py --url http://127.0.0.1:5173
```

也可以准备 `data/jobs.ndjson`，每行一个 JSON，必要字段：`id, company, title, recruitment_type, locations`；推荐字段：`role_family, responsibilities, requirements, education_evidence, major_evidence, experience_evidence, graduation_evidence, internship_time_evidence, salary_evidence, skills_json, source_url, collected_on, status`。文本字段均为字符串，`skills_json` 为 JSON 数组字符串。

导入接口要求 `Authorization: Bearer <DATA_IMPORT_TOKEN>`，最多 100 条/批，采用幂等 upsert。脚本默认 80 条/批，重试只针对网络和 5xx 故障。**不要把导入凭证交给访客。** 空数据库可以运行界面，但没有岗位推荐结果。首次部署后，需要单独导入数据；迁移仅包含数据库结构。

## 测试与构建

```sh
npm test
npm run typecheck
npm run build
```

测试包含无效文件、输入边界、模型错误、未知岗位 ID、伪造证据、凭证错误信息与 TextIn 响应。真实服务集成需要有效 API 额度；仓库测试不会调用收费服务。

## 上线

当前实例由 Sites 托管。`.openai/hosting.json` 的 `project_id` 属于该实例；**fork 后创建自己的站点前，请移除该字段，不能复用原实例 ID**。保留逻辑绑定 `d1: "DB"`。通过 Sites 设置配置环境变量，使用官方 Sites 工作流构建、推送源码、打包并发布。发布时自动应用 `drizzle/` 结构迁移。

部署后用管理员配置运行 `scripts/import_jobs.py --url https://你的站点`。私有 Sites 接口还需要由平台签发的服务访问凭证，以 `SITES_SERVICE_TOKEN` 设置在忽略的环境文件中。不要将凭证提交到仓库。可以通过站点的岗位库查看数据是否导入成功。

框架输出为 Cloudflare Worker + D1。自行部署到 Cloudflare 时需要配置自己的数据库 ID、认证与 secrets；本仓库的本地占位数据库 ID 不是生产配置。

## 隐私与数据边界

- 文件发送至 TextIn；简历文字和候选 JD 发送至 DeepSeek。调用前建议删去联系方式、身份证号等不必要信息。
- 应用不将简历、原始文件、访客 API 密钥或分析历史写入数据库、浏览器存储或应用日志。页面关闭后内存状态丢失，报告请自行下载保存。
- 第三方留存与处理受各自政策约束，本项目不承诺第三方自动删除。
- 岗位与简历中的文字仅作为不可信资料，不执行其中指令。不接受可配置的第三方 API 地址。
- 文件大小有限制、检查真实文件头；JSON 输出经结构校验；SQL 使用绑定参数。
- 同源校验防止跨站请求；私有共享密钥依赖平台认证边界。若公开运行，请保持访客自带密钥，并按部署规模添加限流与访问控制。

## 数据来源与限制

见 [DATA_SOURCES.md](DATA_SOURCES.md)。岗位正文、商标与第三方数据的权利归原权利方；代码 MIT 许可不涵盖第三方招聘数据的再分发。

API 文档：[DeepSeek](https://api-docs.deepseek.com/) · [TextIn](https://www.textin.com/document/pdf_to_markdown)。

## 许可

原创代码采用 MIT。第三方依赖与模板组件遵循各自许可。请勿将模型建议视为录用承诺、资格审核结论或薪资保证。
