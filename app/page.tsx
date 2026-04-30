'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let rafId: number | null = null

    const monitor = () => {
      const duration = video.duration || 0
      const currentTime = video.currentTime || 0
      if (duration > 0) {
        let opacity = 1
        if (currentTime < 0.5) opacity = Math.max(0, currentTime / 0.5)
        else if (duration - currentTime < 0.5) opacity = Math.max(0, (duration - currentTime) / 0.5)
        video.style.opacity = opacity.toFixed(3)
      }
      rafId = requestAnimationFrame(monitor)
    }

    const stopMonitor = () => { if (rafId) { cancelAnimationFrame(rafId); rafId = null } }
    const restart = () => {
      video.style.opacity = '0'
      stopMonitor()
      setTimeout(() => { video.currentTime = 0; video.play().catch(() => { video.style.opacity = '1' }); monitor() }, 100)
    }

    video.addEventListener('play', () => { stopMonitor(); monitor() })
    video.addEventListener('pause', stopMonitor)
    video.addEventListener('ended', restart)
    video.play().catch(() => { video.style.opacity = '1' })
    return stopMonitor
  }, [])

  return (
    <div className="landing-shell">
      <div className={`landing-media${videoReady ? ' video-ready' : ''}`}>
        <div className="landing-video-poster" />
        <video
          ref={videoRef}
          className="landing-video"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/hero-poster.jpg"
          onCanPlay={() => setVideoReady(true)}
          aria-hidden="true"
          style={{ opacity: 0 }}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="landing-overlay" />
      </div>
      <div className="landing-frame">
        <section className="landing-hero">
          <div className="hero-inner">
            <div className="hero-actions">
              <Link href="/tool" className="hero-cta">开始创作</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
