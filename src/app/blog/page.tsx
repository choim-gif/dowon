import type { Metadata } from 'next'
import Link from 'next/link'
import { listPosts } from '@/lib/content'
import { SITE } from '@/config/site'
import { blogJsonLd, formatDate, listUrl } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { ChannelTalk } from '@/components/ChannelTalk'

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.description,
  alternates: { canonical: listUrl() },
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    url: listUrl(),
    type: 'website',
  },
}

export default async function BlogIndex() {
  const posts = await listPosts()

  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))

  return (
    <>
      <JsonLd data={blogJsonLd(posts)} />
      <ChannelTalk />

      <section className="list-hero">
        <h1>{SITE.name}</h1>
        <p>{SITE.description}</p>
      </section>

      {categories.length > 0 && (
        <ul className="cat-chips" aria-label="카테고리">
          {categories.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}

      {posts.length === 0 ? (
        <p className="empty">
          아직 발행된 글이 없습니다. 노션 데이터베이스에서 상태를 &lsquo;발행&rsquo;으로 바꾸고
          &lsquo;노출&rsquo;을 체크한 뒤 다시 배포하면 이 자리에 글이 나타납니다.
        </p>
      ) : (
        <ul className="post-list">
          {posts.map((p) => (
            <li key={p.slug}>
              <article>
                <Link href={`${SITE.basePath}/${encodeURIComponent(p.slug)}/`}>
                  <p className="post-list-meta">
                    {p.status !== '발행' && <span className="draft-badge">{p.status}</span>}
                    {p.category && <span className="post-list-cat">{p.category}</span>}
                    <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
                  </p>
                  <h2 className="post-list-title">{p.title}</h2>
                  {p.summary && <p className="post-list-summary">{p.summary}</p>}
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
