# Janki Elegance

A simple, elegant catalog website for the Janki Elegance store.

- **Customers** browse the catalog and tap **Buy on WhatsApp** (or visit Instagram) to order.
- **The owner** logs in at `/admin` to add, edit, or remove products through a friendly form — no code needed.
- Hosts for **free** on Netlify. No backend server to run.

---

## What's in here

```
index.html            The storefront customers see
css/styles.css        Styling
js/app.js             Loads the catalog + builds WhatsApp/Instagram links
content/products.json The catalog data (edited by the owner via /admin)
admin/                 The owner-only "Catalog Manager" (Decap CMS)
images/               Logo, hero, placeholder + uploaded product photos
netlify.toml          Netlify hosting config (no build step)
```

---

## ✏️ Things to change (placeholders)

In **`js/app.js`** (top of the file):

```js
const WHATSAPP_NUMBER = "123456678";       // ← your WhatsApp number, with country code, e.g. 919876543210
const INSTAGRAM_HANDLE = "janakielegance"; // ← your Instagram handle
```

> ⚠️ The WhatsApp number must include the **country code** and **no `+` or spaces** (e.g. India → `91` + 10-digit number = `919876543210`). The current `123456678` is a placeholder and won't work until you update it.

The Instagram handle is also linked in `index.html` (header + footer) — update it there too, or ask me to.

### Category names
The 12 categories live in two places that must match:
- `js/app.js` → the `CATEGORIES` list (filter buttons)
- `admin/config.yml` → the `category` dropdown options

I tidied the spellings for the storefront (e.g. "Cod Sets" → "Co-ord Sets", "Plazo" → "Palazzo", "Frok" → "Frock", "Jwellerys" → "Artificial Jewellery"). Change any you'd like — just keep both files in sync.

---

## 🚀 Putting it online (one-time, ~15 min)

1. Push this branch to GitHub (you're doing the commit).
2. Go to **[netlify.com](https://www.netlify.com)** → sign up (free) → **Add new site → Import from Git** → pick this repo and branch.
3. Build settings: leave **build command empty**, **publish directory = `.`** (already set in `netlify.toml`). Deploy.
4. Your site is live at `something.netlify.app`. (You can add a custom domain later.)

---

## 🔑 Giving the owner the "Add Catalog" login

The admin panel uses **Netlify Identity** so the owner logs in with an email + password.

1. In Netlify: **Site configuration → Identity → Enable Identity**.
2. Under Identity → **Registration**, set it to **Invite only** (so only people you invite can log in).
3. Under Identity → **Services → Git Gateway**, click **Enable Git Gateway**.
4. Click **Invite users** and enter the owner's email.
5. The owner gets an email → sets a password → can now log in at `yoursite.netlify.app/admin` and use **Catalog → Products** to manage the store.

Customers never see any of this — they only see the storefront and the Buy buttons.

> **Note on logins:** Netlify Identity / Git Gateway is the simplest path and works today. If you'd prefer a more future-proof setup, the admin can instead use the **GitHub backend** (or the drop-in **Sveltia CMS**). Ask me and I'll switch `admin/config.yml` over.

---

## 👀 Preview it locally before deploying

The site loads the catalog with `fetch()`, so opening `index.html` directly as a file won't work — run a tiny local server instead:

```bash
cd Janki-Elegance
python3 -m http.server 8080
```

Then open **http://localhost:8080**. (The `/admin` panel only fully works once deployed to Netlify with Identity enabled.)
