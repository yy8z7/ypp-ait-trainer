# 7日刷题通关计划 (7 Days Study App)

A practice quiz assistant designed for certification exams, helping users prepare with an intuitive, spaced-repetition based approach.

## 项目简介 (Introduction)

本项目是一个面向零技术门槛用户的纯前端 PWA 刷题应用。核心目标是在 7 天内帮助用户高效刷完题库，并利用艾宾浩斯记忆曲线达到长期记忆的强化效果。
项目支持将静态 HTML 题库自动解析为 JSON 格式，并提供流畅的响应式前端界面、本地数据持久化以及完整的错题本复习机制。

## 核心功能 (Features)

*   **智能排期算法**：结合“艾宾浩斯+分组”策略，将大题库拆分为每日任务，每天新学+复习智能穿插。
*   **科学分轮机制**：为减轻疲劳感，每日任务被切分为每轮 50 题（支持动态区块展示），实时显示宏观进度。
*   **完全离线可用 (PWA)**：支持安装到桌面或手机主屏，无网环境也能继续刷题。
*   **错题自动追踪**：错误题目自动加入错题本，并在 10分钟、1小时、1天等时间点进行间隔重复。
*   **无感热更新**：前端界面采用 Service Worker Network First 策略，即时获取最新更新内容，告别手动强制刷新。
*   **完美响应式**：支持跨平台、全尺寸屏幕（手机、平板、桌面），适配浏览器暗黑/明亮主题。
*   **一键启动**：提供 Windows `.bat` 批处理文件，双击即可在本地快速启动服务并打开浏览器。

## 快速开始 (Quick Start)

### 方法一：双击一键启动 (推荐 Windows 用户)
直接双击根目录下的 `一键启动.bat`。脚本会自动检测您电脑上安装的 Python 或 Node.js，并在本地启动一个 HTTP 服务器，随后自动在浏览器中打开项目。

### 方法二：手动启动服务
进入 `dist/` 目录，启动任意本地 HTTP 服务器。例如：
```bash
cd dist
python -m http.server 8000
# 或者使用 npx serve
# npx serve -p 8000
```
然后在浏览器中访问 `http://localhost:8000`。

## 目录结构 (Structure)

```text
├── dist/                   # 核心前端静态资源 (可直接部署至任何静态服务器)
│   ├── index.html          # 主界面
│   ├── app.js              # 核心业务逻辑与算法
│   ├── styles.css          # 响应式样式与主题
│   ├── questions.json      # 题库数据 (由 scripts/parser.js 生成)
│   ├── manifest.json       # PWA 配置文件
│   └── sw.js               # Service Worker 脚本 (缓存与热更新控制)
├── scripts/                # 脚本工具目录
│   └── parser.js           # 题库解析脚本 (Node.js)
├── docs/                   # 相关说明文档与原始素材
│   ├── 七日计划算法说明文档.md
│   ├── 测试报告与用户反馈表.md
│   └── 题库001.html        # 原始 HTML 题库文件
├── 一键启动.bat            # Windows 快捷启动脚本
└── package.json            # Node.js 依赖配置
```

## 数据解析 (Parsing)
如果需要更新题库，可以将新的 HTML 题库文件放在 `docs/` 目录，然后修改并运行解析脚本：
```bash
npm install
node scripts/parser.js
```
脚本会自动解析 HTML 并将格式化后的题目输出至 `dist/questions.json`。

## 许可证 (License)
MIT License