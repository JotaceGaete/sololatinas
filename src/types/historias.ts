export type HistoriaEstado = 'draft' | 'revision' | 'publicada' | 'archivada';
export type CapituloEstado = 'draft' | 'revision' | 'publicado' | 'archivado';
export type MediaBlockTipo = 'image' | 'video';

export interface Historia {
  id: string;
  titulo: string;
  slug: string | null;
  descripcion: string | null;
  portada_url: string | null;
  autor_id: string | null;
  estado: HistoriaEstado;
  created_at: string;
  updated_at: string;
}

export interface HistoriaCapitulo {
  id: string;
  historia_id: string;
  numero: number;
  titulo: string;
  cuerpo_html: string | null;
  estado: CapituloEstado;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CapituloMediaBlock {
  id: string;
  capitulo_id: string;
  tipo: MediaBlockTipo;
  url: string;
  caption: string | null;
  position: number;
  created_at: string;
}

export interface HistoriaConCapitulos extends Historia {
  capitulos: HistoriaCapitulo[];
}
