import type { NBlock, PostMeta } from './notion'

/**
 * 노션 없이 화면과 빌드를 확인하기 위한 샘플 데이터.
 * `SAMPLE_CONTENT=1` 일 때만 쓰인다. 평소 빌드에는 절대 섞이지 않는다.
 */

let seq = 0
const id = () => `sample-${(seq += 1)}`

function rt(text: string, opts: { bold?: boolean; href?: string } = {}) {
  return [
    {
      type: 'text',
      text: { content: text, link: opts.href ? { url: opts.href } : null },
      annotations: {
        bold: !!opts.bold,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text: text,
      href: opts.href ?? null,
    },
  ]
}

function block(type: string, payload: Record<string, unknown>, children?: NBlock[]): NBlock {
  return {
    object: 'block',
    id: id(),
    type,
    [type]: payload,
    has_children: !!children,
    ...(children ? { children } : {}),
  } as unknown as NBlock
}

const p = (t: string) => block('paragraph', { rich_text: rt(t), color: 'default' })
const h1 = (t: string) => block('heading_1', { rich_text: rt(t), color: 'default', is_toggleable: false })
const h2 = (t: string) => block('heading_2', { rich_text: rt(t), color: 'default', is_toggleable: false })
const li = (t: string) => block('bulleted_list_item', { rich_text: rt(t), color: 'default' })
const toggle = (q: string, a: string) =>
  block('toggle', { rich_text: rt(q), color: 'default' }, [p(a)])

const tableRow = (cells: string[]) =>
  block('table_row', { cells: cells.map((c) => rt(c)) })

const SAMPLE_BLOCKS: NBlock[] = [
  p(
    '산재를 신청해도 대부분의 중소 사업장은 보험료가 오르지 않습니다. 개별실적요율은 상시근로자 30인 이상 사업장에만 적용되기 때문입니다.'
  ),
  h1('보험료가 오르는 건 어떤 경우인가'),
  p(
    '산재보험료가 오르는 구조는 개별실적요율 하나뿐입니다. 직전 3년간 낸 보험료 대비 받아 간 보험급여의 비율을 따져 다음 해 요율을 최대 ±20% 범위에서 조정합니다.'
  ),
  block('table', { table_width: 2, has_column_header: true, has_row_header: false }, [
    tableRow(['구분', '개별실적요율 적용 여부']),
    tableRow(['상시근로자 30인 미만', '적용되지 않습니다']),
    tableRow(['상시근로자 30인 이상', '적용됩니다']),
    tableRow(['건설업 (총공사금액 기준)', '별도 기준이 적용됩니다']),
  ]),
  h1('그럼 공상처리가 유리한가'),
  p(
    '아닙니다. 공상처리를 하더라도 산업재해조사표 제출 의무는 그대로 남습니다. 제출하지 않으면 과태료가 부과되고, 근로자가 나중에 산재를 신청하면 은폐로 판단될 수 있습니다.'
  ),
  li('산재 처리: 치료비와 휴업급여를 공단이 부담합니다.'),
  li('공상 처리: 회사가 전액 부담하고 신고 의무는 그대로입니다.'),
  block('callout', { rich_text: rt('정리 — 30인 미만 사업장이라면 산재 처리를 망설일 이유가 사실상 없습니다.'), icon: { type: 'emoji', emoji: '📌' }, color: 'gray_background' }),
  h1('자주 묻는 질문'),
  toggle(
    '산재 처리하면 보험료가 얼마나 오르나요?',
    '상시근로자 30인 미만 사업장은 개별실적요율 적용 대상이 아니라 오르지 않습니다. 30인 이상이라도 조정 범위는 최대 ±20%입니다.'
  ),
  toggle(
    '공상처리하면 신고하지 않아도 되나요?',
    '아닙니다. 3일 이상 휴업이 필요한 재해라면 산업재해조사표를 관할 지방고용노동관서에 제출해야 합니다.'
  ),
  h2('참고'),
  p('실제 판단은 사업장 규모와 재해 내용에 따라 달라집니다.'),
]

const SAMPLE_META: PostMeta[] = [
  {
    id: 'sample-post-1',
    slug: '산재-처리하면-보험료-오를까요',
    title: '산재 처리하면 보험료 오를까요',
    summary:
      '산재를 신청해도 대부분의 중소 사업장은 보험료가 오르지 않습니다. 개별실적요율이 30인 이상 사업장에만 적용되기 때문입니다.',
    category: '산업재해',
    tags: ['중소기업', '사례'],
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-30',
    author: '홍길동',
    authorTitle: '공인노무사',
    lawName: '고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 제15조',
    lawUrl: 'https://www.law.go.kr/',
    coverImage: '',
    cta: '채팅상담',
    status: '발행',
  },
  {
    id: 'sample-post-2',
    slug: '건설현장-4대보험-정산-반납-사례',
    title: '건설현장 4대보험 정산, 3천만원 반납 사례',
    summary:
      '제비율표대로 보험료를 계상하고도 준공 정산에서 3천만원을 반납한 사례입니다. 원인은 신고 누락 하나였습니다.',
    category: '고용산재 확정정산',
    tags: ['건설업', '사례'],
    publishedAt: '2026-07-27',
    updatedAt: '2026-07-27',
    author: '홍길동',
    authorTitle: '공인노무사',
    lawName: '고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 제17조',
    lawUrl: 'https://www.law.go.kr/',
    coverImage: '',
    cta: '체크리스트',
    status: '발행',
  },
]

export function isSampleMode(): boolean {
  return process.env.SAMPLE_CONTENT === '1'
}

export function samplePosts(): PostMeta[] {
  return SAMPLE_META
}

export function sampleBlocks(): NBlock[] {
  return SAMPLE_BLOCKS
}
