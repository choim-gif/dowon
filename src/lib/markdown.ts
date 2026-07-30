import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { Marked } from 'marked'
import type { PostMeta } from './notion'
import type { FaqItem, TocItem } from './blocks'
import { toAnchorId, toSlug } from './slug'

/**
 * 마크다운 파일을 글 저장소로 쓰는 백엔드.
 * 노션 토큰 없이 바로 쓸 수 있고, 글이 저장소에 남아 이력 관리가 된다.
 *
 * content/posts/*.md 를 읽는다.
 */

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

/** 개발 서버에서만 검수·초안 글을 함께 보여준다. 운영 빌드에는 절대 포함되지 않는다. */
const SHOW_DRAFTS = process.env.NODE_ENV === 'development'

export function hasMarkdownPosts(): boolean {
  try {
    return fs.existsSync(POSTS_DIR) && fs.readdirSync(POSTS_DIR).some((f) => f.endsWith('.md'))
  } catch {
    return false
  }
}

type FrontMatter = {
  제목?: string
  슬러그?: string
  요약?: string
  카테고리?: string
  태그?: string[] | string
  상태?: string
  노출?: boolean
  발행일?: string | Date
  최종수정일?: string | Date
  작성자?: string
  작성자직함?: string
  근거법령?: string
  근거법령링크?: string
  대표이미지?: string
  CTA유형?: string
}

function asDate(v: string | Date | undefined): string {
  if (!v) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

function asTags(v: string[] | string | undefined): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.map(String)
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export type MarkdownPost = {
  meta: PostMeta
  html: string
  toc: TocItem[]
  faqs: FaqItem[]
  plainText: string
}

const FAQ_HEADING = /(자주\s*묻는\s*질문|자주하는\s*질문|FAQ|Q\s*&\s*A)/i

/**
 * 마크다운 제목 레벨을 한 단계 낮춰 렌더링한다.
 * 글 제목이 이미 h1이므로 본문의 `#`은 h2가 된다. 노션 백엔드와 동일한 규칙이다.
 */
function renderMarkdown(md: string): { html: string; toc: TocItem[]; faqs: FaqItem[] } {
  const used = new Set<string>()
  const toc: TocItem[] = []
  const marked = new Marked({ gfm: true, breaks: false })

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens)
        const plain = text.replace(/<[^>]+>/g, '').trim()
        const level = Math.min(depth + 1, 6)
        const id = toAnchorId(plain, used)
        if (level === 2 || level === 3) toc.push({ id, text: plain, level: level as 2 | 3 })
        return `<h${level} id="${id}" class="post-h${level}">${text}</h${level}>\n`
      },
      paragraph({ tokens }) {
        return `<p class="post-p">${this.parser.parseInline(tokens)}</p>\n`
      },
      list(token) {
        const tag = token.ordered ? 'ol' : 'ul'
        const cls = token.ordered ? 'post-ol' : 'post-ul'
        const body = token.items.map((item) => `<li>${this.parser.parse(item.tokens)}</li>`).join('')
        return `<${tag} class="${cls}">${body}</${tag}>\n`
      },
      blockquote({ tokens }) {
        return `<blockquote class="post-quote">${this.parser.parse(tokens)}</blockquote>\n`
      },
      table(token) {
        const head = token.header
          .map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`)
          .join('')
        const rows = token.rows
          .map(
            (row) =>
              `<tr>${row.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`
          )
          .join('')
        return `<div class="post-table-wrap"><table class="post-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`
      },
      image({ href, text }) {
        return `<figure class="post-figure"><img src="${href}" alt="${text || ''}" loading="lazy" decoding="async" />${
          text ? `<figcaption>${text}</figcaption>` : ''
        }</figure>\n`
      },
      hr() {
        return '<hr class="post-hr" />\n'
      },
      codespan({ text }) {
        return `<code class="inline-code">${text}</code>`
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens)
        const external = /^https?:\/\//.test(href) && !href.includes('dowonhr.com')
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : ''
        return `<a href="${href}"${title ? ` title="${title}"` : ''}${attrs}>${text}</a>`
      },
    },
  })

  const html = marked.parse(md, { async: false }) as string
  const faqs = extractFaqFromMarkdown(md)
  return { html, toc, faqs }
}

/**
 * "## 자주 묻는 질문" 아래의 소제목·답변 쌍을 FAQ로 인식한다.
 * 마크다운에서는 토글이 없으므로 한 단계 아래 제목을 질문으로 본다.
 */
function extractFaqFromMarkdown(md: string): FaqItem[] {
  const lines = md.split(/\r?\n/)
  const out: FaqItem[] = []
  let inFaq = false
  let faqLevel = 0
  let question = ''
  let answer: string[] = []

  const flush = () => {
    const a = answer.join(' ').replace(/\s+/g, ' ').trim()
    if (question && a) out.push({ question, answer: a })
    question = ''
    answer = []
  }

  for (const raw of lines) {
    const m = raw.match(/^(#{1,6})\s+(.*)$/)
    if (m) {
      const level = m[1].length
      const text = m[2].trim()
      if (!inFaq) {
        if (FAQ_HEADING.test(text)) {
          inFaq = true
          faqLevel = level
        }
        continue
      }
      // FAQ 섹션과 같거나 상위 레벨의 제목이 나오면 섹션이 끝난 것이다.
      if (level <= faqLevel) {
        flush()
        inFaq = FAQ_HEADING.test(text)
        faqLevel = level
        continue
      }
      flush()
      question = text.replace(/[*_`]/g, '')
      continue
    }
    if (inFaq && question) {
      const t = raw.replace(/^[-*>\s]+/, '').trim()
      if (t) answer.push(t.replace(/[*_`]/g, ''))
    }
  }
  flush()
  return out
}

function toMeta(fm: FrontMatter, fallbackSlug: string, fileMtime: Date): PostMeta {
  const title = (fm.제목 || '').trim()
  return {
    id: `md:${fallbackSlug}`,
    slug: toSlug(fm.슬러그 || title || fallbackSlug),
    title,
    summary: (fm.요약 || '').trim(),
    category: (fm.카테고리 || '').trim(),
    tags: asTags(fm.태그),
    publishedAt: asDate(fm.발행일) || fileMtime.toISOString().slice(0, 10),
    updatedAt: asDate(fm.최종수정일) || asDate(fm.발행일) || fileMtime.toISOString().slice(0, 10),
    author: (fm.작성자 || '').trim(),
    authorTitle: (fm.작성자직함 || '').trim() || '공인노무사',
    lawName: (fm.근거법령 || '').trim(),
    lawUrl: (fm.근거법령링크 || '').trim(),
    coverImage: (fm.대표이미지 || '').trim(),
    cta: (fm.CTA유형 || '').trim() || '채팅상담',
    status: (fm.상태 || '').trim() || '초안',
  }
}

let cache: MarkdownPost[] | null = null

/** 발행 상태인 마크다운 글을 최신순으로 읽는다. */
export function readMarkdownPosts(): MarkdownPost[] {
  if (cache) return cache
  if (!hasMarkdownPosts()) {
    cache = []
    return cache
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'))
  const posts: MarkdownPost[] = []
  const seen = new Set<string>()

  for (const file of files) {
    const full = path.join(POSTS_DIR, file)
    const raw = fs.readFileSync(full, 'utf-8')
    const { data, content } = matter(raw)
    const fm = data as FrontMatter

    const status = (fm.상태 || '').trim()
    const visible = fm.노출 !== false
    // 운영 빌드에는 '발행'만 나간다.
    // 개발 서버에서는 검수·초안도 보여야 발행 전에 화면을 확인할 수 있다.
    if (!visible) continue
    if (status !== '발행' && !SHOW_DRAFTS) continue

    const base = file.replace(/\.md$/, '')
    const meta = toMeta(fm, base, fs.statSync(full).mtime)
    if (!meta.title) continue

    // 슬러그 충돌 방지
    if (seen.has(meta.slug)) {
      let n = 2
      while (seen.has(`${meta.slug}-${n}`)) n += 1
      meta.slug = `${meta.slug}-${n}`
    }
    seen.add(meta.slug)

    const { html, toc, faqs } = renderMarkdown(content)
    const plainText = content.replace(/[#*`>_\-|]/g, ' ').replace(/\s+/g, ' ').trim()
    posts.push({ meta, html, toc, faqs, plainText })
  }

  posts.sort((a, b) => (a.meta.publishedAt < b.meta.publishedAt ? 1 : -1))
  cache = posts
  return cache
}

/** 요약이 비어 있을 때 쓸 첫 문단. */
export function firstParagraphOf(post: MarkdownPost): string {
  const m = post.plainText.match(/^(.{20,400}?[.!?])\s/)
  return m ? m[1] : post.plainText.slice(0, 200)
}
