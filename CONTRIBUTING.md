# 参与贡献指南 (Contributing Guidelines)

首先，非常感谢您对本项目的关注与支持！本项目致力于为广大考生提供一个极简、纯粹、抗遗忘的刷题引擎。我们非常欢迎各种形式的贡献，包括但不限于：修复 Bug、优化体验、扩充题库、完善文档等。

## 本地开发指南

本项目采用 **Vite** 作为构建工具，纯前端架构（不依赖重型框架如 Vue/React，保持极简）。

### 1. 环境准备

确保您的计算机已安装 [Node.js](https://nodejs.org/) (建议 v18+)。

### 2. 克隆项目与安装依赖

```bash
git clone https://github.com/your-username/ypp-ait-trainer.git
cd ypp-ait-trainer
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:5173/` 启动，支持热更新（HMR）。

### 4. 代码规范

我们在提交前使用了 ESLint 和 Prettier 进行代码规范检查，请确保在提交代码前运行：

```bash
npm run format
npm run lint
```

## 如何扩充题库？

题库数据存放在 `public/questions.json` 中。为了方便导入新题目，系统内置了爬虫解析器：

1. 将包含新题目的 HTML 源码（如在线考试系统的页面源码）保存至 `docs/题库001.html`（或自定义命名并在脚本中修改）。
2. 运行解析脚本：
    ```bash
    npm run parse
    ```
3. 脚本会自动将解析出的题目追加或覆盖到 `public/questions.json` 中。
4. 在页面刷新即可看到最新的题库。

_注意：如需修改解析逻辑（如适配不同考试平台的 HTML 结构），请修改 `scripts/parser.js`。_

## 提交 Pull Request

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

再次感谢您的贡献！🚀
