/**
 * 한글 슬러그 생성기.
 * 구글 상위 사이트들이 쓰는 방식대로 한글을 그대로 URL에 남긴다.
 * 검색어와 URL이 일치하면 검색결과에서 굵게 표시되고 클릭률이 올라간다.
 */

export function toSlug(input: string): string {
  return (
    input
      .normalize('NFC')
      .trim()
      // 대괄호 안 분류표기 제거: [건설업] 등
      .replace(/^\s*\[[^\]]{1,30}\]\s*/g, '')
      .toLowerCase()
      // 한글·영문·숫자·공백·하이픈만 남긴다
      .replace(/[^가-힣a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      // URL이 지나치게 길어지면 잘라낸다
      .slice(0, 60)
      .replace(/-$/, '')
  )
}

/** 목차 앵커용 ID. 중복이 생기면 뒤에 번호를 붙인다. */
export function toAnchorId(text: string, used: Set<string>): string {
  const base = toSlug(text) || 'section'
  let id = base
  let n = 2
  while (used.has(id)) {
    id = `${base}-${n}`
    n += 1
  }
  used.add(id)
  return id
}
