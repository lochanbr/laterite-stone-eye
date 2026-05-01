# LateriteIQ — Build Plan

An AI-powered laterite stone quality inspection platform. Upload a photo, get an instant AI-graded quality report, save it to your account history, and download a PDF.

## Pages & Routes

- `/` — Landing page (hero, features, how-it-works, CTA)
- `/auth` — Sign in / sign up (email + password, plus Google sign-in)
- `/inspect` — Main upload + analysis page (protected)
- `/history` — Past inspections list (protected)
- `/inspect/$id` — View a single past inspection report (protected)

A shared header with logo, nav (Inspect / History), and account menu (sign out) appears on all authenticated pages.

## 1. Landing Page (`/`)

- Hero: "AI-Powered Laterite Stone Quality Inspector" headline, subhead "Upload a photo. Get an instant quality report in seconds.", primary CTA "Start Inspection" → routes to `/auth` if signed out, else `/inspect`.
- 3 feature cards: Instant Analysis, Defect Detection, Grade Report.
- "How It Works" 3-step visual flow: Upload → Analyze → Report.
- Subtle stone/grain noise texture overlay on the dark background.

## 2. Auth (`/auth`)

- Email + password sign-up and sign-in tabs.
- "Continue with Google" button.
- Email verification handled by Lovable Cloud; redirects to `/inspect` on success.
- A `profiles` table is created (linked to auth users) with a trigger that auto-creates a profile row on signup, so we can show a display name later.

## 3. Inspection Page (`/inspect`)

- Large drag-and-drop upload zone (JPG, PNG, WEBP up to ~10 MB), dashed terracotta border, camera icon, glow on hover/drag.
- "Use sample image" button that loads a hosted demo laterite photo so users can try without uploading.
- Image preview after upload with a "Remove" button.
- "Analyze Stone" primary button.
- While analyzing: skeleton + animated spinner over the results area. Errors (invalid image, AI failure, rate limit, out of credits) shown as inline alerts with friendly copy.
- On success, the Results Panel animates in with a staggered fade-up.

## 4. Results Panel

- Large color-coded **Grade Badge**: A (green) / B (yellow) / C (orange) / D (red) with descriptor text.
- **Quality Parameters Table** with 7 rows: Color Uniformity, Surface Texture, Visible Cracks, Iron Content Estimate, Weathering Signs, Shape Regularity, Porosity Estimate. Each row shows the AI's result text plus a status icon (✅ good / ⚠️ warning / ❌ bad).
- **Summary**: 2–3 line AI verdict.
- **Recommendations**: bulleted list (e.g., "Suitable for load-bearing walls", "Not recommended for flooring").
- **Download PDF** button (jsPDF) — produces a one-page report including the thumbnail, grade, table, summary, recommendations, date, and a "LateriteIQ" header.
- The inspection (image + result JSON + grade + date) is automatically saved to the user's history.

## 5. History Page (`/history`)

- Grid/list of past inspections — each card shows thumbnail, date, color-coded grade badge, and 1-line summary.
- Click a card → `/inspect/$id` to re-view the full report (same Results Panel layout, with Download PDF available).
- Each card has a delete button with confirmation.
- Empty state with CTA to run first inspection.

## AI Analysis

- Uses the Lovable AI Gateway (Gemini vision model) via a `createServerFn` server function. No API key needed from end users; the key is managed automatically.
- The system prompt instructs the model to act as an expert laterite stone inspector and return structured output. We use **tool calling** (not "respond in JSON") to guarantee a valid, schema-conformant result with the exact fields specified (grade, the 7 parameter objects with `result`/`status`, summary, recommendations array).
- The image is sent inline (base64) with the request.
- Server-side handles 429 (rate limit) and 402 (out of credits) with clear, user-facing error messages surfaced via toasts.

## Data Storage (Lovable Cloud)

- `profiles` — id, display_name, created_at. Auto-created via signup trigger.
- `inspections` — id, user_id, image_path (Storage), grade, result (jsonb with all parameters/summary/recommendations), created_at.
- `inspection-images` Storage bucket (private) — original uploaded photos. Signed URLs are used to display thumbnails and full images.
- RLS enabled on all tables and the bucket: users can only read/write/delete their own inspections and images.

## Design System

- Dark industrial / earthy palette: charcoal background `#1a1a1a`, terracotta accent `#c1440e`, stone-beige `#d4b896`, plus semantic green/yellow/orange/red for grade badges.
- Fonts: **Bebas Neue** for headings, **DM Sans** for body (loaded from Google Fonts).
- Subtle CSS noise/grain texture overlay on dark surfaces.
- Mobile-first responsive layout; tested down to ~360px wide.
- Staggered fade-up animations on results; smooth hover states; accessible focus rings.

## Technical Notes

- Stack: TanStack Start + React + Tailwind v4 (per project conventions). Routes live under `src/routes/` (separate route files, not hash anchors).
- Auth: Lovable Cloud (email/password + Google). Protected routes use the `_authenticated` layout pattern with `beforeLoad` redirect, plus a session-hydration gate before loaders that call authed server functions.
- AI call: server function using the Lovable AI Gateway (`google/gemini-2.5-pro` for best vision accuracy on stone defects) with tool-calling for structured JSON. Errors mapped to user-friendly messages.
- PDF: `jspdf` on the client, includes the stone thumbnail (drawn from the image data URL).
- Image upload: client compresses/resizes large images before sending to keep payloads manageable, then uploads the original to Storage and sends a base64 version to the AI.
- Input validation with Zod on the server function (image present, MIME type allowed, size cap).
- File layout: `src/server/ai.functions.ts` (analyze server fn), `src/server/inspections.functions.ts` (CRUD), `src/components/` for UI pieces (UploadZone, GradeBadge, ResultsPanel, ParameterRow, HistoryCard, Header), `src/lib/pdf.ts` for report generation.

## Out of Scope (can add later)

- Sharing reports via public link.
- Comparing multiple stones side-by-side.
- Admin dashboard / analytics.
