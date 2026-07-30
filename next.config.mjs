const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 정적 생성(Static Export) 모드.
  // 빌드 시점에 노션에서 글을 읽어 순수 HTML 파일로 떨어뜨린다.
  // 서버 함수가 없으므로 Netlify 무료 플랜에서 추가 비용이 발생하지 않는다.
  //
  // 개발 서버에서는 끈다. export 모드는 요청 URL의 인코딩된 파라미터를
  // generateStaticParams의 디코딩된 한글 슬러그와 대조해 실패시키기 때문이다.
  // 빌드 결과물은 동일하므로 미리보기에는 영향이 없다.
  ...(isDev ? {} : { output: 'export' }),

  // 정적 모드에서는 Next.js 이미지 최적화 서버를 쓸 수 없다.
  images: { unoptimized: true },

  // /blog/글제목/index.html 형태로 떨어뜨려 프록시·서브도메인 양쪽에서 동일하게 동작시킨다.
  trailingSlash: true,

  reactStrictMode: true,
}

export default nextConfig
