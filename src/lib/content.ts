import type { NBlock, PostMeta } from './notion'
import { getPostBySlug, getPublishedPosts } from './notion'
import { isSampleMode } from './sample'
import { firstParagraphOf, hasMarkdownPosts, readMarkdownPosts } from './markdown'
import {
  buildAnchorMap,
  buildToc,
  clampDescription,
  extractFaq,
  firstParagraph,
  type FaqItem,
  type TocItem,
} from './blocks'

/**
 * 글 저장소 추상화.
 * 노션과 마크다운 두 가지 백엔드를 지원한다. 환경에 따라 자동으로 고른다.
 *
 *   1) SAMPLE_CONTENT=1                       → 샘플 (화면 확인용)
 *   2) NOTION_TOKEN + NOTION_DATABASE_ID 있음  → 노션
 *   3) content/posts/*.md 있음                 → 마크다운 파일
 *
 * 노션 토큰을 발급받기 전에는 마크다운으로 시작하고,
 * 나중에 환경변수만 채우면 노션으로 넘어간다. 코드는 바꿀 필요가 없다.
 */

export type Backend = 'sample' | 'notion' | 'markdown' | 'none'

export function backend(): Backend {
  if (isSampleMode()) return 'sample'
  if (process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID) return 'notion'
  if (hasMarkdownPosts()) return 'markdown'
  return 'none'
}

/**
 * 발행된 글이 하나도 없을 때 쓰는 자리표시 슬러그.
 * Next.js는 output:export 에서 동적 경로에 최소 한 개의 파라미터를 요구하기 때문에,
 * 글이 없으면 빌드가 실패한다. 이 페이지는 noindex 처리되고 사이트맵에도 들어가지 않으며,
 * 글을 한 편이라도 발행하면 사라진다.
 */
export const PLACEHOLDER_SLUG = '준비중'

export type PostContent = { kind: 'notion'; blocks: NBlock[] } | { kind: 'html'; html: string }

export type FullPost = {
  meta: PostMeta
  content: PostContent
  toc: TocItem[]
  faqs: FaqItem[]
  /** meta description. 요약이 없으면 첫 문단에서 뽑는다. */
  description: string
}

const NO_SOURCE_MESSAGE = [
  '글 저장소를 찾지 못했습니다. 아래 중 하나를 준비해주세요.',
  '',
  '  1) 노션을 쓰는 경우 : .env 에 NOTION_TOKEN 과 NOTION_DATABASE_ID 를 채웁니다.',
  '  2) 마크다운을 쓰는 경우 : content/posts/ 폴더에 .md 파일을 둡니다.',
  '  3) 화면만 볼 경우 : npm run dev:sample 로 실행합니다.',
].join('\n')

export async function listPosts(): Promise<PostMeta[]> {
  const b = backend()
  if (b === 'markdown') return readMarkdownPosts().map((p) => p.meta)
  if (b === 'none') throw new Error(NO_SOURCE_MESSAGE)
  return getPublishedPosts()
}

export async function getPost(slug: string): Promise<FullPost | null> {
  const b = backend()

  if (b === 'markdown') {
    const found = readMarkdownPosts().find((p) => p.meta.slug === slug)
    if (!found) return null
    return {
      meta: found.meta,
      content: { kind: 'html', html: found.html },
      toc: found.toc,
      faqs: found.faqs,
      description: clampDescription(found.meta.summary || firstParagraphOf(found)),
    }
  }

  if (b === 'none') throw new Error(NO_SOURCE_MESSAGE)

  const post = await getPostBySlug(slug)
  if (!post) return null
  const anchors = buildAnchorMap(post.blocks)
  return {
    meta: post,
    content: { kind: 'notion', blocks: post.blocks },
    toc: buildToc(post.blocks, anchors),
    faqs: extractFaq(post.blocks),
    description: clampDescription(post.summary || firstParagraph(post.blocks)),
  }
}

/** 노션 렌더링에 필요한 앵커 맵. 마크다운은 렌더 시점에 이미 부여돼 있다. */
export function anchorsOf(content: PostContent): Map<string, string> {
  return content.kind === 'notion' ? buildAnchorMap(content.blocks) : new Map()
}

/** 같은 카테고리의 다른 글을 최대 n개 고른다. 없으면 최신 글로 채운다. */
export function pickRelated(all: PostMeta[], current: PostMeta, n = 3): PostMeta[] {
  const same = all.filter((p) => p.slug !== current.slug && p.category === current.category)
  const rest = all.filter((p) => p.slug !== current.slug && p.category !== current.category)
  return [...same, ...rest].slice(0, n)
}
