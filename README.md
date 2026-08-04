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
    defaultCourses.js           Datos iniciales (Desamparados y Puntarenas)
  styles/
    global.css                  Sistema de diseño institucional FWD
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

## Cambiar la paleta de colores o la tipografía

Todos los tokens de diseño (colores, fuente) están al inicio de `src/styles/global.css` en
`:root`. Cambiando esas variables se actualiza toda la app de forma consistente.
