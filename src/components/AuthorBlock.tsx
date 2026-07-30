import { ORG } from '@/config/site'
import { formatDate } from '@/lib/seo'
import type { PostMeta } from '@/lib/notion'

/**
 * E-E-A-T 블록.
 * 노무는 돈과 법에 직결되는 주제라 구글이 작성자 신뢰도를 특히 엄격하게 본다.
 * 작성자·수정일·근거법령 세 가지를 모든 글 하단에 고정으로 노출한다.
 */
export function AuthorBlock({ post }: { post: PostMeta }) {
  const author = post.author?.trim()
  const modified = post.updatedAt || post.publishedAt

  return (
    <section className="author-block" aria-label="작성 정보">
      <dl>
        <div>
          <dt>작성</dt>
          <dd>
            {author ? (
              <>
                {ORG.name} {post.authorTitle} {author}
              </>
            ) : (
              <>{ORG.name} 기업자문팀</>
            )}
          </dd>
        </div>

        {post.publishedAt && (
          <div>
            <dt>최초 발행</dt>
            <dd>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            </dd>
          </div>
        )}

        {modified && (
          <div>
            <dt>최종 수정</dt>
            <dd>
              <time dateTime={modified}>{formatDate(modified)}</time>
            </dd>
          </div>
        )}

        {post.lawName && (
          <div>
            <dt>근거 법령</dt>
            <dd>
              {post.lawUrl ? (
                <a href={post.lawUrl} target="_blank" rel="noopener noreferrer">
                  {post.lawName}
                </a>
              ) : (
                post.lawName
              )}
            </dd>
          </div>
        )}
      </dl>

      <p className="author-note">
        이 글은 일반적인 정보 제공을 목적으로 하며, 개별 사업장의 사실관계에 따라 판단이 달라질 수
        있습니다. 구체적인 사안은 담당 공인노무사와 상담하시기 바랍니다.
      </p>
    </section>
  )
}
