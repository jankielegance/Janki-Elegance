/* ============================================================
   Janki Elegance — product detail page
   ============================================================ */
const WHATSAPP_NUMBER = "916002674720"; // country code (91) + number, no "+" or spaces
const INSTAGRAM_URL = "https://www.instagram.com/janki.elegance/";
const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN");
// Products saved without a price (empty in the admin) show no price line.
const hasPrice = (p) => Number(p.price) > 0;

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
// Each product's link = its name + a short code from its main photo, e.g.
// "silk-saree-k3x9qa". Products can share a name (four "Silk saree"s) but
// never a photo, so every product gets its own link.
function productSlug(p) {
  const key = p.image || (Array.isArray(p.images) && p.images[0]) || p.description || "";
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h * 33) ^ key.charCodeAt(i)) >>> 0;
  return `${slugify(p.name)}-${h.toString(36)}`;
}
function productUrl(p) {
  return `${location.origin}/product.html?p=${encodeURIComponent(productSlug(p))}`;
}
function whatsappLink(name, size) {
  if (!name) {
    const general = "Hi Janki Elegance! I'd like to know more about your collection.";
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(general)}`;
  }
  let msg = `Hi Janki Elegance! I'm interested in "${name}"`;
  if (size) msg += ` (Size: ${size})`;
  msg += ". Could you share more details?";
  if (currentProduct) msg += `\n\n${productUrl(currentProduct)}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

let selectedSize = "";
let currentProduct = null;

async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("footerWhatsapp").href = whatsappLink("", "");
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

  // Exact match first; fall back to name-only links (e.g. "?p=silk-saree")
  // that were shared before products had unique links.
  const product = products.find((p) => productSlug(p) === slug)
    || products.find((p) => slugify(p.name) === slug);
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

function galleryMedia(p) {
  // Photos first, then any product videos.
  const media = galleryImages(p).map((src) => ({ type: "image", src }));
  if (Array.isArray(p.videos)) {
    [...new Set(p.videos.filter(Boolean))].forEach((src) => media.push({ type: "video", src }));
  }
  return media;
}

function slideMediaHtml(item, alt, i) {
  if (item.type === "video") {
    return `<video src="${escapeHtml(item.src)}" controls playsinline preload="metadata"></video>`;
  }
  // Only the first photo loads right away; the rest load as they are swiped to.
  return `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(alt)}"${i > 0 ? ' loading="lazy"' : ""} />`;
}

function thumbMediaHtml(item) {
  if (item.type === "video") {
    // "#t=0.1" makes mobile browsers show the first frame as a preview.
    return `<video src="${escapeHtml(item.src)}#t=0.1" muted playsinline preload="metadata"></video><span class="pd-play" aria-hidden="true">▶</span>`;
  }
  return `<img src="${escapeHtml(item.src)}" alt="" />`;
}

function renderProduct(p) {
  const media = galleryMedia(p);
  const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : STANDARD_SIZES;
  const onSale = hasPrice(p) && p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
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
          <div class="pd-track" id="pdTrack">
            ${media.map((item, i) => `<div class="pd-slide">${slideMediaHtml(item, p.name, i)}</div>`).join("")}
          </div>
          ${media.length > 1 ? `
          <div class="pd-dots" id="pdDots" aria-hidden="true">
            ${media.map((_, i) => `<span class="pd-dot${i === 0 ? " active" : ""}"></span>`).join("")}
          </div>` : ""}
        </div>
        <div class="pd-thumbs" id="pdThumbs">
          ${media.map((item, i) => `
            <button class="pd-thumb${i === 0 ? " active" : ""}" data-index="${i}" aria-label="View ${item.type === "video" ? "video" : "image"} ${i + 1}">
              ${thumbMediaHtml(item)}
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

        ${hasPrice(p) ? `
        <div class="pd-price">
          <span class="price-now">${rupee(p.price)}</span>
          ${onSale ? `<span class="price-was">${rupee(p.compare_at_price)}</span><span class="price-off">${pct}% off</span>` : ""}
        </div>` : ""}

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
          <button class="btn-share" id="shareBtn" type="button" aria-label="Share this product">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle>
              <line x1="8.6" y1="10.5" x2="15.4" y2="6.5"></line><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line>
            </svg>
            Share
          </button>
        </div>

        <div class="pd-desc">
          <h2>Product description</h2>
          <p>${escapeHtml(p.description || "")}</p>
        </div>
      </div>
    </div>`;

  wireGallery();
  wireLightbox(media, p.name);
  wireSizes(p);
  wireShare(p);
  document.getElementById("sizeChartBtn").addEventListener("click", openModal);
}

/* Share: native share sheet on mobile, copy-link + toast as fallback */
function wireShare(p) {
  const btn = document.getElementById("shareBtn");
  if (!btn) return;
  const shareData = {
    title: p.name,
    text: `Check out "${p.name}" from Janki Elegance`,
    url: location.href,
  };
  btn.addEventListener("click", async () => {
    if (navigator.share) {
      try { await navigator.share(shareData); return; }
      catch (e) { if (e && e.name === "AbortError") return; /* else fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      showToast("Link copied — paste it anywhere to share!");
    } catch (e) {
      window.prompt("Copy this link to share:", shareData.url);
    }
  });
}

let toastTimer = null;
function showToast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    t.setAttribute("role", "status");
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

function wireGallery() {
  // The main preview is a horizontal scroll-snap strip: swipe on phones,
  // click a thumbnail on laptops. Both stay in sync via the scroll position.
  const track = document.getElementById("pdTrack");
  const thumbs = document.querySelectorAll("#pdThumbs .pd-thumb");
  const dots = document.querySelectorAll("#pdDots .pd-dot");
  let current = 0;

  function setActive(idx) {
    if (idx === current) return;
    current = idx;
    thumbs.forEach((b, i) => b.classList.toggle("active", i === idx));
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
    // Stop any video that has been swiped away from.
    track.querySelectorAll("video").forEach((v) => { if (!v.paused) v.pause(); });
  }

  thumbs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      setActive(idx);
      track.scrollTo({ left: idx * track.clientWidth, behavior: "smooth" });
    });
  });

  // Only follow the scroll position once it settles, so a thumbnail click that
  // smooth-scrolls past other photos doesn't flicker the highlight along the way.
  let settle = null;
  track.addEventListener("scroll", () => {
    clearTimeout(settle);
    settle = setTimeout(() => setActive(Math.round(track.scrollLeft / track.clientWidth)), 80);
  }, { passive: true });
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

/* ============================================================
   Full-screen photo viewer (tap a gallery photo to open)
   Swipe between photos, pinch / double-tap to zoom and drag to look
   around. Closes with ✕, Esc, or the phone's Back button.
   ============================================================ */
const LB_MAX_ZOOM = 4;
const LB_TAP_ZOOM = 2.5;

function wireLightbox(media, name) {
  // Only photos go in the viewer; videos keep their own player controls.
  const photos = [];
  const photoIndexOf = {};
  media.forEach((m, i) => {
    if (m.type !== "image") return;
    photoIndexOf[i] = photos.length;
    photos.push(m.src);
  });
  if (!photos.length) return;

  const lb = document.createElement("div");
  lb.className = "lb";
  lb.hidden = true;
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Photo viewer");
  lb.innerHTML = `
    <div class="lb-bar">
      <span class="lb-count" aria-live="polite"></span>
      <button class="lb-close" type="button" aria-label="Close photo viewer">&times;</button>
    </div>
    <div class="lb-track">
      ${photos.map((src, i) => `
        <div class="lb-slide"><img src="${escapeHtml(src)}" alt="${escapeHtml(name)} — photo ${i + 1}" draggable="false" loading="lazy" /></div>`).join("")}
    </div>
    ${photos.length > 1 ? `
    <button class="lb-arrow prev" type="button" aria-label="Previous photo">&#8249;</button>
    <button class="lb-arrow next" type="button" aria-label="Next photo">&#8250;</button>` : ""}
    <p class="lb-hint">${matchMedia("(hover: none)").matches ? "Pinch or double-tap to zoom" : "Click to zoom · use ← → to browse"}</p>`;
  document.body.appendChild(lb);

  const track = lb.querySelector(".lb-track");
  const imgs = [...lb.querySelectorAll(".lb-slide img")];
  const count = lb.querySelector(".lb-count");
  let index = 0;
  let pushedHistory = false;

  // ---- zoom state for the photo currently on screen ----
  let scale = 1, tx = 0, ty = 0;

  function apply() {
    const img = imgs[index];
    img.style.transform = scale > 1 ? `translate(${tx}px, ${ty}px) scale(${scale})` : "";
    lb.classList.toggle("lb-zoomed", scale > 1);
  }
  function resetZoom() {
    imgs[index].style.transform = "";
    scale = 1; tx = 0; ty = 0;
    lb.classList.remove("lb-zoomed");
  }
  // How far the zoomed photo may be dragged before its edge would leave the screen.
  function limits() {
    const img = imgs[index];
    const boxW = img.clientWidth, boxH = img.clientHeight;
    const fit = Math.min(boxW / (img.naturalWidth || boxW), boxH / (img.naturalHeight || boxH));
    const w = (img.naturalWidth || boxW) * fit, h = (img.naturalHeight || boxH) * fit;
    return { x: Math.max(0, (w * scale - boxW) / 2), y: Math.max(0, (h * scale - boxH) / 2) };
  }
  function clampPan() {
    const m = limits();
    tx = Math.min(m.x, Math.max(-m.x, tx));
    ty = Math.min(m.y, Math.max(-m.y, ty));
  }
  // Point relative to the centre of the current photo's box.
  function fromCentre(clientX, clientY) {
    const r = imgs[index].getBoundingClientRect();
    return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
  }
  // Zoom to `next`, keeping the spot under point `p` fixed on screen.
  function zoomAt(next, p) {
    next = Math.min(LB_MAX_ZOOM, Math.max(1, next));
    tx = p.x - (p.x - tx) * (next / scale);
    ty = p.y - (p.y - ty) * (next / scale);
    scale = next;
    if (scale <= 1.01) { scale = 1; tx = 0; ty = 0; }
    clampPan();
    apply();
  }

  // ---- open / close ----
  function goTo(i, smooth) {
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }
  function setIndex(i) {
    if (i !== index) resetZoom();
    index = i;
    count.textContent = photos.length > 1 ? `${i + 1} / ${photos.length}` : "";
  }
  function open(i) {
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    setIndex(i);
    goTo(i, false);
    // A history entry lets the phone's Back button close the viewer instead of leaving the page.
    history.pushState({ lightbox: true }, "");
    pushedHistory = true;
    lb.querySelector(".lb-close").focus({ preventScroll: true });
  }
  function hide() {
    resetZoom();
    lb.hidden = true;
    document.body.style.overflow = "";
  }
  function close() {
    if (lb.hidden) return;
    if (pushedHistory) history.back(); // popstate below does the hiding
    else hide();
  }
  window.addEventListener("popstate", () => {
    pushedHistory = false;
    if (!lb.hidden) hide();
  });

  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-arrow.prev")?.addEventListener("click", () => goTo(Math.max(0, index - 1), true));
  lb.querySelector(".lb-arrow.next")?.addEventListener("click", () => goTo(Math.min(photos.length - 1, index + 1), true));
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") goTo(Math.max(0, index - 1), true);
    else if (e.key === "ArrowRight") goTo(Math.min(photos.length - 1, index + 1), true);
  });

  let settle = null;
  track.addEventListener("scroll", () => {
    clearTimeout(settle);
    settle = setTimeout(() => setIndex(Math.round(track.scrollLeft / track.clientWidth)), 80);
  }, { passive: true });

  // ---- touch: pinch to zoom, drag to pan when zoomed, double-tap to toggle ----
  let pinch = null, pan = null, lastTap = 0, lastTouchEnd = 0, moved = false;
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const mid = (a, b) => fromCentre((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);

  track.addEventListener("touchstart", (e) => {
    moved = false;
    if (e.touches.length === 2) {
      pinch = { d: dist(e.touches[0], e.touches[1]), scale, p: mid(e.touches[0], e.touches[1]), tx, ty };
      pan = null;
    } else if (e.touches.length === 1 && scale > 1) {
      pan = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
    }
  }, { passive: true });

  track.addEventListener("touchmove", (e) => {
    moved = true;
    if (pinch && e.touches.length === 2) {
      e.preventDefault();
      const p = mid(e.touches[0], e.touches[1]);
      const next = Math.min(LB_MAX_ZOOM, Math.max(1, pinch.scale * dist(e.touches[0], e.touches[1]) / pinch.d));
      // Keep the spot between the fingers under the fingers while zooming and moving.
      tx = p.x - (pinch.p.x - pinch.tx) * (next / pinch.scale);
      ty = p.y - (pinch.p.y - pinch.ty) * (next / pinch.scale);
      scale = next;
      clampPan();
      apply();
    } else if (pan && e.touches.length === 1) {
      e.preventDefault();
      tx = pan.tx + (e.touches[0].clientX - pan.x);
      ty = pan.ty + (e.touches[0].clientY - pan.y);
      clampPan();
      apply();
    }
  }, { passive: false });

  track.addEventListener("touchend", (e) => {
    lastTouchEnd = Date.now();
    if (e.touches.length < 2) pinch = null;
    if (e.touches.length === 0) pan = null;
    if (scale <= 1.01 && scale !== 1) resetZoom();
    // Double-tap: zoom in on the tapped spot, or back out if already zoomed.
    if (!moved && e.changedTouches.length === 1 && e.touches.length === 0) {
      const now = Date.now();
      if (now - lastTap < 300) {
        const t = e.changedTouches[0];
        if (scale > 1) resetZoom(); else zoomAt(LB_TAP_ZOOM, fromCentre(t.clientX, t.clientY));
        lastTap = 0;
      } else {
        lastTap = now;
      }
    }
  });

  // ---- mouse (laptop): click to zoom in/out, zoom follows the pointer ----
  track.addEventListener("click", (e) => {
    if (Date.now() - lastTouchEnd < 600 || e.target.tagName !== "IMG") return; // taps are handled above
    if (scale > 1) resetZoom(); else zoomAt(LB_TAP_ZOOM, fromCentre(e.clientX, e.clientY));
  });
  track.addEventListener("mousemove", (e) => {
    if (scale <= 1 || Date.now() - lastTouchEnd < 600) return;
    const r = imgs[index].getBoundingClientRect();
    const m = limits();
    tx = -((e.clientX - r.left) / r.width * 2 - 1) * m.x;
    ty = -((e.clientY - r.top) / r.height * 2 - 1) * m.y;
    apply();
  });

  // ---- open from the product gallery ----
  document.getElementById("pdTrack").addEventListener("click", (e) => {
    const slide = e.target.closest(".pd-slide");
    if (!slide || e.target.tagName !== "IMG") return;
    const galleryIndex = [...slide.parentNode.children].indexOf(slide);
    if (galleryIndex in photoIndexOf) open(photoIndexOf[galleryIndex]);
  });
}

/* Size chart modal */
function wireModal() {
  const modal = document.getElementById("sizeChartModal");
  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}
function openModal() { document.getElementById("sizeChartModal").hidden = false; document.body.style.overflow = "hidden"; }
function closeModal() {
  const modal = document.getElementById("sizeChartModal");
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", init);
