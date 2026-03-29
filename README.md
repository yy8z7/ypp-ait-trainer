<div align="center">

# 🧠 人工智能训练师 (三级) 考证通关引擎
**AI Trainer Certification (Level 3) Study Engine**

*专为零基础考生打造的「沉浸式、抗遗忘」智能备考系统*

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-success)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-lightgrey)

</div>

---

## 🎯 项目愿景 (Vision)

本项目是一款针对**《人工智能训练师（三级）》**职业技能等级认定的专项备考应用。
传统的静态刷题容易导致考生陷入“学了就忘”的死循环，且高强度的题海战术极易产生心理疲劳。本系统将认知心理学中的**艾宾浩斯遗忘曲线（Ebbinghaus Forgetting Curve）**与现代 PWA 技术深度融合，旨在为考生提供一个**零技术门槛、完全离线可用、数据持久化**的沉浸式学习环境，确保在 7 天内高效击穿题库，实现考前肌肉记忆。

## ✨ 核心优势 (Key Features)

### 📈 算法驱动的记忆强化
*   **动态排期算法**：摒弃机械的线性刷题。系统结合“艾宾浩斯+动态分组”策略，将海量题库智能切分为每日学习计划。每日任务自动混合“新题注入”与“旧题复习”，让知识在大脑中扎根。
*   **毫秒级错题追踪**：答错的题目会瞬间被捕获至专属「错题本」，并在未来的 10分钟、1小时、24小时 触发间隔重复测试，直至形成永久记忆。

### 🎮 游戏化与反疲劳设计
*   **科学分轮机制**：将庞大的每日任务拆解为每轮 50 题的“微任务”。通过动态可视化的宏观进度条，将大目标化解为小成就，有效对抗备考期间的心理疲劳。
*   **沉浸式卡片交互**：采用极致丝滑的淡入淡出动效与全屏卡片设计，支持移动端手势滑动操作，带来无干扰的“心流”学习体验。

### ⚡ 现代 Web 技术的极致应用
*   **PWA 离线引擎**：支持“安装至桌面/主屏”。一旦加载，即使在断网的地铁、高铁上依然可以流畅刷题，学习进度实时保存在本地 `localStorage`，断网不断学。
*   **静默热更新架构**：底层采用 Service Worker 的 `Network First` 策略。当题库或系统迭代时，前端界面会自动无感拉取最新版本，彻底告别繁琐的强制刷新。
*   **全场景响应式**：完美适配从 320px 极窄屏幕的手机到超宽带鱼屏的桌面显示器，内置原生暗黑模式 (Dark Mode) 自动跟随系统主题，保护备考者的视力。

## 🚀 极速部署 (Quick Start)

为非技术人员量身定制的零配置启动方案：

### 方案 A：Windows 一键唤醒 (推荐)
直接双击项目根目录下的 `一键启动.bat`。
*脚本会自动探测系统环境中的 Python 或 Node.js，拉起本地高可用服务器，并自动唤醒默认浏览器进入学习状态。*

### 方案 B：极客启动
如果您熟悉终端，只需一行命令即可在 `dist` 目录下启动：
```bash
cd dist
python -m http.server 8000
# 或使用 Node.js: npx serve -p 8000
```
随后在浏览器中访问 `http://localhost:8000` 即可。

## 📂 系统架构 (Architecture)

系统采用纯前端分离架构设计，无需后端数据库支持，极具轻量级与安全性：

```text
├── dist/                   # 🚀 核心生产环境 (直接部署于任何静态 CDN / Nginx / GitHub Pages)
│   ├── index.html          # SPA 视图入口
│   ├── app.js              # 核心大脑：艾宾浩斯算法调度、DOM 渲染、状态机
│   ├── styles.css          # UI 引擎：响应式布局、动画、CSS 变量主题
│   ├── questions.json      # 核心题库：结构化的 AI 训练师试题数据
│   ├── manifest.json       # PWA 桌面应用配置清单
│   └── sw.js               # 缓存与网络拦截中间件 (Service Worker)
├── scripts/                # 🛠️ 构建与数据处理工具链
│   └── parser.js           # 智能解析器：将非结构化 HTML 题库清洗为 JSON
├── docs/                   # 📚 知识库与原始素材
│   ├── 七日计划算法说明文档.md
│   ├── 测试报告与用户反馈表.md
│   └── 题库001.html        # 原始未加工的试题来源
├── 一键启动.bat            # ⚡ Windows 自动化启动脚本
└── package.json            # 依赖关系表
```

## 🔄 题库扩充指南 (Data Parsing)

系统内置了强大的自动化清洗工具，可将网页抓取的杂乱试题直接转化为系统可识别的引擎数据。
只需将新的 HTML 题库文件放入 `docs/` 目录，并执行：

```bash
npm install
node scripts/parser.js
```
解析器将自动提取题干、选项、正确答案，并编译更新至 `dist/questions.json`。

## 📜 许可证 (License)

本项目采用 [MIT License](LICENSE) 开源协议。欢迎二次开发与学习交流。