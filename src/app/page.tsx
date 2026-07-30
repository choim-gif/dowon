import Link from 'next/link'
import { SITE } from '@/config/site'

/**
 * 루트 접속 처리.
 * 실제 리다이렉트는 netlify.toml에서 301로 처리하고,
 * 이 페이지는 그 설정이 적용되지 않는 환경을 위한 보조 화면이다.
 */
export default function Home() {
  return (
    <section className="list-hero">
      <h1>{SITE.name}</h1>
      <p>{SITE.description}</p>
      <p style={{ marginTop: 24 }}>
        <Link className="cta-button" href={`${SITE.basePath}/`}>
          글 목록 보기
        </Link>
      </p>
    </section>
  )
}
