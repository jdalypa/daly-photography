(() => {
  const $ = (s, el = document) => el.querySelector(s);

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Header + mobile nav ---------- */
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = $(".nav-toggle");
  const nav = $(".nav");
  const setNav = (open) => {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setNav(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => e.target.tagName === "A" && setNav(false));

  /* ---------- Hero slideshow ---------- */
  const heroPhotos = PHOTOS.filter((p) => p.hero);
  const slides = $(".hero-slides");
  heroPhotos.forEach((p, i) => {
    const img = new Image();
    img.src = p.src;
    img.alt = "";
    if (i === 0) img.className = "active";
    slides.appendChild(img);
  });
  if (heroPhotos.length > 1) {
    let current = 0;
    setInterval(() => {
      slides.children[current].classList.remove("active");
      current = (current + 1) % heroPhotos.length;
      slides.children[current].classList.add("active");
    }, 6000);
  }

  /* ---------- Gallery ---------- */
  const gallery = $(".gallery");
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); reveal.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -40px 0px" });

  const figures = PHOTOS.map((p, i) => {
    const fig = document.createElement("figure");
    fig.dataset.category = p.category;
    fig.tabIndex = 0;
    fig.innerHTML = `<img src="${p.src}" alt="${p.title}" loading="lazy">
      <figcaption><small>${p.category}</small>${p.title}</figcaption>`;
    fig.addEventListener("click", () => openLightbox(i));
    fig.addEventListener("keydown", (e) => e.key === "Enter" && openLightbox(i));
    gallery.appendChild(fig);
    reveal.observe(fig);
    return fig;
  });

  /* ---------- Filters ---------- */
  const filters = $(".filters");
  const categories = ["All", ...new Set(PHOTOS.map((p) => p.category))];
  categories.forEach((cat, i) => {
    const b = document.createElement("button");
    b.textContent = cat;
    b.setAttribute("role", "tab");
    if (i === 0) b.classList.add("active");
    b.addEventListener("click", () => {
      filters.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      figures.forEach((f) => f.classList.toggle("hidden", cat !== "All" && f.dataset.category !== cat));
    });
    filters.appendChild(b);
  });

  /* ---------- Lightbox ---------- */
  const lb = $(".lightbox");
  const lbImg = $("img", lb);
  const lbCap = $("figcaption", lb);
  let index = 0;

  const visibleIndexes = () => figures.map((f, i) => (f.classList.contains("hidden") ? -1 : i)).filter((i) => i >= 0);

  function show(i) {
    index = i;
    lbImg.src = PHOTOS[i].src;
    lbImg.alt = PHOTOS[i].title;
    lbCap.textContent = PHOTOS[i].title;
  }
  function step(dir) {
    const list = visibleIndexes();
    const pos = list.indexOf(index);
    show(list[(pos + dir + list.length) % list.length]);
  }
  function openLightbox(i) {
    show(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $(".lb-close", lb).focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
    figures[index].focus();
  }

  $(".lb-close", lb).addEventListener("click", closeLightbox);
  $(".lb-prev", lb).addEventListener("click", () => step(-1));
  $(".lb-next", lb).addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => e.target === lb && closeLightbox());
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // Touch swipe in lightbox
  let touchX = null;
  lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  });

  /* ---------- Contact form ---------- */
  const form = $(".contact-form");
  form.addEventListener("submit", async (e) => {
    const status = $(".form-status", form);
    // Without a real form endpoint, just show a message.
    if (form.getAttribute("action") === "#") {
      e.preventDefault();
      status.textContent = "Thanks! (Connect a form service to actually receive messages.)";
      form.reset();
      return;
    }
    e.preventDefault();
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      status.textContent = res.ok ? "Thanks — I'll be in touch soon." : "Something went wrong. Please email me directly.";
      if (res.ok) form.reset();
    } catch {
      status.textContent = "Something went wrong. Please email me directly.";
    }
  });
})();
