/* Palabra del día de "Adivina la palabra".

   Ruta: GET /api/palabra?lang=es|en&d=YYYY-MM-DD

   - La palabra se elige de forma determinista a partir del día natural en
     Europe/Madrid, así que todo el mundo recibe la misma palabra y cambia
     automáticamente a las 00:00.
   - Las listas se descargan de internet (GitHub) la primera vez que se usa
     cada idioma y se mantienen en memoria mientras la función siga viva.
   - El parámetro "d" solo sirve para que la CDN de Vercel guarde una copia
     distinta por día; la fecha real la decide siempre el servidor.
   - Si internet falla, se usa una lista corta de respaldo para que el juego
     no se quede sin palabra.

   Este archivo funciona tanto en Vercel (Node) como en servidor.js, porque
   solo usa las APIs estándar de http.ServerResponse.
*/

"use strict";

const ZONA_HORARIA = "Europe/Madrid";
const TIEMPO_MAXIMO_DESCARGA_MS = 8000;
const REINTENTO_TRAS_FALLO_MS = 5 * 60 * 1000;
const CACHE_LISTA_MS = 6 * 60 * 60 * 1000;

const FUENTES = {
  es: [
    {
      url: "https://raw.githubusercontent.com/JorgeDuenasLerin/diccionario-espanol-txt/master/data/allwords.txt",
      codificacion: "windows-1252"
    },
    {
      url: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt",
      codificacion: "utf-8"
    }
  ],
  en: [
    {
      url: "https://raw.githubusercontent.com/tabatkins/wordle-list/main/words",
      codificacion: "utf-8"
    }
  ]
};

const RESPALDO = {
  es: [
    "ABEJA", "AGUJA", "ARENA", "AVION", "BANCO", "BARCO", "CABRA", "CALLE",
    "CAMPO", "CARTA", "CIELO", "COFRE", "CORAL", "DULCE", "ENERO", "FAROL",
    "FUEGO", "GLOBO", "HECHO", "HIELO", "HUEVO", "JAMON", "LECHE", "LIBRO",
    "LUCHA", "LLAVE", "MADRE", "MANGO", "MARES", "MUNDO", "NIEVE", "NOCHE",
    "NUBES", "OASIS", "ORDEN", "PADRE", "PANES", "PERRO", "PIANO", "PLAYA",
    "PLUMA", "POLLO", "QUESO", "RADIO", "RATON", "REINA", "RELOJ", "RUEDA",
    "SABOR", "SALUD", "TARDE", "TIGRE", "TRENO", "VERDE", "VIENTO", "ZORRO"
  ],
  en: [
    "APPLE", "BEACH", "BREAD", "BRAIN", "CHAIR", "CHESS", "CLOUD", "DANCE",
    "DREAM", "EARTH", "FIELD", "FLAME", "FRUIT", "GHOST", "GRASS", "GREEN",
    "HEART", "HOUSE", "HUMAN", "LIGHT", "LEMON", "MONEY", "MUSIC", "NIGHT",
    "OCEAN", "PAINT", "PEACE", "PLANT", "PLATE", "POINT", "POWER", "QUEEN",
    "RIVER", "ROBOT", "SHEEP", "SMILE", "SNAKE", "SPACE", "SPORT", "STONE",
    "STORM", "SUGAR", "TABLE", "TIGER", "TRAIN", "TRUTH", "WATER", "WORLD"
  ]
};

const cacheListas = new Map();

function limpiarPalabra(texto) {
  return String(texto)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function esPalabraValida(palabra) {
  return /^[A-Z]{5}$/.test(palabra);
}

async function descargarTexto(fuente) {
  const controlador = new AbortController();
  const temporizador = setTimeout(
    () => controlador.abort(),
    TIEMPO_MAXIMO_DESCARGA_MS
  );

  try {
    const respuesta = await fetch(fuente.url, {
      signal: controlador.signal,
      headers: { "User-Agent": "adivina-la-palabra/1.0" }
    });

    if (!respuesta.ok) {
      throw new Error("HTTP " + respuesta.status + " al descargar " + fuente.url);
    }

    const buffer = await respuesta.arrayBuffer();
    return new TextDecoder(fuente.codificacion).decode(buffer);
  } finally {
    clearTimeout(temporizador);
  }
}

function palabrasUnicas(texto) {
  const encontradas = new Set();

  for (const linea of texto.split(/\r?\n/)) {
    const palabra = limpiarPalabra(linea);
    if (esPalabraValida(palabra)) {
      encontradas.add(palabra);
    }
  }

  return [...encontradas];
}

async function descargarLista(idioma) {
  if (idioma === "es") {
    const [diccionario, frecuencia] = await Promise.all(
      FUENTES.es.map((fuente) => descargarTexto(fuente))
    );

    const validas = new Set(palabrasUnicas(diccionario));
    const comunes = new Set();

    for (const linea of frecuencia.split(/\r?\n/)) {
      const palabra = limpiarPalabra(linea.split(/\s+/)[0] || "");
      if (validas.has(palabra)) {
        comunes.add(palabra);
      }
    }

    if (comunes.size >= 100) {
      return { palabras: [...comunes], origen: "internet" };
    }

    if (validas.size > 0) {
      return { palabras: [...validas], origen: "internet" };
    }

    throw new Error("La lista de español llegó vacía.");
  }

  const texto = await descargarTexto(FUENTES.en[0]);
  const palabras = palabrasUnicas(texto);

  if (palabras.length === 0) {
    throw new Error("La lista de inglés llegó vacía.");
  }

  return { palabras, origen: "internet" };
}

function obtenerLista(idioma) {
  const ahora = Date.now();
  const entrada = cacheListas.get(idioma);

  if (entrada && ahora < entrada.expira) {
    return entrada.promesa;
  }

  const promesa = descargarLista(idioma)
    .catch((error) => {
      console.error(
        "No se pudo descargar la lista de " + idioma + "; se usa la de respaldo:",
        error.message
      );
      return {
        palabras: RESPALDO[idioma],
        origen: "respaldo"
      };
    })
    .then((resultado) => {
      const actual = cacheListas.get(idioma);
      if (actual && actual.promesa === promesa) {
        actual.expira =
          Date.now() +
          (resultado.origen === "internet" ? CACHE_LISTA_MS : REINTENTO_TRAS_FALLO_MS);
      }
      return resultado;
    });

  // 30 s de margen para que varias peticiones simultáneas compartan la descarga.
  cacheListas.set(idioma, { promesa, expira: ahora + 30000 });
  return promesa;
}

function claveDiaMadrid(fecha) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(fecha || new Date());

  const valores = {};
  for (const parte of partes) {
    if (parte.type !== "literal") {
      valores[parte.type] = parte.value;
    }
  }

  return valores.year + "-" + valores.month + "-" + valores.day;
}

function hash(texto) {
  let valor = 0x811c9dc5;

  for (let i = 0; i < texto.length; i++) {
    valor ^= texto.charCodeAt(i);
    valor = Math.imul(valor, 0x01000193);
  }

  return valor >>> 0;
}

function responderJson(res, estado, datos) {
  res.statusCode = estado;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(datos));
}

module.exports = async function handler(req, res) {
  let url;

  try {
    url = new URL(req.url, "http://localhost");
  } catch (error) {
    responderJson(res, 400, { error: "Petición inválida." });
    return;
  }

  const idioma = (url.searchParams.get("lang") || "es").toLowerCase();

  if (!Object.prototype.hasOwnProperty.call(FUENTES, idioma)) {
    responderJson(res, 400, { error: "Idioma no soportado. Usa es o en." });
    return;
  }

  try {
    const lista = await obtenerLista(idioma);
    const dia = claveDiaMadrid();
    const indice = hash(idioma + ":" + dia) % lista.palabras.length;

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // Una copia por día en el CDN de Vercel: la palabra cambia a las 00:00.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=86400, stale-while-revalidate=3600"
    );
    res.end(
      JSON.stringify({
        lang: idioma,
        date: dia,
        word: lista.palabras[indice],
        source: lista.origen,
        total: lista.palabras.length
      })
    );
  } catch (error) {
    console.error("Error al calcular la palabra del día:", error);
    responderJson(res, 500, {
      error: "No se pudo obtener la palabra del día."
    });
  }
};
