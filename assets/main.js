/* Ferdinand Baudrexl Metalltechnik — Kundenseite. Alles additiv: ohne JS bleibt die Seite lesbar.
   Kein Cookie, nichts im Browser-Speicher. */
(function(){
  'use strict';
  var sanft = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function istMobil(){ return window.matchMedia('(max-width:900px)').matches; }

  /* ---------- Reveal (Text) + Schnitt-Reveal (Bilder) — Overlay erst in der Nähe ---------- */
  function reveal(){
    var el = document.querySelectorAll('.rv, .bildbox');
    if (sanft || !('IntersectionObserver' in window)){ el.forEach(function(n){ n.classList.add('da'); }); return; }
    var beo = new IntersectionObserver(function(ein){
      ein.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('da'); beo.unobserve(e.target); } });
    }, { rootMargin: '400px 0px -6% 0px', threshold: 0 });
    el.forEach(function(n){ beo.observe(n); });
    setTimeout(function(){ el.forEach(function(n){ n.classList.add('da'); }); }, 2500);
  }

  /* ---------- Wörter aufteilen (nur Textknoten) ---------- */
  function worteTeilen(wurzel){
    var lauf = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT, null), knoten = [], n;
    while ((n = lauf.nextNode())) if (n.nodeValue.trim()) knoten.push(n);
    knoten.forEach(function(t){
      var frag = document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function(s){
        if (!s.trim()){ frag.appendChild(document.createTextNode(s)); return; }
        var sp = document.createElement('span'); sp.className = 'w'; sp.textContent = s; frag.appendChild(sp);
      });
      t.parentNode.replaceChild(frag, t);
    });
  }

  /* ---------- Statement füllt sich wortweise ---------- */
  function statement(){
    var s = document.querySelector('.statement'); if (!s) return;
    worteTeilen(s);
    var w = s.querySelectorAll('.w'); if (!w.length) return;
    if (sanft){ w.forEach(function(x){ x.classList.add('an'); }); return; }
    function mal(){
      var r = s.getBoundingClientRect(), h = window.innerHeight;
      var p = Math.max(0, Math.min(1, (h * 0.82 - r.top) / (h * 0.5 + r.height)));
      var bis = Math.round(p * w.length);
      w.forEach(function(x, i){ x.classList.toggle('an', i < bis); });
    }
    window.addEventListener('scroll', mal, { passive: true }); window.addEventListener('resize', mal); mal(); setTimeout(mal, 300);
  }

  /* ---------- Die Baugruppe: Explosionszeichnung baut sich beim Scrollen zusammen ---------- */
  function baugruppe(){
    var blatt = document.querySelector('.blatt'); if (!blatt) return;
    var teile = blatt.querySelectorAll('.expl .teilg[data-dx]');
    var naht = blatt.querySelector('.expl .naht');
    var lack = blatt.querySelector('.expl .lack');
    var ballons = blatt.querySelectorAll('.expl .ballon');
    var zeilen = blatt.querySelectorAll('.posliste tbody tr');
    var ablese = blatt.querySelector('[data-montage]');
    if (!teile.length) return;
    function lin(p, a, b){ return Math.max(0, Math.min(1, (p - a) / (b - a))); }
    function ease(t){ return 1 - Math.pow(1 - t, 3); }
    function setze(p){
      blatt.style.setProperty('--p', p.toFixed(4));
      teile.forEach(function(g){
        var i = parseInt(g.getAttribute('data-i'), 10) || 0;
        var dx = parseFloat(g.getAttribute('data-dx')), dy = parseFloat(g.getAttribute('data-dy'));
        var q = ease(lin(p, 0.05 + i * 0.12, 0.42 + i * 0.12));
        g.setAttribute('transform', 'translate(' + (dx * (1 - q)).toFixed(1) + ' ' + (dy * (1 - q)).toFixed(1) + ')');
      });
      if (naht){ var qn = lin(p, 0.62, 0.8); naht.setAttribute('stroke-dashoffset', (200 * (1 - qn)).toFixed(1)); naht.setAttribute('opacity', qn > 0 ? '1' : '0'); }
      if (lack){ lack.setAttribute('opacity', (0.55 * lin(p, 0.8, 0.95)).toFixed(2)); }
      var stufe = Math.min(zeilen.length, Math.floor(p * (zeilen.length + 0.4)));
      zeilen.forEach(function(tr, i){ tr.classList.toggle('an', i < stufe); });
      ballons.forEach(function(b){ b.classList.toggle('an', (parseInt(b.getAttribute('data-pos'), 10) - 1) < stufe); });
      if (ablese) ablese.textContent = Math.round(Math.min(1, p / 0.95) * 100) + ' %';
      blatt.classList.toggle('montiert', p >= 0.95);
    }
    if (sanft){ setze(1); return; }
    function mal(){
      var r = blatt.getBoundingClientRect(), h = window.innerHeight;
      /* Fortschritt aus dem Weg des Blatts durchs Fenster — keine klebende Bühne */
      var p = (h * 0.92 - r.top) / (h * 0.5 + r.height * 0.35);
      setze(Math.max(0, Math.min(1, p)));
    }
    window.addEventListener('scroll', mal, { passive: true }); window.addEventListener('resize', mal); mal(); setTimeout(mal, 300);
    /* Ballon ↔ Zeile: Überfahren hebt beide hervor */
    function hervor(i, an){
      zeilen.forEach(function(tr, k){ tr.classList.toggle('hier', an && k === i); });
      ballons.forEach(function(b){ b.classList.toggle('hier', an && (parseInt(b.getAttribute('data-pos'), 10) - 1) === i); });
      var gruppe = {0: 0, 1: 1, 2: 2, 3: 0, 4: 4}[i];
      teile.forEach(function(g){ g.style.opacity = an && parseInt(g.getAttribute('data-i'), 10) !== gruppe ? '.35' : ''; });
    }
    ballons.forEach(function(b){ var i = parseInt(b.getAttribute('data-pos'), 10) - 1; b.addEventListener('mouseenter', function(){ hervor(i, true); }); b.addEventListener('mouseleave', function(){ hervor(i, false); }); });
    zeilen.forEach(function(tr, i){ tr.addEventListener('mouseenter', function(){ hervor(i, true); }); tr.addEventListener('mouseleave', function(){ hervor(i, false); }); });
  }

  /* ---------- Laufkarte: Stempel fallen nacheinander ---------- */
  function laufkarte(){
    var lk = document.querySelector('.laufkarte'); if (!lk) return;
    var s = lk.querySelectorAll('.lk-schritt'); if (!s.length) return;
    if (sanft || !('IntersectionObserver' in window)){ s.forEach(function(x){ x.classList.add('an'); }); return; }
    var beo = new IntersectionObserver(function(ein){
      ein.forEach(function(e){
        if (!e.isIntersecting) return; beo.unobserve(e.target);
        s.forEach(function(x, i){ setTimeout(function(){ x.classList.add('an'); }, 350 + i * 320); });
      });
    }, { threshold: 0.3 });
    beo.observe(lk);
    setTimeout(function(){ s.forEach(function(x){ x.classList.add('an'); }); }, 4000);
  }

  /* ---------- Zähler ---------- */
  function zaehler(){
    var z = document.querySelectorAll('[data-zahl]'); if (!z.length) return;
    if (sanft || !('IntersectionObserver' in window)){ z.forEach(function(n){ n.textContent = n.getAttribute('data-zahl'); }); return; }
    var beo = new IntersectionObserver(function(ein){
      ein.forEach(function(e){
        if (!e.isIntersecting) return; beo.unobserve(e.target);
        var ziel = e.target.getAttribute('data-zahl'), num = parseFloat(ziel.replace(/[^\d.]/g, ''));
        if (!isFinite(num)){ e.target.textContent = ziel; return; }
        var suf = ziel.replace(/[\d.,]/g, ''), t0 = null;
        function schritt(t){ if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 900);
          e.target.textContent = Math.round(num * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(schritt); else e.target.textContent = ziel; }
        requestAnimationFrame(schritt); setTimeout(function(){ e.target.textContent = ziel; }, 1600);
      });
    }, { threshold: 0.4 });
    z.forEach(function(n){ beo.observe(n); });
  }

  /* ---------- Cursor: Einstichpunkt ---------- */
  function punkt(){
    if (sanft || istMobil() || !window.matchMedia('(pointer:fine)').matches) return;
    var w = document.createElement('div'); w.className = 'punkt'; w.setAttribute('aria-hidden', 'true'); document.body.appendChild(w);
    var x = 0, y = 0, zx = 0, zy = 0, laeuft = false;
    document.addEventListener('mousemove', function(e){
      zx = e.clientX; zy = e.clientY; w.classList.add('an');
      if (!laeuft){ laeuft = true; requestAnimationFrame(folge); }
      w.classList.toggle('griff', !!e.target.closest('a, button, summary, .chip, input, textarea, select, .ballon, .posliste tr'));
    });
    document.addEventListener('mouseleave', function(){ w.classList.remove('an'); });
    function folge(){ x += (zx - x) * 0.3; y += (zy - y) * 0.3;
      w.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)'; laeuft = false;
      if (Math.abs(zx - x) > 0.4 || Math.abs(zy - y) > 0.4){ laeuft = true; requestAnimationFrame(folge); } }
  }

  /* ---------- Mobilmenü ---------- */
  function mobilmenu(){
    var auf = document.querySelector('.burger'), menu = document.getElementById('mobilmenu'); if (!auf || !menu) return;
    function schalte(offen){
      menu.classList.toggle('offen', offen); document.body.classList.toggle('menu-offen', offen);
      auf.setAttribute('aria-expanded', offen ? 'true' : 'false'); document.body.style.overflow = offen ? 'hidden' : '';
    }
    auf.addEventListener('click', function(){ schalte(!menu.classList.contains('offen')); });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ schalte(false); }); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') schalte(false); });
  }

  /* ---------- Seitenwechsel: der Schnitt läuft von rechts ---------- */
  function wechsel(){
    if (sanft) return;
    var f = document.createElement('div'); f.className = 'wechsel'; f.setAttribute('aria-hidden', 'true'); document.body.appendChild(f);
    document.addEventListener('click', function(e){
      var a = e.target.closest('a'); if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || a.target === '_blank' || /^(mailto:|tel:|https?:)/.test(href)) return;
      e.preventDefault(); f.classList.add('laeuft'); setTimeout(function(){ window.location.href = href; }, 420);
    });
  }

  /* ---------- Anfrageformular: POST an den Formular-Dienst (kunden-formular Worker), Rücksprung ?gesendet=1 / ?fehler=1 ---------- */
  function formular(){
    var form = document.querySelector('form.anfrage'); if (!form) return;
    var box = form.querySelector('.meldung');
    var ts = form.querySelector('input[name="ts"]'); if (ts) ts.value = String(Date.now());
    function zeigen(art, teile){
      if (!box) return;
      box.className = 'meldung ' + art; box.hidden = false; box.textContent = '';
      teile.forEach(function(t){ box.appendChild(t); });
      box.setAttribute('tabindex', '-1'); box.focus({ preventScroll: true });
      box.scrollIntoView({ block: 'center', behavior: sanft ? 'auto' : 'smooth' });
    }
    function text(t){ return document.createTextNode(t); }
    function link(href, t){ var a = document.createElement('a'); a.href = href; a.textContent = t; return a; }
    form.addEventListener('submit', function(e){
      var fehlend = [], namen = [];
      form.querySelectorAll('[required]').forEach(function(f){
        var leer = !String(f.value || '').trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        f.classList.toggle('fehlt', leer);
        if (leer){ fehlend.push(f); namen.push(f.getAttribute('data-name') || f.name); }
      });
      if (fehlend.length){
        e.preventDefault();
        zeigen('fehler', [text(fehlend.length === 1 ? 'Da fehlt noch etwas: ' + namen[0] + '.' : 'Bitte noch ausfüllen: ' + namen.join(', ') + '.')]);
        fehlend[0].focus();
        return;
      }
      var knopf = form.querySelector('button[type="submit"]');
      if (knopf){ knopf.disabled = true; knopf.style.opacity = '.6'; }
    });
    var q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
    if (q.has('gesendet') || q.has('fehler')){
      if (q.has('gesendet')){
        zeigen('ok', [text('Danke, Ihre Anfrage ist angekommen. Wir melden uns mit Preis und Termin. Die Zeichnung können Sie jetzt an '),
          link('mailto:' + form.getAttribute('data-mail'), form.getAttribute('data-mail')), text(' schicken.')]);
        form.reset();
      } else {
        zeigen('fehler', [text('Das hat leider nicht geklappt. Rufen Sie bitte an unter '), link('tel:' + form.getAttribute('data-tel-link'), form.getAttribute('data-tel')),
          text(' oder schreiben Sie an '), link('mailto:' + form.getAttribute('data-mail'), form.getAttribute('data-mail')), text('.')]);
      }
      try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    }
    form.addEventListener('input', function(e){ if (e.target && e.target.classList) e.target.classList.remove('fehlt'); });
  }

  /* ---------- Seitenaufrufe zählen — ohne Cookies, ohne Speicher im Browser, ohne IP und ohne Kennung.
     Eigener Zähler der HandwerksManufaktur (Worker seiten-zaehler); beschrieben in der Datenschutzerklärung.
     Zählt nur auf der echten Domain, nicht in der Vorschau und nicht lokal. ---------- */
  function zaehlen(){
    if (!/(^|\.)metalltechnik-baudrexl\.de$/.test(location.hostname)) return;
    var r = 'direkt';
    try {
      var q = new URLSearchParams(location.search);
      if (q.get('utm_source')) r = 'utm:' + q.get('utm_source');
      else if (document.referrer){ var h = new URL(document.referrer).hostname.replace(/^www\./, ''); if (h && h !== location.hostname) r = h; }
    } catch (e) {}
    var d = JSON.stringify({ t: 'v', s: location.hostname, p: location.pathname, g: innerWidth < 768 ? 'm' : 'd',
      id: Math.random().toString(36).slice(2, 12), r: r });
    var Z = 'https://seiten-zaehler.handwerksmanufaktur.workers.dev/z';
    try { if (!(navigator.sendBeacon && navigator.sendBeacon(Z, new Blob([d], { type: 'text/plain' })))) fetch(Z, { method: 'POST', body: d, keepalive: true, mode: 'no-cors' }); } catch (e) {}
  }
  function videos(){ if (!sanft) return; document.querySelectorAll('video').forEach(function(v){ v.pause(); v.removeAttribute('autoplay'); }); }

  function los(){
    reveal(); statement(); baugruppe(); laufkarte(); zaehler(); punkt(); mobilmenu(); wechsel(); formular(); videos(); zaehlen();
    document.documentElement.classList.add('js-lebt');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
})();
