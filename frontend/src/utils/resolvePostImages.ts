import { resolveImageUrl } from '@/api/client'
import type { PostImage } from '@/types/post'

/**
 * Replace image keys in markdown body with resolved URLs.
 * Markdown images: ![alt](key) → ![alt](resolvedUrl)
 * HTML img tags:   <img src="key"> → <img src="resolvedUrl">
 * Only replaces if the src/URL portion matches a known image key;
 * external URLs and unknown references pass through unchanged.
 */
export function resolvePostImageKeys(body: string, images: PostImage[]): string {
  if (!images.length) return body

  const keyToUrl = new Map(images.map((img) => [img.key, resolveImageUrl(img.url)]))

  // Replace markdown images: ![alt](key)
  let result = body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, ref) => {
    const resolved = keyToUrl.get(ref)
    return resolved ? `![${alt}](${resolved})` : match
  })

  // Replace HTML img src attributes: <img src="key"> or <img src='key'>
  result = result.replace(/(<img\s[^>]*\bsrc=)(["'])([^"']+)\2/g, (match, before, quote, ref) => {
    const resolved = keyToUrl.get(ref)
    return resolved ? `${before}${quote}${resolved}${quote}` : match
  })

  return result
}
