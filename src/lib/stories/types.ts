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
