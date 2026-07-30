'use client'

import { CTA_PRESETS, type CtaKey } from '@/config/site'
import { withSource } from '@/lib/seo'
import { openChannelChat } from './ChannelTalk'

/**
 * 글 하단 전환 장치.
 * 네이버 블로그 글에는 이런 장치가 하나도 없어서 유입이 문의로 이어지지 않았다.
 *
 * `채팅상담` 유형은 페이지 이동 없이 채널톡 상담창을 연다.
 * 홈페이지로 한 번 더 보내지 않아도 되고, 이동이 없어 유입 출처도 보존된다.
 */
export function CtaBlock({
  type,
  slug,
  category,
  title,
}: {
  type: string
  slug: string
  category: string
  title: string
}) {
  if (type === '없음') return null

  const key = (Object.keys(CTA_PRESETS) as CtaKey[]).includes(type as CtaKey)
    ? (type as CtaKey)
    : '채팅상담'
  const preset = CTA_PRESETS[key]

  return (
    <aside className="cta-block">
      <p className="cta-heading">{preset.heading}</p>
      <p className="cta-body">{preset.body}</p>

      {preset.chat ? (
        <button
          type="button"
          className="cta-button"
          onClick={() =>
            openChannelChat(
              `[${category || '문의'}] "${title}" 글을 보고 문의드립니다.\n\n우리 회사 상황은 이렇습니다: `
            )
          }
        >
          {preset.buttonText}
        </button>
      ) : (
        <a className="cta-button" href={withSource(preset.href, slug, category)}>
          {preset.buttonText}
        </a>
      )}
    </aside>
  )
}
