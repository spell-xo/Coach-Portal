# Деплой на GitHub Pages

## Передумови

### 1. CORS на бекенді

GitHub Pages не має проксі. Фронтенд з `github.io` робить запити напряму до Cloud Run API.  
**На бекенді потрібно додати до allowed CORS origins:**

```
https://thatguywithesp3-sketch.github.io
```

### 2. GitHub Settings

У репозиторії: **Settings** → **Pages** → **Source**:  
обрати **Deploy from a branch**  
і вказати гілку **gh-pages**, папку **/ (root)**.

---

## Деплой

Для GitHub Pages потрібен `homepage` у package.json. Перед деплоєм тимчасово додай:

```json
"homepage": "https://thatguywithesp3-sketch.github.io/AIM-Coach-Portal"
```

Потім:

```bash
npm install
npm run deploy:gh-pages
```

(Vercel використовує корінь `/`, тому homepage не потрібен і заборонений у package.json.)

Після успішного деплою сайт буде доступний за адресою:

**https://thatguywithesp3-sketch.github.io/AIM-Coach-Portal/**

---

## Що робить `deploy:gh-pages`

1. Збирає білд з `REACT_APP_API_URL` на Cloud Run API
2. Копіює `index.html` у `404.html` для SPA маршрутизації
3. Публікує папку `build` у гілку `gh-pages`
