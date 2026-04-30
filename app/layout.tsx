import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '小红书图文创作与运营助手',
  description: '把主题、图片和语气整理成可发布的 A/B 图文方案，再用轻量数据看板复盘下一次灵感。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
