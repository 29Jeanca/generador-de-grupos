# Generador de Grupos — FWD Costa Rica

Aplicación web (Vite + React) para armar grupos de estudiantes: automático (ordenado o
aleatorio, por cantidad de grupos o por tamaño de grupo) y con ajuste manual arrastrando o
tocando a los estudiantes entre grupos. Soporta restricciones de "no pueden ir juntos" y
maneja varios grupos/cursos (por ejemplo Desamparados y Puntarenas) desde una pantalla de
selección inicial.

Todo corre 100% en el navegador — no hay backend ni base de datos. Los datos se guardan en
`localStorage`, así que quedan disponibles la próxima vez que abrís la página en el mismo
navegador.

## Usarlo ya compilado (sin instalar nada)

Esta carpeta ya incluye una carpeta `dist/` compilada y lista para usar. La forma más rápida:

- Abrí la carpeta `dist/` con **Live Server** en VS Code (clic derecho sobre `dist/index.html`
  → "Open with Live Server") — la misma herramienta que usás con tus estudiantes.
- O corré cualquier servidor estático simple desde la carpeta `dist/`, por ejemplo:
  `npx serve dist` (te va a pedir instalar el paquete `serve` la primera vez).
- No abras `dist/index.html` haciendo doble clic directamente en el navegador — algunos
  navegadores bloquean módulos de JavaScript cargados así (`file://`); necesita un servidor
  local, aunque sea uno simple.

## Seguir editando el código fuente

Si más adelante querés modificar algo (colores, textos, funcionalidades), necesitás
[Node.js](https://nodejs.org/) instalado (18 o más reciente):

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (normalmente `http://localhost:5173`).

Para volver a generar la versión compilada después de editar:

```bash
npm run build
```

Esto regenera la carpeta `dist/` con los archivos estáticos listos para usar o publicar en
cualquier hosting (Netlify, Vercel, GitHub Pages, un servidor propio, etc.). También podés
revisar el resultado localmente con:

```bash
npm run preview
```

## Estructura del proyecto

```
src/
  App.jsx                     Estado principal, persistencia y navegación
  components/
    CourseLanding.jsx         Pantalla inicial: elegir o crear un grupo/curso
    CourseEditor.jsx          Lista de estudiantes, configuración, resultados
    GroupCard.jsx             Tarjeta de un grupo (o de "sin asignar")
    ConstraintsPanel.jsx      Gestión de restricciones "no pueden ir juntos"
  lib/
    grouping.js                Algoritmos de reparto y resolución de restricciones
    storage.js                  Guardar/leer localStorage
    supabaseClient.js           Cliente de Supabase (ver sección "Supabase" abajo)
    defaultCourses.js           Datos iniciales (Desamparados y Puntarenas)
  styles/
    global.css                  Sistema de diseño institucional FWD
.env.example                    Plantilla de variables de entorno de Supabase
```

## Funcionalidades

- **Selector de grupos**: pantalla inicial con tarjetas por cada grupo/curso guardado, más
  una tarjeta para crear uno nuevo (nombre + pegar lista de estudiantes).
- **Lista editable**: agregar un nombre suelto o pegar varios de una vez, quitar estudiantes.
- **Dos formas de dividir**: por cantidad de grupos, o por tamaño de grupo (en pasos de 2,
  pensado para trabajo en parejas).
- **Dos modos de reparto**: ordenado (siempre igual) o aleatorio.
- **Restricciones**: marcá pares de estudiantes que no pueden quedar en el mismo grupo. El
  generador automático intenta resolverlas moviendo estudiantes entre grupos; los ajustes
  manuales que violarían una restricción quedan bloqueados.
- **Ajuste manual**: arrastrar y soltar entre tarjetas de grupo, o tocar un nombre y luego
  tocar el grupo destino (funciona igual en computadora y celular).
- **Exportar**: imprimir, descargar como `.txt`, o copiar al portapapeles.
- **Persistente**: todo (lista, configuración, grupos armados, restricciones) se guarda
  automáticamente en el navegador.

## Supabase

La app puede guardar los cursos en [Supabase](https://supabase.com) en vez de (o además de)
`localStorage`, para que los datos persistan entre navegadores/dispositivos. Mientras no haya
credenciales configuradas, sigue funcionando 100% local como antes — no hace falta Supabase
para usar la app.

### 1. Crear la tabla

En el dashboard de tu proyecto → **SQL Editor → New query**, pegá y ejecutá el contenido de
[`db/schema.sql`](db/schema.sql). Esto crea la tabla `courses` (cada curso se guarda completo
como un bloque JSON, igual que en `localStorage`) y sus políticas de acceso.

> Nota de seguridad: como la app no tiene pantalla de login, usa la *anon key* directo desde
> el navegador con políticas abiertas — cualquiera con esa key (pública, queda en el bundle)
> puede leer y escribir. Está bien para uso personal/interno; si esto se comparte más
> ampliamente, hay que agregar Supabase Auth y ajustar las políticas en `db/schema.sql`.

### 2. Configurar las credenciales

1. Copiá `.env.example` a `.env.local`.
2. En **Project Settings → API** copiá:
   - **Project URL** → `VITE_SUPABASE_URL`.
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`.
3. Reiniciá `npm run dev`.

### 3. Verificar que quedó conectado

Con el server corriendo, abrí la consola del navegador: si falta alguna variable vas a ver un
`console.warn` de `[supabase]`. Si no aparece nada, creá o editá un grupo y revisá en
**Table Editor → courses** del dashboard que la fila aparezca/actualice.

### Cómo funciona

- `src/lib/supabaseClient.js`: crea el cliente. Expone `supabase` (o `null` si faltan
  credenciales) y `isSupabaseConfigured`.
- `src/lib/storage.js`: si `isSupabaseConfigured` es `true`, `App.jsx` lee/escribe los cursos
  en Supabase (con una copia de respaldo en `localStorage` por si se pierde la conexión); si es
  `false`, usa solo `localStorage` como hasta ahora. El curso seleccionado (a qué pantalla
  volver) siempre vive en `localStorage`, sea cual sea el modo.
- La primera vez que se conecta a un proyecto de Supabase vacío, la app siembra
  automáticamente los cursos por defecto (Desamparados y Puntarenas).

`.env.local` está en `.gitignore`, así que las credenciales reales nunca se suben al
repositorio; solo `.env.example` (vacío) queda versionado como referencia.

## Cambiar la paleta de colores o la tipografía

Todos los tokens de diseño (colores, fuente) están al inicio de `src/styles/global.css` en
`:root`. Cambiando esas variables se actualiza toda la app de forma consistente.
