# Vercel CORS Fix – Deployment Protection

Якщо логін все ще показує "Not allowed by CORS" або 401 помилки:

## 1. Vercel Deployment Protection

**401 для manifest.json і api/v1** часто викликає **Vercel Deployment Protection**. Preview-деплої (типу `-puwx1khrb-...-projects.vercel.app`) можуть бути захищені.

### Що зробити:

1. Vercel Dashboard → твій проєкт → **Settings** → **Deployment Protection**
2. Для **Production** (aimcoach-portal1.vercel.app): переконайся, що protection вимкнено або додано exception
3. Для **Preview**: додай домен до **Deployment Protection Exceptions**, щоб він був публічним

### OPTIONS Allowlist (для CORS preflight):

Якщо protection увімкнено, додай шлях:

- **Path:** `/api`

Це дозволить OPTIONS-запити для `/api/v1/*` обходити protection.

---

## 2. Перевірка env на Vercel

**Settings** → **Environment Variables**:

- **REACT_APP_API_URL** = `/api/v1` (тільки це значення, без `https://`)

---

## 3. Тест на Production

Спробуй зайти на **https://aimcoach-portal1.vercel.app** (а не на preview URL). Production зазвичай не захищений.
