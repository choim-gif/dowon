# 인사노무 인사이트 — 노무법인 도원 자체 블로그

노션에서 글을 쓰면 Next.js가 정적 HTML로 만들어 Netlify에 올리는 구조입니다.
구글 노무 키워드 1페이지를 차지한 사이트 6곳의 공통 구조(자체 도메인 서브디렉터리 + h2 4~8개)를 그대로 따르되, 그들이 빠뜨린 구조화 데이터와 작성자 정보를 처음부터 넣었습니다.

```
글 작성(노션 또는 마크다운) → 빌드 시점에 읽음 → 정적 HTML 생성 → Netlify 배포
```

## 글 저장소는 두 가지 중에 고르면 됩니다

코드가 환경을 보고 자동으로 판단합니다. 나중에 바꿔도 코드는 손대지 않습니다.

| 방식 | 준비물 | 이럴 때 씁니다 |
|---|---|---|
| **마크다운 파일** | 없음. 바로 시작 | 노션 토큰 발급이 막혀 있거나, 지금 당장 시작하고 싶을 때. 글이 저장소에 남아 이력이 보관됩니다. → [작성 가이드](docs/markdown-guide.md) |
| **노션** | 통합 토큰 발급 | 여러 명이 노션에서 함께 쓰고 관리할 때. → [DB 설계](docs/notion-schema.md) |

판단 순서는 이렇습니다.

1. `SAMPLE_CONTENT=1` 이면 샘플 글 (화면 확인용)
2. `.env`에 `NOTION_TOKEN`과 `NOTION_DATABASE_ID`가 있으면 노션
3. `content/posts/`에 `.md` 파일이 있으면 마크다운

두 방식은 속성 이름과 제목 규칙이 동일해서, 마크다운으로 시작했다가 노션으로 옮겨도 글을 그대로 옮길 수 있습니다.

---

## 1. 왜 이 구성인가

| 선택 | 이유 |
|---|---|
| Next.js 정적 생성 | 서버 함수가 없어 Netlify 무료 플랜에서 추가 비용이 나지 않고, 속도도 가장 빠릅니다. |
| 노션을 글 저장소로 | 이미 쓰고 있는 도구라 새로 배울 것이 없고, 마케터가 개발자 없이 발행할 수 있습니다. |
| Netlify 호스팅 | 무료 플랜에서 상업적 이용이 허용됩니다. **Vercel 무료(Hobby) 플랜은 약관상 상업적 이용이 금지되어 쓰면 안 됩니다.** |
| `/blog/{한글-슬러그}` | 검색어와 URL이 일치하면 검색결과에서 굵게 표시되어 클릭률이 올라갑니다. |

---

## 2. 처음 한 번만 하는 설정

### 2-0. 마크다운으로 시작하는 경우 — 준비할 것이 없습니다

`content/posts/` 폴더에 샘플 글이 한 편 들어 있습니다(`상태: 초안`). 상태를 `발행`으로 바꾸고 커밋하면 그대로 나갑니다. 작성 방법은 [docs/markdown-guide.md](docs/markdown-guide.md)에 있습니다. 아래 2-1~2-3은 건너뛰고 2-4로 가시면 됩니다.

### 2-1. 노션으로 쓰는 경우 — 데이터베이스는 이미 만들어져 있습니다

노션 `MARKETING` 페이지 아래에 **인사노무 인사이트 (자체 블로그)** 데이터베이스를 만들어 두었습니다. 규칙을 보여주는 샘플 글도 한 편 들어 있습니다(상태는 `검수`, 노출은 해제 상태).

- 데이터베이스 주소 : https://app.notion.com/p/33bc5e2e7d1b41afa2ae5fd0cfb8329e
- 데이터베이스 ID : `33bc5e2e7d1b41afa2ae5fd0cfb8329e`

속성 구성과 본문 작성 규칙은 [docs/notion-schema.md](docs/notion-schema.md)에 정리해 두었습니다. **속성 이름이 코드와 1:1로 연결되어 있으니 이름은 바꾸지 마세요.**

### 2-2. 통합 토큰 발급과 연결 — 이 단계만 직접 하셔야 합니다

토큰 발급은 계정 소유자만 할 수 있어 대신 해드릴 수 없습니다.

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) → `새 API 통합` → 이름을 `도원 블로그`로 지정하고 워크스페이스를 선택합니다.
2. 발급된 `Internal Integration Secret`을 복사합니다. `ntn_`으로 시작합니다.
3. 위 데이터베이스 페이지를 열고 우측 상단 `···` → `연결` → `도원 블로그`를 추가합니다. **이 3번을 빠뜨리면 권한 오류가 납니다.**

### 2-3. 환경변수

`.env.example`을 복사해 `.env`로 만들고 값을 채웁니다.

```
NOTION_TOKEN=ntn_여기에_발급받은_시크릿
NOTION_DATABASE_ID=33bc5e2e7d1b41afa2ae5fd0cfb8329e
NEXT_PUBLIC_SITE_URL=https://dowonhr.com
```

`NEXT_PUBLIC_SITE_URL`은 최종 도메인입니다. 서브도메인으로 운영하면 `https://blog.dowonhr.com`으로 바꿉니다.

### 2-4. 회사 정보와 CTA 문구

`src/config/site.ts` 한 파일만 고치면 전체 글에 반영됩니다.

- `ORG` : 회사명, 홈페이지 주소, 로고 URL
- `CTA_PRESETS` : 글 하단 전환 문구와 연결 주소 — **`href`를 실제 진단 페이지 주소로 바꿔주세요.** 지금은 홈페이지 주소로 되어 있습니다.
- `COLORS` : 브랜드 색상

### 2-5. GitHub에 올리고 Netlify 연결

```bash
git init
git add .
git commit -m "인사노무 인사이트 블로그 초기 구성"
git branch -M main
git remote add origin https://github.com/<계정>/dowon-blog.git
git push -u origin main
```

Netlify에서 `Add new site` → `Import an existing project` → 저장소 선택. 빌드 설정은 `netlify.toml`에 이미 들어 있어 그대로 두면 됩니다. 마지막으로 **Site configuration → Environment variables**에 위 세 개의 환경변수를 등록합니다.

---

## 3. 글을 발행하는 순서

1. 노션에서 글을 씁니다.
2. `상태`를 `검수`로 두고 점검기를 돌립니다.
   ```bash
   npm run seo:check -- 검수
   ```
   제목 길이, 파이프 나열, 인사말로 시작하는 첫 문단, 섹션 제목 개수, 작성자, 분량, 표와 FAQ 유무를 자동으로 검사합니다.
3. 지적된 항목을 고칩니다.
4. `상태`를 `발행`으로 바꾸고 `노출`을 체크합니다.
5. Netlify에서 `Trigger deploy` → `Deploy site`를 누릅니다.

정적 생성이라 **노션에서 글을 고쳐도 재배포하기 전에는 사이트에 반영되지 않습니다.** 이건 단점이 아니라 안전장치입니다. 초안이 실수로 노출되지 않습니다.

### 자동 배포를 걸고 싶다면

Netlify에서 **Build hooks**를 만들면 그 URL을 호출할 때마다 재빌드됩니다. 매일 아침 한 번 호출하도록 예약하거나, 노션 자동화에서 상태가 `발행`으로 바뀔 때 호출하게 걸어두면 수동 배포가 없어집니다.

---

## 4. 도메인 연결

두 가지 방식이 있고, SEO 효과는 서브디렉터리가 낫습니다.

### A안. 서브도메인 `blog.dowonhr.com` — 안전하고 즉시 가능

Netlify에서 도메인을 추가하고 DNS에 CNAME을 하나 추가하면 끝입니다. 본진 사이트에 아무 영향이 없습니다.
`NEXT_PUBLIC_SITE_URL`을 `https://blog.dowonhr.com`으로 설정합니다.

### B안. 서브디렉터리 `dowonhr.com/blog` — SEO 최선, 사전 검증 필요

도메인 권위가 본진에 그대로 쌓입니다. 구글 상위 6개 사이트가 전부 이 방식입니다.

구현은 DNS를 Cloudflare로 옮긴 뒤, `/blog/*` 요청만 Netlify로 넘기고 나머지는 아임웹으로 보내는 Worker를 두는 방식입니다. **먼저 아임웹이 Cloudflare 프록시 뒤에서 SSL과 도메인 검증을 정상 처리하는지 확인해야 합니다.** 확인 전에 적용하면 본진 사이트가 멈출 수 있습니다.

A안으로 시작했다가 B안으로 옮길 수 있습니다. 그때는 301 리다이렉트를 걸어 기존 주소의 평가를 넘깁니다.

---

## 5. 검색엔진 등록

배포가 끝나면 세 곳에 등록합니다. 전부 무료입니다.

| 도구 | 등록 내용 | 왜 필요한가 |
|---|---|---|
| 구글 서치콘솔 | 사이트맵 `/blog/sitemap.xml` | 색인 상태와 누락 사유를 URL별로 확인할 수 있습니다. |
| 네이버 서치어드바이저 | 사이트 + 사이트맵 | 네이버 웹사이트 탭에 노출됩니다. 지금 서비스 키워드에서 도원이 전혀 없는 자리입니다. |
| 빙 웹마스터도구 | 사이트 + 사이트맵 | 챗GPT 검색이 빙 색인을 씁니다. AI 검색 노출의 관문입니다. |

그리고 아임웹 쪽 `robots.txt`(도메인 루트)에 사이트맵 주소를 한 줄 추가합니다.

```
Sitemap: https://dowonhr.com/blog/sitemap.xml
```

---

## 6. 자동으로 만들어지는 것

| 항목 | 주소 | 비고 |
|---|---|---|
| 글 목록 | `/blog/` | 카테고리 칩과 요약이 함께 나옵니다. |
| 글 상세 | `/blog/{한글-슬러그}/` | |
| 사이트맵 | `/blog/sitemap.xml` | 발행 글 전체와 수정일이 들어갑니다. |
| RSS | `/blog/rss.xml` | 뉴스레터 자동화에 씁니다. |
| Article 스키마 | 각 글 | 작성자·발행일·수정일·발행사 포함 |
| BreadcrumbList | 각 글 | 검색결과에 경로가 표시됩니다. |
| FAQPage | FAQ 토글이 있는 글 | 질문 목록이 검색결과에 펼쳐질 수 있습니다. |
| 목차 | 섹션 3개 이상인 글 | 자동 생성되며 앵커 링크가 걸립니다. |
| 작성자·수정일·근거법령 블록 | 각 글 | E-E-A-T 신호 |
| CTA | 각 글 | UTM이 자동으로 붙습니다. |

---

## 7. 로컬에서 미리 보기

Node.js 24 LTS와 의존성은 이미 설치해 두었습니다. 바로 쓰실 수 있습니다.

```bash
npm run dev          # 노션 연결 후: http://localhost:3000/blog
npm run build        # out/ 폴더에 정적 파일 생성
```

노션 토큰을 아직 발급받지 않았다면 샘플 글로 화면만 먼저 볼 수 있습니다.

```bash
npm run dev:sample     # 샘플 글 2편으로 화면 확인
npm run build:sample   # 샘플로 빌드 검증
```

샘플 모드는 `SAMPLE_CONTENT=1`일 때만 동작하므로 운영 빌드(`npm run build`)에는 절대 섞이지 않습니다.

### 빌드 검증 결과 (2026-07-30)

샘플 모드로 실제 빌드를 돌려 아래를 확인했습니다.

- 정적 export 성공. `out/blog/{한글-슬러그}/index.html` 생성
- `out/blog/sitemap.xml`, `out/blog/rss.xml` 정상 위치
- h1 1개, h2 4개, h3 1개 — 본문에 h1 중복 없음
- JSON-LD 3종(Article, BreadcrumbList, FAQPage) 정상 출력. FAQ 질문 2개가 토글에서 자동 추출됨
- canonical, og:type=article, article:modified_time 정상
- CTA 링크에 UTM 4종 자동 부착

---

## 8. 폴더 구조

```
src/
├── app/
│   ├── layout.tsx              공통 헤더·푸터
│   ├── page.tsx                루트(→ /blog로 안내)
│   ├── globals.css             전체 스타일
│   └── blog/
│       ├── page.tsx            글 목록
│       ├── [slug]/page.tsx     글 상세
│       ├── sitemap.xml/route.ts
│       └── rss.xml/route.ts
├── components/
│   ├── PostBody.tsx            노션 블록 → HTML (제목1을 h2로 변환)
│   ├── RichText.tsx            굵게·링크·코드 등 서식
│   ├── Toc.tsx                 목차
│   ├── AuthorBlock.tsx         작성자·수정일·근거법령
│   ├── CtaBlock.tsx            전환 장치
│   ├── RelatedPosts.tsx        관련 글
│   └── JsonLd.tsx              구조화 데이터
├── lib/
│   ├── notion.ts               노션 API 연동
│   ├── blocks.ts               목차·FAQ·요약 추출
│   ├── seo.ts                  JSON-LD, URL, UTM
│   └── slug.ts                 한글 슬러그
└── config/
    └── site.ts                 회사 정보·CTA·색상
```
