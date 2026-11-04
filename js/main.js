/* ============================================================
   GIFFORD PT - interactions (kept deliberately minimal)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Header shadow + back-to-top on scroll ---------- */
  const nav = document.getElementById("siteNav");
  const toTop = document.getElementById("toTop");
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 8);
    toTop.classList.toggle("show", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  function setMenu(open) {
    navToggle.classList.toggle("open", open);
    mobileMenu.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.inert = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }
  setMenu(false);
  navToggle.addEventListener("click", () =>
    setMenu(!mobileMenu.classList.contains("open"))
  );
  mobileMenu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => setMenu(false))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("open")) setMenu(false);
  });
  window.matchMedia("(min-width: 761px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Scroll-spy: highlight the current section ---------- */
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const btn = item.querySelector(".faq-q");
    const answer = item.querySelector(".faq-a");
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((other) => {
        if (other === item) return;
        other.classList.remove("open");
        other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        other.querySelector(".faq-a").style.maxHeight = "0px";
      });
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
      answer.style.maxHeight = isOpen ? "0px" : answer.scrollHeight + "px";
    });
  });
  window.addEventListener("resize", () => {
    const open = document.querySelector(".faq-item.open .faq-a");
    if (open) open.style.maxHeight = open.scrollHeight + "px";
  });

  /* ---------- Photo gallery: click a thumbnail to switch ---------- */
  const galleryMain = document.getElementById("galleryMain");
  const thumbs = Array.from(document.querySelectorAll(".gthumb"));
  if (galleryMain && thumbs.length) {
    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const src = thumb.dataset.src;
        if (src) galleryMain.src = src;
        const img = thumb.querySelector("img");
        if (img && img.alt) galleryMain.alt = img.alt;
        thumbs.forEach((t) => t.classList.toggle("is-active", t === thumb));
      });
    });
  }

  /* ---------- Swipeable photo sets (client progress) ---------- */
  document.querySelectorAll("[data-swiper]").forEach((sw) => {
    const track = sw.querySelector(".swiper-track");
    const slides = sw.querySelectorAll(".swiper-slide");
    const prev = sw.querySelector(".swiper-prev");
    const next = sw.querySelector(".swiper-next");
    const hint = sw.querySelector(".swiper-hint");
    const n = slides.length;
    let i = 0;

    function go(k) {
      i = Math.max(0, Math.min(n - 1, k));
      track.style.transform = "translateX(" + -i * 100 + "%)";
      if (prev) prev.hidden = i === 0;
      if (next) next.hidden = i === n - 1;
      if (hint) hint.style.opacity = i === 0 ? "1" : "0";
    }
    if (next) next.addEventListener("click", () => go(i + 1));
    if (prev) prev.addEventListener("click", () => go(i - 1));

    // pointer / touch swipe
    let x0 = null;
    track.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    window.addEventListener("pointerup", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    go(0);
  });

  /* ---------- Client-stories carousel: shows a few boxes, slides one along ---------- */
  document.querySelectorAll("[data-stories]").forEach((car) => {
    const viewport = car.querySelector(".stories-viewport");
    const track = car.querySelector(".stories-track");
    const cells = Array.from(track.children);
    const prev = car.querySelector(".stories-prev");
    const next = car.querySelector(".stories-next");
    const hint = car.querySelector(".review-hint");
    let index = 0;

    // Width of one card + its gap, measured live so it stays right at any breakpoint
    function step() {
      if (cells.length < 2) return cells.length ? cells[0].getBoundingClientRect().width : 0;
      return cells[1].getBoundingClientRect().left - cells[0].getBoundingClientRect().left;
    }
    function visible() {
      const s = step();
      return s ? Math.max(1, Math.round(viewport.getBoundingClientRect().width / s)) : 1;
    }
    function maxIndex() { return Math.max(0, cells.length - visible()); }
    function update() {
      index = Math.max(0, Math.min(index, maxIndex()));
      track.style.transform = "translateX(" + (-index * step()) + "px)";
      if (prev) prev.hidden = index <= 0;
      if (next) next.hidden = index >= maxIndex();
      // Hide the arrows/hint entirely when everything already fits
      const canSlide = maxIndex() > 0;
      if (hint) hint.hidden = !canSlide;
      if (prev && !canSlide) prev.hidden = true;
      if (next && !canSlide) next.hidden = true;
    }
    if (next) next.addEventListener("click", () => { index += 1; update(); });
    if (prev) prev.addEventListener("click", () => { index -= 1; update(); });
    window.addEventListener("resize", update);
    car.querySelectorAll("img").forEach((im) => im.addEventListener("load", update));

    // pointer / touch swipe
    let sx = null;
    track.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    window.addEventListener("pointerup", (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 40) { index += dx < 0 ? 1 : -1; update(); }
      sx = null;
    });
    update();
  });

  /* ---------- Group / corporate booking: build the WhatsApp enquiry ---------- */
  const groupSize = document.getElementById("groupSize");
  const groupBtn = document.getElementById("groupBookBtn");
  if (groupSize && groupBtn) {
    const updateGroup = () => {
      const n = groupSize.value;
      const who = n === "16+" ? "a group of 16 or more people (company enquiry)" : ("a group of " + n + " people");
      const text = "Hi Jack, I would like to book " + who + ". Could you tell me about your group and corporate packages?";
      groupBtn.setAttribute("href", "https://wa.me/447507824925?text=" + encodeURIComponent(text));
    };
    groupSize.addEventListener("change", updateGroup);
    updateGroup();
  }

  /* ---------- "Read more" on clamped review quotes ---------- */
  function setupReadMore() {
    document.querySelectorAll(".stories .review").forEach((card) => {
      if (card.querySelector(".read-more")) return; // already set up
      const p = card.querySelector("p:not(.stars)");
      if (!p) return;
      if (p.scrollHeight - p.clientHeight <= 4) return; // not truncated, no button needed
      const btn = document.createElement("button");
      btn.className = "read-more";
      btn.type = "button";
      btn.textContent = "Read more";
      btn.setAttribute("aria-expanded", "false");
      p.after(btn);
      btn.addEventListener("click", () => {
        const open = card.classList.toggle("expanded");
        btn.textContent = open ? "Show less" : "Read more";
        btn.setAttribute("aria-expanded", String(open));
      });
    });
  }
  setupReadMore();
  // Re-check once the web font has settled, in case line counts shift
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setupReadMore);

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
