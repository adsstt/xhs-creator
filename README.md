# xhs-creator
AI-powered Xiaohongshu (RED) content creator and analytics tool with A/B post generation and local performance tracking.
# 小红书图文创作与运营助手

## 功能

- **创作发布包**：输入主题 / 上传图片 → DeepSeek 生成 A/B 两套图文方案（标题、正文、标签、封面字、配图顺序、修图建议、发布检查清单）
- **主题生图**（可选）：ChatGPT 网页版免费手动生成 / OpenAI API 付费自动生成 / 阿里万相付费备用生成
- **运营数据复盘**：手动录入或 CSV 批量导入笔记数据，自动计算互动率并输出 AI 复盘建议

## 本地开发

```bash
npm install
cp .env.example .env.local
# 填写 .env.local 中的 API Key
npm run dev
```

打开 http://localhost:3000

## 部署到 Vercel

1. 将项目推送到 GitHub（可忽略 `legacy_streamlit/` 目录）
2. 在 Vercel 新建项目，关联 GitHub 仓库
3. 在 Vercel 项目的 **Settings → Environment Variables** 中添加：

| 变量名 | 说明 |
|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥（必填） |
| `OPENAI_API_KEY` | OpenAI API 密钥（生图可选） |
| `DASHSCOPE_API_KEY` | 阿里万相 DashScope API 密钥（生图可选） |

4. 点击 **Deploy** 即可完成部署

> **注意**：API Key 也可以在页面右上角"设置"面板中临时填写，仅保存在浏览器本地，不会发送到服务端之外。  
> 优先级：页面输入的 Key > 环境变量中的 Key。

## 目录结构

```
xhs_creator/
├── app/
│   ├── layout.tsx          # 全局 HTML layout
│   ├── globals.css         # 全部样式（保留原始 UI/UX）
│   ├── page.tsx            # 首页（Landing，背景视频）
│   ├── tool/
│   │   └── page.tsx        # 工具页（创作 + 运营 Tab）
│   └── api/
│       ├── generate/route.ts       # DeepSeek 文案生成
│       ├── images/openai/route.ts  # OpenAI 生图
│       └── images/aliyun/route.ts  # 阿里万相生图
├── components/
│   ├── Settings.tsx        # 侧边设置面板
│   ├── CreatorTab.tsx      # 创作发布包 Tab
│   └── OperationsTab.tsx   # 运营数据复盘 Tab
├── lib/
│   ├── content_planner.ts  # 发布包 prompt 构建 & 解析
│   ├── operations.ts       # 运营数据计算逻辑
│   └── image_services.ts   # 生图 prompt 构建
├── public/
│   └── hero-video.mp4      # 首页背景视频
├── legacy_streamlit/       # 原 Streamlit 版本（仅参考，不部署）
├── .env.example
├── next.config.js
├── package.json
└── tsconfig.json
```


# 小红书图文创作与运营助手

这是一个基于 Streamlit 的本地原型工具，面向个人博主完成“小红书图文创作 + 轻量运营复盘”的一期闭环。

## 当前能力

- 输入主题、问题或图片描述，调用 DeepSeek 生成小红书 A/B 发布包。
- 每个发布包包含标题备选、正文、标签、封面字、配图顺序建议、修图/风格化建议和发布检查清单。
- 支持上传 1-9 张图片做预览，并把图片数量作为配图建议上下文。
- 可选启用主题生图，采用 Free-first + Paid fallback：ChatGPT 网页版免费手动生成，OpenAI API 付费自动生成，阿里万相付费备用生成。
- 支持手动录入笔记运营数据，并自动刷新本地数据看板。
- 支持 CSV 导入历史笔记数据。
- 根据曝光、点赞、收藏、评论生成轻量复盘建议。
- API Key 只从 `st.secrets`、环境变量或当前会话读取，不写入本地 JSON。

## 目录结构

```text
xhs_creator/
├── app.py                  # Streamlit 页面编排
├── content_planner.py      # A/B 发布包提示词、解析与文本导出
├── image_services.py       # 主题生图 provider 适配
├── operations.py           # 运营数据存储、统计与复盘建议
├── requirements.txt
├── README.md
├── data/
│   ├── settings.json       # 非敏感配置
│   └── notes_metrics.json  # 首次录入运营数据后自动生成
└── tests/
    ├── test_content_planner.py
    └── test_operations.py
```

## 安装依赖

```bash
pip install -r requirements.txt
```

## 启动方式

```bash
streamlit run app.py
```

如果你在仓库根目录运行，也可以使用：

```bash
streamlit run xhs_creator/app.py
```

启动后在浏览器打开 Streamlit 输出的本地地址，通常是 `http://localhost:8501`。

## API Key 配置方式

应用按以下顺序读取配置：

1. `st.secrets`
2. 环境变量
3. 当前页面手动输入

支持的配置项：

- `DEEPSEEK_API_KEY`
- `DASHSCOPE_API_KEY`
- `OPENAI_API_KEY`

### Windows PowerShell 示例

```powershell
$env:DEEPSEEK_API_KEY="your-deepseek-key"
$env:DASHSCOPE_API_KEY="your-dashscope-key"
$env:OPENAI_API_KEY="your-openai-key"
streamlit run app.py
```

### Streamlit secrets 示例

在 `.streamlit/secrets.toml` 中配置：

```toml
DEEPSEEK_API_KEY = "your-deepseek-key"
DASHSCOPE_API_KEY = "your-dashscope-key"
OPENAI_API_KEY = "your-openai-key"
```

## 主题生图方式

在左侧“连接与模型”中打开“启用主题生图”后，应用会在生成 A/B 发布包后，结合用户主题、第一套发布包的标题、标签和封面字生成一段主题生图提示词。系统不会自动串联调用多个 provider，而是展示三个选择卡，由用户决定实际执行方式：

1. ChatGPT 网页版：推荐免费方式，点击后自动复制提示词并打开 ChatGPT，用户手动粘贴生成。
2. OpenAI Images API：付费自动生成，需要 `OPENAI_API_KEY` 和 API 账户余额。
3. 阿里万相（DashScope）：付费备用生成，需要 `DASHSCOPE_API_KEY`，按阿里云百炼/通义万相官方价格计费。

推荐默认模型与费用提示：

- OpenAI：`gpt-image2`（会自动兼容到 `gpt-image-2`）。OpenAI API 生图为付费服务，需要账户有可用余额，价格以 OpenAI 官方定价为准。
- 阿里万相：`wanx2.1-t2i-turbo`、`wanx2.0-t2i-turbo`、`wan2.2-t2i-flash` 或 `qwen-image`。常用模型约 `0.04-0.25 元/张`，以阿里官方价格为准。

ChatGPT 网页版入口会自动复制当前生图提示词，并打开 `https://chat.openai.com`。浏览器会显示“提示词已复制，可直接粘贴生成”。

## 运营数据 CSV 格式

CSV 支持英文列名：

```csv
title,publish_date,topic,views,likes,favorites,comments
春日咖啡,2026-04-01,探店,1200,90,50,12
```

也支持中文列名：

```csv
标题,日期,分类,曝光,点赞,收藏,评论
春日咖啡,2026-04-01,探店,1200,90,50,12
```

导入或手动录入后，数据会保存到 `data/notes_metrics.json`，看板与复盘建议会自动刷新。

## 运行测试

项目测试只依赖 Python 标准库：

```bash
python -m unittest discover -s tests
```

## 当前边界

- 不自动发布到小红书。
- 不绕过平台登录、风控或访问限制做自动抓取。
- 当前图片理解是基于用户描述和上传数量的图文建议，不承诺真实多图视觉理解。
- 当前主题生图基于主题和发布包提示词生成，不会自动理解上传图片内容。
