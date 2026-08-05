# Environment Variables - FoodOps Phase 2

FoodOps requires the following environment variables to run. A template is provided in the project root as `.env.example`.

---

## 1. Required Variables

| Name | Type | Purpose | Production Value | Development Value |
|---|---|---|---|---|
| `DATABASE_URL` | String | Connection URI for the database adapter | `postgresql://user:password@host:5432/db?schema=public` | `file:./dev.db` |
| `JWT_SECRET` | String | Secret key used to sign session cookies | Secure 32-character random string | `your_jwt_secret` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | String | Browser key for map renders and reverse geocoding | Google Cloud API Key | Google Cloud API Key |

---

## 2. Optional Variables

| Name | Type | Purpose | Production Value | Development Value |
|---|---|---|---|---|
| `RESEND_API_KEY` | String | API key for transactional Resend email dispatches | `re_...` | (Optional: Mock mode if empty) |

---

## 3. Security Recommendations

- **No Secrets in Repo:** Never commit `.env` files to git. They are ignored by default via `.gitignore` and `.dockerignore`.
- **Rotations:** Rotate `JWT_SECRET` and database credentials in production quarterly.
