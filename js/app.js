/* ============================================================
   Janki Elegance — storefront config
   👉 EDIT THESE TWO LINES when you get your real number/handle.
   WhatsApp number must include country code, no "+" or spaces.
   Example for India: "919876543210"
   ============================================================ */
const WHATSAPP_NUMBER = "6002674720";          // 6002674720
const INSTAGRAM_HANDLE = "janki.elegance";     // instagram.com/janki.elegance

/* Canonical category order shown in the filter bar.
   These must match the category names used in content/products.json
   and in admin/config.yml. */
const CATEGORIES = [
  "Sarees",
  "Cotton Kurtis",
  "Co-ord Sets",
  "3 Piece Suits",
  "Frock Kurtis",
  "Palazzo Pants",
  "Mekhela Sador",
  "Kids Wear",
  "Artificial Jewellery",
  "Lehengas",
  "Indo-Western",
  "Suit Fabric",
];

const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN");

function whatsappLink(productName) {
  const msg = productName
    ? `Hi Janki Elegance! I'm interested in "${productName}". Could you share more details?`
    : `Hi Janki Elegance! I'd like to know more about your collection.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

let allProducts = [];
let activeCat = "all";
let searchQuery = "";

async function loadProducts() {
  try {
    const res = await fetch("/content/products.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    allProducts = Array.isArray(data.products) ? data.products : [];
  } catch (err) {
    console.error("Could not load products:", err);
    allProducts = [];
  }
  buildFilters();
  render();
}

function buildFilters() {
  const bar = document.getElementById("filterBar");
  // Only show categories that actually have products, plus "All".
  const present = new Set(allProducts.map((p) => p.category));
  const cats = ["all", ...CATEGORIES.filter((c) => present.has(c))];
  bar.innerHTML = "";
  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (cat === activeCat ? " active" : "");
    btn.textContent = cat === "all" ? "All" : cat;
    btn.setAttribute("role", "tab");
    btn.addEventListener("click", () => {
      activeCat = cat;
      clearSearch();
      buildFilters();
      render();
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    bar.appendChild(btn);
  });
}

function getVisibleProducts() {
  if (searchQuery) {
    return allProducts.filter((p) =>
      [p.name, p.category, p.description].some((f) =>
        String(f || "").toLowerCase().includes(searchQuery)
      )
    );
  }
  return activeCat === "all" ? allProducts : allProducts.filter((p) => p.category === activeCat);
}

function render() {
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("emptyState");
  const items = getVisibleProducts();

  grid.innerHTML = "";
  empty.hidden = items.length > 0;
  if (items.length === 0) {
    empty.textContent = searchQuery
      ? `No results for “${searchQuery}”. Try a different search.`
      : "No items in this category yet — check back soon.";
  }

  items.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = (i % 8) * 0.05 + "s";

    const onSale = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
    const soldOut = !!p.sold_out;

    card.innerHTML = `
      <div class="product-media">
        ${soldOut ? '<span class="badge soldout">Sold Out</span>' : (onSale ? '<span class="badge">Sale</span>' : "")}
        <img src="${escapeHtml(p.image || "/images/placeholder-1.svg")}" alt="${escapeHtml(p.name)}" loading="lazy" />
      </div>
      <div class="product-info">
        <p class="product-cat">${escapeHtml(p.category || "")}</p>
        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <div class="product-price">
          <span class="price-now">${rupee(p.price)}</span>
          ${onSale ? `<span class="price-was">${rupee(p.compare_at_price)}</span>` : ""}
        </div>
        <a class="btn btn-wine" href="${whatsappLink(p.name)}" target="_blank" rel="noopener">
          ${soldOut ? "Enquire on WhatsApp" : "Buy on WhatsApp"}
        </a>
      </div>`;
    grid.appendChild(card);
    // trigger entrance animation on next frame
    requestAnimationFrame(() => card.classList.add("in"));
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Header nav: filter by category links + mobile toggle */
function wireNav() {
  document.querySelectorAll(".main-nav a[data-cat]").forEach((link) => {
    link.addEventListener("click", () => {
      activeCat = link.dataset.cat;
      clearSearch();
      buildFilters();
      render();
      document.getElementById("mainNav").classList.remove("open");
    });
  });
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

/* Search: filter products by name / category / description */
function clearSearch() {
  searchQuery = "";
  const input = document.getElementById("searchInput");
  if (input) input.value = "";
}

function wireSearch() {
  const toggle = document.getElementById("searchToggle");
  const bar = document.getElementById("searchBar");
  const input = document.getElementById("searchInput");
  const closeBtn = document.getElementById("searchClose");
  if (!toggle || !bar || !input) return;

  function openBar() {
    bar.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    input.focus();
  }
  function closeBar() {
    bar.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (searchQuery) { clearSearch(); buildFilters(); render(); }
  }
  toggle.addEventListener("click", () => { bar.hidden ? openBar() : closeBar(); });
  if (closeBtn) closeBtn.addEventListener("click", closeBar);
  input.addEventListener("input", () => {
    const wasEmpty = !searchQuery;
    searchQuery = input.value.trim().toLowerCase();
    if (searchQuery) activeCat = "all";
    buildFilters();
    render();
    if (wasEmpty && searchQuery) {
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  input.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBar(); });
}

/* Hero slideshow: auto-rotate every 5s, dots + arrows, pause on hover */
function wireSlider() {
  const slider = document.getElementById("heroSlider");
  const dotsWrap = document.getElementById("sliderDots");
  if (!slider || !dotsWrap) return;
  const slides = Array.from(slider.querySelectorAll(".slide"));
  if (slides.length <= 1) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const INTERVAL = 5000;
  let idx = 0;
  let timer = null;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => { go(i); restart(); });
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function go(n) {
    slides[idx].classList.remove("is-active");
    dots[idx].classList.remove("active");
    idx = (n + slides.length) % slides.length;
    slides[idx].classList.add("is-active");
    dots[idx].classList.add("active");
  }
  function start() { if (!prefersReduced && !timer) timer = setInterval(() => go(idx + 1), INTERVAL); }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); start(); }

  const prevBtn = document.getElementById("slidePrev");
  const nextBtn = document.getElementById("slideNext");
  if (prevBtn) prevBtn.addEventListener("click", () => { go(idx - 1); restart(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { go(idx + 1); restart(); });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);

  start();
}

function wireStatic() {
  document.getElementById("footerWhatsapp").href = whatsappLink("");
  document.getElementById("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  wireStatic();
  wireNav();
  wireSearch();
  wireSlider();
  loadProducts();
});
