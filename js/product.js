/* ============================================================
   Janki Elegance — product detail page
   ============================================================ */
const WHATSAPP_NUMBER = "6002674720";
const INSTAGRAM_URL = "https://www.instagram.com/janki.elegance/";
const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN");

function slugify(s) {
  return String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function whatsappLink(name, size) {
  let msg = `Hi Janki Elegance! I'm interested in "${name}"`;
  if (size) msg += ` (Size: ${size})`;
  msg += ". Could you share more details?";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

let selectedSize = "";
let currentProduct = null;

async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("footerWhatsapp").href = whatsappLink("your collection", "");
  wireModal();

  const params = new URLSearchParams(location.search);
  const slug = params.get("p");

  let products = [];
  try {
    const res = await fetch("/content/products.json", { cache: "no-store" });
    const data = await res.json();
    products = Array.isArray(data.products) ? data.products : [];
  } catch (err) {
    console.error("Could not load products:", err);
  }

  const product = products.find((p) => slugify(p.name) === slug);
  if (!product) return renderNotFound();
  currentProduct = product;
  document.title = `${product.name} — Janki Elegance`;
  renderProduct(product);
}

function renderNotFound() {
  document.getElementById("productRoot").innerHTML = `
    <div class="pd-notfound">
      <h1>Product not found</h1>
      <p>Sorry, we couldn't find that item.</p>
      <a class="btn btn-wine" href="/">Back to shop</a>
    </div>`;
}

function starsHtml(rating) {
  const full = Math.round(Number(rating));
  let s = "";
  for (let i = 1; i <= 5; i++) s += `<span class="star${i <= full ? " on" : ""}">★</span>`;
  return s;
}

function galleryImages(p) {
  // Lead with the Main photo, then the gallery photos, de-duplicated.
  const list = [];
  if (p.image) list.push(p.image);
  if (Array.isArray(p.images)) list.push(...p.images);
  const deduped = [...new Set(list.filter(Boolean))];
  return deduped.length ? deduped : ["/images/placeholder-1.svg"];
}

function renderProduct(p) {
  const images = galleryImages(p);
  const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : STANDARD_SIZES;
  const onSale = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
  const pct = onSale ? Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100) : 0;
  const soldOut = !!p.sold_out;

  const root = document.getElementById("productRoot");
  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span>/</span>
      <a href="index.html?cat=${encodeURIComponent(p.category)}">${escapeHtml(p.category)}</a><span>/</span>
      <span class="current">${escapeHtml(p.name)}</span>
    </nav>

    <div class="pd-layout">
      <div class="pd-gallery">
        <div class="pd-main">
          ${soldOut ? '<span class="badge soldout">Sold Out</span>' : (onSale ? `<span class="badge">-${pct}%</span>` : "")}
          <img id="pdMain" src="${escapeHtml(images[0])}" alt="${escapeHtml(p.name)}" />
        </div>
        <div class="pd-thumbs" id="pdThumbs">
          ${images.map((src, i) => `
            <button class="pd-thumb${i === 0 ? " active" : ""}" data-src="${escapeHtml(src)}" aria-label="View image ${i + 1}">
              <img src="${escapeHtml(src)}" alt="" />
            </button>`).join("")}
        </div>
      </div>

      <div class="pd-info">
        <h1 class="pd-name">${escapeHtml(p.name)}</h1>

        ${p.rating ? `
        <div class="pd-rating" aria-label="${p.rating} out of 5">
          <span class="stars">${starsHtml(p.rating)}</span>
          <span class="pd-reviews">${Number(p.rating).toFixed(1)}${p.reviews ? ` · ${p.reviews} reviews` : ""}</span>
        </div>` : ""}

        <div class="pd-price">
          <span class="price-now">${rupee(p.price)}</span>
          ${onSale ? `<span class="price-was">${rupee(p.compare_at_price)}</span><span class="price-off">${pct}% off</span>` : ""}
        </div>

        <div class="pd-sizes">
          <div class="pd-sizes-head">
            <span class="pd-label">Size</span>
            <button class="size-chart-link" id="sizeChartBtn" type="button">📏 Size chart</button>
          </div>
          <div class="size-options" id="sizeOptions" role="radiogroup" aria-label="Select size">
            ${sizes.map((s) => `<button class="size-chip" type="button" role="radio" aria-checked="false" data-size="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}
          </div>
        </div>

        <div class="pd-actions">
          <a class="btn btn-wine pd-wa" id="waBtn" href="${whatsappLink(p.name, "")}" target="_blank" rel="noopener">
            ${soldOut ? "Enquire on WhatsApp" : "Buy on WhatsApp"}
          </a>
          <a class="btn btn-ig" href="${INSTAGRAM_URL}" target="_blank" rel="noopener">Message on Instagram</a>
        </div>

        <div class="pd-desc">
          <h2>Product description</h2>
          <p>${escapeHtml(p.description || "")}</p>
        </div>
      </div>
    </div>`;

  wireGallery();
  wireSizes(p);
  document.getElementById("sizeChartBtn").addEventListener("click", openModal);
}

function wireGallery() {
  const main = document.getElementById("pdMain");
  document.querySelectorAll("#pdThumbs .pd-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#pdThumbs .pd-thumb").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      main.src = btn.dataset.src;
    });
  });
}

function wireSizes(p) {
  const waBtn = document.getElementById("waBtn");
  document.querySelectorAll("#sizeOptions .size-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const already = chip.classList.contains("selected");
      document.querySelectorAll("#sizeOptions .size-chip").forEach((c) => {
        c.classList.remove("selected");
        c.setAttribute("aria-checked", "false");
      });
      if (already) {
        selectedSize = "";
      } else {
        chip.classList.add("selected");
        chip.setAttribute("aria-checked", "true");
        selectedSize = chip.dataset.size;
      }
      waBtn.href = whatsappLink(p.name, selectedSize);
    });
  });
}

/* Size chart modal */
function wireModal() {
  const modal = document.getElementById("sizeChartModal");
  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}
function openModal() { document.getElementById("sizeChartModal").hidden = false; document.body.style.overflow = "hidden"; }
function closeModal() { document.getElementById("sizeChartModal").hidden = true; document.body.style.overflow = ""; }

document.addEventListener("DOMContentLoaded", init);
