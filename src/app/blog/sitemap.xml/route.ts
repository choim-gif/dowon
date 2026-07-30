import { listPosts } from '@/lib/content'
import { listUrl, postUrl } from '@/lib/seo'

export const dynamic = 'force-static'

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * /blog/sitemap.xml
 * 도메인 루트의 robots.txt(아임웹에서 관리)에 이 주소를 등록하면
 * 구글·네이버·빙이 블로그 글을 한 번에 수집한다.
 */
export async function GET() {
  const posts = await listPosts()

  const urls = [
    { loc: listUrl(), lastmod: posts[0]?.updatedAt || new Date(0).toISOString(), priority: '0.8' },
    ...posts.map((p) => ({
      loc: postUrl(p.slug),
      lastmod: p.updatedAt || p.publishedAt,
      priority: '0.7',
    })),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${(u.lastmod || '').slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
