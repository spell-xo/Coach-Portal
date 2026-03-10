# Vercel: Club Dashboard замість Coach Dashboard

Щоб на Vercel показувався **Club Dashboard** (як на localhost), додай змінну середовища:

## Vercel Dashboard → Settings → Environment Variables

| Name | Value |
|------|-------|
| `REACT_APP_API_URL` | `/api/v1` |
| `REACT_APP_DEFAULT_CLUB_ID` | `ТВІЙ_CLUB_ID` |

### Як дізнатися Club ID

1. Відкрий **localhost** (логін: headcoach@sk.com / Aim@2025)
2. Перейди на Club Dashboard (SK Academy)
3. Подивись URL: `http://localhost:3000/clubs/XXXXX/dashboard`
4. `XXXXX` — це твій Club ID

Скопіюй його в `REACT_APP_DEFAULT_CLUB_ID` у Vercel.

---

**Що станеться:**

- Якщо **auto-login пройде** → покаже Club Dashboard з реальними даними
- Якщо **auto-login не пройде** (CORS/API) → покаже Club Dashboard з mock-контекстом (layout як на localhost, дані можуть не завантажуватися)
