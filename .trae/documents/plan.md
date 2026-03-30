# 🚀 项目优化与开源规范化计划 (Plan)

## 1. 总体目标 (Summary)

当前项目是一个极具潜力的纯前端刷题 PWA 应用，核心的“艾宾浩斯记忆算法”和“无后端的轻量化设计”非常适合作为开源项目推广。
为了让其达到**高质量开源项目**的标准，本计划将围绕**“工程化重构、代码模块化、开源规范化”**三个维度进行升级，同时**保持其作为“纯粹刷题工具”的轻量级和零依赖特性**（不引入 React/Vue 等重型框架，保持原生 JS 的极致性能）。

## 2. 当前状态分析 (Current State Analysis)

- **目录结构反模式**：源码（`index.html`, `app.js`, `styles.css`）直接裸露在 `dist/`（发布产物）目录中，缺乏现代前端工程结构。
- **代码高耦合**：`app.js` 是一个单体巨型文件，DOM 操作、状态存储、算法逻辑混杂在一起，开源协作者难以阅读和维护。
- **缺乏规范工具**：没有代码格式化（Prettier）、语法检查（ESLint）工具，多人协作时容易产生代码风格冲突。
- **开源文档缺失**：虽然有很好的 `README.md`，但缺少参与贡献的指南（`CONTRIBUTING.md`）、Issue 模板和 `.editorconfig`。

## 3. 拟定更改步骤 (Proposed Changes)

### 第一阶段：工程目录重构与构建工具引入 (Project Restructuring)

- **动作**：引入轻量级且极速的现代构建工具 **Vite**。
- **文件调整**：
    - 将 `dist/` 中的源代码移动到新建的 `src/` 目录中。
    - `dist/` 目录将严格作为 `npm run build` 后的编译产物目录，并在 `.gitignore` 中忽略。
    - 修改 `package.json`，增加标准命令：`"dev": "vite"`, `"build": "vite build"`, `"preview": "vite preview"`。
- **收益**：开发者只需 `npm run dev` 即可享受热更新（HMR），产物将自动被压缩混淆，加载速度更快。

### 第二阶段：核心刷题逻辑模块化拆分 (Code Modularization)

- **动作**：将几百行的 `app.js` 利用 ES6 Modules 拆分为多个单一职责的模块，方便开源贡献者理解。
- **文件调整**：在 `src/js/` 下建立：
    - `state.js`：封装存储逻辑（优雅处理 Node Server `data/index.json` 与浏览器 `localStorage` 的双重 fallback 机制）。
    - `algorithm.js`：专门存放艾宾浩斯复习调度算法、题目分组（daySplit）逻辑。
    - `ui.js`：封装 DOM 渲染、页面切换（Screen Switch）、卡片动画。
    - `main.js`：入口文件，负责初始化事件监听和启动 Service Worker。
- **收益**：逻辑清晰，算法与 UI 解耦，方便后续编写单元测试。

### 第三阶段：代码质量与规范化链条 (Code Quality & Tooling)

- **动作**：引入前端开源项目标配的基建工具。
- **文件调整**：
    - 配置 `ESLint` + `Prettier`，并添加对应的配置文件（`.eslintrc`, `.prettierrc`）。
    - 添加 `.editorconfig`，统一所有开发者的缩进（如统一使用 4 个空格或 2 个空格）。
    - 在核心算法函数上补充 **JSDoc** 注释，明确参数结构（如 `Question` 对象、`State` 对象的结构），降低代码阅读门槛。

### 第四阶段：完善开源社区文档 (Open Source Community Standards)

- **动作**：增加标准化的 GitHub 社区文件。
- **文件调整**：
    - 创建 `CONTRIBUTING.md`：指导外部开发者如何本地运行项目、如何使用 `parser.js` 扩充题库。
    - 创建 `.github/ISSUE_TEMPLATE/`：提供“Bug 反馈”和“新增需求”的标准化 Markdown 模板。

## 4. 假设与决策 (Assumptions & Decisions)

- **技术栈决策**：**不引入** React/Vue/TypeScript。为了保证非专业前端或后端开发者也能轻松 Fork 并修改题库，坚持使用 **原生 JavaScript (Vanilla JS)**。
- **存储决策**：保留 `server.js` + `localStorage` 的双重设计。这既满足了通过 `.bat` 一键启动在本地存文件的极客需求，也满足了纯 PWA 部署到 GitHub Pages 时的纯离线需求。
- **测试决策**：考虑到这是一个“刷题”工具，复习算法是核心。如果时间允许，可以为 `algorithm.js` 添加几个简单的单元测试，以保障复习逻辑的严谨性。

## 5. 验证标准 (Verification Steps)

1. 运行 `npm run dev`，前端页面能够正常加载，且刷题交互、动画依然流畅。
2. 断开网络，PWA Service Worker 依然能接管缓存并提供服务。
3. `npm run build` 能成功在 `dist/` 生成高度压缩的生产环境代码。
4. `npm run lint` 能够通过，没有代码风格错误。
