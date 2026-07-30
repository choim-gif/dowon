import React from 'react'
import type { NBlock } from '@/lib/notion'
import { headingLevelOf } from '@/lib/blocks'
import { RichText } from './RichText'

type Props = { blocks: NBlock[]; anchors: Map<string, string> }

/** 리스트 항목은 연속된 것끼리 묶어야 ul/ol이 하나로 나온다. */
type Group =
  | { kind: 'blocks'; items: NBlock[] }
  | { kind: 'ul'; items: NBlock[] }
  | { kind: 'ol'; items: NBlock[] }

function group(blocks: NBlock[]): Group[] {
  const out: Group[] = []
  for (const b of blocks) {
    const kind = b.type === 'bulleted_list_item' ? 'ul' : b.type === 'numbered_list_item' ? 'ol' : 'blocks'
    const last = out[out.length - 1]
    if (last && last.kind === kind && kind !== 'blocks') last.items.push(b)
    else if (last && last.kind === 'blocks' && kind === 'blocks') last.items.push(b)
    else out.push({ kind, items: [b] } as Group)
  }
  return out
}

function richOf(b: NBlock) {
  const anyB = b as unknown as Record<string, { rich_text?: never[] }>
  return anyB[b.type]?.rich_text as never[] | undefined
}

export function PostBody({ blocks, anchors }: Props) {
  return <>{group(blocks).map((g, i) => <GroupNode key={i} g={g} anchors={anchors} />)}</>
}

function GroupNode({ g, anchors }: { g: Group; anchors: Map<string, string> }) {
  if (g.kind === 'ul') {
    return (
      <ul className="post-ul">
        {g.items.map((b) => (
          <li key={b.id}>
            <RichText value={richOf(b)} />
            {b.children && b.children.length > 0 && <PostBody blocks={b.children} anchors={anchors} />}
          </li>
        ))}
      </ul>
    )
  }
  if (g.kind === 'ol') {
    return (
      <ol className="post-ol">
        {g.items.map((b) => (
          <li key={b.id}>
            <RichText value={richOf(b)} />
            {b.children && b.children.length > 0 && <PostBody blocks={b.children} anchors={anchors} />}
          </li>
        ))}
      </ol>
    )
  }
  return <>{g.items.map((b) => <Block key={b.id} b={b} anchors={anchors} />)}</>
}

function Block({ b, anchors }: { b: NBlock; anchors: Map<string, string> }) {
  const level = headingLevelOf(b.type)

  if (level) {
    const id = anchors.get(b.id)
    const inner = <RichText value={richOf(b)} />
    if (level === 2) return <h2 id={id} className="post-h2">{inner}</h2>
    if (level === 3) return <h3 id={id} className="post-h3">{inner}</h3>
    return <h4 id={id} className="post-h4">{inner}</h4>
  }

  switch (b.type) {
    case 'paragraph': {
      const rt = richOf(b)
      if (!rt || rt.length === 0) return null
      return (
        <p className="post-p">
          <RichText value={rt} />
        </p>
      )
    }

    case 'quote':
      return (
        <blockquote className="post-quote">
          <RichText value={richOf(b)} />
          {b.children && <PostBody blocks={b.children} anchors={anchors} />}
        </blockquote>
      )

    case 'callout':
      return (
        <aside className="post-callout">
          {b.callout.icon?.type === 'emoji' && (
            <span className="post-callout-icon" aria-hidden="true">
              {b.callout.icon.emoji}
            </span>
          )}
          <div>
            <RichText value={b.callout.rich_text} />
            {b.children && <PostBody blocks={b.children} anchors={anchors} />}
          </div>
        </aside>
      )

    case 'divider':
      return <hr className="post-hr" />

    case 'to_do':
      return (
        <p className="post-todo">
          <span aria-hidden="true">{b.to_do.checked ? '☑' : '☐'}</span>{' '}
          <RichText value={b.to_do.rich_text} />
        </p>
      )

    case 'toggle':
      return (
        <details className="post-toggle">
          <summary>
            <RichText value={b.toggle.rich_text} />
          </summary>
          {b.children && <PostBody blocks={b.children} anchors={anchors} />}
        </details>
      )

    case 'code':
      return (
        <pre className="post-code">
          <code>{b.code.rich_text.map((r) => r.plain_text).join('')}</code>
        </pre>
      )

    case 'image': {
      const src = b.image.type === 'external' ? b.image.external.url : b.image.file.url
      const caption = b.image.caption.map((c) => c.plain_text).join('')
      return (
        <figure className="post-figure">
          {/* 정적 export라 next/image 최적화를 쓰지 않는다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={caption || ''} loading="lazy" decoding="async" />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      )
    }

    case 'table': {
      const rows = (b.children ?? []).filter((c) => c.type === 'table_row')
      if (rows.length === 0) return null
      const hasHeader = b.table.has_column_header
      const [first, ...rest] = rows
      const cellsOf = (r: NBlock) => (r.type === 'table_row' ? r.table_row.cells : [])
      return (
        <div className="post-table-wrap">
          <table className="post-table">
            {hasHeader && (
              <thead>
                <tr>
                  {cellsOf(first).map((cell, i) => (
                    <th key={i}>
                      <RichText value={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(hasHeader ? rest : rows).map((r) => (
                <tr key={r.id}>
                  {cellsOf(r).map((cell, i) => (
                    <td key={i}>
                      <RichText value={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    case 'bookmark':
    case 'embed':
    case 'link_preview': {
      const url =
        b.type === 'bookmark' ? b.bookmark.url : b.type === 'embed' ? b.embed.url : b.link_preview.url
      return (
        <p className="post-p">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        </p>
      )
    }

    case 'video': {
      const url = b.video.type === 'external' ? b.video.external.url : b.video.file.url
      const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/)
      if (yt) {
        return (
          <div className="post-video">
            <iframe
              src={`https://www.youtube.com/embed/${yt[1]}`}
              title="YouTube video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )
      }
      return (
        <p className="post-p">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        </p>
      )
    }

    case 'column_list':
      return (
        <div className="post-columns">
          {(b.children ?? []).map((col) => (
            <div key={col.id}>
              {col.children && <PostBody blocks={col.children} anchors={anchors} />}
            </div>
          ))}
        </div>
      )

    default:
      // 지원하지 않는 블록은 조용히 건너뛴다.
      return null
  }
}
