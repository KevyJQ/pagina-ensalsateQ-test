/* Comportamiento compartido de las subpáginas de EnsalsateQ.
   (index.html lleva su propio script, con piezas que solo existen en la portada.)
   Sin movimiento (prefers-reduced-motion, sin GSAP o ?sinmov) la página se ve completa y funciona igual. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || location.search.indexOf('sinmov') !== -1;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var motion = !!(window.gsap && window.ScrollTrigger && window.SplitText && window.ScrollToPlugin && window.CustomEase) && !reduce;
  var WA = '524421047299';

  /* ---- Menú móvil ---- */
  var nav = document.querySelector('.nav'), menuBtn = nav.querySelector('.menu-btn');
  function toggleMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  menuBtn.addEventListener('click', function () { toggleMenu(!nav.classList.contains('open')); });
  nav.querySelectorAll('ul a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggleMenu(false); });

  /* ---- Aviso (toast) ---- */
  var toastEl = document.getElementById('toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 5200);
  }

  /* ---- Formularios que abren WhatsApp con el mensaje armado ----
     <form data-wa="Quiero información de X">; los campos con data-label entran al mensaje. */
  document.querySelectorAll('form[data-wa]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = form.elements.nombre ? form.elements.nombre.value.trim() : '';
      var partes = ['Hola' + (nombre ? ', soy ' + nombre : '') + '. ' + form.dataset.wa + '.'];
      form.querySelectorAll('[data-label]').forEach(function (f) {
        if (f.value.trim()) partes.push(f.dataset.label + ': ' + f.value.trim() + '.');
      });
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(partes.join(' ')), '_blank', 'noopener');
      toast('Abrimos WhatsApp con tu mensaje listo. Solo falta que lo envíes.');
    });
  });

  /* ---- Volver arriba y aviso de WhatsApp ---- */
  var toTop = document.querySelector('.to-top');
  toTop.addEventListener('click', function () {
    if (motion) gsap.to(window, { scrollTo: 0, duration: 1.2, ease: 'power3.inOut' });
    else window.scrollTo({ top: 0 });
  });
  window.addEventListener('scroll', function () { toTop.classList.toggle('show', window.scrollY > 900); }, { passive: true });
  var waTip = document.querySelector('.wa-tip');
  try { if (!sessionStorage.getItem('ensal-tip')) {
    setTimeout(function () { waTip.classList.add('show'); setTimeout(function () { waTip.classList.remove('show'); }, 6000); sessionStorage.setItem('ensal-tip', '1'); }, 6500);
  } } catch (e) {}

  if (!motion) return;

  /* =====================================================
     Movimiento (GSAP): mismo lenguaje que la portada
     ===================================================== */
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText, CustomEase);
  CustomEase.create('emilOut', '0.23,1,0.32,1');
  CustomEase.create('emilInOut', '0.77,0,0.175,1');
  doc.classList.add('motion');

  try {
    /* Anclas de la misma página: desplazamiento suave con el encabezado fijo */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var h = a.getAttribute('href'); if (h.length < 2) return;
      a.addEventListener('click', function (e) {
        var t = document.querySelector(h); if (!t) return;
        e.preventDefault(); toggleMenu(false);
        gsap.to(window, { scrollTo: { y: t, offsetY: parseInt(getComputedStyle(t).scrollMarginTop, 10) || 76 }, duration: 1.1, ease: 'emilInOut' });
        history.replaceState(null, '', h);
      });
    });

    /* Barra de progreso de lectura */
    gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .2 } });

    /* Entrada de la cabecera de la página */
    var hero = document.querySelector('.page-hero');
    if (hero) {
      var tl = gsap.timeline({ defaults: { ease: 'emilOut' } });
      var h1 = hero.querySelector('h1');
      if (h1) {
        var hs = SplitText.create(h1, { type: 'words', mask: 'words', wordsClass: 'hw' });
        /* Blur a nítido: autorizado por el usuario aunque usa filter; se limpia al terminar */
        tl.from(hs.words, { yPercent: 115, rotate: 3, filter: 'blur(14px)', duration: 1, stagger: .08, clearProps: 'filter' }, .05);
      }
      tl.from(hero.querySelectorAll('.lead, .actions .btn, .chips li'), { y: 22, opacity: 0, duration: .8, stagger: .08 }, .5);
      var ph = hero.querySelector('.page-photo');
      if (ph) {
        tl.from(ph, { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'emilInOut' }, .1)
          .from(ph.querySelector('img'), { scale: 1.25, duration: 1.6 }, .1);
      }
    }

    /* Títulos de sección: línea por línea con máscara */
    gsap.utils.toArray('.split-title').forEach(function (h) {
      SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 115, duration: 1, stagger: .09, ease: 'emilOut',
            scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
        } });
    });

    /* Fotos: se destapan al entrar */
    gsap.utils.toArray('.reveal-img').forEach(function (el) {
      var st = { trigger: el, start: 'top 85%', once: true };
      gsap.from(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'emilInOut', scrollTrigger: st });
      var img = el.querySelector('img'); if (img) gsap.from(img, { scale: 1.25, duration: 1.6, ease: 'emilOut', scrollTrigger: st });
    });

    /* Listas: entran en cascada */
    ['.rows li', '.checks li', '.steps-simple li'].forEach(function (sel) {
      var els = gsap.utils.toArray(sel); if (!els.length) return;
      gsap.set(els, { opacity: 0, x: -30 });
      ScrollTrigger.batch(els, { start: 'top 92%', once: true,
        onEnter: function (b) { gsap.to(b, { opacity: 1, x: 0, duration: .8, stagger: { each: .07, ease: 'power1.out' }, ease: 'emilOut', overwrite: true, clearProps: 'opacity,transform' }); } });
    });

    /* Marca del pie: se escribe sola */
    var wm = gsap.timeline({ scrollTrigger: { trigger: 'footer', start: 'top 80%', once: true } });
    wm.fromTo('.wordmark .fill', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 2.6, ease: 'power2.inOut' })
      .fromTo('.wm-spark', { opacity: 0, scale: .8, rotation: -20 }, { opacity: 1, scale: 1, rotation: 0, duration: .6, stagger: { each: .18, ease: 'power1.out' }, ease: 'emilOut' }, 1.4);

    /* Solo con mouse: cursor con anillo y botones magnéticos */
    if (canHover) {
      doc.classList.add('has-cursor');
      var cur = document.querySelector('.cursor');
      var cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
      window.addEventListener('pointermove', function (e) {
        cx(e.clientX); cy(e.clientY); cur.classList.add('on');
        cur.classList.toggle('link', !!(e.target.closest && e.target.closest('a, button, summary')));
      }, { passive: true });
      document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });

      document.querySelectorAll('.page-hero .btn, .nav .btn').forEach(function (b) {
        var bx = gsap.quickTo(b, 'x', { duration: .4, ease: 'power3' }), by = gsap.quickTo(b, 'y', { duration: .4, ease: 'power3' });
        b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); bx((e.clientX - r.left - r.width / 2) * .25); by((e.clientY - r.top - r.height / 2) * .35); });
        b.addEventListener('pointerleave', function () { bx(0); by(0); gsap.to(b, { scale: 1, duration: .2 }); });
        b.addEventListener('pointerdown', function () { gsap.to(b, { scale: .97, duration: .1 }); });
        b.addEventListener('pointerup', function () { gsap.to(b, { scale: 1, duration: .25, ease: 'emilOut' }); });
      });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } catch (err) {
    console.warn('Animaciones desactivadas:', err);
    doc.classList.remove('motion');
  }
})();
