/* ==========================================================================
   CUBISMO · quiz.js
   Juego de preguntas de la página Exclusivo (se enlaza solo desde
   exclusivo.html, o exclusivo.php cuando PHP está activo). El HTML tiene
   únicamente el contenedor <div id="quiz">: todas las pantallas se generan
   desde acá.

   Con PHP activo, para jugar hay que iniciar sesión: PHP escribe en el
   contenedor data-logueado="si" o "no", y este archivo lo lee al tocar
   COMENZAR. Sin PHP ese atributo no existe y el juego queda abierto.

   ÍNDICE
   1. Preguntas (array de objetos)
   2. Estado del juego
   3. Funciones auxiliares
   4. Pantalla de inicio y pantalla de "iniciá sesión"
   5. Pantalla de pregunta
   6. Elegir una opción
   7. Pantalla final
   8. Inicio
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. PREGUNTAS
   Cada pregunta es un objeto con:
   - pregunta:   el texto que se muestra
   - imagen:     (opcional) { src, alt } de una obra de la carpeta img/
   - opciones:   las 4 respuestas posibles
   - correcta:   la posición (0 a 3) de la respuesta correcta en "opciones"
   - referencia: { pagina, nombre } de la página del sitio donde está el dato
   Todos los datos salen de las otras páginas del sitio.
   -------------------------------------------------------------------------- */
const PREGUNTAS = [
  {
    pregunta: '¿De quién es esta pintura?',
    imagen: {
      src: 'img/torre.jpg',
      alt: 'Pintura cubista de la Torre Eiffel, fragmentada y torcida entre edificios'
    },
    opciones: ['Fernand Léger', 'Juan Gris', 'Robert Delaunay', 'Georges Braque'],
    correcta: 2,
    referencia: { pagina: 'galeria.html', nombre: 'Galería' }
  },
  {
    pregunta: '¿En qué año pintó Picasso Les Demoiselles d\'Avignon, el cuadro que dio origen al cubismo?',
    imagen: null,
    opciones: ['1907', '1905', '1912', '1909'],
    correcta: 0,
    referencia: { pagina: 'cubismo.html', nombre: 'Cubismo' }
  },
  {
    pregunta: '¿En qué ciudad nació el cubismo?',
    imagen: null,
    opciones: ['Barcelona', 'Málaga', 'Madrid', 'París'],
    correcta: 3,
    referencia: { pagina: 'cubismo.html', nombre: 'Cubismo' }
  },
  {
    pregunta: '¿En qué año nació Pablo Picasso?',
    imagen: null,
    opciones: ['1882', '1881', '1879', '1885'],
    correcta: 1,
    referencia: { pagina: 'picasso.html', nombre: 'Artista 1: Picasso' }
  },
  {
    pregunta: '¿Quién pintó este retrato de Pablo Picasso?',
    imagen: {
      src: 'img/picasoretrato.webp',
      alt: 'Retrato cubista de un pintor con una paleta en la mano, construido con planos geométricos'
    },
    opciones: ['Georges Braque', 'Robert Delaunay', 'Fernand Léger', 'Juan Gris'],
    correcta: 3,
    referencia: { pagina: 'galeria.html', nombre: 'Galería' }
  },
  {
    pregunta: '¿En qué etapa del cubismo los objetos se desarman en muchas facetas pequeñas y la paleta se reduce a grises, marrones y negros?',
    imagen: null,
    opciones: ['Protocubismo', 'Cubismo analítico', 'Cubismo sintético', 'Orfismo'],
    correcta: 1,
    referencia: { pagina: 'cubismo.html', nombre: 'Cubismo' }
  },
  {
    pregunta: '¿En qué año se pintó esta obra, Guernica?',
    imagen: {
      src: 'img/guernica.webp',
      alt: 'Guernica: mural en blanco, negro y grises con un toro, un caballo herido y figuras que gritan'
    },
    opciones: ['1914', '1931', '1945', '1937'],
    correcta: 3,
    referencia: { pagina: 'picasso.html', nombre: 'Artista 1: Picasso' }
  },
  {
    pregunta: '¿Cuál fue el primer papier collé de la historia, creado por Braque en 1912?',
    imagen: null,
    opciones: ['Naturaleza muerta con silla de rejilla', 'Compotera y vaso', 'Violín y candelero', 'Hombre con guitarra'],
    correcta: 1,
    referencia: { pagina: 'braque.html', nombre: 'Artista 2: Braque' }
  }
];


/* --------------------------------------------------------------------------
   2. ESTADO DEL JUEGO
   Variables que cambian mientras se juega.
   -------------------------------------------------------------------------- */
const contenedor = document.getElementById('quiz');

let indiceActual = 0;   // número de la pregunta que se está mostrando (0 a 7)
let puntaje = 0;        // cantidad de respuestas correctas
let fallos = [];        // preguntas falladas, para el repaso final


/* --------------------------------------------------------------------------
   3. FUNCIONES AUXILIARES
   -------------------------------------------------------------------------- */

// Crea un elemento HTML con una clase y un texto.
// Se usa textContent (y no innerHTML) porque es más seguro.
function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);

  if (clase) {
    elemento.className = clase;
  }
  if (texto) {
    elemento.textContent = texto;
  }
  return elemento;
}

// Devuelve una copia del array con los elementos en orden aleatorio
// (algoritmo de Fisher-Yates: recorre de atrás hacia adelante e
// intercambia cada elemento con otro elegido al azar).
function mezclar(lista) {
  const copia = lista.slice();

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temporal = copia[i];
    copia[i] = copia[j];
    copia[j] = temporal;
  }
  return copia;
}

// Reemplaza lo que hay en el contenedor por una pantalla nueva y le pasa
// el foco al título, así quien usa teclado o lector de pantalla sigue el juego.
// Al cargar la página no se mueve el foco (moverFoco = false).
function mostrarPantalla(tarjeta, titulo, moverFoco) {
  contenedor.replaceChildren(tarjeta);
  titulo.setAttribute('tabindex', '-1');

  if (moverFoco !== false) {
    titulo.focus({ preventScroll: true });
  }
}

// Crea un botón con estilo de píldora (clases del sitio + las del quiz)
function crearBoton(texto, alHacerClic) {
  const boton = crear('button', 'btn btn--contorno quiz__boton', texto);
  boton.type = 'button';
  boton.addEventListener('click', alHacerClic);
  return boton;
}


/* --------------------------------------------------------------------------
   4. PANTALLA DE INICIO Y PANTALLA DE "INICIÁ SESIÓN"
   -------------------------------------------------------------------------- */
function mostrarInicio(moverFoco) {
  const tarjeta = crear('div', 'quiz__tarjeta quiz__inicio');
  const titulo = crear('h2', 'quiz__pregunta', '¿Cuánto aprendiste?');
  const intro = crear('p', 'quiz__intro',
    'Poné a prueba lo que aprendiste sobre el Cubismo: ' + PREGUNTAS.length +
    ' preguntas sobre sus artistas, sus obras y su historia.');

  const acciones = crear('div', 'quiz__acciones');
  acciones.append(crearBoton('Comenzar', alTocarComenzar));

  tarjeta.append(titulo, intro, acciones);
  // Al cargar la página se llama con false (no mueve el foco);
  // desde el botón VOLVER sí se mueve, para no perderlo
  mostrarPantalla(tarjeta, titulo, moverFoco);
}

// Al tocar COMENZAR se revisa si hay sesión iniciada.
// El dato lo escribe PHP en el HTML: <div id="quiz" data-logueado="si">
// Solo se bloquea si dice "no". Si el atributo no existe (versión sin PHP,
// exclusivo.html), el juego queda abierto para todos.
function alTocarComenzar() {
  if (contenedor.dataset.logueado === 'no') {
    mostrarBloqueo();
  } else {
    comenzarJuego();
  }
}

// Pantalla que pide iniciar sesión (con candado)
function mostrarBloqueo() {
  const tarjeta = crear('div', 'quiz__tarjeta quiz__inicio quiz__bloqueo');

  // El candado es decorativo: aria-hidden hace que el lector de pantalla lo saltee
  const candado = crear('span', 'quiz__candado', '🔒');
  candado.setAttribute('aria-hidden', 'true');

  const titulo = crear('h2', 'quiz__pregunta', 'Iniciá sesión para jugar');
  const intro = crear('p', 'quiz__intro',
    'El juego es exclusivo para usuarios registrados. ' +
    'Iniciá sesión y vas a volver directo acá para empezar.');

  // "Iniciar sesión" es un link (lleva a otra página), con aspecto de botón
  const acciones = crear('div', 'quiz__acciones');
  const linkLogin = crear('a', 'btn btn--claro quiz__boton', 'Iniciar sesión');
  linkLogin.href = 'login.php';

  acciones.append(linkLogin, crearBoton('Volver', mostrarInicio));
  tarjeta.append(candado, titulo, intro, acciones);
  mostrarPantalla(tarjeta, titulo);
}

// Reinicia el estado y muestra la primera pregunta
function comenzarJuego() {
  indiceActual = 0;
  puntaje = 0;
  fallos = [];
  mostrarPregunta();
}


/* --------------------------------------------------------------------------
   5. PANTALLA DE PREGUNTA
   -------------------------------------------------------------------------- */
function mostrarPregunta() {
  const datos = PREGUNTAS[indiceActual];
  const tarjeta = crear('div', 'quiz__tarjeta');

  // "Pregunta 3 de 8"
  const estado = crear('span', 'quiz__estado',
    'Pregunta ' + (indiceActual + 1) + ' de ' + PREGUNTAS.length);

  // Barra de progreso: el relleno arranca con el ancho de la pregunta anterior
  // y en el siguiente cuadro pasa al nuevo ancho, para que se vea la transición
  const barra = crear('div', 'quiz__barra');
  const relleno = crear('div', 'quiz__barra-relleno');
  relleno.style.width = (indiceActual / PREGUNTAS.length * 100) + '%';
  barra.append(relleno);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      relleno.style.width = ((indiceActual + 1) / PREGUNTAS.length * 100) + '%';
    });
  });

  const titulo = crear('h2', 'quiz__pregunta', datos.pregunta);
  tarjeta.append(estado, barra, titulo);

  // Imagen de la obra (solo si la pregunta tiene una)
  if (datos.imagen) {
    const figura = crear('figure', 'quiz__obra');
    const imagen = document.createElement('img');
    imagen.src = datos.imagen.src;
    imagen.alt = datos.imagen.alt;
    figura.append(imagen);
    tarjeta.append(figura);
  }

  // Opciones: se arma una lista de objetos { texto, esCorrecta } y se mezcla,
  // así el orden cambia en cada partida
  const opciones = mezclar(datos.opciones.map(function (texto, posicion) {
    return { texto: texto, esCorrecta: posicion === datos.correcta };
  }));

  const lista = crear('ul', 'quiz__opciones');

  opciones.forEach(function (opcion) {
    const item = document.createElement('li');
    const boton = crear('button', 'quiz__opcion');
    boton.type = 'button';
    boton.append(crear('span', 'quiz__texto', opcion.texto));

    // Se guarda en el botón si es la correcta (atributo data-correcta)
    boton.dataset.correcta = opcion.esCorrecta;

    boton.addEventListener('click', function () {
      elegirOpcion(boton, lista, tarjeta);
    });

    item.append(boton);
    lista.append(item);
  });

  // Mensaje de correcto/incorrecto: aria-live hace que el lector de
  // pantalla lo lea en voz alta cuando aparece
  const feedback = crear('p', 'quiz__feedback');
  feedback.setAttribute('aria-live', 'polite');

  tarjeta.append(lista, feedback);
  mostrarPantalla(tarjeta, titulo);
}


/* --------------------------------------------------------------------------
   6. ELEGIR UNA OPCIÓN
   -------------------------------------------------------------------------- */
function elegirOpcion(botonElegido, lista, tarjeta) {
  const datos = PREGUNTAS[indiceActual];
  const botones = lista.querySelectorAll('.quiz__opcion');
  const acerto = botonElegido.dataset.correcta === 'true';
  const textoCorrecto = datos.opciones[datos.correcta];

  // 1) Se bloquean todas las opciones y se marca la correcta con ✓
  botones.forEach(function (boton) {
    boton.disabled = true;

    if (boton.dataset.correcta === 'true') {
      boton.classList.add('is-correcta');
      boton.append(crear('span', 'quiz__marca', '✓'));
    }
  });

  // 2) Si se equivocó, su opción se marca con ✗ y se guarda para el repaso
  if (acerto) {
    puntaje++;
  } else {
    botonElegido.classList.add('is-incorrecta');
    botonElegido.append(crear('span', 'quiz__marca', '✗'));

    fallos.push({
      pregunta: datos.pregunta,
      elegida: botonElegido.querySelector('.quiz__texto').textContent,
      correcta: textoCorrecto,
      referencia: datos.referencia
    });
  }

  // 3) Mensaje de resultado
  const feedback = tarjeta.querySelector('.quiz__feedback');
  feedback.textContent = acerto
    ? '¡Correcto!'
    : 'Incorrecto. La respuesta correcta es: ' + textoCorrecto + '.';

  // 4) Botón SIGUIENTE (o VER RESULTADO en la última pregunta)
  const esLaUltima = indiceActual === PREGUNTAS.length - 1;
  const acciones = crear('div', 'quiz__acciones');
  const siguiente = crearBoton(esLaUltima ? 'Ver resultado' : 'Siguiente', function () {
    indiceActual++;

    if (esLaUltima) {
      mostrarFinal();
    } else {
      mostrarPregunta();
    }
  });

  acciones.append(siguiente);
  tarjeta.append(acciones);
  siguiente.focus(); // quien usa teclado puede seguir con Enter
}


/* --------------------------------------------------------------------------
   7. PANTALLA FINAL
   -------------------------------------------------------------------------- */

// Mensaje según la cantidad de respuestas correctas
function mensajeSegunPuntaje(correctas) {
  if (correctas <= 3) {
    return 'Te conviene volver a recorrer el sitio.';
  }
  if (correctas <= 6) {
    return '¡Bien! Aprendiste bastante.';
  }
  return '¡Sos un experto en Cubismo!';
}

function mostrarFinal() {
  const tarjeta = crear('div', 'quiz__tarjeta quiz__final');
  const titulo = crear('h2', 'quiz__pregunta', 'Tu resultado');

  // Puntaje grande, ej: "6 / 8"
  const numero = crear('span', 'quiz__puntaje', puntaje + ' / ' + PREGUNTAS.length);
  const mensaje = crear('p', 'quiz__mensaje', mensajeSegunPuntaje(puntaje));

  tarjeta.append(titulo, numero, mensaje);

  // Repaso de las preguntas falladas (solo si hubo alguna)
  if (fallos.length > 0) {
    const repaso = crear('section', 'quiz__repaso');
    repaso.append(crear('h3', 'quiz__repaso-titulo', 'Para repasar'));

    const lista = document.createElement('ol');

    fallos.forEach(function (fallo) {
      const item = document.createElement('li');

      const pregunta = crear('p', 'quiz__repaso-pregunta', fallo.pregunta);

      const tuya = crear('p', '', 'Tu respuesta: ');
      tuya.append(crear('span', 'quiz__repaso-tuya', fallo.elegida));

      const correcta = crear('p', '', 'Respuesta correcta: ');
      correcta.append(crear('strong', '', fallo.correcta));

      // Link a la página del sitio donde está el dato
      const link = crear('a', '', 'Repasar en ' + fallo.referencia.nombre + ' →');
      link.href = fallo.referencia.pagina;

      item.append(pregunta, tuya, correcta, link);
      lista.append(item);
    });

    repaso.append(lista);
    tarjeta.append(repaso);
  }

  const acciones = crear('div', 'quiz__acciones');
  acciones.append(crearBoton('Volver a jugar', comenzarJuego));
  tarjeta.append(acciones);

  mostrarPantalla(tarjeta, titulo);
}


/* --------------------------------------------------------------------------
   8. INICIO
   Solo arranca si la página tiene el contenedor del juego.
   -------------------------------------------------------------------------- */
if (contenedor) {
  mostrarInicio(false);
}
