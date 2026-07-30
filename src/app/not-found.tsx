import Link from 'next/link'
import { SITE } from '@/config/site'

export default function NotFound() {
  return (
    <section className="list-hero">
      <h1>찾으시는 글이 없습니다</h1>
      <p>주소가 바뀌었거나 삭제된 글일 수 있습니다. 목록에서 다시 찾아보세요.</p>
      <p style={{ marginTop: 24 }}>
        <Link className="cta-button" href={`${SITE.basePath}/`}>
          글 목록으로 가기
        </Link>
      </p>
    </section>
  )
}
