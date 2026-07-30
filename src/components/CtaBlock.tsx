import { CTA_PRESETS, type CtaKey } from '@/config/site'
import { withUtm } from '@/lib/seo'

/**
 * 글 하단 전환 장치.
 * 네이버 블로그 글에는 이런 장치가 하나도 없어서 유입이 문의로 이어지지 않았다.
 * 여기서는 모든 글에 기본 탑재하고, 링크에는 UTM을 자동으로 붙여 기여도를 측정한다.
 */
export function CtaBlock({ type, slug, category }: { type: string; slug: string; category: string }) {
  if (type === '없음') return null

  const key = (Object.keys(CTA_PRESETS) as CtaKey[]).includes(type as CtaKey)
    ? (type as CtaKey)
    : '무료진단'
  const preset = CTA_PRESETS[key]
  const href = withUtm(preset.href, slug, category || key)

  return (
    <aside className="cta-block">
      <p className="cta-heading">{preset.heading}</p>
      <p className="cta-body">{preset.body}</p>
      <a className="cta-button" href={href}>
        {preset.buttonText}
      </a>
    </aside>
  )
}
