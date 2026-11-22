(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Organic results ---------- */
  const results = Array.isArray(window.RESULTS) ? window.RESULTS : [];
  const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const allShots = [];
  if (results.length) {
    $("#results").hidden = false;
    const grid = $("#gallery");
    results.forEach((r, i) => {
      const shots = (r.shots || []).map(src => { allShots.push({ src, caption: `${r.brand} · ${r.platform} · ${r.period}` }); return allShots.length - 1; });
      const h = r.hero || {};
      const card = document.createElement("article");
      card.className = "rcard reveal";
      card.innerHTML = `
        <div class="rcard__head">
          <span class="rcard__platform">${esc(r.platform)}</span>
          <span class="rcard__period">${esc(r.period)}</span>
          <span class="rcard__organic">0 ads · Organic</span>
        </div>
        <div class="rcard__id">
          <span class="rcard__num">${String(i + 1).padStart(2, "0")}</span>
          <div><h3>${esc(r.brand)}</h3><p>${esc(r.sector)}${r.country ? " · " + esc(r.country) : ""}</p></div>
        </div>
        <div class="rcard__goal"><span>Goal</span>${esc(r.goal)}</div>
        <div class="rcard__hero">
          <b data-count="${h.value}" data-decimals="${h.decimals || 0}" data-suffix="${esc(h.suffix || "")}">0</b>
          <span>${esc(h.label)}</span>
        </div>
        ${r.outcome ? `<div class="rcard__outcome">✓ ${esc(r.outcome)}</div>` : ""}
        <ul class="rcard__metrics">${(r.metrics || []).map(m => `<li><b>${esc(m.value)}</b><span>${esc(m.label)}</span></li>`).join("")}</ul>
        <p class="rcard__note">${esc(r.note)}</p>
        ${shots.length ? `<button type="button" class="rcard__proof js-shot" data-index="${shots[0]}">View dashboard proof <span>↗</span></button>` : ""}`;
      grid.appendChild(card);
    });
  } else {
    $$(".js-results-link").forEach(a => a.remove());
  }

  /* ---------- Split words ---------- */
  $$(".split-words").forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const inner = document.createElement("span"); inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    $$(".w > span", el).forEach((s, i) => (s.style.transitionDelay = `${i * 0.035}s`));
  });

  /* ---------- Preloader ---------- */
  const loader = $(".loader");
  const countEl = $("#loaderCount");
  const barEl = $("#loaderBar");
  const start = performance.now();
  const DURATION = reduce ? 1 : 1300;
  const finish = () => {
    loader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    setTimeout(() => loader.remove(), 1100);
  };
  const tickLoader = now => {
    const p = Math.min(1, (now - start) / DURATION);
    const eased = 1 - Math.pow(1 - p, 3);
    countEl.textContent = Math.round(eased * 100);
    barEl.style.width = eased * 100 + "%";
    if (p < 1) requestAnimationFrame(tickLoader);
    else setTimeout(finish, 150);
  };
  requestAnimationFrame(tickLoader);

  /* ---------- Count up ---------- */
  const fmt = (n, dec) => dec ? n.toFixed(dec) : Math.round(n).toLocaleString("en-US");
  const countUp = el => {
    if (el.dataset.done) return;
    el.dataset.done = 1;
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    if (reduce) { el.textContent = pre + fmt(target, dec) + suf; return; }
    const t0 = performance.now(), dur = 1800;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + fmt(target * e, dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add("is-in");
      if (el.dataset.count !== undefined) countUp(el);
      $$("[data-count]", el).forEach(countUp);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  // stagger siblings
  $$(".stats, .featured__meta, .services__list, .certs, .rgrid, .goals, .timeline").forEach(group => {
    $$(".reveal", group).forEach((el, i) => (el.style.transitionDelay = `${(i % 6) * 0.08}s`));
  });
  $$(".reveal, .split-words, .contact__title .line, [data-count], .case").forEach(el => io.observe(el));

  /* ---------- Rotating word ---------- */
  const words = ["scroll-stoppers.", "conversations.", "communities.", "sales machines.", "household names."];
  const rot = $(".rotator__word");
  if (rot && !reduce) {
    let i = 0;
    setInterval(() => {
      rot.classList.add("is-out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        rot.textContent = words[i];
        rot.classList.remove("is-out");
        rot.classList.add("is-pre");
        void rot.offsetWidth;
        rot.classList.remove("is-pre");
      }, 450);
    }, 2600);
  }

  /* ---------- Scroll: progress, nav, timeline, case stack ---------- */
  const nav = $("#nav");
  const bar = $("#progressBar");
  const tFill = $("#timelineFill");
  const timeline = $(".timeline");
  const cases = $$(".case");
  let lastY = window.scrollY, ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (!menu.classList.contains("is-open")) {
      nav.classList.toggle("is-hidden", y > lastY && y > 300);
    }
    lastY = y;

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
      tFill.style.transform = `scaleY(${p})`;
    }

    if (!reduce && innerWidth > 860) {
      cases.forEach((c, i) => {
        const next = cases[i + 1];
        if (!next) return;
        const nr = next.getBoundingClientRect();
        const cr = c.getBoundingClientRect();
        const overlap = Math.min(1, Math.max(0, (cr.bottom - nr.top) / cr.height));
        c.style.transform = `scale(${1 - overlap * 0.06})`;
        c.style.filter = `brightness(${1 - overlap * 0.12})`;
      });
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const menu = $("#menu");
  const toggleMenu = open => {
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggleMenu(!menu.classList.contains("is-open")));
  $$("a", menu).forEach(a => a.addEventListener("click", () => toggleMenu(false)));
  onScroll();

  /* ---------- Hero chips parallax ---------- */
  const chips = $$(".chip");
  if (finePointer && !reduce) {
    window.addEventListener("mousemove", e => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      chips.forEach(c => {
        const d = parseFloat(c.dataset.depth || 1) * 30;
        c.style.transform = `translate(${x * d}px, ${y * d}px)`;
      });
    });
  }

  /* ---------- Custom cursor + magnetic ---------- */
  if (finePointer && !reduce) {
    const cursor = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring");
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`; });
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("mouseover", e => {
      cursor.classList.toggle("is-hover", !!e.target.closest("a, button, .kpi, .pills span, .rcard"));
      cursor.classList.toggle("is-dark", !!e.target.closest(".featured, .contact, .marquee, .service:hover"));
    });

    $$(".magnetic").forEach(el => {
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });

    // subtle tilt on KPI cards
    $$(".kpi").forEach(k => {
      k.addEventListener("mousemove", e => {
        const r = k.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        k.style.transform = `translateY(-4px) perspective(600px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
      });
      k.addEventListener("mouseleave", () => (k.style.transform = ""));
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
  let current = 0;
  const show = i => {
    if (!allShots.length) return;
    current = (i + allShots.length) % allShots.length;
    const r = allShots[current];
    lbImg.src = r.src; lbImg.alt = r.caption;
    lbCap.textContent = r.caption;
  };
  const openLb = i => { show(i); lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; };
  const closeLb = () => { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; };
  $("#gallery").addEventListener("click", e => { const s = e.target.closest(".js-shot"); if (s) openLb(+s.dataset.index); });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", () => show(current - 1));
  $("#lbNext").addEventListener("click", () => show(current + 1));
  lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("is-open")) { if (e.key === "Escape") toggleMenu(false); return; }
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
})();
