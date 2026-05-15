import type { Capitulo, Story } from './types';

export const INITIAL_STORY_CHAPTER_ID_PREFIX = 'story-initial:';

export function buildInitialStoryChapter(story: Story): Capitulo | null {
  const cuerpo = story.fullText?.trim() ?? '';
  if (!cuerpo) return null;

  return {
    id: `${INITIAL_STORY_CHAPTER_ID_PREFIX}${story.id}`,
    relatoId: story.id,
    numero: 1,
    titulo: story.title,
    cuerpo,
    extracto: story.excerpt,
    publishedAt: story.publishedAt,
    createdAt: story.publishedAt,
    mediaBlocks: [],
  };
}

export function shiftStoredChaptersAfterInitial(capitulos: Capitulo[]): Capitulo[] {
  return capitulos.map((capitulo) => ({
    ...capitulo,
    numero: capitulo.numero + 1,
  }));
}

export function isInitialStoryChapter(capitulo: Pick<Capitulo, 'id'>): boolean {
  return capitulo.id.startsWith(INITIAL_STORY_CHAPTER_ID_PREFIX);
}
