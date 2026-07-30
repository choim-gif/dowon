import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { anchorsOf, getPost, listPosts, pickRelated, PLACEHOLDER_SLUG } from '@/lib/content'
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, formatDate, postUrl } from '@/lib/seo'
import { SITE } from '@/config/site'
import { JsonLd } from '@/components/JsonLd'
import { PostBody } from '@/components/PostBody'
import { Toc } from '@/components/Toc'
import { AuthorBlock } from '@/components/AuthorBlock'
import { CtaBlock } from '@/components/CtaBlock'
import { RelatedPosts } from '@/components/RelatedPosts'
import { ChannelTalk } from '@/components/ChannelTalk'

type Params = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  const posts = await listPosts()
  if (posts.length === 0) {
    console.warn(
      '[content] 발행된 글이 없습니다. content/posts/*.md 에서 상태를 "발행"으로 바꾸면 됩니다.'
    )
    return [{ slug: PLACEHOLDER_SLUG }]
  }
  // 슬러그는 디코딩된 한글 그대로 넘긴다.
  // 인코딩해서 넘기면 out/blog/%EC%82%B0... 처럼 폴더명이 깨진다.
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)
  if (decoded === PLACEHOLDER_SLUG) {
    return { title: '준비 중', robots: { index: false, follow: false } }
  }
  const post = await getPost(decoded)
  if (!post) return {}

  const { meta, description } = post
  const url = postUrl(meta.slug)

  return {
    title: meta.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: meta.title,
      description,
      url,
      publishedTime: meta.publishedAt,
      modifiedTime: meta.updatedAt || meta.publishedAt,
      ...(meta.coverImage ? { images: [{ url: meta.coverImage }] } : {}),
    },
    ...(meta.tags.length ? { keywords: meta.tags } : {}),
  }
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)

  if (decoded === PLACEHOLDER_SLUG) {
    return (
      <section className="list-hero">
        <h1>글을 준비하고 있습니다</h1>
        <p>
          아직 발행된 글이 없습니다. <code>content/posts/</code> 폴더의 글에서 상태를
          &lsquo;발행&rsquo;으로 바꾸면 이 자리에 글이 나타납니다.
        </p>
      </section>
    )
  }

  const post = await getPost(decoded)
  if (!post) notFound()

  const { meta, content, toc, faqs, description } = post
  const all = await listPosts()
  const related = pickRelated(all, meta, 3)

  return (
    <>
      <JsonLd data={articleJsonLd(meta, description)} />
      <JsonLd data={breadcrumbJsonLd(meta)} />
      <JsonLd data={faqJsonLd(faqs)} />

      <ChannelTalk
        context={{
          postTitle: meta.title,
          postCategory: meta.category,
          postSlug: meta.slug,
          postUrl: postUrl(meta.slug),
        }}
      />

      <article className="post">
        <nav className="crumbs" aria-label="현재 위치">
          <Link href={`${SITE.basePath}/`}>{SITE.name}</Link>
          {meta.category && (
            <>
              <span aria-hidden="true"> › </span>
              <span>{meta.category}</span>
            </>
          )}
        </nav>

        <header className="post-header">
          {/* 글 제목이 이 페이지의 유일한 h1이다. 본문 제목은 모두 h2 이하로 내려간다. */}
          <h1 className="post-title">{meta.title}</h1>
          <p className="post-meta">
            <time dateTime={meta.publishedAt}>{formatDate(meta.publishedAt)}</time>
            {meta.updatedAt && meta.updatedAt.slice(0, 10) !== meta.publishedAt.slice(0, 10) && (
              <>
                <span aria-hidden="true"> · </span>
                <span>최종 수정 {formatDate(meta.updatedAt)}</span>
              </>
            )}
            {meta.author && (
              <>
                <span aria-hidden="true"> · </span>
                <span>
                  {meta.authorTitle} {meta.author}
                </span>
              </>
            )}
          </p>
        </header>

        <Toc items={toc} />

        <div className="post-content">
          {content.kind === 'notion' ? (
            <PostBody blocks={content.blocks} anchors={anchorsOf(content)} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content.html }} />
          )}
        </div>

        <CtaBlock
          type={meta.cta}
          slug={meta.slug}
          category={meta.category}
          title={meta.title}
        />
        <AuthorBlock post={meta} />
        <RelatedPosts posts={related} />
      </article>
    </>
  )
}
