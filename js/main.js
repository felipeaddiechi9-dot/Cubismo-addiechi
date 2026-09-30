/* ==========================================================================
   CUBISMO · main.js
   JavaScript del sitio (se carga con "defer" en todas las páginas, así que
   se ejecuta cuando el HTML ya está listo).

   ÍNDICE
   1. Aviso de que JavaScript está activo
   2. Marcar el link activo del menú
   3. Menú hamburguesa (mobile)
   4. Header que se achica al hacer scroll
   5. Aparición de elementos al hacer scroll (IntersectionObserver)
   6. Lightbox de la galería
   7. Formularios desactivados (mientras PHP está apagado)
   8. Inicio: se llama a cada función
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. AVISO DE QUE JAVASCRIPT ESTÁ ACTIVO
   Agrega la clase "js" al <html>. El CSS solo oculta los elementos ".reveal"
   si esta clase existe: sin JavaScript, el contenido se ve igual.
   -------------------------------------------------------------------------- */
document.documentElement.classList.add('js');


/* --------------------------------------------------------------------------
   2. MARCAR EL LINK ACTIVO DEL MENÚ
   Compara el nombre del archivo actual (ej: "galeria.html") con el href de
   cada link del header y del footer. Si coinciden, lo marca.
   -------------------------------------------------------------------------- */
function marcarLinkActivo() {
  // "/cubismo/galeria.html" -> "galeria.html"
  let paginaActual = window.location.pathname.split('/').pop();

  // Si la URL termina en "/" se está viendo el index
  if (paginaActual === '') {
    paginaActual = 'index.html';
  }

  // La página de resultado del formulario pertenece a la sección Contacto
  if (paginaActual === 'enviar.php') {
    paginaActual = 'contacto.html';
  }

  const links = document.querySelectorAll('.nav-principal a, .header-botones a, .nav-footer a');

  links.forEach(function (link) {
    if (link.getAttribute('href') === paginaActual) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page'); // lo anuncian los lectores de pantalla
    }
  });
}


/* --------------------------------------------------------------------------
   3. MENÚ HAMBURGUESA
   Abre y cierra el panel del menú en pantallas chicas.
   -------------------------------------------------------------------------- */
function iniciarMenu() {
  const boton = document.querySelector('.menu-toggle');
  const menu = document.getElementById('menu-principal');

  if (!boton || !menu) {
    return;
  }

  function abrirMenu() {
    menu.classList.add('is-open');
    boton.setAttribute('aria-expanded', 'true');
    boton.setAttribute('aria-label', 'Cerrar menú');
  }

  function cerrarMenu() {
    menu.classList.remove('is-open');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', 'Abrir menú');
  }

  // Clic en el botón: si está abierto lo cierra, si está cerrado lo abre
  boton.addEventListener('click', function () {
    const estaAbierto = boton.getAttribute('aria-expanded') === 'true';

    if (estaAbierto) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  });

  // Al elegir una opción, el menú se cierra
  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', cerrarMenu);
  });

  // La tecla Esc también lo cierra
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && menu.classList.contains('is-open')) {
      cerrarMenu();
      boton.focus();
    }
  });

  // Si se agranda la ventana a tamaño escritorio, se resetea el estado
  const escritorio = window.matchMedia('(min-width: 1024px)');
  escritorio.addEventListener('change', function (evento) {
    if (evento.matches) {
      cerrarMenu();
    }
  });
}


/* --------------------------------------------------------------------------
   4. HEADER QUE SE ACHICA AL HACER SCROLL
   Al bajar más de 40px se agrega la clase "is-scrolled" (ver CSS).
   -------------------------------------------------------------------------- */
function iniciarHeaderScroll() {
  const header = document.querySelector('.site-header');

  if (!header) {
    return;
  }

  function actualizarHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }

  actualizarHeader(); // por si la página se carga ya scrolleada
  window.addEventListener('scroll', actualizarHeader, { passive: true });
}


/* --------------------------------------------------------------------------
   5. APARICIÓN AL HACER SCROLL
   IntersectionObserver "avisa" cuando un elemento entra en la pantalla.
   En ese momento se le agrega la clase "is-visible" y se deja de observar.
   -------------------------------------------------------------------------- */
function iniciarAparicion() {
  const elementos = document.querySelectorAll('.reveal');

  // Navegadores muy viejos: se muestran todos directamente
  if (!('IntersectionObserver' in window)) {
    elementos.forEach(function (elemento) {
      elemento.classList.add('is-visible');
    });
    return;
  }

  const observador = new IntersectionObserver(function (entradas, obs) {
    entradas.forEach(function (entrada) {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('is-visible');
        obs.unobserve(entrada.target); // la animación ocurre una sola vez
      }
    });
  }, {
    threshold: 0.1,                     // 10% del elemento visible
    rootMargin: '0px 0px -40px 0px'     // se activa un poco antes del borde
  });

  elementos.forEach(function (elemento) {
    observador.observe(elemento);
  });
}


/* --------------------------------------------------------------------------
   6. LIGHTBOX DE LA GALERÍA
   Cada obra es un link a su imagen grande. Con JavaScript, en lugar de abrir
   la imagen sola, se muestra dentro de una ventana modal.
   Se cierra con la X, con Esc o con un clic afuera; las flechas (en pantalla
   o del teclado) pasan a la obra anterior/siguiente.
   -------------------------------------------------------------------------- */
function iniciarLightbox() {
  const lightbox = document.getElementById('lightbox');
  const enlaces = Array.from(document.querySelectorAll('.galeria__enlace'));

  // Si la página no tiene galería, no se hace nada
  if (!lightbox || enlaces.length === 0) {
    return;
  }

  const imagen = lightbox.querySelector('.lightbox__imagen');
  const texto = lightbox.querySelector('.lightbox__texto');
  const botonCerrar = lightbox.querySelector('.lightbox__cerrar');
  const botonAnterior = lightbox.querySelector('.lightbox__flecha--anterior');
  const botonSiguiente = lightbox.querySelector('.lightbox__flecha--siguiente');

  let indiceActual = 0;
  let elementoConFoco = null; // para devolver el foco al cerrar

  // Carga en el lightbox la obra de la posición indicada
  function mostrarObra(indice) {
    // El resto (%) hace que después de la última vuelva a la primera y viceversa
    indiceActual = (indice + enlaces.length) % enlaces.length;

    const enlace = enlaces[indiceActual];
    const miniatura = enlace.querySelector('img');
    const figura = enlace.closest('figure');

    imagen.src = enlace.getAttribute('href');
    imagen.alt = miniatura.alt;

    // Se arma el epígrafe con textContent (más seguro que innerHTML)
    const titulo = document.createElement('strong');
    titulo.textContent = figura.querySelector('.galeria__titulo').textContent;

    const autor = document.createElement('span');
    autor.textContent = figura.querySelector('.galeria__autor').textContent +
      ' — ' + (indiceActual + 1) + ' de ' + enlaces.length;

    texto.replaceChildren(titulo, autor);
  }

  function abrirLightbox(indice) {
    elementoConFoco = document.activeElement;
    mostrarObra(indice);
    lightbox.hidden = false;
    document.body.classList.add('sin-scroll');
    botonCerrar.focus();
  }

  function cerrarLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove('sin-scroll');

    if (elementoConFoco) {
      elementoConFoco.focus();
    }
  }

  // Clic en cada obra de la grilla
  enlaces.forEach(function (enlace, indice) {
    enlace.addEventListener('click', function (evento) {
      evento.preventDefault(); // evita que se abra la imagen sola
      abrirLightbox(indice);
    });
  });

  botonCerrar.addEventListener('click', cerrarLightbox);

  botonAnterior.addEventListener('click', function () {
    mostrarObra(indiceActual - 1);
  });

  botonSiguiente.addEventListener('click', function () {
    mostrarObra(indiceActual + 1);
  });

  // Clic afuera: solo si se hizo clic en el fondo oscuro, no en la imagen
  lightbox.addEventListener('click', function (evento) {
    if (evento.target === lightbox) {
      cerrarLightbox();
    }
  });

  // Teclado: Esc cierra, flechas izquierda/derecha cambian de obra
  document.addEventListener('keydown', function (evento) {
    if (lightbox.hidden) {
      return;
    }

    if (evento.key === 'Escape') {
      cerrarLightbox();
    } else if (evento.key === 'ArrowLeft') {
      mostrarObra(indiceActual - 1);
    } else if (evento.key === 'ArrowRight') {
      mostrarObra(indiceActual + 1);
    }
  });
}


/* --------------------------------------------------------------------------
   7. FORMULARIOS DESACTIVADOS (mientras PHP está apagado)
   Los formularios de login y contacto funcionan con PHP, que por ahora está
   desactivado. Los formularios marcados con el
   atributo data-desactivado no se envían: si pasan la validación HTML5,
   se muestra el aviso (.aviso) que tienen adentro.
   -------------------------------------------------------------------------- */
function iniciarFormulariosDesactivados() {
  const formularios = document.querySelectorAll('form[data-desactivado]');

  formularios.forEach(function (formulario) {
    const aviso = formulario.querySelector('.aviso');

    // El evento "submit" solo ocurre si la validación nativa fue correcta
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();   // no se envía a ningún lado

      if (aviso) {
        aviso.hidden = false;
      }
    });
  });
}


/* --------------------------------------------------------------------------
   8. INICIO
   -------------------------------------------------------------------------- */
marcarLinkActivo();
iniciarMenu();
iniciarHeaderScroll();
iniciarAparicion();
iniciarLightbox();
iniciarFormulariosDesactivados();
