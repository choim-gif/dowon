import type { Metadata } from 'next'
import Link from 'next/link'
import { ORG, SITE } from '@/config/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${ORG.name}`,
    template: `%s | ${ORG.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: SITE.locale,
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="wrap header-inner">
            <a className="brand" href={ORG.url}>
              {ORG.name}
            </a>
            <nav aria-label="주요 메뉴">
              <Link href={`${SITE.basePath}/`}>{SITE.name}</Link>
              <a href={`${ORG.url}/`}>서비스 안내</a>
            </nav>
          </div>
        </header>

        <main className="wrap">{children}</main>

        <footer className="site-footer">
          <div className="wrap">
            <p className="footer-org">{ORG.name}</p>
            <p className="footer-desc">{ORG.description}</p>
            <p className="footer-links">
              <a href={`${ORG.url}/`}>홈페이지</a>
              <span aria-hidden="true"> · </span>
              <a href="https://blog.naver.com/dowon2038">네이버 블로그</a>
              <span aria-hidden="true"> · </span>
              <a href={`${SITE.basePath}/rss.xml`}>RSS</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
