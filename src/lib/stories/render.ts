const HTML_TAG_RE = /<[a-z][\s\S]*?>/i;

export function isHtmlContent(text: string): boolean {
  return HTML_TAG_RE.test(text);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Converts story content (HTML or plain text) to a safe HTML string.
 * Plain text: wraps paragraphs in <p>, converts single \n to <br />.
 * HTML: returned as-is.
 */
export function renderStoryHtml(content: string): string {
  if (!content?.trim()) return '';
  if (isHtmlContent(content)) return content;
  return content
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p>${p.trim().replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

/**
 * Splits story content into pages by target word count.
 * Handles both plain text (split on \n\n) and HTML (split on </p> boundaries).
 * Returns an array of HTML strings ready for dangerouslySetInnerHTML.
 */
export function splitIntoPages(
  content: string,
  targetWords: number,
  minWords: number,
  maxWords: number,
): string[] {
  if (!content?.trim()) return [''];

  if (!isHtmlContent(content)) {
    // Plain text path: same word-count logic, output as HTML
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    const pages: string[] = [];
    let currentParas: string[] = [];
    let currentCount = 0;

    for (const para of paragraphs) {
      const wc = para.trim().split(/\s+/).length;
      if (currentCount > 0 && currentCount + wc > maxWords) {
        pages.push(currentParas.map((p) => `<p>${p.trim().replace(/\n/g, '<br />')}</p>`).join(''));
        currentParas = [para];
        currentCount = wc;
      } else {
        currentParas.push(para);
        currentCount += wc;
        if (currentCount >= minWords && currentCount >= targetWords) {
          pages.push(currentParas.map((p) => `<p>${p.trim().replace(/\n/g, '<br />')}</p>`).join(''));
          currentParas = [];
          currentCount = 0;
        }
      }
    }
    if (currentParas.length > 0) {
      pages.push(currentParas.map((p) => `<p>${p.trim().replace(/\n/g, '<br />')}</p>`).join(''));
    }
    return pages.length > 0 ? pages : [''];
  }

  // HTML path: split by block-level closing tags
  const chunks = content.match(/<p[^>]*>[\s\S]*?<\/p>|<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<blockquote[^>]*>[\s\S]*?<\/blockquote>|<br\s*\/?>/gi) ?? [];
  if (chunks.length === 0) return [content];

  const pages: string[] = [];
  let currentChunks: string[] = [];
  let currentCount = 0;

  for (const chunk of chunks) {
    const wc = stripTags(chunk).split(/\s+/).filter(Boolean).length;
    if (currentCount > 0 && currentCount + wc > maxWords) {
      pages.push(currentChunks.join(''));
      currentChunks = [chunk];
      currentCount = wc;
    } else {
      currentChunks.push(chunk);
      currentCount += wc;
      if (currentCount >= minWords && currentCount >= targetWords) {
        pages.push(currentChunks.join(''));
        currentChunks = [];
        currentCount = 0;
      }
    }
  }
  if (currentChunks.length > 0) {
    pages.push(currentChunks.join(''));
  }
  return pages.length > 0 ? pages : [content];
}
