# 🎲 WhereIsMySUPER-Ficha — ROADMAP

> Generador de fichas de roleplay narrativo (estilo Discord).  
> Stack: **Vite + Alpine.js + Tailwind CSS + idb-keyval**

---

## Fase 0 — Configuración Inicial

- [x] Inicializar proyecto Vite
- [x] Configurar Tailwind CSS (paleta, tipografías)
- [x] Agregar dependencias (Alpine.js, idb-keyval, anime.js, Lucide)
- [x] Crear `index.html` con fonts y contenedor `#app`
- [x] Crear este ROADMAP

---

## Fase 1 — Estado Global y Dashboard Multipersonaje

- [x] Definir store Alpine.js global (`Alpine.store('app', {...})` + `Alpine.store('characters', {...})`)
- [x] Modelo de datos del personaje (schema JSON en `store/characters.js`)
- [x] Persistencia con `idb-keyval` (guardar/cargar/eliminar con prefijo `wimsf_char_`)
- [x] Dashboard: grid de tarjetas de personajes existentes (modal)
- [x] Botón "Nuevo Personaje" con valores por defecto
- [x] Confirmación de eliminación de personaje (dialog de confirmación)
- [x] Duplicar personaje existente
- [x] Renombrar personaje (dialog inline)
- [x] Auto-guardado con debounce 800ms

---

## Fase 2 — Layout Base y Sidebar de Pestañas

- [x] Layout principal: CSS Grid (header / sidebar / content) — sidebar fija + área scrollable
- [x] Sidebar con lista de pestañas (tabs) con iconos Lucide
- [x] Sistema de pestañas removibles (botón ✕ por pestaña) y menú [+ Añadir pestaña]
- [x] Indicador visual de pestaña activa (borde gold + fondo)
- [x] Transiciones de entrada/salida entre pestañas (anime.js — fade + translateY)
- [ ] Responsive: sidebar colapsable en móvil _(pendiente)_

---

## Fase 3 — Pestañas de Formulario

### 3.1 — Datos Básicos
- [x] Nombre completo, apodo/alias/títulos, edad real y aparente, género y pronombres
- [x] Avatar / imagen de referencia (carga local única File API + preview + eliminación)
- [x] Edad, raza/especie, orientación, clase/rol
- [x] Alineamiento moral (selector `<select>` con las 9 alineaciones D&D)

### 3.2 — Cuerpo
- [x] Descripción física narrativa
- [x] Estatura & peso / complexión
- [x] Marcas distintivas / cicatrices / tatuajes, estilo de vestir e indumentaria
- [x] Campos independientes para ojos, cabello y piel

### 3.3 — Mente
- [x] Resumen de personalidad
- [x] MBTI / arquetipo psicológico
- [x] Virtudes y rasgos positivos
- [x] Defectos y rasgos negativos
- [x] Fobias, traumas y puntos débiles emocionales

### 3.4 — Social
- [x] Afiliación / bando / facción
- [x] Estatus social / reputación
- [x] Lugar de origen & residencia actual
- [x] Matriz de relaciones (módulo dinámico repetible con nombre, vínculo y descripción + botón eliminar)

### 3.5 — Creencias
- [x] Código moral / filosofía
- [x] Religión / fe / dogma
- [x] Lo que ama / valora y lo que odia / detesta
- [x] Línea roja / imposible moral
- [x] Visión del mundo / perspectiva y supersticiones / creencias menores

### 3.6 — Prioridades
- [x] Objetivo principal y objetivos secundarios
- [x] Mayor temor / lo que intenta evitar
- [x] Motivación profunda y conflicto actual
- [x] Lealtad máxima y línea de sacrificio

---

## Fase 4 — Módulo de Habilidades

- [x] Lista de habilidades activas (nombre, descripción, cooldown, duración, coste)
- [x] Lista de habilidades pasivas (condición de activación)
- [x] Carga de imagen/GIF por habilidad (File API + preview; GIF animado en app, frame estático en PDF)
- [x] Compresion de imagenes de habilidad (Canvas → WebP via imageCompressor.js)
- [x] Selector tipo Activa/Pasiva por tarjeta con campos condicionales
- [x] Aviso visual de GIF en modo PDF
- [x] TD/CD automático como 'Permanente' para habilidades pasivas

---

## Fase 5 — Pestaña Extras y Compresión Canvas

- [x] Campo de notas libres (Notas de Rol)
- [x] Galería de imágenes adicionales (máx. 5 imágenes con preview)
- [x] Compresión automática de imágenes a WebP (max 1080px) — `utils/imageCompressor.js`
- [x] Preview de imágenes comprimidas con badge de tamaño (KB)
- [x] Clase del personaje (selector con 90+ clases)
- [x] Voz y referencia auditiva (actor de voz + enlace YouTube/SoundCloud)
- [x] Curiosidades, Playlist, Gustos secundarios y Notas de rol
- [x] Avatar y galeria usan compresor Canvas → WebP automáticamente

---

## Fase 6 — Motores de Exportación

### 6.1 — PDF (`@media print`)
- [x] Hoja de estilos de impresion dedicada (`@media print` en style.css)
- [x] Layout de ficha optimizado para A4 / Letter (bloque simple, tarjetas break-inside: avoid)
- [x] Boton "Exportar PDF" en header que lanza `window.print()` (con cambio a modo lectura)
- [x] Ocultar UI de edicion en modo print (`.no-print`, sidebar, header, botones, toasts)

### 6.2 — TXT Discord (≤ 2000 chars)
- [x] Template de texto plano con formato Discord (negritas, iconos, separadores)
- [x] Division automatica en bloques de ≤ 2000 chars sin cortar palabras ni lineas
- [x] Modal de exportacion con bloques numerados y contador de caracteres
- [x] Boton "Copiar bloque" por seccion (Clipboard API) con Toast de confirmacion
- [x] Barra de progreso visual por bloque
- [x] Boton "Copiar todos" los bloques de una vez

### 6.3 — Backup JSON
- [x] Exportar personaje activo como `.json` (Blob API + descarga automatica)
- [x] Importar personaje desde archivo `.json` (FileReader API + rehidratacion IndexedDB)
- [x] Validacion del schema al importar (campo `name` requerido, nuevo ID asignado)
- [x] Boton de importar y exportar en el header de la aplicacion

---

## Fase 7 — Modos Lectura/Edición y Notificaciones Toast

- [x] Toggle global Lectura ↔ Edición (header mode-toggle)
- [x] En modo lectura: campos como texto estático con tarjeta estéticas formateadas listas para lectura
- [x] En modo edición: inputs, textareas, selects y controles interactivos
- [x] Sistema de notificaciones toast con Alpine.js + CSS transitions
- [x] Tipos: éxito, error, info, advertencia
- [x] Auto-dismiss 3 s (configurable por llamada)
- [x] Posición: esquina inferior derecha (`#toast-region`)

---

## Fase 8 — Pulido Final

- [x] Accesibilidad (ARIA labels, roles, focus management en modales y botones)
- [x] Atajos de teclado (Escape para cerrar modales)
- [x] Animaciones de micro-interaccion (hover effects, transiciones entre pestanas con anime.js)
- [x] Exportacion PDF con layout de impresion elegante
- [x] Exportacion Discord con vista previa y copia por bloques
- [x] Backup y recuperacion JSON con validacion de schema
- [x] README / ROADMAP actualizado y completo

---

> **Nota**: Proyecto 100% funcional en modo local.  
> Stack: Vite + Alpine.js + Tailwind CSS + idb-keyval
