// js/index.js

const DATA_URL = "./data.json";
const MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function applyTranslations() {
  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const translation = window.i18n.t(key, window.i18n.getPreferredLanguage());
    if (translation && translation !== key) {
      element.textContent = translation;
    }
  });
}

async function loadData() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`data.json HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const txt = await res.text();
    throw new Error("data.json no es JSON. Respuesta: " + txt.slice(0, 120));
  }
  return res.json();
}

function render(items, container) {
  if (!container) return; // por si falta alguna sección en alguna página
  const frag = document.createDocumentFragment();
  const origin = location.origin;

  items.forEach((item) => {
    const card = document.createElement("article");
    card.classList.add("producto");

    // Obtener la descripción traducida del producto
    const productKey = item.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const translatedDescription =
      window.i18n.t(
        `productDescriptions.${productKey}.${window.i18n.getPreferredLanguage()}`
      ) || item.description;

    card.innerHTML = `
      <img class="prod-img" src="${item.img}" alt="${item.name}" loading="lazy" decoding="async">
      <h3 class="prod-title">${item.name}${item.size ? ` (${item.size.toUpperCase()})` : ""}</h3>
      <p class="prod-desc">${translatedDescription}</p>
      <p class="prod-warning" role="note" aria-label="Allergen warning">
        <svg class="warn-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v2h2v-2zm0-8h-2v6h2v-6z"/>
        </svg>
        <span>All products may contain nuts, dairy, eggs, wheat, gluten and soy.</span>
      </p>
      <span class="price">${MONEY.format(Number(item.price))}</span>
    `;

    // Botón Snipcart
    const btn = document.createElement("button");
    btn.className = "snipcart-add-item btn-cta";
    btn.textContent = window.i18n.t("addToCart");
    btn.setAttribute("data-item-id", item.id);
    btn.setAttribute(
      "data-item-name",
      item.size ? `${item.name} (${item.size.toUpperCase()})` : item.name
    );
    btn.setAttribute("data-item-price", Number(item.price).toFixed(2));
    // JSON crawler
    btn.setAttribute("data-item-url", `${origin}/products/${item.id}.json`);
    btn.setAttribute("data-item-description", item.description);
    // Imagen absoluta para el crawler
    btn.setAttribute("data-item-image", new URL(item.img, location.href).href);

    card.appendChild(btn);
    frag.appendChild(card);
  });

  container.replaceChildren(frag);
}


(async function init() {
  try {
    const data = await loadData();

    // Filtrar por categoría
    const cookiesEl = document.getElementById("cookies");
    const cupcakesEl = document.getElementById("cupcakes");

    const cookies = data.filter((p) => p.category === "cookie");
    const cupcakes = data.filter((p) => p.category === "cupcake");
    const seasonal = data.filter((p) => p.category === "seasonal");

    // Si hay "seasonal", crear sección y ponerla ARRIBA del listado de productos (debajo del hero)
    if (seasonal.length > 0) {
      const seasonalSection = document.createElement("section");
      seasonalSection.id = "seasonal-section";
      seasonalSection.setAttribute("aria-labelledby", "seasonal-title");

      const h2 = document.createElement("h2");
      h2.className = "title_products";
      h2.id = "seasonal-title";
      h2.setAttribute("data-i18n", "seasonalTitle");
      // Fallback visible si no existe la clave aún
      const lang = window.i18n.getPreferredLanguage();
      h2.textContent =
        lang === "es" ? "Exclusivos de temporada" : "Seasonal exclusives";

      const wrap = document.createElement("div");
      wrap.className = "productContainer";
      wrap.id = "seasonal";

      seasonalSection.appendChild(h2);
      seasonalSection.appendChild(wrap);

      // Insertar justo DESPUÉS del hero
      const main = document.querySelector("main");
      const hero = document.querySelector(".hero");
      if (main) {
        if (hero && hero.parentNode === main) {
          main.insertBefore(seasonalSection, hero.nextSibling);
        } else {
          // Fallback: al inicio del <main>
          main.prepend(seasonalSection);
        }
      }

      // Render de productos de temporada
      render(seasonal, wrap);
    }

    // Render normal
    render(cookies, cookiesEl);
    render(cupcakes, cupcakesEl);

    // i18n después de renderizar
    applyTranslations();

    // Setear selector de idioma
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
      languageSelect.value = window.i18n.getPreferredLanguage();
    }

    if (!cookiesEl && !cupcakesEl) {
      console.error(
        "No se encontró ningún contenedor (#cookies | #cupcakes). Revisa el HTML desplegado."
      );
    }
  } catch (err) {
    console.error(err);
    const cookiesEl = document.getElementById("cookies");
    const cupcakesEl = document.getElementById("cupcakes");
    if (cookiesEl) cookiesEl.textContent = "No se pudieron cargar las cookies.";
    if (cupcakesEl)
      cupcakesEl.textContent = "No se pudieron cargar los cupcakes.";
  }
})();

/* ===== Get a quote (mailto + i18n-friendly) ===== */
(function QuoteForm() {
  const form = document.getElementById("quote-form");
  if (!form) return;

  const $label = (forId) => {
    const el = form.querySelector(`label[for="${forId}"]`);
    return el ? el.textContent.trim() : forId;
  };
  const titleEl = document.querySelector("#quote h2");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const to = "shop@dutsicakes.com";
    const title = titleEl ? titleEl.textContent.trim() : "Get a quote";
    const name = (fd.get("name") || "").trim() || "Customer";
    const subject = `${title} - ${name}`;

    const categoryText =
      form.querySelector("#q-category option:checked")?.textContent.trim() ||
      "";

    const bodyLines = [
      `${$label("q-name")}: ${fd.get("name") || ""}`,
      `${$label("q-email")}: ${fd.get("email") || ""}`,
      `${$label("q-phone")}: ${fd.get("phone") || ""}`,
      `${$label("q-category")}: ${categoryText}`,
      `${$label("q-qty")}: ${fd.get("quantity") || ""}`,
      `${$label("q-date")}: ${fd.get("date") || "N/A"}`,
      "",
      `${$label("q-message")}:`,
      (fd.get("message") || "").trim(),
    ];

    const mailto = `mailto:${to}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    if (mailto.length > 1800) {
      alert(
        "Your message is too long to open your email app automatically. Please shorten it."
      );
      return;
    }
    window.location.href = mailto;
  });
})();

/* ===== Reviews Carousel (Home) ===== */
(function ReviewsCarousel() {
  const API = "https://zdusg2gurk.execute-api.us-west-2.amazonaws.com/api/reviews";
  const viewport = document.getElementById("reviewsViewport");
  const track = document.getElementById("reviewsTrack");
  const btnPrev = document.querySelector("#reviews .reviews-nav.prev");
  const btnNext = document.querySelector("#reviews .reviews-nav.next");

  if (!viewport || !track) return; // por si esta sección no existe en alguna página

  // Util: estrellas sólidas/contorno simple (esta versión interna puede convivir con la global)
  function stars(n) {
    const s = Math.max(1, Math.min(5, Number(n) || 0));
    return "★".repeat(s) + "☆".repeat(5 - s);
  }
  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  let index = 0; // slide index (columna inicial)
  let cols = 1; // cuántas tarjetas entran visibles (estimado)
  let total = 0; // total de slides

  function computeCols() {
    const vpw = viewport.clientWidth || 1;
    cols = Math.max(1, Math.floor(vpw / 300)); // ~300px por tarjeta
  }
  function clampIndex() {
    index = Math.max(0, Math.min(index, Math.max(0, total - cols)));
  }
  function update() {
    computeCols();
    clampIndex();
    const firstCard = track.querySelector(".review-card");
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 300;
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    const offset = index * (cardWidth + gap);
    track.style.transform = `translateX(${-offset}px)`;

    if (btnPrev) btnPrev.disabled = index <= 0;
    if (btnNext) btnNext.disabled = index >= Math.max(0, total - cols);
  }

  function goNext() { index += 1; update(); }
  function goPrev() { index -= 1; update(); }

  btnPrev?.addEventListener("click", goPrev);
  btnNext?.addEventListener("click", goNext);
  window.addEventListener("resize", update);

  // Drag/touch (suave)
  let startX = 0, startTx = 0, dragging = false;
  viewport.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startTx = getTranslateX(track);
    track.style.transition = "none";
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    track.style.transform = `translateX(${startTx + dx}px)`;
  });
  viewport.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    track.style.transition = ""; // restore
    const dx = getTranslateX(track) - startTx;
    const firstCard = track.querySelector(".review-card");
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 300;
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    const step = (cardWidth + gap) * 0.4; // umbral de swipe
    if (dx < -step) index += 1;
    else if (dx > step) index -= 1;
    update();
  });
  function getTranslateX(el) {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return m.m41 || 0;
  }

  // ---- CARGA (ajustada a { items, nextCursor }) ----
  async function load() {
    try {
      const res = await fetch(API, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      track.innerHTML = "";
  
      if (items.length === 0) {
        track.innerHTML = `<div class="review-card"><p class="review-text">No hay reseñas aún. ¡Sé el primero en dejar la tuya!</p></div>`;
        total = 1;
        update();
        return;
      }
  
      // últimas 10, más recientes primero
      const ordered = [...items]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
  
      const frag = document.createDocumentFragment();
      for (const r of ordered) {
        const card = document.createElement("article");
        card.className = "review-card";
        card.innerHTML = `
          <h3 class="review-name">${escapeHTML(r.name || "Anónimo")}</h3>
          <div class="review-stars" aria-label="${r.rating || 0} de 5">${stars(r.rating)}</div>
          <p class="review-text">${escapeHTML(r.comment || "")}</p>
          <div class="review-date">${formatDate(r.date)}</div>
        `;
        frag.appendChild(card);
      }
  
      track.appendChild(frag);
      total = ordered.length;
      update();
    } catch (err) {
      console.error("Reviews load error", err);
      track.innerHTML = `<div class="review-card"><p class="review-text">No fue posible cargar las reseñas.</p></div>`;
      total = 1;
      update();
    }
  }
  load();
})();


function stars(n) {
  const s = Math.max(1, Math.min(5, Number(n) || 0));
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<span class="${i <= s ? "star full" : "star empty"}">★</span>`;
  }
  return html;
}

/* ===== Modal tarifas de entrega al abrir carrito ===== */
(function DeliveryFeesModal() {
  // CUALQUIER disparador de "ver carrito" que uses
  const CART_TRIGGERS = [
    ".snipcart-checkout", // tu botón en el header
    'a[href="#/cart"]',
    ".snipcart-cart-button",
    "[data-view-cart]",
    "[data-open-cart]",
  ];

  const ZONES = [
    { cities: "Concord, Clayton", min: 50, fee: 0 },
    { cities: "Walnut Creek, Pleasant Hill", min: 50, fee: 7 },
    {
      cities: "Orinda, Lafayette, Moraga, Martinez, Pittsburg, Antioch",
      min: 50,
      fee: 16,
    },
    { cities: "San Ramon, Oakland, Berkeley", min: 50, fee: 30 },
    { cities: "Tracy", min: 50, fee: 40 },
    { cities: "San Francisco", min: 50, fee: 50 },
    {
      cities:
        "Marin County (San Rafael, Mill Valley, Novato, Sausalito, Corte Madera, Larkspur, San Anselmo, Fairfax)",
      min: 50,
      fee: 55,
    },
  ];

  const MONEY = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Crear modal (oculto)
  const modal = document.createElement("div");
  modal.className = "fees-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "feesModalTitle");
  modal.innerHTML = `
    <div class="fees-backdrop" data-close="1"></div>
    <div class="fees-dialog" role="document" tabindex="-1">
      <button class="fees-close" aria-label="Close" data-close="1">×</button>
      <h2 id="feesModalTitle" class="fees-title" data-i18n="fees.title">
        You’re a little further from us, but don't worry – we’ve got you covered!
      </h2>
      <p class="fees-lead" data-i18n="fees.lead">
        To keep your order fresh and right on time, certain locations require a higher minimum purchase and a delivery fee based on distance. Take a quick look at the chart below to see what applies to your city.
      </p>

      <div class="fees-table-wrap" role="region" aria-label="Delivery fees table">
        <table class="fees-table">
          <thead>
            <tr>
              <th scope="col" data-i18n="fees.city">City</th>
              <th scope="col" data-i18n="fees.min">Minimum Order</th>
              <th scope="col" data-i18n="fees.deliveryFee">Delivery Fee</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>

      <div class="fees-actions">
        <button class="btn-ghost" data-close="1" data-i18n="fees.keepBrowsing">Keep browsing</button>
        <button class="btn-cta" id="feesContinue" data-i18n="fees.continue">Continue to cart</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Rellenar la tabla
  const tbody = modal.querySelector("tbody");
  ZONES.forEach((z) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${z.cities}</td>
      <td>${MONEY.format(z.min)}</td>
      <td>${z.fee === 0 ? "Free" : MONEY.format(z.fee)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Aplicar i18n si existe
  try {
    if (window.i18n) applyTranslations();
  } catch (_) {}

  // Accesibilidad y control
  let lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    const dialog = modal.querySelector(".fees-dialog");
    dialog?.focus();
    document.addEventListener("keydown", onKeydown);
    document.body.style.overflow = "hidden";
    // (Opcional) Solo una vez por sesión:
    // sessionStorage.setItem("feesShown", "1");
  }
  function closeModal() {
    modal.classList.remove("is-open");
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = "";
    lastFocus?.focus?.();
  }
  function onKeydown(e) {
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {
      const focusables = modal.querySelectorAll(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
      );
      if (!list.length) return;
      const first = list[0],
        last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeModal();
  });

  modal.querySelector("#feesContinue")?.addEventListener("click", () => {
    closeModal();

    if (window.Snipcart?.api?.theme?.cart?.open) {
      window.Snipcart.api.theme.cart.open();
    } else {
      location.hash = "#/cart";
    }
  });

  // Interceptar click en “Ver carrito”
  document.addEventListener(
    "click",
    (e) => {
      const trigger = e.target.closest(CART_TRIGGERS.join(","));
      if (!trigger) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation;

      // (Opcional) prevenir re-muestreo por sesión:
      // if (sessionStorage.getItem("feesShown") === "1") {
      //   if (window.Snipcart?.api?.theme?.cart?.open) window.Snipcart.api.theme.cart.open();
      //   else location.hash = "#/cart";
      //   return;
      // }

      openModal();
    },
    true
  );
})();

/* ===== Hero Image Carousel (simple) ===== */
(function HeroCarousel() {
  const VIEWPORT = document.getElementById("heroViewport");
  const TRACK = document.getElementById("heroTrack");
  const DOTS = document.getElementById("heroDots");
  const BTN_PREV = document.querySelector(".hero-nav.prev");
  const BTN_NEXT = document.querySelector(".hero-nav.next");
  if (!VIEWPORT || !TRACK) return;

  // <<< EDITA ESTAS RUTAS >>>
  const IMAGES = [
    "./assets/img/hero/hero2.png",
    "./assets/img/hero/hero1.jpg",
    "./assets/img/hero/hero3.webp",
    "./assets/img/hero/hero4.webp",
    "./assets/img/hero/hero5.webp",
    "./assets/img/hero/hero6.webp",
    "./assets/img/hero/hero7.webp",
    "./assets/img/hero/hero8.webp",
    "./assets/img/hero/hero9.webp",
    "./assets/img/hero/hero10.webp",
  ];

  // Crear slides <img>
  const frag = document.createDocumentFragment();
  IMAGES.forEach((src, idx) => {
    const slide = document.createElement("article");
    slide.className = "hero-slide";
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `Slide ${idx + 1} de ${IMAGES.length}`);

    const img = document.createElement("img");
    img.src = src;
    img.alt = "Productos destacados";
    img.loading = "lazy";
    img.decoding = "async";

    slide.appendChild(img);
    frag.appendChild(slide);
  });
  TRACK.appendChild(frag);

  // Dots
  IMAGES.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.addEventListener("click", () => goTo(i));
    DOTS.appendChild(b);
  });

  let index = 0,
    width = VIEWPORT.clientWidth;
  function update() {
    width = VIEWPORT.clientWidth;
    TRACK.style.transform = `translateX(${-index * width}px)`;
    DOTS.querySelectorAll("button").forEach((b, i) =>
      b.setAttribute("aria-selected", i === index ? "true" : "false")
    );
  }
  function goTo(i) {
    index = (i + IMAGES.length) % IMAGES.length;
    update();
  }
  function next() {
    goTo(index + 1);
  }
  function prev() {
    goTo(index - 1);
  }

  BTN_NEXT?.addEventListener("click", next);
  BTN_PREV?.addEventListener("click", prev);
  window.addEventListener("resize", update);

  // Swipe
  let startX = 0,
    startTx = 0,
    dragging = false;
  VIEWPORT.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startTx = getTranslateX(TRACK);
    TRACK.style.transition = "none";
    VIEWPORT.setPointerCapture(e.pointerId);
  });
  VIEWPORT.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    TRACK.style.transform = `translateX(${startTx + dx}px)`;
  });
  VIEWPORT.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    TRACK.style.transition = "";
    const dx = getTranslateX(TRACK) - -index * width;
    const threshold = width * 0.18;
    if (dx < -threshold) next();
    else if (dx > threshold) prev();
    else update();
  });
  function getTranslateX(el) {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return m.m41 || 0;
  }

  // Auto-avance (respeta reduce motion)
  let timer = null;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function startAuto() {
    if (reduce) return;
    stopAuto();
    timer = setInterval(next, 5000);
  }
  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  VIEWPORT.addEventListener("pointerdown", stopAuto);
  VIEWPORT.addEventListener("pointerup", startAuto);
  BTN_NEXT?.addEventListener("click", () => {
    stopAuto();
    startAuto();
  });
  BTN_PREV?.addEventListener("click", () => {
    stopAuto();
    startAuto();
  });

  // Init
  update();
  startAuto();
})();
