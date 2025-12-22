# 📚 NovelStack
<div align="left">


专为长篇创作者打造的私有化、全栈式小说创作平台。
<br>
拒绝碎片化，让世界观、时间轴、人物关系与正文无缝融合。

快速开始 • 核心功能 • 技术栈 • 贡献指南
</div>  

## 📖 简介 (Introduction)

NovelStack 不仅仅是一个打字工具，它是为构建宏大世界观而生的史诗级创作系统。

市面上的写作软件要么数据不安全（云端封禁风险），要么功能单一（纯文本编辑器）。NovelStack 采用 Docker 私有化部署，确保数据 100% 掌握在自己手中。同时，它深度集成了动态关系网、多维时间轴和AI 辅助，帮助科幻、奇幻、历史类作家梳理复杂的逻辑脉络。
## ✨ 核心功能 (Key Features)
## ✍️ 沉浸式写作工作台

    专业编辑器：基于 Tiptap 打造，支持 Markdown 语法。

    一键排版：专为网文优化，自动首行缩进、去空行，符合出版标准。

    目录管理：支持卷/章层级，右键菜单支持拖拽排序、跨卷转移。

    实时保存：毫秒级自动保存，不再担心丢稿。

## 🌏 动态世界观系统

    百科资料库：管理人物、地点、道具、功法等设定，支持上传图片。

    人物关系网 (Social Graph)：基于力导向图的可视化社交网络，直观展示角色间的爱恨情仇（支持自定义关系类型）。

    多维时空架构 (Chrono-System)：

        多纪元管理：支持“太古”、“上古”、“末法”等自定义纪元。

        泳道图视图：多势力/多时间线并行展示，理清复杂的历史脉络。

        事件关联：每个历史大事件可关联具体参与角色，形成人物履历。

## 🤖 AI 智能副驾驶

    多模型路由：支持 OpenAI, Claude, DeepSeek 以及本地 Ollama 模型。

    灵感生成：在编辑器内直接呼出 AI，辅助润色、续写、起名或生成环境描写。

## 🛡️ 数据主权与工程化

    完全私有：Docker 容器化部署，数据存储在本地 PostgreSQL 和 MinIO。

    备份与恢复：支持单书 JSON 全量备份/恢复，以及 Docx 格式一键导出。

🖼️ 预览 (Previews)

![主页](/capimage/主页.png)

![世界观](/capimage/人物.png)

![时间轴](/capimage/时间轴.png)

![关系网](/capimage/关系网-列表.png)

![AI配置](/capimage/AI配置.png)

![编辑页面](/capimage/编辑页面.png)
## 🛠 技术栈 (Tech Stack)

本项目采用现代化的全栈架构，易于扩展和维护：

    前端: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Recoil/Context

    可视化: React Force Graph (关系网), Vis.js (时间轴)

    后端: NestJS, Prisma ORM

    数据库: PostgreSQL (数据), Redis (缓存)

    存储: MinIO (S3 兼容对象存储)

    网关: Caddy (自动反向代理)

    搜索: Meilisearch (全文检索)

## 🚀 快速开始 (Quick Start)
前置要求

    Docker & Docker Compose

部署步骤

    克隆仓库
    code Bash

    
git clone https://github.com/kukuyuer/novel-stack.git
cd novel-stack

  

配置环境变量
复制模版文件并根据需要修改（默认配置即可直接运行）：
code Bash

    
cp .env.example .env

  

启动服务
code Bash

        
    docker compose up -d

      

    开始创作
    访问浏览器 http://localhost:8080 (或服务器 IP:8080)。

## 🤝 参与贡献 (Contributing)

NovelStack 还是一个年轻的项目，非常欢迎社区贡献！我们需要你的帮助来让它变得更好。
我们正在寻找的功能：

移动端适配：让手机也能随时记录灵感。

EPUB/PDF 导出：更丰富的电子书格式支持。

统计图表：每日码字热力图、字数统计趋势。

    主题系统：夜间模式、羊皮纸模式等。

如何贡献？

    Fork 本仓库。

    创建一个新分支 (git checkout -b feature/AmazingFeature)。

    提交你的修改 (git commit -m 'Add some AmazingFeature')。

    推送到分支 (git push origin feature/AmazingFeature)。

    提交 Pull Request。

📄 开源协议 (License)



