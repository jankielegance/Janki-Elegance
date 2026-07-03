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

## 🔑 The "Add Catalog" login (GitHub + your own Cloudflare Worker)

The admin panel uses the **GitHub backend**: whoever manages the catalog logs in
with a **GitHub account** and must be a **collaborator** on this repo. Login is
completed by a tiny **Cloudflare Worker** you deploy once — so it does **not**
depend on Netlify Identity/Git Gateway (which Netlify has deprecated). Even if
Netlify removes every auth feature, this login keeps working.

> **Who can log in:** add the shop owner as a collaborator at
> **github.com/jankielegance/Janki-Elegance → Settings → Collaborators**, or just
> manage the catalog yourself with your own GitHub account.

### One-time setup (~15 min)

**1. Deploy the auth Worker (Cloudflare — free)**
- Sign up at [cloudflare.com](https://www.cloudflare.com) (free).
- Deploy **sveltia-cms-auth**: open <https://github.com/sveltia/sveltia-cms-auth>
  and use its **Deploy to Cloudflare** button (or clone it and run `npx wrangler deploy`).
- Copy the resulting Worker URL, e.g. `https://sveltia-cms-auth.<your-subdomain>.workers.dev`.

**2. Register a GitHub OAuth App**
- Go to <https://github.com/settings/applications/new>.
- **Homepage URL:** your site URL (e.g. `https://janki-elegance.netlify.app`).
- **Authorization callback URL:** `<YOUR_WORKER_URL>/callback`
  (e.g. `https://sveltia-cms-auth.<your-subdomain>.workers.dev/callback`).
- Register, then copy the **Client ID** and generate a **Client Secret**.

**3. Give the Worker its secrets**
- In the Cloudflare dashboard → your Worker → **Settings → Variables**, add:
  - `GITHUB_CLIENT_ID` — the Client ID from step 2
  - `GITHUB_CLIENT_SECRET` — the Client Secret (click **Encrypt**)
  - `ALLOWED_DOMAINS` *(optional but recommended)* — your site hostname,
    e.g. `janki-elegance.netlify.app` (locks the Worker to your site only)
- Save & deploy.

**4. Point the CMS at your Worker**
- In **`admin/config.yml`**, set `base_url` to your Worker URL (no trailing slash):
  ```yaml
  base_url: https://sveltia-cms-auth.<your-subdomain>.workers.dev
  ```
- Also confirm `repo:` and `branch:` are correct (branch should become `main` after you merge).
- Commit & push.

**Done.** Visit `yoursite.netlify.app/admin` → click **Login with GitHub** → you land in
**Catalog → Products**. Customers never see any of this — only the storefront and Buy buttons.

> **Tip:** The same Worker works with the drop-in **Sveltia CMS** too, if you ever want to
> swap `admin/index.html`'s script over — it reads this exact `config.yml`.

---

## 👀 Preview it locally before deploying

The site loads the catalog with `fetch()`, so opening `index.html` directly as a file won't work — run a tiny local server instead:

```bash
cd Janki-Elegance
python3 -m http.server 8080
```

Then open **http://localhost:8080**. (The `/admin` login only works once deployed, since the GitHub OAuth callback points at your live Worker + site URL — not `localhost`.)
