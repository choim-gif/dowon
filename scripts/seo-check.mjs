#!/usr/bin/env node
/**
 * 발행 전 SEO 점검기.
 * 노션에 있는 글을 읽어 규칙 문서의 체크리스트를 자동으로 검사한다.
 *
 *   npm run seo:check            발행 상태인 글 전체 검사
 *   npm run seo:check -- 검수     상태가 '검수'인 글 검사
 *
 * 환경변수는 .env에서 읽는다(Node 20.6 이상의 --env-file 사용).
 */

const TOKEN = process.env.NOTION_TOKEN
const DB = process.env.NOTION_DATABASE_ID
const STATUS = process.argv[2] || '발행'

if (!TOKEN || !DB) {
  console.error('NOTION_TOKEN 과 NOTION_DATABASE_ID 가 필요합니다. .env 파일을 확인해주세요.')
  process.exit(1)
}

const API = 'https://api.notion.com/v1'
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

const AD_WORDS = /(무료상담|최대\s*\d|절감|알아봅시다|완벽\s*정리|총정리|모든\s*것|국세청\s*10년)/
const GREETING = /^(안녕하세요|반갑습니다|오늘은|이번\s*시간)/

async function api(path, init) {
  const res = await fetch(`${API}${path}`, { headers: HEADERS, ...init })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

function plain(rich) {
  return (rich || []).map((r) => r.plain_text).join('').trim()
}

function prop(props, key) {
  const p = props[key]
  if (!p) return ''
  if (p.type === 'title') return plain(p.title)
  if (p.type === 'rich_text') return plain(p.rich_text)
  if (p.type === 'select') return p.select?.name ?? ''
  if (p.type === 'url') return p.url ?? ''
  return ''
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

function blockText(b) {
  const body = b[b.type]
  if (!body || !body.rich_text) return ''
  return plain(body.rich_text)
}

const ICON = { pass: '  ok  ', warn: ' 주의 ', fail: ' 실패 ' }

function check(list, level, label, detail = '') {
  list.push({ level, label, detail })
}

async function main() {
  console.log(`\n노션에서 상태가 '${STATUS}'인 글을 불러옵니다...\n`)

  const pages = []
  let cursor
  do {
    const res = await api(`/databases/${DB}/query`, {
      method: 'POST',
      body: JSON.stringify({
        start_cursor: cursor,
        page_size: 100,
        filter: { property: '상태', select: { equals: STATUS } },
      }),
    })
    pages.push(...res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)

  if (pages.length === 0) {
    console.log('해당 상태의 글이 없습니다.')
    return
  }

  let totalFail = 0
  let totalWarn = 0

  for (const page of pages) {
    const props = page.properties
    const title = prop(props, '제목')
    const blocks = await allBlocks(page.id)
    const results = []

    // 1. 제목 길이 (뒤에 사이트명이 붙는 것을 감안)
    if (!title) check(results, 'fail', '제목이 비어 있습니다')
    else if (title.length > 32)
      check(results, 'warn', `제목이 ${title.length}자입니다`, '32자 이내를 권장합니다')
    else check(results, 'pass', `제목 길이 ${title.length}자`)

    // 2. 파이프 나열
    if (title.includes('|'))
      check(results, 'fail', '제목에 파이프(|) 나열이 있습니다', '색인 탈락 글의 75%가 이 패턴이었습니다')

    // 3. 광고 문구
    if (AD_WORDS.test(title))
      check(results, 'warn', '제목에 광고성 표현이 있습니다', title.match(AD_WORDS)?.[0])

    // 4~5. 첫 문단
    const firstPara = blocks.find((b) => b.type === 'paragraph' && blockText(b).length >= 10)
    const firstText = firstPara ? blockText(firstPara) : ''
    if (!firstText) {
      check(results, 'fail', '본문 첫 문단을 찾지 못했습니다')
    } else {
      if (GREETING.test(firstText))
        check(results, 'fail', '첫 문단이 인사말로 시작합니다', '검색결과 설명문이 인사말로 채워집니다')
      else check(results, 'pass', '첫 문단이 본론으로 시작합니다')

      const firstSentence = firstText.split(/(?<=[.!?])\s/)[0] || firstText
      if (firstSentence.length < 40 || firstSentence.length > 160)
        check(results, 'warn', `첫 문장이 ${firstSentence.length}자입니다`, '80~120자를 권장합니다')

      if (!/\d/.test(firstText))
        check(results, 'warn', '첫 문단에 숫자가 없습니다', '수치가 있으면 검색결과에서 눈에 띕니다')
    }

    // 6. 요약
    if (!prop(props, '요약'))
      check(results, 'warn', '요약이 비어 있습니다', '비우면 첫 문단이 자동으로 쓰입니다')

    // 7. h2 (노션 제목1)
    const h1c = blocks.filter((b) => b.type === 'heading_1').length
    if (h1c < 3) check(results, 'fail', `노션 '제목1'이 ${h1c}개입니다`, '3개 이상 필요합니다(h2로 변환됩니다)')
    else check(results, 'pass', `섹션 제목 ${h1c}개`)

    // 8. 작성자
    if (!prop(props, '작성자')) check(results, 'warn', '작성자가 비어 있습니다', 'E-E-A-T에 직접 영향을 줍니다')

    // 9. 근거법령
    if (!prop(props, '근거법령')) check(results, 'warn', '근거 법령이 비어 있습니다')

    // 10. 분량
    const len = blocks.reduce((n, b) => n + blockText(b).length, 0)
    if (len < 1500) check(results, 'warn', `본문이 ${len.toLocaleString()}자입니다`, '1,500자 이상을 권장합니다')
    else check(results, 'pass', `본문 ${len.toLocaleString()}자`)

    // 11. 표·FAQ 여부
    if (!blocks.some((b) => b.type === 'table'))
      check(results, 'warn', '표가 없습니다', '수치 비교는 표로 만들면 AI 검색 인용률이 올라갑니다')
    const faqCount = blocks.filter((b) => b.type === 'toggle').length
    if (faqCount === 0)
      check(results, 'warn', 'FAQ 토글이 없습니다', '"자주 묻는 질문" 아래 토글을 넣으면 FAQ 스키마가 생성됩니다')

    const fails = results.filter((r) => r.level === 'fail')
    const warns = results.filter((r) => r.level === 'warn')
    totalFail += fails.length
    totalWarn += warns.length

    const mark = fails.length ? '✗' : warns.length ? '△' : '✓'
    console.log(`${mark} ${title || '(제목 없음)'}`)
    for (const r of results) {
      if (r.level === 'pass') continue
      console.log(`   [${ICON[r.level]}] ${r.label}${r.detail ? ` — ${r.detail}` : ''}`)
    }
    console.log('')
  }

  console.log('─'.repeat(60))
  console.log(`글 ${pages.length}편 검사 완료 · 실패 ${totalFail}건 · 주의 ${totalWarn}건`)
  if (totalFail > 0) process.exitCode = 1
}

main().catch((e) => {
  console.error('\n검사 중 오류가 발생했습니다:', e.message)
  process.exit(1)
})
