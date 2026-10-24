"use strict";

/* =========================================================
   Adivina la palabra · Lógica del juego
   - Palabra del día obtenida de internet (API /api/palabra).
   - La misma palabra para todos durante el día; cambia a las
     00:00 de Europe/Madrid.
   - Modo español / inglés con bandera para cambiar.
   ========================================================= */

const THEME_KEY = "cinco-theme";
const LANG_KEY = "cinco-lang";
const ZONA_HORARIA = "Europe/Madrid";

const MAX_INTENTOS = 6;
const LARGO_PALABRA = 5;
const ORDEN_ESTADOS = { absent: 1, present: 2, correct: 3 };

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

/* ---------------- Elementos de la página ---------------- */

const boardEl = document.getElementById("board");
const keyboardEl = document.getElementById("keyboard");
const messageEl = document.getElementById("message");
const badgeEl = document.getElementById("attemptBadge");
const newWordBtn = document.getElementById("newWordBtn");
const gameCard = document.getElementById("gameCard");
const themeToggle = document.getElementById("themeToggle");
const restartBtn = document.getElementById("restartBtn");
const langToggle = document.getElementById("langToggle");
const flagEnglish = document.getElementById("flagEnglish");
const flagSpanish = document.getElementById("flagSpanish");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const descripcionMeta = document.querySelector('meta[name="description"]');
const tituloEl = document.getElementById("game-title");
const shareEl = document.getElementById("share");
const shareBtn = document.getElementById("shareBtn");
const shareMenu = document.getElementById("shareMenu");
const shareWhatsapp = document.getElementById("shareWhatsapp");
const shareTelegram = document.getElementById("shareTelegram");
const shareCopy = document.getElementById("shareCopy");

/* ---------------- Textos en ambos idiomas ---------------- */

const TEXTOS = {
  es: {
    idioma: "es",
    titulo: "Adivina la palabra · Juego de palabras",
    descripcion:
      "Juego de palabras en español e inglés: adivina una palabra oculta de cinco letras en seis intentos. Palabra nueva cada día.",
    encabezado: "Adivina la palabra",
    cargando: "Cargando la palabra del día…",
    tablero: "Tablero de 6 intentos y 5 letras",
    teclado: "Teclado en pantalla",
    reiniciar: "Reiniciar partida",
    reintentar: "Reintentar",
    leyendaCorrecta: "Correcta",
    leyendaPresente: "Mal ubicada",
    leyendaAusente: "No está",
    pie: "6 intentos · Palabra nueva cada día a las 00:00 (hora peninsular)",
    inicio: "Adivina la palabra oculta de 5 letras de hoy.",
    pulsaEnter: "Pulsa Enter para comprobar.",
    completa: "Completa las 5 letras.",
    comprobando: "Comprobando…",
    noExiste: (palabra) => "La palabra " + palabra + " no existe. Prueba con otra.",
    correcto: (palabra) =>
      "¡Correcto! La palabra era " + palabra + ". Vuelve mañana para una nueva.",
    agotado: (palabra) =>
      "La palabra era " + palabra + ". Vuelve mañana para una nueva.",
    quedan: (n) => (n === 1 ? "Te queda 1 intento." : "Te quedan " + n + " intentos."),
    intentosRestantes: (n) =>
      n === 1 ? "1 intento restante" : n + " intentos restantes",
    errorCarga:
      "No se pudo cargar la palabra del día. Comprueba tu conexión y reintenta.",
    activarOscuro: "Activar modo oscuro",
    activarClaro: "Activar modo claro",
    cambiarAIngles: "Cambiar a inglés",
    cambiarAEspanol: "Cambiar a español",
    intento: (n) => "Intento " + n,
    vacia: (fila, columna) =>
      "Fila " + fila + ", columna " + columna + ", vacía",
    letraFila: (letra, fila) => "Letra " + letra + ", fila " + fila,
    seleccionada: ", seleccionada",
    letra: (letra) => "Letra " + letra,
    enter: "Enter, comprobar palabra",
    borrar: "Borrar letra",
    estadoCorrecta: "correcta",
    estadoPresente: "mal ubicada",
    estadoAusente: "no está en la palabra",
    compartir: "Compartir resultado",
    compartirMenu: "Opciones para compartir",
    compartirCopiar: "Copiar resultado",
    copiado: "¡Copiado!",
    noCopiado: "No se pudo copiar",
    compartirCabecera: (fecha) => "Adivina la palabra 🇪🇸 · " + fecha
  },
  en: {
    idioma: "en",
    titulo: "Guess the word · Word game",
    descripcion:
      "Word game in Spanish and English: guess a hidden five-letter word in six tries. A new word every day.",
    encabezado: "Guess the word",
    cargando: "Loading today's word…",
    tablero: "Board with 6 attempts and 5 letters",
    teclado: "On-screen keyboard",
    reiniciar: "Restart game",
    reintentar: "Try again",
    leyendaCorrecta: "Correct",
    leyendaPresente: "Wrong place",
    leyendaAusente: "Not in word",
    pie: "6 tries · New word every day at 00:00 (Madrid time)",
    inicio: "Guess today's hidden 5-letter word.",
    pulsaEnter: "Press Enter to check.",
    completa: "Fill in all 5 letters.",
    comprobando: "Checking…",
    noExiste: (palabra) =>
      "“" + palabra + "” is not in the dictionary. Try another word.",
    correcto: (palabra) =>
      "Correct! The word was " + palabra + ". Come back tomorrow for a new one.",
    agotado: (palabra) =>
      "The word was " + palabra + ". Come back tomorrow for a new one.",
    quedan: (n) => (n === 1 ? "1 try left." : n + " tries left."),
    intentosRestantes: (n) => (n === 1 ? "1 try left" : n + " tries left"),
    errorCarga:
      "Could not load today's word. Check your connection and try again.",
    activarOscuro: "Turn on dark mode",
    activarClaro: "Turn on light mode",
    cambiarAIngles: "Switch to English",
    cambiarAEspanol: "Switch to Spanish",
    intento: (n) => "Attempt " + n,
    vacia: (fila, columna) => "Row " + fila + ", column " + columna + ", empty",
    letraFila: (letra, fila) => "Letter " + letra + ", row " + fila,
    seleccionada: ", selected",
    letra: (letra) => "Letter " + letra,
    enter: "Enter, check word",
    borrar: "Delete letter",
    estadoCorrecta: "correct",
    estadoPresente: "in the wrong place",
    estadoAusente: "not in the word",
    compartir: "Share result",
    compartirMenu: "Share options",
    compartirCopiar: "Copy result",
    copiado: "Copied!",
    noCopiado: "Could not copy",
    compartirCabecera: (fecha) => "Guess the word 🇬🇧 · " + fecha
  }
};

let idiomaActual = leerIdiomaGuardado();

function textos() {
  return TEXTOS[idiomaActual];
}

function leerIdiomaGuardado() {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "es";
  } catch (error) {
    return "es";
  }
}

/* ---------------- Tema claro / oscuro ---------------- */

function leerTemaGuardado() {
  try {
    const guardado = localStorage.getItem(THEME_KEY);
    return guardado === "light" || guardado === "dark" ? guardado : null;
  } catch (error) {
    return null;
  }
}

function aplicarTema(tema, guardar) {
  const esOscuro = tema === "dark";

  document.documentElement.dataset.theme = esOscuro ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(esOscuro));

  const accion = esOscuro ? textos().activarClaro : textos().activarOscuro;
  themeToggle.setAttribute("aria-label", accion);
  themeToggle.setAttribute("title", accion);

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", esOscuro ? "#09090b" : "#f4f1e8");
  }

  if (guardar) {
    try {
      localStorage.setItem(THEME_KEY, esOscuro ? "dark" : "light");
    } catch (error) {
      /* El juego sigue funcionando aunque localStorage esté bloqueado. */
    }
  }
}

aplicarTema(
  document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  false
);

themeToggle.addEventListener("click", () => {
  const nuevoTema =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  aplicarTema(nuevoTema, true);
  themeToggle.blur();
});

const preferenciaSistema = window.matchMedia
  ? window.matchMedia("(prefers-color-scheme: dark)")
  : null;

if (preferenciaSistema && typeof preferenciaSistema.addEventListener === "function") {
  preferenciaSistema.addEventListener("change", (evento) => {
    if (!leerTemaGuardado()) {
      aplicarTema(evento.matches ? "dark" : "light", false);
    }
  });
}

/* ---------------- Idioma ---------------- */

function aplicarIdioma() {
  const t = textos();

  document.documentElement.lang = t.idioma;
  document.title = t.titulo;

  if (descripcionMeta) {
    descripcionMeta.setAttribute("content", t.descripcion);
  }

  document.querySelectorAll("[data-i18n]").forEach((elemento) => {
    const clave = elemento.dataset.i18n;
    if (typeof t[clave] === "string") {
      elemento.textContent = t[clave];
    }
  });

  boardEl.setAttribute("aria-label", t.tablero);
  keyboardEl.setAttribute("aria-label", t.teclado);

  const destino = idiomaActual === "es" ? t.cambiarAIngles : t.cambiarAEspanol;
  langToggle.setAttribute("aria-label", destino);
  langToggle.setAttribute("title", destino);

  shareBtn.setAttribute("aria-label", t.compartir);
  shareBtn.setAttribute("title", t.compartir);
  shareMenu.setAttribute("aria-label", t.compartirMenu);
  restartBtn.setAttribute("aria-label", t.reiniciar);
  restartBtn.setAttribute("title", t.reiniciar);

  if (idiomaActual === "es") {
    flagEnglish.removeAttribute("hidden");
    flagSpanish.setAttribute("hidden", "");
  } else {
    flagEnglish.setAttribute("hidden", "");
    flagSpanish.removeAttribute("hidden");
  }

  newWordBtn.textContent = modoError ? t.reintentar : t.reiniciar;

  actualizarAriaTeclado();
  actualizarAriaTablero();
  aplicarTema(
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    false
  );
  actualizarBadge();
}

function actualizarAriaTeclado() {
  const t = textos();

  teclas.forEach((key, letra) => key.setAttribute("aria-label", t.letra(letra)));

  if (teclaEnter) {
    teclaEnter.setAttribute("aria-label", t.enter);
  }

  if (teclaBorrar) {
    teclaBorrar.setAttribute("aria-label", t.borrar);
  }
}

function actualizarAriaTablero() {
  const t = textos();

  [...boardEl.children].forEach((rowEl, fila) => {
    rowEl.setAttribute("aria-label", t.intento(fila + 1));
  });

  celdas.forEach((filaCeldas, fila) => {
    filaCeldas.forEach((tile, columna) => {
      if (!tile.textContent) {
        tile.setAttribute("aria-label", t.vacia(fila + 1, columna + 1));
      }
    });
  });
}

function cambiarIdioma() {
  idiomaActual = idiomaActual === "es" ? "en" : "es";

  try {
    localStorage.setItem(LANG_KEY, idiomaActual);
  } catch (error) {
    /* Sin persistencia, pero el cambio funciona igualmente. */
  }

  diccionarioDisponible = true;
  aplicarIdioma();
  cargarPalabraDelDia();
  langToggle.blur();
}

langToggle.addEventListener("click", cambiarIdioma);

/* ---------------- Estado del juego ---------------- */

let palabraSecreta = "";
let intentos = [];
let letras = new Array(LARGO_PALABRA).fill("");
let cursor = 0;
let juegoTerminado = false;
let revelando = false;
let validando = false;
let juegoListo = false;
let modoError = false;
let diaActual = "";
let diccionarioDisponible = true;
let generacion = 0;
let timerPulso = null;

const celdas = [];
const teclas = new Map();
const cacheDiccionario = new Map();
const cacheListasRemotas = new Map();
let teclaEnter = null;
let teclaBorrar = null;

/* ---------------- Tablero y teclado ---------------- */

function crearTablero() {
  for (let fila = 0; fila < MAX_INTENTOS; fila++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    rowEl.setAttribute("role", "row");
    rowEl.setAttribute("aria-label", textos().intento(fila + 1));

    const filaCeldas = [];
    for (let columna = 0; columna < LARGO_PALABRA; columna++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.setAttribute("role", "gridcell");
      tile.setAttribute(
        "aria-label",
        textos().vacia(fila + 1, columna + 1)
      );
      tile.addEventListener("click", () => seleccionarCelda(fila, columna));
      rowEl.appendChild(tile);
      filaCeldas.push(tile);
    }

    boardEl.appendChild(rowEl);
    celdas.push(filaCeldas);
  }
}

function crearTeclado() {
  const t = textos();
  const filas = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
  ];

  filas.forEach((fila) => {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";

    fila.forEach((valor) => {
      const key = document.createElement("button");
      key.type = "button";
      key.className = "key";

      if (valor === "ENTER") {
        key.classList.add("wide");
        key.textContent = "Enter";
        key.dataset.action = "enter";
        key.setAttribute("aria-label", t.enter);
        teclaEnter = key;
      } else if (valor === "BACKSPACE") {
        key.classList.add("wide");
        key.textContent = "⌫";
        key.dataset.action = "backspace";
        key.setAttribute("aria-label", t.borrar);
        teclaBorrar = key;
      } else {
        key.textContent = valor;
        key.dataset.letter = valor;
        key.setAttribute("aria-label", t.letra(valor));
        teclas.set(valor, key);
      }

      key.addEventListener("click", () => {
        if (valor === "ENTER") {
          comprobarIntento();
        } else if (valor === "BACKSPACE") {
          borrarLetra();
        } else {
          agregarLetra(valor);
        }
        key.blur();
      });

      rowEl.appendChild(key);
    });

    keyboardEl.appendChild(rowEl);
  });
}

/* ---------------- Utilidades de palabras ---------------- */

function normalizarLetra(caracter) {
  const limpia = caracter
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return /^[A-Z]$/.test(limpia) ? limpia : "";
}

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

function claveDiaActual() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

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

function elegirPalabraDeLista(lista, semilla) {
  return lista[hash(semilla) % lista.length];
}

function fetchConTiempo(url, opciones, milisegundos) {
  const controlador = new AbortController();
  const temporizador = window.setTimeout(() => controlador.abort(), milisegundos);

  return fetch(url, Object.assign({}, opciones, { signal: controlador.signal }))
    .finally(() => window.clearTimeout(temporizador));
}

async function descargarTextoRemoto(fuente) {
  const respuesta = await fetchConTiempo(fuente.url, {}, 10000);

  if (!respuesta.ok) {
    throw new Error("HTTP " + respuesta.status + " al descargar " + fuente.url);
  }

  const buffer = await respuesta.arrayBuffer();
  return new TextDecoder(fuente.codificacion).decode(buffer);
}

async function descargarListaRemota(idioma) {
  if (idioma === "es") {
    const [diccionario, frecuencia] = await Promise.all(
      FUENTES.es.map((fuente) => descargarTextoRemoto(fuente))
    );

    const validas = new Set(
      diccionario
        .split(/\r?\n/)
        .map(limpiarPalabra)
        .filter(esPalabraValida)
    );

    const comunes = new Set();
    for (const linea of frecuencia.split(/\r?\n/)) {
      const palabra = limpiarPalabra(linea.split(/\s+/)[0] || "");
      if (validas.has(palabra)) {
        comunes.add(palabra);
      }
    }

    const lista = comunes.size >= 100 ? [...comunes] : [...validas];

    if (lista.length === 0) {
      throw new Error("La lista de español llegó vacía.");
    }

    return lista;
  }

  const texto = await descargarTextoRemoto(FUENTES.en[0]);
  const lista = [
    ...new Set(texto.split(/\r?\n/).map(limpiarPalabra).filter(esPalabraValida))
  ];

  if (lista.length === 0) {
    throw new Error("La lista de inglés llegó vacía.");
  }

  return lista;
}

function obtenerListaRemota(idioma) {
  if (!cacheListasRemotas.has(idioma)) {
    const promesa = descargarListaRemota(idioma).catch((error) => {
      cacheListasRemotas.delete(idioma);
      throw error;
    });
    cacheListasRemotas.set(idioma, promesa);
  }

  return cacheListasRemotas.get(idioma);
}

async function obtenerPalabraDelDia(idioma, dia) {
  try {
    const url =
      "api/palabra?lang=" + encodeURIComponent(idioma) + "&d=" + encodeURIComponent(dia);
    const respuesta = await fetchConTiempo(url, { headers: { Accept: "application/json" } }, 8000);

    if (!respuesta.ok) {
      throw new Error("La API respondió " + respuesta.status + ".");
    }

    const datos = await respuesta.json();
    const palabra = limpiarPalabra((datos && datos.word) || "");

    if (!esPalabraValida(palabra)) {
      throw new Error("La API devolvió una palabra no válida.");
    }

    return palabra;
  } catch (error) {
    console.warn(
      "No se pudo usar /api/palabra; se descarga la lista de internet directamente:",
      error.message
    );

    const lista = await obtenerListaRemota(idioma);
    return elegirPalabraDeLista(lista, idioma + ":" + dia);
  }
}

/* ---------------- Rondas ---------------- */

function limpiarTablero() {
  generacion += 1;
  intentos = [];
  letras = new Array(LARGO_PALABRA).fill("");
  cursor = 0;
  juegoTerminado = false;
  revelando = false;
  validando = false;

  celdas.flat().forEach((tile) => {
    tile.textContent = "";
    tile.className = "tile";
  });

  teclas.forEach((key) => {
    key.classList.remove("correct", "present", "absent");
    delete key.dataset.state;
  });

  newWordBtn.classList.remove("show");
  ocultarReinicio();
  ocultarCompartir();
}

function nuevaRonda() {
  const t = textos();

  modoError = false;
  palabraSecreta = palabraDelDia;
  limpiarTablero();
  actualizarBadge();

  newWordBtn.textContent = t.reiniciar;
  actualizarMensaje(t.inicio);
  pintarFilaActual();
}

function actualizarMensaje(texto, tipo) {
  messageEl.textContent = texto;
  messageEl.className = "status" + (tipo ? " " + tipo : "");
}

function actualizarBadge() {
  const restantes = Math.max(MAX_INTENTOS - intentos.length, 0);

  badgeEl.textContent = String(restantes);
  badgeEl.dataset.state =
    restantes >= 5 ? "green" : restantes >= 3 ? "orange" : "red";
  badgeEl.setAttribute("aria-label", textos().intentosRestantes(restantes));
}

function mostrarReinicio() {
  restartBtn.hidden = false;
}

function ocultarReinicio() {
  restartBtn.hidden = true;
}

function etiquetaCelda(fila, columna, letra) {
  const t = textos();
  const seleccionada = columna === cursor;
  const base = letra ? t.letraFila(letra, fila + 1) : t.vacia(fila + 1, columna + 1);

  return base + (seleccionada ? t.seleccionada : "");
}

function pintarFilaActual() {
  const fila = intentos.length;

  if (!celdas[fila]) {
    return;
  }

  const filaCeldas = celdas[fila];

  for (let i = 0; i < LARGO_PALABRA; i++) {
    const tile = filaCeldas[i];
    const letra = letras[i];

    tile.textContent = letra;
    tile.classList.toggle("filled", letra !== "");
    tile.classList.toggle("selectable", true);
    tile.classList.toggle("selected", i === cursor);
    tile.setAttribute("aria-label", etiquetaCelda(fila, i, letra));
  }
}

function seleccionarCelda(fila, columna) {
  if (!juegoListo || juegoTerminado || revelando || validando) {
    return;
  }

  if (fila !== intentos.length) {
    return;
  }

  cursor = columna;
  pintarFilaActual();
}

function agregarLetra(letra) {
  if (!juegoListo || juegoTerminado || revelando || validando) {
    return;
  }

  const columna = cursor;
  letras[columna] = letra;
  cursor = Math.min(cursor + 1, LARGO_PALABRA - 1);

  pintarFilaActual();

  const tile = celdas[intentos.length][columna];
  tile.classList.add("pop");
  window.setTimeout(() => tile.classList.remove("pop"), 160);

  if (letras.every((valor) => valor !== "")) {
    actualizarMensaje(textos().pulsaEnter);
  } else if (messageEl.classList.contains("warn")) {
    actualizarMensaje(textos().completa);
  }
}

function borrarLetra() {
  if (!juegoListo || juegoTerminado || revelando || validando) {
    return;
  }

  if (letras[cursor] !== "") {
    letras[cursor] = "";
  } else if (cursor > 0) {
    cursor -= 1;
    letras[cursor] = "";
  } else {
    return;
  }

  pintarFilaActual();
  actualizarMensaje(textos().completa);
}

/* ---------------- Comprobación de intentos ---------------- */

function evaluarIntento(intento, secreta) {
  const resultado = Array(LARGO_PALABRA).fill("absent");
  const restantes = secreta.split("");

  for (let i = 0; i < LARGO_PALABRA; i++) {
    if (intento[i] === secreta[i]) {
      resultado[i] = "correct";
      restantes[i] = null;
    }
  }

  for (let i = 0; i < LARGO_PALABRA; i++) {
    if (resultado[i] === "correct") {
      continue;
    }
    const indice = restantes.indexOf(intento[i]);
    if (indice !== -1) {
      resultado[i] = "present";
      restantes[indice] = null;
    }
  }

  return resultado;
}

function etiquetaEstado(estado) {
  const t = textos();

  if (estado === "correct") return t.estadoCorrecta;
  if (estado === "present") return t.estadoPresente;
  return t.estadoAusente;
}

function actualizarTecla(letra, estado) {
  const key = teclas.get(letra);
  if (!key) return;

  const actual = key.dataset.state;
  if (!actual || ORDEN_ESTADOS[estado] > ORDEN_ESTADOS[actual]) {
    key.classList.remove("correct", "present", "absent");
    key.classList.add(estado);
    key.dataset.state = estado;
  }
}

function sacudirFila(fila) {
  const rowEl = boardEl.children[fila];
  rowEl.classList.remove("shake");
  void rowEl.offsetWidth;
  rowEl.classList.add("shake");
  window.setTimeout(() => rowEl.classList.remove("shake"), 420);
}

function revelarIntento(fila, intento, estados, gen) {
  const RETRASO_ENTRE_LETRAS = 130;
  const DURACION_VUELTA = 620;
  const MITAD_VUELTA = Math.round(DURACION_VUELTA / 2);

  let ultimoCambio = 0;

  estados.forEach((estado, indice) => {
    const tile = celdas[fila][indice];
    const retraso = indice * RETRASO_ENTRE_LETRAS;

    window.setTimeout(() => {
      if (gen !== generacion) return;
      tile.classList.add("flip");
    }, retraso);

    window.setTimeout(() => {
      if (gen !== generacion) return;
      tile.classList.add(estado);
      tile.setAttribute(
        "aria-label",
        textos().letra(intento[indice]) + ", " + etiquetaEstado(estado)
      );
      actualizarTecla(intento[indice], estado);
    }, retraso + MITAD_VUELTA);

    ultimoCambio = Math.max(ultimoCambio, retraso + MITAD_VUELTA);
  });

  window.setTimeout(() => {
    if (gen !== generacion) return;
    finalizarIntento(intento, gen);
  }, ultimoCambio + MITAD_VUELTA + 200);
}

function variantesConTildes(palabra) {
  const base = palabra.toLowerCase();
  const variantes = new Set([base]);
  const tildes = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };

  for (let i = 0; i < base.length; i++) {
    const letra = base[i];

    if (tildes[letra]) {
      variantes.add(base.slice(0, i) + tildes[letra] + base.slice(i + 1));
    }

    if (letra === "n") {
      variantes.add(base.slice(0, i) + "ñ" + base.slice(i + 1));
    }
  }

  return [...variantes];
}

async function palabraEnDiccionario(palabra) {
  if (palabra === palabraSecreta) {
    return true;
  }

  const clave = idiomaActual + ":" + palabra;

  if (cacheDiccionario.has(clave)) {
    return cacheDiccionario.get(clave);
  }

  if (!diccionarioDisponible) {
    return true;
  }

  const variantes =
    idiomaActual === "es" ? variantesConTildes(palabra) : [palabra.toLowerCase()];
  const anfitrion =
    idiomaActual === "es" ? "es.wiktionary.org" : "en.wiktionary.org";
  const url =
    "https://" +
    anfitrion +
    "/w/api.php?action=query&format=json&origin=*&titles=" +
    variantes.map(encodeURIComponent).join("|");

  try {
    const respuesta = await fetchConTiempo(url, {}, 4000);

    if (!respuesta.ok) {
      throw new Error("El diccionario respondió " + respuesta.status + ".");
    }

    const datos = await respuesta.json();
    const paginas = Object.values((datos && datos.query && datos.query.pages) || {});
    const existe = paginas.some((pagina) => !("missing" in pagina));

    cacheDiccionario.set(clave, existe);
    return existe;
  } catch (error) {
    console.warn(
      "No se pudo consultar el diccionario; se acepta la palabra:",
      error.message
    );
    diccionarioDisponible = false;
    return true;
  }
}

async function comprobarIntento() {
  if (modoError) {
    cargarPalabraDelDia();
    return;
  }

  if (!juegoListo) {
    return;
  }

  if (juegoTerminado) {
    if (!revelando && !restartBtn.hidden) {
      nuevaRonda();
    }
    return;
  }

  if (revelando || validando) {
    return;
  }

  if (letras.some((valor) => valor === "")) {
    actualizarMensaje(textos().completa, "warn");
    sacudirFila(intentos.length);
    return;
  }

  const intento = letras.join("");
  const generacionIntento = generacion;

  validando = true;
  actualizarMensaje(textos().comprobando);

  const existe = await palabraEnDiccionario(intento);
  validando = false;

  if (generacionIntento !== generacion) {
    return;
  }

  if (!existe) {
    actualizarMensaje(textos().noExiste(intento), "warn");
    sacudirFila(intentos.length);
    return;
  }

  if (!juegoListo || juegoTerminado) {
    return;
  }

  const fila = intentos.length;
  letras = new Array(LARGO_PALABRA).fill("");
  cursor = 0;
  celdas[fila].forEach((tile) => tile.classList.remove("selected", "selectable"));
  intentos.push(intento);
  revelando = true;

  const estados = evaluarIntento(intento, palabraSecreta);
  revelarIntento(fila, intento, estados, generacionIntento);
}

function finalizarIntento(intento, gen) {
  if (gen !== generacion) {
    return;
  }

  const t = textos();

  revelando = false;
  actualizarBadge();

  if (intento === palabraSecreta) {
    juegoTerminado = true;
    actualizarMensaje(t.correcto(palabraSecreta), "success");
    mostrarCompartir();
    mostrarReinicio();
    desplazarACompartir();
    return;
  }

  if (intentos.length >= MAX_INTENTOS) {
    juegoTerminado = true;
    actualizarMensaje(t.agotado(palabraSecreta), "warn");
    mostrarCompartir();
    mostrarReinicio();
    desplazarACompartir();
    return;
  }

  pintarFilaActual();

  const restantes = MAX_INTENTOS - intentos.length;
  actualizarMensaje(t.quedan(restantes));
}

/* ---------------- Compartir resultado ---------------- */

const EMOJIS_COMPARTIR = { correct: "🟩", present: "🟨", absent: "⬛" };

function urlCompartir() {
  return window.location.href.split(/[?#]/)[0];
}

function construirResultadoCompartir() {
  const filas = intentos.map((intento) =>
    evaluarIntento(intento, palabraSecreta)
      .map((estado) => EMOJIS_COMPARTIR[estado])
      .join("")
  );

  const acertado =
    intentos.length > 0 && intentos[intentos.length - 1] === palabraSecreta;
  const puntuacion = (acertado ? intentos.length : "X") + "/" + MAX_INTENTOS;
  const fecha = (diaActual || claveDiaActual()).split("-").reverse().join("/");

  return [textos().compartirCabecera(fecha), "", ...filas, "", puntuacion].join("\n");
}

function construirTextoCompartir() {
  return construirResultadoCompartir() + "\n\n" + urlCompartir();
}

function actualizarEnlacesCompartir() {
  const resultado = construirResultadoCompartir();
  const url = urlCompartir();

  shareWhatsapp.href =
    "https://wa.me/?text=" + encodeURIComponent(resultado + "\n\n" + url);
  shareTelegram.href =
    "https://t.me/share/url?url=" +
    encodeURIComponent(url) +
    "&text=" +
    encodeURIComponent(resultado);
}

function abrirMenuCompartir() {
  if (shareEl.hidden) {
    return;
  }

  actualizarEnlacesCompartir();
  shareMenu.classList.add("show");
  shareBtn.setAttribute("aria-expanded", "true");

  shareBtn.classList.remove("pulse");
  window.clearTimeout(timerPulso);
  timerPulso = null;
}

function cerrarMenuCompartir() {
  shareMenu.classList.remove("show");
  shareBtn.setAttribute("aria-expanded", "false");
}

function mostrarCompartir() {
  shareEl.hidden = false;
  cerrarMenuCompartir();

  shareBtn.classList.remove("pulse");
  void shareBtn.offsetWidth;
  shareBtn.classList.add("pulse");

  window.clearTimeout(timerPulso);
  timerPulso = window.setTimeout(() => {
    shareBtn.classList.remove("pulse");
    timerPulso = null;
  }, 5600);
}

function desplazarACompartir() {
  const reducido =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Se espera a que el pie de página aparezca y se asiente el diseño.
  window.setTimeout(() => {
    if (shareEl.hidden) {
      return;
    }

    shareEl.scrollIntoView({
      behavior: reducido ? "auto" : "smooth",
      block: "center"
    });
  }, 240);
}

function ocultarCompartir() {
  shareEl.hidden = true;
  cerrarMenuCompartir();

  shareBtn.classList.remove("pulse");
  window.clearTimeout(timerPulso);
  timerPulso = null;
}

async function copiarAlPortapapeles(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (error) {
      /* Se intenta el método clásico justo debajo. */
    }
  }

  const area = document.createElement("textarea");
  area.value = texto;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();

  let copiado = false;
  try {
    copiado = document.execCommand("copy");
  } catch (error) {
    copiado = false;
  } finally {
    area.remove();
  }

  return copiado;
}

async function copiarResultado() {
  const copiado = await copiarAlPortapapeles(construirTextoCompartir());
  const etiqueta = shareCopy.querySelector("span");

  if (!etiqueta) {
    return;
  }

  etiqueta.textContent = copiado ? textos().copiado : textos().noCopiado;
  window.setTimeout(() => {
    etiqueta.textContent = textos().compartirCopiar;
  }, 1800);
}

/* ---------------- Teclado físico ---------------- */

function manejarTeclaFisica(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (event.key === "Enter") {
    if (
      event.target === newWordBtn ||
      event.target === themeToggle ||
      event.target === langToggle ||
      event.target === restartBtn ||
      event.target === shareBtn
    ) {
      return;
    }
    event.preventDefault();
    comprobarIntento();
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    borrarLetra();
    return;
  }

  const letra = normalizarLetra(event.key);
  if (letra.length === 1) {
    event.preventDefault();
    agregarLetra(letra);
  }
}

/* ---------------- Carga de la palabra del día ---------------- */

let palabraDelDia = "";

async function cargarPalabraDelDia() {
  const idiomaSolicitado = idiomaActual;
  const dia = claveDiaActual();

  diaActual = dia;
  juegoListo = false;
  modoError = false;
  gameCard.setAttribute("aria-busy", "true");
  actualizarMensaje(textos().cargando);
  newWordBtn.classList.remove("show");
  limpiarTablero();
  actualizarBadge();

  try {
    const palabra = await obtenerPalabraDelDia(idiomaSolicitado, dia);

    if (idiomaSolicitado !== idiomaActual) {
      return;
    }

    palabraDelDia = palabra;
    juegoListo = true;
    gameCard.setAttribute("aria-busy", "false");
    nuevaRonda();
  } catch (error) {
    if (idiomaSolicitado !== idiomaActual) {
      return;
    }

    console.error("Error al cargar la palabra del día:", error);

    modoError = true;
    juegoListo = false;
    gameCard.setAttribute("aria-busy", "false");
    actualizarMensaje(textos().errorCarga, "warn");
    newWordBtn.textContent = textos().reintentar;
    newWordBtn.classList.add("show");
  }
}

function comprobarCambioDeDia() {
  const dia = claveDiaActual();

  if (dia !== diaActual && !revelando && !validando) {
    diaActual = dia;
    cargarPalabraDelDia();
  }
}

newWordBtn.addEventListener("click", () => {
  if (modoError) {
    cargarPalabraDelDia();
  } else {
    nuevaRonda();
  }
});

restartBtn.addEventListener("click", () => {
  if (modoError) {
    cargarPalabraDelDia();
    return;
  }

  if (!juegoTerminado || revelando || validando) {
    return;
  }

  nuevaRonda();
  restartBtn.blur();
});

window.addEventListener("keydown", manejarTeclaFisica);

shareBtn.addEventListener("click", () => {
  if (shareMenu.classList.contains("show")) {
    cerrarMenuCompartir();
  } else {
    abrirMenuCompartir();
  }
});

shareWhatsapp.addEventListener("click", cerrarMenuCompartir);
shareTelegram.addEventListener("click", cerrarMenuCompartir);
shareCopy.addEventListener("click", copiarResultado);

document.addEventListener("click", (event) => {
  if (!shareEl.hidden && !shareEl.contains(event.target)) {
    cerrarMenuCompartir();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && shareMenu.classList.contains("show")) {
    cerrarMenuCompartir();
    shareBtn.focus();
  }
});

/* ---------------- Arranque ---------------- */

crearTablero();
crearTeclado();
aplicarIdioma();
cargarPalabraDelDia();

// A las 00:00 (hora peninsular) se comprueba si toca palabra nueva.
window.setInterval(comprobarCambioDeDia, 30000);
