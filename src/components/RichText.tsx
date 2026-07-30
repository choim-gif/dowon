import React from 'react'
import type { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints'

/** 노션 리치텍스트(굵게·링크·코드 등)를 그대로 HTML로 옮긴다. */
export function RichText({ value }: { value: RichTextItemResponse[] | undefined }) {
  if (!value || value.length === 0) return null

  return (
    <>
      {value.map((t, i) => {
        const { annotations, plain_text, href } = t
        let node: React.ReactNode = plain_text

        if (annotations.code) node = <code className="inline-code">{node}</code>
        if (annotations.bold) node = <strong>{node}</strong>
        if (annotations.italic) node = <em>{node}</em>
        if (annotations.underline) node = <u>{node}</u>
        if (annotations.strikethrough) node = <s>{node}</s>

        if (href) {
          const external = /^https?:\/\//.test(href) && !href.includes('dowonhr.com')
          node = (
            <a
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {node}
            </a>
          )
        }

        return <React.Fragment key={i}>{node}</React.Fragment>
      })}
    </>
  )
}
