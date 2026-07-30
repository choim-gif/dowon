import type { TocItem } from '@/lib/blocks'

/** 목차. h2가 3개 미만이면 오히려 방해가 되므로 그릴 때 걸러낸다. */
export function Toc({ items }: { items: TocItem[] }) {
  const h2count = items.filter((i) => i.level === 2).length
  if (h2count < 3) return null

  return (
    <nav className="toc" aria-label="목차">
      <p className="toc-title">이 글의 내용</p>
      <ol>
        {items.map((it) => (
          <li key={it.id} data-level={it.level}>
            <a href={`#${it.id}`}>{it.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
