// Ported from legacy_streamlit/content_planner.py

export interface PublishPackage {
  name: string
  title_options: string[]
  body: string
  tags: string[]
  cover_text: string
  image_order: string[]
  retouching_tips: string[]
  publish_checklist: string[]
}

export interface ParseResult {
  packages: PublishPackage[]
  raw: string
  parsed: boolean
}

const PACKAGE_SCHEMA_HINT = `
请只输出合法 JSON，不要使用 Markdown 代码块。JSON 结构如下：
{
  "packages": [
    {
      "name": "A版：自然分享",
      "title_options": ["标题1", "标题2", "标题3"],
      "body": "正文",
      "tags": ["#标签1", "#标签2"],
      "cover_text": "封面字",
      "image_order": ["第1张：用途说明"],
      "retouching_tips": ["修图建议"],
      "publish_checklist": ["发布前检查项"]
    },
    {
      "name": "B版：强钩子",
      "title_options": ["标题1", "标题2", "标题3"],
      "body": "正文",
      "tags": ["#标签1", "#标签2"],
      "cover_text": "封面字",
      "image_order": ["第1张：用途说明"],
      "retouching_tips": ["修图建议"],
      "publish_checklist": ["发布前检查项"]
    }
  ]
}
`

export function buildSystemPrompt(): string {
  return `你是一位面向个人博主的小红书图文创作与运营助手。
你的任务是根据用户输入的主题、图片描述或创作要求，生成可直接发布前编辑的 A/B 发布包。

要求：
- 面向泛生活内容，包括探店、穿搭、美妆、旅行、家居、职场、美食、健身等。
- 每个发布包至少给 3 个标题备选。
- 正文自然真实，避免夸张承诺和硬广腔。
- 标签必须以 # 开头。
- 图片建议不假装真实识图，只基于用户描述、上传张数和已知上下文给出配图顺序、封面字、修图方向。
- 发布检查清单要具体、可执行。

${PACKAGE_SCHEMA_HINT}`
}

export function buildUserPrompt(prompt: string, imageCount = 0, stylized = false): string {
  const context: string[] = [prompt.trim()]
  if (imageCount) {
    context.push(`用户本次上传了 ${imageCount} 张图片。请给出适合 ${imageCount} 张图的配图顺序建议。`)
  } else {
    context.push('用户本次没有上传图片。请给出可拍摄或可补充的配图建议。')
  }
  if (stylized) {
    context.push('第一张图片已生成手绘/水彩风格化结果，可作为封面或视觉统一参考。')
  }
  return context.join('\n\n')
}

function normalizeTag(tag: string): string {
  tag = String(tag).trim()
  if (!tag) return ''
  return tag.startsWith('#') ? tag : `#${tag}`
}

function listOfText(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split('\n').map((line) => line.replace(/^[-\s　]+/, '').trim()).filter(Boolean)
  }
  return []
}

export function normalizePackage(pkg: Record<string, unknown>, index = 0): PublishPackage {
  const defaultName = index === 0 ? 'A版：自然分享' : 'B版：强钩子'
  let titles = (pkg.title_options ?? pkg.titles ?? []) as unknown
  if (typeof titles === 'string') {
    titles = (titles as string).split('\n').map((l) => l.trim()).filter(Boolean)
  }
  let tags = (pkg.tags ?? []) as unknown
  if (typeof tags === 'string') {
    const found = (tags as string).match(/#\S+/g)
    tags = found ?? (tags as string).split(/\s+/)
  }

  return {
    name: String(pkg.name ?? defaultName).trim(),
    title_options: (Array.isArray(titles) ? titles : []).map((t) => String(t).trim()).filter(Boolean).slice(0, 6),
    body: String(pkg.body ?? '').trim(),
    tags: (Array.isArray(tags) ? tags : []).map(normalizeTag).filter(Boolean).slice(0, 12),
    cover_text: String(pkg.cover_text ?? '').trim(),
    image_order: listOfText(pkg.image_order),
    retouching_tips: listOfText(pkg.retouching_tips),
    publish_checklist: listOfText(pkg.publish_checklist),
  }
}

export function parsePublishPackages(content: string): ParseResult {
  const text = (content ?? '').trim()
  if (!text) return { packages: [], raw: '', parsed: false }

  const cleaned = text.replace(/^```(?:json)?|```$/gim, '').trim()
  try {
    const payload = JSON.parse(cleaned)
    const packages = payload?.packages
    if (Array.isArray(packages) && packages.length > 0) {
      return {
        packages: packages
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map((item, idx) => normalizePackage(item, idx)),
        raw: text,
        parsed: true,
      }
    }
  } catch {
    // fall through
  }

  return { packages: [legacyMarkdownToPackage(text)], raw: text, parsed: false }
}

function legacyMarkdownToPackage(text: string): PublishPackage {
  const titleMatch = text.match(/##\s*备选标题\s*(.*?)##\s*正文/s)
  const bodyMatch = text.match(/##\s*正文\s*(.*?)##\s*标签/s)
  const tagMatch = text.match(/##\s*标签\s*(.*)/s)
  const titles = titleMatch
    ? titleMatch[1].split('\n').map((l) => l.replace(/^\s*\d+[.、]\s*/, '').trim()).filter(Boolean)
    : []
  const tags = tagMatch ? (tagMatch[1].match(/#\S+/g) ?? []) : []
  return normalizePackage({
    name: 'A版：生成结果',
    title_options: titles,
    body: bodyMatch ? bodyMatch[1].trim() : text,
    tags,
    cover_text: '',
    image_order: [],
    retouching_tips: [],
    publish_checklist: [],
  })
}

export function packageToText(pkg: PublishPackage): string {
  const lines: string[] = [`## ${pkg.name}`]
  if (pkg.title_options.length) {
    lines.push('\n### 标题备选')
    pkg.title_options.forEach((t, i) => lines.push(`${i + 1}. ${t}`))
  }
  if (pkg.body) lines.push(`\n### 正文\n${pkg.body}`)
  if (pkg.tags.length) lines.push(`\n### 标签\n${pkg.tags.join(' ')}`)
  if (pkg.cover_text) lines.push(`\n### 封面字\n${pkg.cover_text}`)
  const extras: [keyof PublishPackage, string][] = [
    ['image_order', '配图顺序建议'],
    ['retouching_tips', '修图/风格化建议'],
    ['publish_checklist', '发布检查清单'],
  ]
  for (const [key, label] of extras) {
    const arr = pkg[key] as string[]
    if (arr.length) {
      lines.push(`\n### ${label}`)
      arr.forEach((item) => lines.push(`- ${item}`))
    }
  }
  return lines.join('\n')
}

export function allPackagesToText(packages: PublishPackage[], raw = ''): string {
  if (packages.length) return packages.map(packageToText).join('\n\n')
  return raw
}
