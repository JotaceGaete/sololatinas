import sanitizeHtml from 'sanitize-html';

export type RelatoImageFields = {
  portada_url?: string | null;
  cover_image_url?: string | null;
  imagen_url?: string | null;
};

export function getRelatoImageUrl(relato: RelatoImageFields): string {
  return (
    relato.portada_url?.trim() ||
    relato.cover_image_url?.trim() ||
    relato.imagen_url?.trim() ||
    ''
  );
}

export function sanitizeStoryHtml(input?: string | null): string {
  return sanitizeHtml(input ?? '', {
    allowedTags: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'blockquote',
      'ul',
      'ol',
      'li',
      'h2',
      'h3',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      p: ['dir'],
      blockquote: ['dir'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  });
}

export function htmlToPlainText(input?: string | null): string {
  return sanitizeHtml(input ?? '', {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/\s+/g, ' ').trim();
}
