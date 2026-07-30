import { listPosts } from '@/lib/content'
import { clampDescription } from '@/lib/blocks'
import { listUrl, postUrl } from '@/lib/seo'
import { ORG, SITE } from '@/config/site'

export const dynamic = 'force-static'

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** /blog/rss.xml — 뉴스레터 자동화와 외부 구독에 쓴다. */
export async function GET() {
  const posts = await listPosts()
  const latest = posts.slice(0, 30)

  const items = latest
    .map((p) => {
      const pub = new Date(p.publishedAt)
      const pubStr = Number.isNaN(pub.getTime()) ? '' : pub.toUTCString()
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(postUrl(p.slug))}</link>
      <guid isPermaLink="true">${esc(postUrl(p.slug))}</guid>
      ${pubStr ? `<pubDate>${pubStr}</pubDate>` : ''}
      ${p.category ? `<category>${esc(p.category)}</category>` : ''}
      <description>${esc(clampDescription(p.summary || p.title))}</description>
    </item>`
    })
    .join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${SITE.name} | ${ORG.name}`)}</title>
    <link>${esc(listUrl())}</link>
    <description>${esc(SITE.description)}</description>
    <language>ko</language>
    <atom:link href="${esc(`${SITE.url}${SITE.basePath}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
