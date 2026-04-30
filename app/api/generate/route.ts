import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/content_planner'

export async function POST(req: NextRequest) {
  try {
    const { prompt, imageCount, apiKey } = await req.json()
    const key = apiKey || process.env.DEEPSEEK_API_KEY
    if (!key) return NextResponse.json({ error: '未提供 DeepSeek API 密钥' }, { status: 400 })
    if (!prompt?.trim()) return NextResponse.json({ error: '请输入主题' }, { status: 400 })

    const client = new OpenAI({ apiKey: key, baseURL: 'https://api.deepseek.com' })
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(prompt, imageCount ?? 0, false) },
      ],
      temperature: 0.78,
      max_tokens: 3000,
    })
    const content = response.choices[0].message.content ?? ''
    return NextResponse.json({ content })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
