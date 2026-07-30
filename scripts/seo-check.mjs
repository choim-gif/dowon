#!/usr/bin/env node
/**
 * 발행 전 SEO 점검기.
 * 규칙 문서의 체크리스트를 자동으로 검사한다. 노션과 마크다운 양쪽을 지원한다.
 *
 *   npm run seo:check            발행 상태인 글 검사
 *   npm run seo:check -- 검수     상태가 '검수'인 글 검사
 *   npm run seo:check -- 전체     상태와 무관하게 전부 검사
 */

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const TOKEN = process.env.NOTION_TOKEN
const DB = process.env.NOTION_DATABASE_ID
const WANT = process.argv[2] || '발행'
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

const AD_WORDS = /(무료상담|최대\s*\d|절감|알아봅시다|완벽\s*정리|총정리|모든\s*것|국세청\s*10년)/
const GREETING = /^(안녕하세요|반갑습니다|오늘은|이번\s*시간)/

/* ───────────────────────── 공통 검사 로직 ───────────────────────── */

function inspect({ title, summary, author, law, firstText, sectionCount, bodyLen, hasTable, faqCount }) {
  const r = []
  const add = (level, label, detail = '') => r.push({ level, label, detail })

  if (!title) add('fail', '제목이 비어 있습니다')
  else if (title.length > 32) add('warn', `제목이 ${title.length}자입니다`, '32자 이내를 권장합니다')

  if (title.includes('|'))
    add('fail', '제목에 파이프(|) 나열이 있습니다', '색인 탈락 글의 75%가 이 패턴이었습니다')
  if (AD_WORDS.test(title))
    add('warn', '제목에 광고성 표현이 있습니다', title.match(AD_WORDS)?.[0])

  if (!firstText) {
    add('fail', '본문 첫 문단을 찾지 못했습니다')
  } else {
    if (GREETING.test(firstText))
      add('fail', '첫 문단이 인사말로 시작합니다', '검색결과 설명문이 인사말로 채워집니다')
    const firstSentence = firstText.split(/(?<=[.!?])\s/)[0] || firstText
    if (firstSentence.length < 40 || firstSentence.length > 160)
      add('warn', `첫 문장이 ${firstSentence.length}자입니다`, '80~120자를 권장합니다')
    if (!/\d/.test(firstText))
      add('warn', '첫 문단에 숫자가 없습니다', '수치가 있으면 검색결과에서 눈에 띕니다')
  }

  if (!summary) add('warn', '요약이 비어 있습니다', '비우면 첫 문단이 자동으로 쓰입니다')
  if (sectionCount < 3) add('fail', `섹션 제목이 ${sectionCount}개입니다`, '3개 이상 필요합니다(h2로 변환됩니다)')
  if (!author) add('warn', '작성자가 비어 있습니다', 'E-E-A-T에 직접 영향을 줍니다')
  if (!law) add('warn', '근거 법령이 비어 있습니다')
  if (bodyLen < 1500) add('warn', `본문이 ${bodyLen.toLocaleString()}자입니다`, '1,500자 이상을 권장합니다')
  if (!hasTable) add('warn', '표가 없습니다', '수치 비교는 표로 만들면 AI 검색 인용률이 올라갑니다')
  if (faqCount === 0)
    add('warn', 'FAQ가 없습니다', '"자주 묻는 질문" 아래 항목을 넣으면 FAQ 스키마가 생성됩니다')

  return r
}

/* ───────────────────────── 마크다운 백엔드 ───────────────────────── */

function fromMarkdown() {
  if (!fs.existsSync(POSTS_DIR)) return []
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8'))
      const body = content.trim()
      const firstText = (body.split(/\n\s*\n/).find((b) => !b.startsWith('#') && b.length > 20) || '')
        .replace(/[*_`>]/g, '')
        .trim()
      const faqIdx = body.search(/^#{1,3}\s*.*(자주\s*묻는\s*질문|FAQ)/im)
      const faqCount =
        faqIdx < 0 ? 0 : (body.slice(faqIdx).match(/^#{2,4}\s+\S.*$/gm) || []).length - 1
      return {
        source: f,
        status: (data.상태 || '').trim(),
        title: (data.제목 || '').trim(),
        summary: (data.요약 || '').trim(),
        author: (data.작성자 || '').trim(),
        law: (data.근거법령 || '').trim(),
        firstText,
        sectionCount: (body.match(/^#\s+\S/gm) || []).length,
        bodyLen: body.replace(/\s+/g, '').length,
        hasTable: /^\|.*\|/m.test(body),
        faqCount: Math.max(faqCount, 0),
      }
    })
}

/* ───────────────────────── 노션 백엔드 ───────────────────────── */

const API = 'https://api.notion.com/v1'
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

async function api(p, init) {
  const res = await fetch(`${API}${p}`, { headers: HEADERS, ...init })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}
const plain = (rich) => (rich || []).map((x) => x.plain_text).join('').trim()
function prop(props, key) {
  const p = props[key]
  if (!p) return ''
  if (p.type === 'title') return plain(p.title)
  if (p.type === 'rich_text') return plain(p.rich_text)
  if (p.type === 'select') return p.select?.name ?? ''
  if (p.type === 'url') return p.url ?? ''
  return ''
}
function blockText(b) {
  const body = b[b.type]
  return body?.rich_text ? plain(body.rich_text) : ''
}
async function allBlocks(id, depth = 0) {
  if (depth > 2) return []
  const out = []
  let cursor
  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=100` : '?page_size=100'
    const res = await api(`/blocks/${id}/children${q}`)
    for (const b of res.results) {
      out.push(b)
      if (b.has_children) out.push(...(await allBlocks(b.id, depth + 1)))
    }
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return out
}

async function fromNotion() {
  const pages = []
  let cursor
  do {
    const res = await api(`/databases/${DB}/query`, {
      method: 'POST',
      body: JSON.stringify({ start_cursor: cursor, page_size: 100 }),
    })
    pages.push(...res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)

  const out = []
  for (const page of pages) {
    const props = page.properties
    const blocks = await allBlocks(page.id)
    const firstPara = blocks.find((b) => b.type === 'paragraph' && blockText(b).length >= 10)
    out.push({
      source: '노션',
      status: prop(props, '상태'),
      title: prop(props, '제목'),
      summary: prop(props, '요약'),
      author: prop(props, '작성자'),
      law: prop(props, '근거법령'),
      firstText: firstPara ? blockText(firstPara) : '',
      sectionCount: blocks.filter((b) => b.type === 'heading_1').length,
      bodyLen: blocks.reduce((n, b) => n + blockText(b).length, 0),
      hasTable: blocks.some((b) => b.type === 'table'),
      faqCount: blocks.filter((b) => b.type === 'toggle').length,
    })
  }
  return out
}

/* ───────────────────────── 실행 ───────────────────────── */

const LABEL = { pass: '  ok  ', warn: ' 주의 ', fail: ' 실패 ' }

async function main() {
  const useNotion = !!(TOKEN && DB)
  console.log(`\n저장소: ${useNotion ? '노션' : '마크다운 파일(content/posts)'}`)
  console.log(`대상: 상태가 '${WANT}'인 글\n`)

  const posts = useNotion ? await fromNotion() : fromMarkdown()
  const targets = WANT === '전체' ? posts : posts.filter((p) => p.status === WANT)

  if (targets.length === 0) {
    console.log('해당 상태의 글이 없습니다.')
    if (posts.length > 0) {
      const counts = posts.reduce((m, p) => ({ ...m, [p.status || '(없음)']: (m[p.status || '(없음)'] || 0) + 1 }), {})
      console.log('현재 상태 분포:', counts)
    }
    return
  }

  let fails = 0
  let warns = 0

  for (const post of targets) {
    const results = inspect(post)
    const f = results.filter((r) => r.level === 'fail')
    const w = results.filter((r) => r.level === 'warn')
    fails += f.length
    warns += w.length

    const mark = f.length ? '✗' : w.length ? '△' : '✓'
    console.log(`${mark} ${post.title || '(제목 없음)'}   [${post.source}]`)
    for (const r of results) console.log(`   [${LABEL[r.level]}] ${r.label}${r.detail ? ` — ${r.detail}` : ''}`)
    if (results.length === 0) console.log('   모든 항목을 통과했습니다.')
    console.log('')
  }

  console.log('─'.repeat(60))
  console.log(`글 ${targets.length}편 검사 완료 · 실패 ${fails}건 · 주의 ${warns}건`)
  if (fails > 0) process.exitCode = 1
}

main().catch((e) => {
  console.error('\n검사 중 오류가 발생했습니다:', e.message)
  process.exit(1)
})
