import Link from 'next/link'
import type { PostMeta } from '@/lib/notion'
import { SITE } from '@/config/site'

/** 관련 글. 내부 링크는 색인 순환과 체류시간 양쪽에 기여한다. */
export function RelatedPosts({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null

  return (
    <section className="related" aria-label="함께 읽으면 좋은 글">
      <h2 className="related-title">함께 읽으면 좋은 글</h2>
      <ul>
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`${SITE.basePath}/${encodeURIComponent(p.slug)}/`}>
              <span className="related-cat">{p.category}</span>
              <span className="related-name">{p.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
