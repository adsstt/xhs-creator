// Ported from legacy_streamlit/image_services.py

import type { PublishPackage } from './content_planner'

export function buildOpenAIImagePrompt(articlePrompt: string, pkg?: PublishPackage): string {
  let titleHint = ''
  let tagHint = ''
  let coverHint = ''
  if (pkg) {
    if (pkg.title_options.length) titleHint = `标题方向：${pkg.title_options[0]}`
    if (pkg.tags.length) tagHint = `内容标签：${pkg.tags.slice(0, 6).join(' ')}`
    if (pkg.cover_text) coverHint = `封面文字参考：${pkg.cover_text}`
  }
  const details = [titleHint, tagHint, coverHint].filter(Boolean).join('\n')
  return `为一篇小红书图文笔记生成一张适合做封面或配图的图片。

主题/用户需求：
${articlePrompt}

${details}

视觉要求：
- 生活方式内容，真实、自然、清爽，有小红书图文封面感。
- 适合个人博主发布，不要商业海报感，不要密集文字。
- 构图要有明确主体，留出少量可加封面字的干净区域。
- 不要生成品牌 Logo、水印、平台 UI 或真实人物肖像。`.trim()
}

export function normalizeOpenAIImageModel(model: string): string {
  const aliases: Record<string, string> = {
    'gpt-image2': 'gpt-image-2',
    'gptimage2': 'gpt-image-2',
  }
  const m = (model ?? '').trim().toLowerCase()
  return aliases[m] ?? model ?? 'gpt-image-2'
}

export function normalizeAliyunImageSize(size: string): string {
  const aliases: Record<string, string> = {
    '1024x1024': '1024*1024',
    '1024x1536': '1024*1536',
    '1536x1024': '1536*1024',
  }
  return aliases[(size ?? '').toLowerCase()] ?? size ?? '1024*1024'
}
