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
  status: 'publicado' | 'borrador' | 'revision' | 'destacado' | 'archivado';
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

export const mockStories: Story[] = [
{
  id: 'story-001',
  title: 'La Noche del Jazmín',
  author: 'Valentina Ríos',
  authorId: 'author-001',
  country: 'Colombia',
  excerpt: 'Sus dedos rozaron los míos sobre el borde de la copa, y supe que esa noche cambiaría todo lo que creía saber sobre mí misma.',
  fullText: `Sus dedos rozaron los míos sobre el borde de la copa, y supe que esa noche cambiaría todo lo que creía saber sobre mí misma.

El jardín olía a jazmín y a tierra mojada después de la lluvia de la tarde. Bogotá siempre huele así después de llover: a promesas y a cosas que aún no tienen nombre. Él estaba de pie junto a la fuente, con esa manera suya de ocupar el espacio como si le perteneciera, y cuando me miró, no parpadeó.

—Pensé que no vendrías —dijo.

—Yo también lo pensé —respondí, y era verdad.

Había algo en su voz que hacía que las palabras perdieran su significado habitual y adquirieran uno nuevo, más íntimo, como si estuviéramos hablando en un idioma que solo existía entre nosotros dos. Era una de esas conversaciones que no necesitan principio ni final, que simplemente existen en el espacio entre dos personas que se están descubriendo.

La noche avanzó lenta, como avanzan las noches que no queremos que terminen. Hablamos de ciudades que nunca habíamos visitado juntos, de libros que nos habían roto el corazón de maneras distintas, de esa sensación extraña de reconocer a alguien que acabas de conocer. Él tenía la costumbre de inclinar la cabeza ligeramente hacia la izquierda cuando escuchaba, como si quisiera capturar cada palabra antes de que se la llevara el viento.

Le conté de mi infancia en Medellín, de las tardes en que mi abuela me leía poesía en voz alta mientras el aguacero golpeaba el techo de zinc. Él escuchó sin interrumpir, con esa atención que se ha vuelto tan rara en el mundo moderno, esa presencia completa que hace sentir que eres la única persona que existe en ese momento.

—Mi abuela también leía —dijo cuando terminé—. Pero ella prefería las cartas. Decía que las cartas eran la única forma honesta de hablar, porque cuando escribes no puedes esconderte detrás de una sonrisa.

Pensé en eso durante un momento. Pensé en todas las cartas que nunca había escrito, en todas las palabras que se habían quedado atrapadas en mi garganta por miedo o por orgullo o simplemente por no saber cómo empezar.

—¿Tú escribes cartas? —le pregunté.

—Solía hacerlo —respondió, y en su voz había algo que no era exactamente tristeza pero se le parecía—. Dejé de hacerlo cuando me di cuenta de que la persona a quien quería escribirle ya no estaba.

No pregunté más. Hay silencios que merecen ser respetados, espacios en la historia de alguien que no te pertenecen todavía, quizás nunca.

La luna había subido bastante cuando nos dimos cuenta de que llevábamos horas hablando. El jardín se había vaciado de otros invitados sin que ninguno de los dos lo notara. Solo quedaban las luces de las velas en los bordes de la fuente, el olor persistente del jazmín, y nosotros dos en ese rincón del mundo que parecía existir fuera del tiempo.

—Tengo hambre —dijo de repente, y la normalidad de esa frase después de tanta intensidad me hizo reír de verdad, con esa risa que sale del estómago y no del protocolo social.

Encontramos la cocina de la casa casi por accidente, siguiendo el olor a chocolate caliente que alguien había dejado en el fuego. Él preparó dos tazas con una familiaridad que me sorprendió, moviéndose por ese espacio ajeno como si lo conociera de siempre.

—¿Cómo sabes dónde está todo? —le pregunté.

—No lo sé —admitió—. Pero cuando no sabes dónde está algo, lo buscas hasta encontrarlo. Es una filosofía de vida bastante útil.

Bebimos el chocolate de pie, apoyados en el mesón de mármol frío, y en ese momento tan simple y tan doméstico sentí algo que no había sentido en mucho tiempo: la sensación de estar exactamente donde debía estar.

Cuando sus labios encontraron los míos, fue como recordar algo que nunca había olvidado. No fue un beso de película, con música de fondo y luz perfecta. Fue un beso real, con el sabor del chocolate y la torpeza de dos personas que están aprendiendo el idioma del otro. Fue mejor que cualquier beso de película.

Afuera, Bogotá seguía siendo Bogotá: ruidosa, impredecible, llena de historias que se cruzan sin saber que se están cruzando. Pero en esa cocina, en ese momento, el mundo era exactamente del tamaño de dos personas que acaban de encontrarse.

No sé cuánto tiempo pasamos así. El tiempo tiene esa costumbre de comportarse de manera diferente cuando estás feliz: se acelera cuando quisieras que se detuviera, y se detiene justo cuando más lo necesitas.

—Tengo que irme —dije finalmente, aunque ninguna parte de mí quería irse.

—Lo sé —respondió él, y no intentó convencerme de lo contrario. Eso también me gustó de él: que entendía que las despedidas tienen su propio ritmo y que forzarlas solo las hace más difíciles.

Me acompañó hasta la puerta del jardín. La ciudad estaba más tranquila ahora, con esa calma particular de las tres de la mañana cuando los que madrugan todavía no han salido y los que trasnocharon ya se fueron a casa.

—¿Puedo verte de nuevo? —preguntó.

Era una pregunta simple, directa, sin artificios. Me gustó eso también.

—Sí —respondí, con la misma simplicidad.

Caminé hacia el taxi que me esperaba sin mirar atrás, no porque no quisiera sino porque sabía que si lo hacía no podría irme. Y había algo hermoso en esa tensión, en ese deseo contenido, en la promesa implícita de un próximo encuentro.

En el taxi, con Bogotá pasando por la ventana como un sueño en movimiento, me di cuenta de que no había pensado en nada más durante toda la noche. Ni en el trabajo, ni en las preocupaciones que normalmente me acompañan a todas partes como sombras fieles. Solo había estado presente, completamente presente, de una manera que hacía mucho tiempo no experimentaba.

El jazmín seguía en mi ropa cuando llegué a casa. Me quedé dormida con ese olor, y soñé con jardines que no terminaban nunca y con conversaciones que no necesitaban llegar a ningún lado para tener sentido.

A la mañana siguiente, encontré un mensaje en mi teléfono. Solo decía: "El chocolate estaba bueno. La compañía, mejor."

Sonreí durante todo el desayuno.

Hay noches que cambian algo en ti de manera tan sutil que no te das cuenta hasta días después, cuando de repente ves el mundo con unos ojos ligeramente distintos y no puedes explicar exactamente cuándo ocurrió el cambio. La noche del jazmín fue una de esas noches para mí.

No fue el principio de una gran historia de amor, o quizás sí lo fue, pero eso no lo supe hasta mucho después. Fue simplemente una noche en que dos personas se encontraron en el momento exacto en que ambas necesitaban ser encontradas, y eso, a veces, es suficiente. A veces es todo.

Bogotá siguió oliendo a jazmín durante semanas después de esa noche, o quizás era yo quien lo llevaba conmigo a todas partes sin saberlo. Hay perfumes que se quedan pegados no en la ropa sino en la memoria, y ese es el tipo de perfume más difícil de olvidar.

Lo vi de nuevo, claro que sí. Y la segunda vez fue diferente a la primera, como siempre son diferentes los encuentros cuando ya no hay que presentarse, cuando ya existe entre dos personas ese territorio compartido de referencias y recuerdos y pequeñas historias que solo tienen sentido para ellos.

Pero eso es otra historia, para otra noche, con otro olor en el aire.

Esta historia termina aquí, en un taxi que cruza Bogotá a las tres de la mañana, con el sabor del chocolate en los labios y la certeza tranquila de que algo ha comenzado, aunque todavía no sepa exactamente qué.`,
  coverImage: "https://images.unsplash.com/photo-1660081693779-183b0cf1006c",
  tags: ['colombiana', 'pasión', 'noche', 'encuentro', 'romance', 'jazmín'],
  readingTime: 12,
  views: 28400,
  likes: 3210,
  isPremium: false,
  status: 'destacado',
  publishedAt: '2026-04-18',
  genre: 'Romance'
},
{
  id: 'story-002',
  title: 'Tequila y Medianoche',
  author: 'Isabella Moreno',
  authorId: 'author-002',
  country: 'México',
  excerpt: 'El mezcal ardía en mi garganta igual que sus palabras: con una dulzura que llegaba después del dolor, cuando ya era demasiado tarde para arrepentirse.',
  coverImage: "https://images.unsplash.com/photo-1660899149990-07a5355ce2ab",
  tags: ['mexicana', 'pasión', 'intimidad', 'noche', 'deseo', 'mezcal'],
  readingTime: 18,
  views: 41200,
  likes: 5670,
  isPremium: true,
  status: 'destacado',
  publishedAt: '2026-04-22',
  genre: 'Romance Erótico'
},
{
  id: 'story-003',
  title: 'Cartas desde Buenos Aires',
  author: 'Sofía Castellano',
  authorId: 'author-003',
  country: 'Argentina',
  excerpt: 'Escribir es la única forma de tocarte sin que nadie lo sepa. Cada carta era un secreto entre mi piel y el papel.',
  coverImage: "https://images.unsplash.com/photo-1712167959948-0c7e81aab961",
  tags: ['argentina', 'cartas', 'amor', 'secreto', 'literatura', 'melancolía'],
  readingTime: 22,
  views: 19800,
  likes: 2890,
  isPremium: false,
  status: 'publicado',
  publishedAt: '2026-04-15',
  genre: 'Romance Literario'
},
{
  id: 'story-004',
  title: 'El Último Verano en Sevilla',
  author: 'Carmen Ruiz',
  authorId: 'author-004',
  country: 'España',
  excerpt: 'Hay veranos que no terminan aunque el calendario insista en que sí. Aquel verano en Sevilla fue uno de esos: eterno, ardiente, imposible de olvidar.',
  coverImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1f9c957d1-1778168393815.png",
  tags: ['española', 'verano', 'pasión', 'flamenco', 'calor', 'amor'],
  readingTime: 15,
  views: 33700,
  likes: 4120,
  isPremium: true,
  status: 'publicado',
  publishedAt: '2026-04-10',
  genre: 'Romance'
},
{
  id: 'story-005',
  title: 'Lluvia en Caracas',
  author: 'Gabriela Montoya',
  authorId: 'author-005',
  country: 'Venezuela',
  excerpt: 'La lluvia en Caracas no avisa. Llega de golpe, como él llegó a mi vida: sin permiso, sin maletas, y con la intención de quedarse.',
  coverImage: "https://images.unsplash.com/photo-1513026220439-344933810315",
  tags: ['venezolana', 'lluvia', 'amor', 'encuentro', 'nostalgia'],
  readingTime: 10,
  views: 14200,
  likes: 1980,
  isPremium: false,
  status: 'publicado',
  publishedAt: '2026-04-28',
  genre: 'Romance'
},
{
  id: 'story-006',
  title: 'Vino Tinto en Santiago',
  author: 'Alejandra Pinto',
  authorId: 'author-006',
  country: 'Chile',
  excerpt: 'Él sabía de vinos lo que yo sabía de mentiras: todo. Y sin embargo, esa noche, ninguno de los dos quiso ser experto en nada.',
  coverImage: "https://images.unsplash.com/photo-1597506597091-d88249b6a6f7",
  tags: ['chilena', 'vino', 'pasión', 'noche', 'deseo', 'intimidad'],
  readingTime: 14,
  views: 22100,
  likes: 2760,
  isPremium: true,
  status: 'publicado',
  publishedAt: '2026-05-01',
  genre: 'Romance Erótico'
},
{
  id: 'story-007',
  title: 'Salsa y Secretos',
  author: 'Daniela Vargas',
  authorId: 'author-007',
  country: 'Colombia',
  excerpt: 'Bailar salsa con alguien es la conversación más honesta que puedes tener. El cuerpo no miente aunque la boca sí.',
  coverImage: "https://images.unsplash.com/photo-1624745292828-9933f3740635",
  tags: ['colombiana', 'salsa', 'baile', 'deseo', 'cuerpo', 'verdad'],
  readingTime: 9,
  views: 31500,
  likes: 4400,
  isPremium: false,
  status: 'publicado',
  publishedAt: '2026-05-03',
  genre: 'Romance'
},
{
  id: 'story-008',
  title: 'El Mar de Oaxaca',
  author: 'Mariana Flores',
  authorId: 'author-008',
  country: 'México',
  excerpt: 'El mar de Oaxaca guarda los secretos que el Pacífico se lleva. Yo le confié el nuestro una mañana de agosto que huele todavía a sal y a ti.',
  coverImage: "https://images.unsplash.com/photo-1629149043099-18be3e0164c2",
  tags: ['mexicana', 'mar', 'secreto', 'verano', 'amor', 'oaxaca'],
  readingTime: 16,
  views: 18900,
  likes: 2340,
  isPremium: false,
  status: 'publicado',
  publishedAt: '2026-04-25',
  genre: 'Romance Literario'
},
{
  id: 'story-009',
  title: 'Tango en el Fin del Mundo',
  author: 'Lucía Ferreyra',
  authorId: 'author-003',
  country: 'Argentina',
  excerpt: 'Hay un tango que se baila solo una vez en la vida. Cuando lo bailas, sabes que todo lo que vino antes era solo el ensayo.',
  coverImage: "https://images.unsplash.com/photo-1542401520-cc5c46fa5134",
  tags: ['argentina', 'tango', 'pasión', 'baile', 'único', 'destino'],
  readingTime: 20,
  views: 26300,
  likes: 3890,
  isPremium: true,
  status: 'publicado',
  publishedAt: '2026-04-12',
  genre: 'Romance'
},
{
  id: 'story-010',
  title: 'Café con Canela',
  author: 'Valentina Ríos',
  authorId: 'author-001',
  country: 'Colombia',
  excerpt: 'Cada mañana me preparaba el café con canela sin que yo se lo pidiera. Era su manera de decir lo que su orgullo no le dejaba pronunciar.',
  coverImage: "https://images.unsplash.com/photo-1652223733823-5c58d39bd191",
  tags: ['colombiana', 'café', 'amor', 'cotidiano', 'ternura', 'silencio'],
  readingTime: 8,
  views: 42600,
  likes: 6100,
  isPremium: false,
  status: 'destacado',
  publishedAt: '2026-05-05',
  genre: 'Romance'
},
{
  id: 'story-011',
  title: 'Medianoche en Lima',
  author: 'Rebeca Huanca',
  authorId: 'author-009',
  country: 'Perú',
  excerpt: 'Lima huele a océano y a pisco. Él olía a cedro y a algo que no tenía nombre. Lo busqué en todos los perfumes después.',
  coverImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1add37ffd-1767274531783.png",
  tags: ['peruana', 'lima', 'noche', 'olor', 'búsqueda', 'deseo'],
  readingTime: 11,
  views: 11400,
  likes: 1560,
  isPremium: false,
  status: 'publicado',
  publishedAt: '2026-05-02',
  genre: 'Romance'
},
{
  id: 'story-012',
  title: 'Fuego en Montevideo',
  author: 'Natalia Suárez',
  authorId: 'author-010',
  country: 'Uruguay',
  excerpt: 'Montevideo tiene la pausa que Montevideo quiere. Y en esa pausa, entre mate y silencio, aprendí que el deseo no necesita prisa.',
  coverImage: "https://images.unsplash.com/photo-1602393719268-10c0ad18d819",
  tags: ['uruguaya', 'mate', 'pausa', 'deseo', 'calma', 'intimidad'],
  readingTime: 13,
  views: 9800,
  likes: 1290,
  isPremium: true,
  status: 'revision',
  publishedAt: '2026-05-06',
  genre: 'Romance Literario'
}];


export const mockAuthors: Author[] = [
{
  id: 'author-001',
  name: 'Valentina Ríos',
  country: 'Colombia',
  bio: 'Escritora de Medellín con un estilo que mezcla el realismo mágico con el romance contemporáneo. Dos relatos en el top 10 de la plataforma.',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e5f3b827-1772482248018.png",
  storyCount: 24,
  followers: 8420,
  tags: ['romance', 'realismo mágico', 'colombia', 'naturaleza'],
  joinedAt: '2025-03-12',
  featured: true
},
{
  id: 'author-002',
  name: 'Isabella Moreno',
  country: 'México',
  bio: 'Desde la Ciudad de México, Isabella escribe sobre el deseo con una honestidad que incomoda y encanta a partes iguales.',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11e9fe8f3-1778168398028.png",
  storyCount: 18,
  followers: 12300,
  tags: ['erótico', 'urbano', 'méxico', 'contemporáneo'],
  joinedAt: '2025-01-08',
  featured: true
},
{
  id: 'author-003',
  name: 'Sofía Castellano',
  country: 'Argentina',
  bio: 'Porteña de corazón. Sus relatos tienen la melancolía del tango y la precisión del lunfardo. Ganadora del Premio Letras Latinas 2025.',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10d87018e-1763299899278.png",
  storyCount: 31,
  followers: 15700,
  tags: ['literario', 'tango', 'argentina', 'melancólico'],
  joinedAt: '2024-11-20',
  featured: true
},
{
  id: 'author-004',
  name: 'Carmen Ruiz',
  country: 'España',
  bio: 'Sevillana que escribe sobre el calor de Andalucía y los amores imposibles con una pluma que huele a azahar.',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1c8a8ba1d-1778168396811.png",
  storyCount: 14,
  followers: 6890,
  tags: ['española', 'flamenco', 'sensual', 'histórico'],
  joinedAt: '2025-05-14',
  featured: false
},
{
  id: 'author-005',
  name: 'Gabriela Montoya',
  country: 'Venezuela',
  bio: 'Sus palabras tienen la urgencia de quien escribe desde la distancia y la nostalgia de quien recuerda lo que ama.',
  avatar: "https://images.unsplash.com/photo-1542407932-6b61abfe5856",
  storyCount: 9,
  followers: 3240,
  tags: ['nostalgia', 'venezolana', 'diaspora', 'amor'],
  joinedAt: '2025-08-03',
  featured: false
},
{
  id: 'author-006',
  name: 'Alejandra Pinto',
  country: 'Chile',
  bio: 'Chilena que escribe con la precisión de los Andes y la pasión del vino del sur. Sus relatos son lentos, profundos e inevitables.',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1abc799d7-1778168393793.png",
  storyCount: 12,
  followers: 5110,
  tags: ['chilena', 'erótico', 'lento', 'vino'],
  joinedAt: '2025-04-22',
  featured: false
},
{
  id: 'author-007',
  name: 'Daniela Vargas',
  country: 'Colombia',
  bio: 'Caleña con ritmo en la escritura. Sus relatos se leen como se baila salsa: con el cuerpo, no con la cabeza.',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_134540b5e-1767811361352.png",
  storyCount: 16,
  followers: 7650,
  tags: ['salsa', 'colombia', 'cuerpo', 'ritmo'],
  joinedAt: '2025-02-17',
  featured: false
},
{
  id: 'author-008',
  name: 'Mariana Flores',
  country: 'México',
  bio: 'Oaxaqueña que mezcla la riqueza cultural de su tierra con historias de amor que saben a chocolate y a maíz tostado.',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a91735a5-1778168396469.png",
  storyCount: 11,
  followers: 4890,
  tags: ['oaxaca', 'cultural', 'sensorial', 'amor'],
  joinedAt: '2025-06-09',
  featured: false
}];


export const storyViewsData = [
{ date: '07 Abr', views: 3200, likes: 420 },
{ date: '09 Abr', views: 4100, likes: 530 },
{ date: '11 Abr', views: 3800, likes: 490 },
{ date: '13 Abr', views: 5200, likes: 680 },
{ date: '15 Abr', views: 4700, likes: 610 },
{ date: '17 Abr', views: 6100, likes: 790 },
{ date: '19 Abr', views: 5600, likes: 720 },
{ date: '21 Abr', views: 7300, likes: 940 },
{ date: '23 Abr', views: 6800, likes: 880 },
{ date: '25 Abr', views: 8200, likes: 1060 },
{ date: '27 Abr', views: 7600, likes: 980 },
{ date: '29 Abr', views: 9100, likes: 1180 },
{ date: '01 May', views: 8700, likes: 1120 },
{ date: '03 May', views: 10200, likes: 1320 },
{ date: '05 May', views: 9800, likes: 1270 },
{ date: '07 May', views: 11400, likes: 1480 }];


export const storiesByCountryData = [
{ country: 'Colombia', count: 48, color: 'var(--primary)' },
{ country: 'México', count: 41, color: 'var(--accent)' },
{ country: 'Argentina', count: 35, color: 'var(--terracotta)' },
{ country: 'España', count: 22, color: 'var(--gold-light)' },
{ country: 'Venezuela', count: 14, color: 'var(--muted-foreground)' },
{ country: 'Chile', count: 18, color: 'var(--rose-soft)' }];


export const genreData = [
{ name: 'Romance', value: 45, fill: 'var(--primary)' },
{ name: 'Romance Erótico', value: 28, fill: 'var(--accent)' },
{ name: 'Literario', value: 17, fill: 'var(--terracotta)' },
{ name: 'Histórico', value: 10, fill: 'var(--muted-foreground)' }];