# Vocablo · Adivina la palabra

Juego web de palabras al estilo Wordle: adivina la palabra oculta de **5 letras** en **6 intentos**. Hay una palabra nueva cada día y es la misma para todo el mundo.

- Español e inglés, con cambio de idioma desde la bandera.
- Sin dependencias, sin build y sin variables de entorno.
- Listo para desplegar en Vercel tal cual.

## Cómo se juega

1. Escribe una palabra de 5 letras y pulsa **Enter**.
2. Cada letra se colorea:
   - **Verde**: está en la palabra y en la posición correcta.
   - **Amarillo**: está en la palabra, pero en otra posición.
   - **Gris**: no está en la palabra.
3. Cuando aciertas o gastas los 6 intentos, aparece el icono de compartir y el de reiniciar.

La palabra cambia a las **00:00 (Europe/Madrid)**. Mientras la página esté abierta se comprueba cada 30 segundos y se recarga sola al cambiar el día.

## Funciones

- **Palabra diaria compartida**: se calcula en el servidor a partir de la fecha, así que todos reciben la misma.
- **Idioma ES/EN**: el botón de la bandera muestra el idioma actual; al pulsarlo se cambia de idioma y de palabra.
- **Tema claro/oscuro**: se guarda en `localStorage` y respeta la preferencia del sistema si no hay nada guardado.
- **Reiniciar**: icono que aparece solo al terminar la partida (acierto o intentos agotados).
- **Compartir**: WhatsApp, Telegram o copiar al portapapeles, con el resultado en emojis (🟩🟨⬛) y la puntuación (`N/6` o `X/6`).
- **Accesibilidad**: tablero y teclado con etiquetas ARIA, navegación con teclado físico y respeto a `prefers-reduced-motion`.

## Estructura

```
index.html        Estructura de la página
styles.css        Estilos, temas y animaciones
juego.js          Lógica del juego, idioma, tablero y compartir
api/palabra.js    Función serverless que devuelve la palabra del día
```

## API de la palabra del día

```
GET /api/palabra?lang=es
GET /api/palabra?lang=en
```

Respuesta:

```json
{
  "lang": "es",
  "date": "2026-10-24",
  "word": "PERRO",
  "source": "internet",
  "total": 1567
}
```

- `lang`: `es` o `en`. Cualquier otro valor devuelve `400`.
- `date`: día natural en `Europe/Madrid`, calculado siempre en el servidor.
- `source`: `internet` o `respaldo` si no se pudieron descargar las listas.
- El parámetro opcional `d=YYYY-MM-DD` solo se usa como clave de caché de la CDN; la fecha real la decide el servidor.
- La respuesta se cachea en el CDN durante 24 h (`s-maxage=86400`).

### Fuentes de las palabras

- **Español**: intersección del [diccionario español](https://github.com/JorgeDuenasLerin/diccionario-espanol-txt) con las [50 000 palabras más frecuentes](https://github.com/hermitdave/FrequencyWords) → 1 567 palabras de 5 letras.
- **Inglés**: [lista de Wordle de tabatkins](https://github.com/tabatkins/wordle-list) → 14 855 palabras de 5 letras.
- Cada lista se descarga una vez y se mantiene en memoria 6 h.
- Si internet falla, se usa una lista corta de respaldo para que el juego nunca se quede sin palabra.

La palabra se elige con un hash de `idioma:AAAA-MM-DD`, de modo que es determinista y no necesita base de datos.

## Validación de palabras

Antes de aceptar un intento se consulta el Wikcionario (`es.wiktionary.org` o `en.wiktionary.org`), incluyendo variantes con tilde y `ñ` en español. Si esa consulta falla por red, **la palabra se acepta** para no bloquear la partida.

Si `/api/palabra` no responde, el cliente descarga las listas directamente desde GitHub y calcula la palabra con el mismo algoritmo.

## Desarrollo local

La forma recomendada, porque ejecuta también la función serverless:

```bash
npx vercel dev
```

Con un servidor estático cualquiera la página funciona igual, pero `/api/palabra` no existirá y el cliente usará la descarga directa de las listas.

## Despliegue en Vercel

1. **Add New → Project → Import Git Repository** y elige este repositorio.
2. Framework Preset: **Other**.
3. Build Command: **vacío**.
4. Output Directory: **vacío**.
5. **Deploy**.

No hay variables de entorno ni pasos de compilación.

Comprobación rápida tras el despliegue:

```
https://TU-PROYECTO.vercel.app/api/palabra?lang=es
https://TU-PROYECTO.vercel.app/api/palabra?lang=en
```

## Privacidad

Sin analítica, sin cookies y sin cuentas. Solo se guardan en `localStorage` el tema (`cinco-theme`) y el idioma (`cinco-lang`).
