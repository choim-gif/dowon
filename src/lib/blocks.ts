import type { NBlock } from './notion'
import { toAnchorId } from './slug'

/** 노션 리치텍스트에서 평문만 뽑는다. */
export function blockPlainText(b: NBlock): string {
  const anyB = b as unknown as Record<string, { rich_text?: Array<{ plain_text: string }> }>
  const body = anyB[b.type]
  if (!body || !body.rich_text) return ''
  return body.rich_text.map((r) => r.plain_text).join('').trim()
}

export type TocItem = { id: string; text: string; level: 2 | 3 }

/**
 * 노션 제목 레벨을 HTML 제목 레벨로 낮춰서 매핑한다.
 * 글 제목이 이미 h1이므로 본문에는 h1을 절대 내지 않는다.
 *   노션 제목1 → h2   노션 제목2 → h3   노션 제목3 → h4
 */
export function headingLevelOf(type: NBlock['type']): 2 | 3 | 4 | null {
  if (type === 'heading_1') return 2
  if (type === 'heading_2') return 3
  if (type === 'heading_3') return 4
  return null
}

/** 렌더링과 목차가 같은 앵커 ID를 쓰도록 미리 계산해 둔다. */
export function buildAnchorMap(blocks: NBlock[]): Map<string, string> {
  const used = new Set<string>()
  const map = new Map<string, string>()
  for (const b of blocks) {
    const lv = headingLevelOf(b.type)
    if (!lv) continue
    const text = blockPlainText(b)
    if (!text) continue
    map.set(b.id, toAnchorId(text, used))
  }
  return map
}

/** h2·h3만 목차로 노출한다. h4까지 넣으면 목차가 산만해진다. */
export function buildToc(blocks: NBlock[], anchors: Map<string, string>): TocItem[] {
  const out: TocItem[] = []
  for (const b of blocks) {
    const lv = headingLevelOf(b.type)
    if (lv !== 2 && lv !== 3) continue
    const text = blockPlainText(b)
    const id = anchors.get(b.id)
    if (!text || !id) continue
    out.push({ id, text, level: lv })
  }
  return out
}

const FAQ_HEADING = /(자주\s*묻는\s*질문|자주하는\s*질문|FAQ|Q\s*&\s*A)/i

export type FaqItem = { question: string; answer: string }

/**
 * "자주 묻는 질문" 제목 아래에 놓인 토글 블록을 FAQ로 인식한다.
 * 토글 제목이 질문, 토글 안 문단이 답변이 된다.
 * 작성자는 노션에서 토글만 쓰면 되고 JSON-LD는 자동으로 만들어진다.
 */
export function extractFaq(blocks: NBlock[]): FaqItem[] {
  const out: FaqItem[] = []
  let inFaq = false

  for (const b of blocks) {
    const lv = headingLevelOf(b.type)
    if (lv) {
      inFaq = FAQ_HEADING.test(blockPlainText(b))
      continue
    }
    if (!inFaq) continue
    if (b.type !== 'toggle') continue

    const question = blockPlainText(b)
    const answer = (b.children ?? [])
      .map((c) => blockPlainText(c))
      .filter(Boolean)
      .join(' ')
      .trim()

    if (question && answer) out.push({ question, answer })
  }
  return out
}

/** 첫 문단. meta description 자동 생성과 발행 전 점검에 함께 쓴다. */
export function firstParagraph(blocks: NBlock[]): string {
  for (const b of blocks) {
    if (b.type !== 'paragraph') continue
    const t = blockPlainText(b)
    if (t.length >= 10) return t
  }
  return ''
}

/** 검색결과 설명문 길이에 맞춰 자른다. */
export function clampDescription(text: string, max = 155): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastPeriod = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('다. '))
  if (lastPeriod > max * 0.6) return cut.slice(0, lastPeriod + 1)
  return cut.replace(/\s+\S*$/, '') + '…'
}

/** 본문 실질 글자 수. 발행 전 점검에 쓴다. */
export function countBodyText(blocks: NBlock[]): number {
  let n = 0
  const walk = (list: NBlock[]) => {
    for (const b of list) {
      n += blockPlainText(b).length
      if (b.children) walk(b.children)
    }
  }
  walk(blocks)
  return n
}
