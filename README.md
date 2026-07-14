# AlgoNote

AlgoNote 是一个面向中文算法学习者的 Python / C++ 刷题工作台。它保留成熟在线判题平台的核心练习流程：分类选题、阅读题意摘要、编写代码、隔离运行、查看渐进提示与题解，并在卡住时向 AI 助教提问。

本站不是 LeetCode 官方产品，也不批量转载完整题面。题库页使用公开目录元数据；练习时始终提供 LeetCode 中文站原题链接，完整约束和函数签名以官方页面为准。

## 当前覆盖

截至 2026-07-14 的仓库快照：

| 内容 | 数量 | 说明 |
| --- | ---: | --- |
| 题目目录 | 4,379 | 中英文标题、难度、通过率、会员状态与算法标签 |
| 第三方参考实现覆盖 | 3,182 | 来自 `walkccc/LeetCode`，按需从上游读取 |
| Python 参考实现 | 2,889 | MIT 许可，不一定包含可直接运行的测试入口 |
| C++ 参考实现 | 3,140 | MIT 许可，不一定包含可直接运行的 `main` |
| Python + C++ 双语参考 | 2,847 | 同一道题同时有两种语言 |
| 原创深度题解 | 8 | 原创摘要、提示、推导、复杂度、双语代码与内置测试 |

这不是“4,379 道题全部拥有原创双语标准答案”。题库会逐题显示真实代码覆盖；没有参考实现的题目仍可打开官方题面并使用编辑器、运行器和 AI 助教。

## 功能

- 按数组、双指针、滑动窗口、栈、二分、链表、树、图、动态规划和贪心分类学习
- 按题号、中英文题名、标签和难度检索
- Monaco Python / C++ 编辑器，本地草稿自动保存
- 自建 Piston 沙箱执行代码，限制运行时间、内存、输入和源码大小
- 原创题解按“提示 -> 思路 -> 标准实现”渐进揭示
- MIT 第三方实现按真实语言覆盖读取并显示来源
- OpenAI Responses API 驱动的中文算法助教
- 收藏、尝试、完成状态保存在浏览器本地
- 浅色/深色主题，以及桌面双列和移动三标签工作台

## 技术栈

- React 19、TypeScript、Vite 7
- Express 5、Zod、Helmet
- Monaco Editor、Lucide 图标
- 自建 Piston 代码执行沙箱
- OpenAI Node SDK
- Vitest、Playwright、Axe

## 本地运行

需要 Node.js 20+、npm 和 Docker Desktop。

```powershell
npm install
Copy-Item .env.example .env
npm run setup:runner
npm run dev
```

打开：

- 网站：<http://127.0.0.1:5173/>
- API 健康检查：<http://127.0.0.1:8787/api/health>
- Piston 仅绑定本机：<http://127.0.0.1:2000/>

若 Windows PowerShell 禁止执行 `npm.ps1`，把命令中的 `npm` 改为 `npm.cmd`。

`npm run setup:runner` 会启动 `docker-compose.runner.yml` 中的 Piston，并安装 Python 与 GCC 运行时。首次安装需要下载镜像和语言包。

## 环境变量

复制 [.env.example](./.env.example) 后按需配置：

| 变量 | 用途 |
| --- | --- |
| `PORT` | Express 端口，默认 `8787` |
| `HOST` | 监听地址；本机默认 `127.0.0.1`，容器内可用 `0.0.0.0` |
| `PISTON_URL` | 私有 Piston API，默认 `http://127.0.0.1:2000/api/v2` |
| `OPENAI_API_KEY` | 可选；启用 AI 助教，必须只放在服务端 |
| `OPENAI_MODEL` | 助教模型，可按部署账户可用模型覆盖 |
| `OPENAI_SAFETY_SALT` | 生成匿名安全标识的服务端随机密钥 |
| `GITHUB_TOKEN` | 可选；提高题解同步和 Contents API 回退的 GitHub 限额 |

AI 助教只在用户主动发送消息时接收当前题目摘要、当前代码和提问。不要把密钥写入 `VITE_*` 变量，也不要提交 `.env`。

## 数据同步

```powershell
npm run sync:catalog
npm run sync:solutions
```

- `sync:catalog` 从 LeetCode CN 公开 GraphQL 目录读取元数据并更新 `src/data/catalog.json`，不需要登录，也不抓取完整题面。
- `sync:solutions` 从 `walkccc/LeetCode` 的公开 Git 树生成服务端清单和浏览器端紧凑覆盖表。
- 同步结果是时间点快照，题目数量和第三方覆盖会随上游变化；测试不会把当前数量永久硬编码。

## 验证命令

```powershell
npm run typecheck
npm test
npm run build
npm run verify:solutions
npm run qa:a11y
npm run qa:visual
```

`verify:solutions` 和两项浏览器 QA 需要开发服务正在运行；题解验证还需要 Piston。视觉截图写入被 Git 忽略的 `artifacts/visual-qa/`。

## 生产部署

构建后由同一个 Express 进程提供静态页面和 API：

```powershell
npm run build
$env:HOST = "0.0.0.0"
npm start
```

公开部署前至少完成以下配置：

- 使用 HTTPS 反向代理，并让应用与 Piston 位于私有网络
- 不要把 Piston 的 `2000` 端口暴露到公网
- 为多实例部署换成共享限流与缓存存储；当前实现是单进程内存限流
- 为 AI 助教设置预算、速率限制、日志脱敏和滥用监控
- 定期更新 Piston、语言运行时和 npm 依赖
- 设置 `GITHUB_TOKEN` 后定期刷新参考实现清单

公共 Piston 服务自 2026-02-15 起采用白名单，生产环境必须使用自建或其他受控沙箱。不要在 Express 进程中直接执行用户代码。

## 项目结构

```text
src/                         React 应用、题目目录、原创深度题解
server/                      API、限流、沙箱和第三方题解代理
scripts/                     数据同步、沙箱初始化与 QA
python/                      可选的本仓库原创 Python 文件目录
cpp/                         可选的本仓库原创 C++ 文件目录
PRODUCT.md                   产品与版权边界
DESIGN.md                    真实设计令牌和组件规范
docker-compose.runner.yml    本地 Piston
```

原创题解的格式与贡献要求见 [SOLUTIONS.md](./SOLUTIONS.md)，分类练习方法见 [LEARNING.md](./LEARNING.md)。

## 来源与许可

- LeetCode 名称、题目与商标归其权利人所有；本项目与 LeetCode 无隶属或背书关系。
- 第三方参考实现来自 [walkccc/LeetCode](https://github.com/walkccc/LeetCode)，Copyright (c) 2022 Peng-Yu Chen，采用 MIT License。
- 本项目自身代码采用 [MIT License](./LICENSE)。完整第三方声明见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
