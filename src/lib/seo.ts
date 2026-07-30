import { ORG, SITE } from '@/config/site'
import type { PostMeta } from './notion'
import type { FaqItem } from './blocks'

export function postUrl(slug: string): string {
  return `${SITE.url}${SITE.basePath}/${encodeURIComponent(slug)}/`
}

export function listUrl(): string {
  return `${SITE.url}${SITE.basePath}/`
}

function organization() {
  return {
    '@type': 'Organization',
    '@id': `${ORG.url}#organization`,
    name: ORG.name,
    legalName: ORG.legalName,
    url: ORG.url,
    logo: { '@type': 'ImageObject', url: ORG.logo },
    description: ORG.description,
    sameAs: [...ORG.sameAs],
  }
}

/**
 * 글 상세용 구조화 데이터.
 * save-tax를 포함한 경쟁 사이트 대부분이 빠뜨린 부분이라 차별점이 된다.
 */
export function articleJsonLd(post: PostMeta, description: string) {
  const url = postUrl(post.slug)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: post.title.slice(0, 110),
    description,
    inLanguage: SITE.language,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    ...(post.coverImage ? { image: [post.coverImage] } : {}),
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.tags.length ? { keywords: post.tags.join(', ') } : {}),
    author: post.author
      ? {
          '@type': 'Person',
          name: post.author,
          jobTitle: post.authorTitle,
          worksFor: organization(),
        }
      : organization(),
    publisher: organization(),
  }
}

export function breadcrumbJsonLd(post: PostMeta) {
  const items = [
    { name: ORG.name, item: `${ORG.url}/` },
    { name: SITE.name, item: listUrl() },
    ...(post.category ? [{ name: post.category, item: listUrl() }] : []),
    { name: post.title, item: postUrl(post.slug) },
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  }
}

export function faqJsonLd(faqs: FaqItem[]) {
  if (faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

export function blogJsonLd(posts: PostMeta[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${listUrl()}#blog`,
    name: SITE.name,
    description: SITE.description,
    url: listUrl(),
    inLanguage: SITE.language,
    publisher: organization(),
    blogPost: posts.slice(0, 20).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: postUrl(p.slug),
      datePublished: p.publishedAt,
    })),
  }
}

/**
 * CTA 링크에 어느 글에서 눌렀는지 표시를 붙인다.
 *
 * 일부러 utm_* 을 쓰지 않는다. 채널톡은 UTM을 라스트터치로 덮어쓰기 때문에,
 * 내부 링크에 utm을 달면 구글 검색 같은 원래 유입 출처가 지워진다.
 * 같은 사이트 안의 이동이라 GA4는 페이지 경로만으로도 흐름을 추적할 수 있다.
 */
export function withSource(href: string, slug: string, category: string): string {
  try {
    const u = new URL(href)
    u.searchParams.set('from', 'blog')
    u.searchParams.set('post', slug)
    if (category) u.searchParams.set('topic', category)
    return u.toString()
  } catch {
    return href
  }
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(d)
}
