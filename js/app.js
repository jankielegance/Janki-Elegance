/* ============================================================
   Janki Elegance — storefront config
   WhatsApp number: country code + number, no "+" or spaces.
   ============================================================ */
const WHATSAPP_NUMBER = "6002674720";          // 6002674720
const INSTAGRAM_HANDLE = "janki.elegance";     // instagram.com/janki.elegance

/* Canonical category order. Must match content/products.json + admin/config.yml. */
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

/* How many products to preview per category on the home page before "Shop More". */
const PREVIEW_COUNT = 4;

const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN");
const plural = (n) => `${n} product${n === 1 ? "" : "s"}`;

function slugify(s) {
  return String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function firstImage(p) {
  // Card/front-page image = the Main photo. Only fall back to the first
  // gallery photo when no Main photo was set.
  return p.image || (Array.isArray(p.images) && p.images[0]) || "/images/placeholder-1.svg";
}
function productHref(p) {
  return `product.html?p=${encodeURIComponent(slugify(p.name))}`;
}
function whatsappLink(productName) {
  const msg = productName
    ? `Hi Janki Elegance! I'm interested in "${productName}". Could you share more details?`
    : `Hi Janki Elegance! I'd like to know more about your collection.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

let allProducts = [];
let currentView = "home";   // "home" | "collection"
let currentCat = null;
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
  // Deep-link support: product.html links back with ?cat=Category
  const cat = new URLSearchParams(location.search).get("cat");
  if (cat && allProducts.some((p) => p.category === cat)) {
    renderCollection(cat);
  } else {
    renderHome();
  }
}

/* ---------- Product card (price only, whole card links to detail page) ---------- */
function productCardEl(p, i) {
  const a = document.createElement("a");
  a.className = "product-card";
  a.href = productHref(p);
  a.style.animationDelay = (i % 8) * 0.05 + "s";

  const onSale = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
  const soldOut = !!p.sold_out;
  const pct = onSale ? Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100) : 0;

  a.innerHTML = `
    <div class="product-media">
      ${soldOut ? '<span class="badge soldout">Sold Out</span>' : (onSale ? `<span class="badge">-${pct}%</span>` : "")}
      <img src="${escapeHtml(firstImage(p))}" alt="${escapeHtml(p.name)}" loading="lazy" />
    </div>
    <div class="product-info">
      <h3 class="product-name">${escapeHtml(p.name)}</h3>
      <div class="product-price">
        <span class="price-now">${rupee(p.price)}</span>
        ${onSale ? `<span class="price-was">${rupee(p.compare_at_price)}</span>` : ""}
      </div>
    </div>`;
  requestAnimationFrame(() => a.classList.add("in"));
  return a;
}

/* ---------- Home view: a preview section per category + Shop More ---------- */
function renderHome() {
  currentView = "home";
  currentCat = null;
  document.getElementById("collectionView").hidden = true;
  document.getElementById("homeView").hidden = false;
  document.getElementById("catalogHead").hidden = false;
  buildFilters();

  const home = document.getElementById("homeView");
  home.innerHTML = "";

  const present = CATEGORIES.filter((c) => allProducts.some((p) => p.category === c));
  if (present.length === 0) {
    home.innerHTML = `<p class="empty-state">No products yet — check back soon.</p>`;
    return;
  }

  present.forEach((cat) => {
    const items = allProducts.filter((p) => p.category === cat);

    const section = document.createElement("section");
    section.className = "cat-section";

    const head = document.createElement("div");
    head.className = "cat-section-head";
    head.innerHTML = `<h2 class="cat-title">${escapeHtml(cat)}</h2>`;
    section.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "product-grid";
    items.slice(0, PREVIEW_COUNT).forEach((p, i) => grid.appendChild(productCardEl(p, i)));
    section.appendChild(grid);

    if (items.length > PREVIEW_COUNT) {
      const wrap = document.createElement("div");
      wrap.className = "shop-more-wrap";
      const btn = document.createElement("button");
      btn.className = "btn btn-shopmore";
      btn.type = "button";
      btn.textContent = "Shop More";
      btn.setAttribute("aria-label", `Shop all ${cat}`);
      btn.addEventListener("click", () => renderCollection(cat));
      wrap.appendChild(btn);
      section.appendChild(wrap);
    }

    home.appendChild(section);
  });
}

/* ---------- Collection view: full listing of one category / search results ---------- */
function showCollection(title, items, countText, doScroll) {
  currentView = "collection";
  document.getElementById("homeView").hidden = true;
  document.getElementById("catalogHead").hidden = true;
  document.getElementById("collectionView").hidden = false;
  document.getElementById("collectionTitle").textContent = title;
  document.getElementById("collectionCount").textContent = countText;

  const grid = document.getElementById("collectionGrid");
  const empty = document.getElementById("emptyState");
  grid.innerHTML = "";
  empty.hidden = items.length > 0;
  if (!items.length) empty.textContent = "Nothing here yet.";
  items.forEach((p, i) => grid.appendChild(productCardEl(p, i)));

  buildFilters();
  if (doScroll) document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCollection(cat) {
  currentCat = cat;
  clearSearch();
  const items = allProducts.filter((p) => p.category === cat);
  showCollection(cat, items, plural(items.length), true);
}

function renderSearchResults(raw, doScroll) {
  currentCat = null;
  const items = allProducts.filter((p) =>
    [p.name, p.category, p.description].some((f) => String(f || "").toLowerCase().includes(searchQuery))
  );
  showCollection("Search results", items, `${items.length} result${items.length === 1 ? "" : "s"} for “${raw}”`, doScroll);
}

/* ---------- Category filter chips ---------- */
function buildFilters() {
  const bar = document.getElementById("filterBar");
  const present = CATEGORIES.filter((c) => allProducts.some((p) => p.category === c));
  const cats = ["all", ...present];
  const active = searchQuery ? null : currentView === "collection" ? currentCat : "all";

  bar.innerHTML = "";
  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (cat === active ? " active" : "");
    btn.textContent = cat === "all" ? "All" : cat;
    btn.setAttribute("role", "tab");
    btn.addEventListener("click", () => {
      clearSearch();
      cat === "all" ? renderHome() : renderCollection(cat);
    });
    bar.appendChild(btn);
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- Header nav ---------- */
function wireNav() {
  document.querySelectorAll(".main-nav a[data-cat]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const cat = link.dataset.cat;
      clearSearch();
      cat === "all" ? renderHome() : renderCollection(cat);
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

/* ---------- Search ---------- */
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
    if (searchQuery) { clearSearch(); renderHome(); }
  }
  toggle.addEventListener("click", () => { bar.hidden ? openBar() : closeBar(); });
  if (closeBtn) closeBtn.addEventListener("click", closeBar);
  input.addEventListener("input", () => {
    const wasEmpty = !searchQuery;
    const raw = input.value.trim();
    searchQuery = raw.toLowerCase();
    if (searchQuery) renderSearchResults(raw, wasEmpty);
    else renderHome();
  });
  input.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBar(); });
}

/* ---------- Back to all (collection view) ---------- */
function wireBack() {
  const back = document.getElementById("backToHome");
  if (back) back.addEventListener("click", () => { clearSearch(); renderHome(); });
}

/* ---------- Hero slideshow: auto-rotate every 5s, keeps running on hover ---------- */
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

  // Note: intentionally NO pause-on-hover — the slider keeps advancing every 5s.
  start();
}

function wireStatic() {
  const fw = document.getElementById("footerWhatsapp");
  if (fw) fw.href = whatsappLink("");
  document.getElementById("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  wireStatic();
  wireNav();
  wireSearch();
  wireBack();
  wireSlider();
  loadProducts();
});
