/**
 * 사이트 전역 설정.
 * 회사 정보와 CTA 문구를 여기서만 고치면 전체 글에 반영된다.
 */

export const SITE = {
  /** 글이 실제로 노출될 도메인. 끝에 슬래시를 넣지 않는다. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://dowonhr.com').replace(/\/$/, ''),

  /** 블로그가 놓이는 경로. next.config 및 폴더 구조와 일치해야 한다. */
  basePath: '/blog',

  name: '인사노무 인사이트',
  description:
    '노무법인 도원 공인노무사가 쓰는 인사노무 실무 가이드입니다. 4대보험, 확정정산, 사내근로복지기금, 산업재해를 사업주 관점에서 정리합니다.',

  locale: 'ko_KR',
  language: 'ko',
} as const

export const ORG = {
  name: '노무법인 도원',
  legalName: '노무법인 도원',
  url: 'https://dowonhr.com',
  logo: 'https://dowonhr.com/logo.png',
  description: '건설업·의료기관 전문 노무 컨설팅을 제공하는 공인노무사 법인입니다.',
  sameAs: [
    'https://blog.naver.com/dowon2038',
  ],
} as const

/**
 * 글 하단 CTA. 노션의 `CTA유형` 값으로 골라 쓴다.
 * utm은 자동으로 붙는다.
 */
export const CTA_PRESETS = {
  무료진단: {
    heading: '우리 회사도 해당되는지 1분 만에 확인하세요',
    body: '사업장 정보만 입력하면 해당 여부와 예상 규모를 무료로 알려드립니다.',
    buttonText: '무료 진단 신청하기',
    href: 'https://dowonhr.com/',
  },
  체크리스트: {
    heading: '실무 체크리스트를 무료로 받아보세요',
    body: '담당자가 바로 쓸 수 있는 점검 항목을 정리한 자료입니다.',
    buttonText: '체크리스트 받기',
    href: 'https://dowonhr.com/',
  },
  상담: {
    heading: '사례에 맞는 답이 필요하시면 물어보세요',
    body: '담당 공인노무사가 사업장 상황을 확인한 뒤 회신드립니다.',
    buttonText: '상담 요청하기',
    href: 'https://dowonhr.com/',
  },
} as const

export type CtaKey = keyof typeof CTA_PRESETS

/** 브랜드 색상. 인쇄물·카드뉴스와 톤을 맞춘다. */
export const COLORS = {
  navy: '#1F3864',
  gold: '#C8A96A',
  ink: '#1a1a1a',
  body: '#333333',
  muted: '#6b7280',
  line: '#e5e7eb',
  tint: '#F2F5FA',
} as const
