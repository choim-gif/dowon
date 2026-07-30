/** JSON-LD 구조화 데이터를 script 태그로 안전하게 내보낸다. */
export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
