export type StoryStatus = 'borrador' | 'revision' | 'publicado' | 'destacado' | 'archivado';

export const STORY_STATUS = {
  draft: 'borrador',
  revision: 'revision',
  published: 'publicado',
  featured: 'destacado',
  archived: 'archivado',
} as const;

export const PUBLIC_STORY_STATUSES: StoryStatus[] = [
  STORY_STATUS.published,
  STORY_STATUS.featured,
];

export interface Story {
  id: string;
  slug: string;
  title: string;
  author: string;
  authorId: string;
  country: string;
  excerpt: string;
  fullText?: string;
  coverImage: string;
  tags: string[];
  readingTime: number;
  views: number;
  likes: number;
  isPremium: boolean;
  status: StoryStatus;
  publishedAt: string;
  genre: string;
  hasChapters?: boolean;
}

export interface Author {
  id: string;
  name: string;
  country: string;
  bio: string;
  avatar: string;
  storyCount: number;
  followers: number;
  tags: string[];
  joinedAt: string;
  featured: boolean;
}

export type MediaBlockType = 'imagen' | 'video' | 'audio' | 'separador';

export interface CapituloMediaBlock {
  id: string;
  capituloId: string;
  tipo: MediaBlockType;
  url: string;
  alt: string;
  caption: string;
  posicion: number;
}

export interface Capitulo {
  id: string;
  relatoId: string;
  numero: number;
  titulo: string;
  cuerpo: string;
  extracto: string;
  publishedAt: string | null;
  createdAt: string;
  mediaBlocks?: CapituloMediaBlock[];
}
