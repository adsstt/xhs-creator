# 小红书图文创作与运营助手

一个面向个人小红书博主的图文创作与轻量运营复盘 Web 工具。它把主题输入、图片素材、A/B 发布包、主题生图、运营数据录入和复盘建议放到同一个工作区里，帮助创作者完成从内容创作到数据复盘的闭环。

## 功能概览

### 创作发布包

- 输入主题、问题、创作要求或图片描述。
- 可选择内容方向：穿搭、美妆、旅行、美食、健身、职场、情感、家居，或自定义方向。
- 调用 DeepSeek 生成 A/B 两套图文发布包。
- 每套发布包包含：
  - 标题备选
  - 正文
  - 标签
  - 封面字
  - 配图顺序建议
  - 修图/风格化建议
  - 发布检查清单
- 生成结果可复制，也可下载为文本文件。

### 图片素材

- 支持上传 1-9 张图片。
- 上传后展示全部预览图。
- 每张图片都可以单独删除。
- 当前图片能力主要用于素材预览、上传数量上下文和配图建议，不做真实图片内容识别。

### 主题生图

主题生图是可选功能，需要在右上角「设置」中开启。

启用后，系统会在生成 A/B 发布包后，基于用户主题和第一套发布包生成一段生图提示词。提示词可以继续编辑，编辑后的内容会用于复制和 API 生图。

支持三种方式：

1. **ChatGPT 网页版生成**：免费方式。点击后复制当前提示词并打开 ChatGPT，用户自行粘贴生成。
2. **OpenAI API 生成**：付费自动生成，需要 OpenAI API Key。
3. **阿里万相生成**：付费备用生成，需要 DashScope API Key。

支持的生图配置：

- OpenAI 模型：`gpt-image-2`、`gpt-image-1`、`gpt-image-1-mini`
- OpenAI 图片尺寸：`1024x1024`、`1024x1536`、`1536x1024`
- OpenAI 图片质量：`low`、`medium`、`high`、`auto`
- 阿里万相模型：`wanx2.1-t2i-turbo`、`wanx2.0-t2i-turbo`、`wan2.2-t2i-flash`、`qwen-image`
- 阿里万相图片尺寸：`1024x1024`、`1024x1536`、`1536x1024`

### 运营数据复盘

- 支持手动录入单条笔记数据。
- 支持点击或拖拽导入 CSV。
- 页面提供 CSV 示例模板下载。
- 自动计算：
  - 笔记数
  - 总曝光
  - 总点赞
  - 总收藏
  - 互动率
  - 内容方向表现
  - 近期数据
- 指标卡片使用点折线展示最近趋势。
- 近期数据支持逐条删除，删除前需要二次确认。
- 根据当前记录自动生成复盘建议。

## 技术栈

- Next.js 14 App Router
- React 18
- TypeScript
- OpenAI Node SDK
- DeepSeek Chat Completions API
- OpenAI Images API
- 阿里云 DashScope / 万相文生图 API

## 本地运行

先进入项目目录：

```powershell
cd E:\cc_agent_demo\xhs_creator_nextjs\xhs_creator
```

安装依赖：

```bash
npm install
```

复制环境变量文件：

```bash
cp .env.example .env.local
```

Windows PowerShell 如果没有 `cp`，可以用：

```powershell
Copy-Item .env.example .env.local
```

启动开发服务器：

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

构建检查：

```bash
npm run build
```

## 环境变量

`.env.example` 中包含：

```env
DEEPSEEK_API_KEY=
OPENAI_API_KEY=
DASHSCOPE_API_KEY=
```

变量说明：

| 变量名 | 用途 | 必需 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | A/B 发布包文案生成 | 是 |
| `OPENAI_API_KEY` | OpenAI 图片生成 | 否 |
| `DASHSCOPE_API_KEY` | 阿里万相图片生成 | 否 |

也可以在页面右上角「设置」面板中填写 API Key。页面输入的 Key 会保存在当前浏览器的 `localStorage` 中，并优先于环境变量使用。

优先级：

```text
页面设置中的 API Key > 环境变量中的 API Key
```

## 数据存储说明

当前项目没有数据库。

- API Key 设置保存在浏览器 `localStorage`。
- 运营数据记录保存在浏览器 `localStorage`，key 为 `xhs_metrics_records`。
- 上传图片只在当前浏览器会话中作为预览使用，不会持久保存。
- 生成的发布包和图片不会自动保存到服务端；需要用户自行复制或下载。

这意味着：换浏览器、清理浏览器数据或更换设备后，页面设置和运营记录不会自动同步。

## CSV 导入格式

支持英文列名：

```csv
title,publish_date,topic,views,likes,favorites,comments
春日咖啡,2026-04-01,探店,1200,90,50,12
```

支持中文列名：

```csv
标题,日期,分类,曝光,点赞,收藏,评论
春日咖啡,2026-04-01,探店,1200,90,50,12
```

字段含义：

| 字段 | 说明 |
| --- | --- |
| `title` / `标题` / `笔记标题` | 笔记标题 |
| `publish_date` / `发布日期` / `日期` | 发布日期 |
| `topic` / `赛道` / `分类` | 内容方向 |
| `views` / `曝光` / `浏览` | 曝光或浏览 |
| `likes` / `点赞` | 点赞数 |
| `favorites` / `收藏` | 收藏数 |
| `comments` / `评论` | 评论数 |

注意：当前 CSV 解析是轻量实现，适合普通逗号分隔文件。标题等字段里如果包含英文逗号，建议先去掉或改成中文标点。

## 项目结构

```text
xhs_creator/
├── app/
│   ├── layout.tsx                  # 全局 HTML 与 metadata
│   ├── globals.css                 # 全局样式
│   ├── page.tsx                    # 首页，含背景视频与 poster
│   ├── tool/
│   │   └── page.tsx                # 工具页，包含创作和运营两个 Tab
│   └── api/
│       ├── generate/route.ts       # DeepSeek 文案生成接口
│       ├── images/openai/route.ts  # OpenAI 生图接口
│       └── images/aliyun/route.ts  # 阿里万相生图接口
├── components/
│   ├── CreatorTab.tsx              # 创作发布包工作区
│   ├── OperationsTab.tsx           # 运营数据复盘工作区
│   └── Settings.tsx                # 设置侧边栏
├── lib/
│   ├── content_planner.ts          # 发布包 prompt、解析和导出文本
│   ├── image_services.ts           # 生图 prompt 与模型参数适配
│   └── operations.ts               # 运营指标、CSV 导入和复盘建议
├── public/
│   ├── hero-video.mp4              # 首页背景视频
│   └── hero-poster.jpg             # 视频加载前的首屏背景图
├── docs/
│   └── PRD.md                      # 产品需求文档
├── assets/
│   └── hero-video.mp4              # 原始视频资源备份
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── package-lock.json
└── tsconfig.json
```

## 主要接口

### `POST /api/generate`

用于生成 A/B 发布包。

请求体：

```json
{
  "prompt": "春日咖啡店探店，想写得自然一点",
  "imageCount": 3,
  "apiKey": "可选，页面设置中的 DeepSeek API Key"
}
```

返回：

```json
{
  "content": "模型生成的 JSON 文本"
}
```

### `POST /api/images/openai`

用于 OpenAI 图片生成。

请求体：

```json
{
  "prompt": "生图提示词",
  "model": "gpt-image-2",
  "size": "1024x1024",
  "quality": "medium",
  "apiKey": "可选，页面设置中的 OpenAI API Key"
}
```

返回：

```json
{
  "b64": "base64 图片内容"
}
```

### `POST /api/images/aliyun`

用于阿里万相图片生成。接口会提交异步任务并轮询结果，最长等待约 180 秒。

请求体：

```json
{
  "prompt": "生图提示词",
  "model": "wanx2.1-t2i-turbo",
  "size": "1024x1024",
  "apiKey": "可选，页面设置中的 DashScope API Key"
}
```

返回：

```json
{
  "b64": "base64 图片内容"
}
```

## 部署到 Vercel

推荐把 `xhs_creator` 这个目录作为 GitHub 仓库根目录上传。

部署步骤：

1. 将项目推送到 GitHub。
2. 在 Vercel 新建项目。
3. 选择对应 GitHub 仓库。
4. Framework Preset 选择 `Next.js`。
5. 设置环境变量：
   - `DEEPSEEK_API_KEY`
   - `OPENAI_API_KEY`，可选
   - `DASHSCOPE_API_KEY`，可选
6. 点击 Deploy。

如果你的 GitHub 仓库根目录是 `xhs_creator_nextjs`，而项目在里面的 `xhs_creator` 子目录中，那么 Vercel 的 Root Directory 需要设置为：

```text
xhs_creator
```

## GitHub 上传建议

项目 `.gitignore` 已经排除了：

- `node_modules`
- `.next`
- `.env`
- `.env.local`
- `.vercel`
- 构建产物和日志文件

首次提交可以执行：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-name>/<repo-name>.git
git push -u origin main
```

## 当前边界

- 不自动发布内容到小红书。
- 不自动抓取小红书后台数据。
- 不绕过平台登录、风控、访问限制或平台规则。
- 不提供多账号、团队协作、客户审核流或商业投放管理。
- 上传图片当前不做真实视觉理解，系统只基于用户描述和上传张数生成配图建议。
- AI 生成内容仍需用户自行检查事实准确性、平台合规性和发布风格。
- OpenAI API 和阿里万相为付费能力，请确认账户余额和价格后再使用。
