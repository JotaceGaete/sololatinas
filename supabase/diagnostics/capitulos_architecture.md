# Arquitectura de Relatos con Capítulos — Diagnóstico

## Estado actual (auditoría 2026-05-13)

### Tablas existentes antes de esta migración
| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `relatos` | Historia única (contenido en `cuerpo`) | ✅ Funcionando |
| `story_comments` | Comentarios por relato | ✅ Funcionando |
| `story_reactions` | Reacciones por relato | ✅ Funcionando |
| `user_profiles` | Perfiles de autoras | ✅ Funcionando |
| `historia_capitulos` | Capítulos de una historia | ❌ No existía |
| `capitulo_media_blocks` | Media por capítulo | ❌ No existía |

### Rutas existentes antes de esta migración
| Ruta | Descripción |
|------|-------------|
| `/immersive-reading-mode?id={uuid}` | Lectura de relato único (paginado por palabras) |
| `/stories-library` | Biblioteca pública |
| `/mis-relatos` | Panel de la autora |
| `/admin-panel` | Moderación |
| `/escribir-relato` | Editor de relato |

### Rutas nuevas (por implementar)
| Ruta | Descripción |
|------|-------------|
| `/historia/[slug]` | Portada + índice de capítulos (o redirect si no tiene) |
| `/historia/[slug]/capitulo/[numero]` | Lectura de un capítulo específico |

---

## Modelo de datos propuesto

```
relatos (entidad principal visible)
  └── historia_capitulos[] (capítulos ordenados por numero)
        └── capitulo_media_blocks[] (media embebida por capítulo)
```

### Regla de fallback
- `relatos.cuerpo` vacío + capítulos → mostrar índice de capítulos
- `relatos.cuerpo` con contenido + sin capítulos → paginación automática (comportamiento actual)
- `relatos.cuerpo` con contenido + con capítulos → el cuerpo actúa como "Prólogo" (capítulo 0 implícito)

---

## Flujo de lectura

```
/historia/[slug]
  ├── has_chapters = true  → ChapterIndexPage (lista de capítulos)
  └── has_chapters = false → redirect /immersive-reading-mode?id={id}
                             (mantiene compatibilidad total)

/historia/[slug]/capitulo/[numero]
  └── ChapterReaderPage
        ├── renders chapter.cuerpo via renderStoryHtml()
        ├── media blocks antes/durante/después del texto
        ├── paginación interna si chapter.cuerpo > 1500 palabras
        └── navegación prev/next chapter
```

---

## Columnas nuevas en `relatos`
- `slug TEXT UNIQUE` — para rutas amigables `/historia/[slug]`

---

## Commits de implementación planeados

1. `chore: audit historias capitulos schema and reading flow` ← este
2. `feat: add chapter types mappers and supabase queries`
3. `feat: add /historia/[slug] index and chapter reader routes`
4. `feat: update immersive reader to detect chapters`
5. `feat: add chapter management to escribir-relato and admin`
