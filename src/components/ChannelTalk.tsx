'use client'

import { useEffect } from 'react'
import { CHANNEL } from '@/config/site'

type ChannelIOFn = ((...args: unknown[]) => void) & {
  c?: (args: unknown) => void
  q?: unknown[]
}

declare global {
  interface Window {
    ChannelIO?: ChannelIOFn
    ChannelIOInitialized?: boolean
  }
}

export type ChatContext = {
  /** 지금 보고 있는 글 제목 */
  postTitle?: string
  postCategory?: string
  postSlug?: string
  postUrl?: string
}

let booted = false

function loadSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (window.ChannelIOInitialized) return resolve()
    window.ChannelIOInitialized = true

    const ch: ChannelIOFn = Object.assign((...args: unknown[]) => ch.c?.(args), {
      q: [] as unknown[],
    })
    ch.c = (args: unknown) => ch.q?.push(args)
    window.ChannelIO = ch

    const s = document.createElement('script')
    s.async = true
    s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js'
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

/**
 * 채널톡 상담 위젯.
 *
 * 성능을 위해 페이지가 한가해진 뒤에 스크립트를 불러온다. 채널톡 SDK는 무거운 편이라
 * 처음부터 로드하면 구글이 보는 페이지 속도 지표가 나빠진다.
 *
 * 글 정보는 UTM이 아니라 프로필 속성으로 넘긴다. 채널톡 UTM은 라스트터치라
 * 내부 링크에 utm을 붙이면 원래 유입 출처(구글 검색 등)가 덮어써지기 때문이다.
 */
export function ChannelTalk({ context }: { context?: ChatContext }) {
  useEffect(() => {
    if (!CHANNEL.pluginKey) return

    let cancelled = false

    const boot = async () => {
      if (cancelled) return
      await loadSdk()
      if (cancelled || !window.ChannelIO) return

      const profile = {
        ...(context?.postTitle ? { 유입글: context.postTitle } : {}),
        ...(context?.postCategory ? { 유입글카테고리: context.postCategory } : {}),
        ...(context?.postUrl ? { 유입글주소: context.postUrl } : {}),
        유입채널: '자체블로그',
      }

      if (!booted) {
        booted = true
        window.ChannelIO('boot', {
          pluginKey: CHANNEL.pluginKey,
          language: 'ko',
          zIndex: 1000,
          hideChannelButtonOnBoot: false,
          profile,
        })
      } else {
        // 같은 세션에서 다른 글로 이동한 경우 글 정보만 갱신한다.
        window.ChannelIO('updateUser', { profile })
      }
    }

    // 브라우저가 한가해질 때 로드하고, 그 전에 사용자가 움직이면 즉시 로드한다.
    let idleId: number | undefined
    let timerId: number | undefined
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(boot, { timeout: 4000 })
    } else {
      timerId = window.setTimeout(boot, 2500)
    }

    const onInteract = () => void boot()
    window.addEventListener('scroll', onInteract, { once: true, passive: true })
    window.addEventListener('pointerdown', onInteract, { once: true })

    return () => {
      cancelled = true
      window.removeEventListener('scroll', onInteract)
      window.removeEventListener('pointerdown', onInteract)
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timerId !== undefined) window.clearTimeout(timerId)
    }
  }, [context])

  return null
}

/** 글 안에서 상담창을 바로 여는 버튼. 페이지 이동이 없어 유입 출처가 보존된다. */
export function openChannelChat(message?: string) {
  if (typeof window === 'undefined') return
  const open = () => window.ChannelIO?.('openChat', undefined, message)
  if (window.ChannelIO) {
    open()
    return
  }
  // 아직 로드 전이면 지금 불러온 뒤 연다.
  loadSdk().then(() => {
    if (!booted && CHANNEL.pluginKey) {
      booted = true
      window.ChannelIO?.('boot', {
        pluginKey: CHANNEL.pluginKey,
        language: 'ko',
        zIndex: 1000,
        hideChannelButtonOnBoot: false,
      })
    }
    open()
  })
}
