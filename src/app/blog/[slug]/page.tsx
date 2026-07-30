import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostBySlug, getPublishedPosts, pickRelated } from '@/lib/notion'
import {
  buildAnchorMap,
  buildToc,
  clampDescription,
  extractFaq,
  firstParagraph,
} from '@/lib/blocks'
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, formatDate, postUrl } from '@/lib/seo'
import { SITE } from '@/config/site'
import { JsonLd } from '@/components/JsonLd'
import { PostBody } from '@/components/PostBody'
import { Toc } from '@/components/Toc'
import { AuthorBlock } from '@/components/AuthorBlock'
import { CtaBlock } from '@/components/CtaBlock'
import { RelatedPosts } from '@/components/RelatedPosts'

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  // 슬러그는 디코딩된 한글 그대로 넘긴다.
  // 인코딩해서 넘기면 out/blog/%EC%82%B0... 처럼 폴더명이 깨진다.
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(decodeURIComponent(slug))
  if (!post) return {}

  // 요약 속성이 있으면 그것을 쓰고, 없으면 첫 문단에서 뽑는다.
  // 첫 문단에 결론을 쓰라는 규칙이 여기서 검색결과 설명문으로 직결된다.
  const description = clampDescription(post.summary || firstParagraph(post.blocks))
  const url = postUrl(post.slug)

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      ...(post.coverImage ? { images: [{ url: post.coverImage }] } : {}),
    },
    ...(post.tags.length ? { keywords: post.tags } : {}),
  }
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)
  const post = await getPostBySlug(decoded)
  if (!post) notFound()

  const all = await getPublishedPosts()
  const related = pickRelated(all, post, 3)

  const anchors = buildAnchorMap(post.blocks)
  const toc = buildToc(post.blocks, anchors)
  const faqs = extractFaq(post.blocks)
  const description = clampDescription(post.summary || firstParagraph(post.blocks))

  return (
    <>
      <JsonLd data={articleJsonLd(post, description)} />
      <JsonLd data={breadcrumbJsonLd(post)} />
      <JsonLd data={faqJsonLd(faqs)} />

      <article className="post">
        <nav className="crumbs" aria-label="현재 위치">
          <Link href={`${SITE.basePath}/`}>{SITE.name}</Link>
          {post.category && (
            <>
              <span aria-hidden="true"> › </span>
              <span>{post.category}</span>
            </>
          )}
        </nav>

        <header className="post-header">
          {/* 글 제목이 이 페이지의 유일한 h1이다. 본문 제목은 모두 h2 이하로 내려간다. */}
          <h1 className="post-title">{post.title}</h1>
          <p className="post-meta">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            {post.updatedAt && post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10) && (
              <>
                <span aria-hidden="true"> · </span>
                <span>최종 수정 {formatDate(post.updatedAt)}</span>
              </>
            )}
            {post.author && (
              <>
                <span aria-hidden="true"> · </span>
                <span>
                  {post.authorTitle} {post.author}
                </span>
              </>
            )}
          </p>
        </header>

        <Toc items={toc} />

        <div className="post-content">
          <PostBody blocks={post.blocks} anchors={anchors} />
        </div>

        <CtaBlock type={post.cta} slug={post.slug} category={post.category} />
        <AuthorBlock post={post} />
        <RelatedPosts posts={related} />
      </article>
    </>
  )
}
