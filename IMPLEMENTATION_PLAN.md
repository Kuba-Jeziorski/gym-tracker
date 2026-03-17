# Gym Tracker – Implementation Plan

This document is a structured variation of the product plan, oriented toward implementation order and technical clarity. All original requirements are preserved; some are grouped or rephrased for clarity.

---

## 1. Authentication & Onboarding

### 1.1 Account creation (sign up)
- **Fields:** application language (Polish / English), name, email, password.
- **Validation:** email format, password strength, unique email.
- **Flow:** sign up → (optional email verification) → redirect to app or onboarding.

### 1.2 Login
- **Fields:** email, password.
- **Flow:** login → JWT/session → redirect to dashboard (or “current workout” if one is in progress).

### 1.3 Password reminder
- **Flow:** enter email → send reset link/token → reset password page → redirect to login.

### 1.4 Logout & account deletion
- **Logout:** clear session/token, redirect to login or landing.
- **Delete account:** confirm step, then call “delete account” endpoint; clear local state and redirect (see §5.3).

---

## 2. Current Workout (Save Workout)

**Endpoint:** e.g. `POST /workouts` (create) and `PATCH /workouts/:id` (update in progress).

### 2.1 Exercise selection and sets
- User picks **exercise** (from a list that can be filtered by name or muscle group).
- For each **set:** reps, load (weight), optional time/duration if needed.
- **Validation rule:** key fields (e.g. weight and reps for bench press) must be filled before another set can be added.
- **Confirm set:** button next to the set; on confirm, row is visually “locked” (e.g. different background), and a new set row is added.
- **Edit set:** after confirm, user can still click to edit that set (weight, reps, time) and save again.

### 2.2 Placeholders from previous set
- Each new set row pre-fills (as placeholders or default values) from the **previous set** (e.g. same weight, same reps) to speed up input.

### 2.3 Comments
- **Per exercise:** optional comment per exercise block.
- **Workout summary:** optional comment for the whole workout (e.g. “felt strong”, “tired”).

### 2.4 Link to last time with this exercise
- For each chosen exercise, show a link like “Last time: [date]” that opens the **last completed workout** containing that exercise (read-only view or deep link to summary).

### 2.5 Ending the workout
- **Finish:** save workout definitively and (optional) redirect to workout summary or dashboard.
- **Pause / discard:** end without saving; delete current workout from server (and local state). No history entry.

---

## 3. Training Summary (History & Analytics)

**Endpoints:** e.g. `GET /workouts` (list), `GET /workouts/:id` (detail), `PATCH /workouts/:id` (edit completed).

### 3.1 Workout list
- **Default range:** last 3 months.
- **Display:** list of workouts (date, duration, exercises summary, optional tags).

### 3.2 Filters
- **Period:** e.g. last 7 days, 30 days, 3 months, custom range.
- **Exercise:** e.g. “Barbell squat” – show only workouts containing that exercise.
- **Muscle group:** e.g. “Chest” – show only workouts that contain at least one exercise assigned to that group.

### 3.3 Edit completed workout
- From list or detail, “Edit” opens a form similar to “current workout”: change exercises, sets, reps, load, comments. Save via `PATCH /workouts/:id`.

### 3.4 Progress & analytics
- **Body weight over time:** chart (body weight vs date), data from account settings or dedicated “body weight” entries.
- **Volume (per exercise or per workout):** e.g. last set reps × weight (or total volume) over time.
- **Other (optional):** strength progression per exercise, estimated 1RM, etc.

### 3.5 Workout detail (single workout)
- **Endpoint:** `GET /workouts/:id`.
- **View:** exercises, sets (reps, load, time), comments per exercise and workout summary. Read-only unless “Edit” is used (§3.3).

---

## 4. Account Settings

**Endpoint:** e.g. `GET /me`, `PATCH /me` (profile/settings).

### 4.1 Editable fields
- Name, password (with current password confirmation), height, weight, age, application language (Polish / English).
- Email: **not editable** (or only via separate “change email” flow with verification, if required later).

### 4.2 Logout
- Clear token/session; redirect to login or landing.

### 4.3 Delete account
- **Confirmation:** e.g. modal with “Type DELETE” or similar.
- **Endpoint:** e.g. `DELETE /me` or `POST /me/delete`.
- **Effect:** account and related data removed; user logged out and redirected.

---

## 5. PWA Install / Download

### 5.1 “How to install” page
- **Route:** e.g. `/install` or `/pwa`.
- **Content:** short step-by-step with **screenshots** (or illustrations):
  - **Android (default browser):** e.g. “Add to Home screen” / “Install app”.
  - **iOS:** separate instructions for **Safari** and **Chrome** (e.g. Share → “Add to Home Screen” in Safari).
- **PWA setup:** ensure `manifest.json` and service worker are configured so “Add to Home Screen” / “Install” is available where supported.

---

## 6. Data & UX Rules (Summary)

| # | Rule | Implementation note |
|---|------|----------------------|
| 1 | No new set until key values (e.g. weight + reps) are filled for current set | Disable “Add set” / “Confirm set” until required fields valid. |
| 2 | Link to last workout with same exercise | For each exercise in current workout, call e.g. `GET /workouts?exerciseId=…&limit=1` or include in exercise payload; show “Last: [date]” link. |
| 3 | Confirm set → row locked (color change), then allow new set; allow edit of confirmed set | Toggle “confirmed” state per set; style row when confirmed; “Edit” reopens row for changes. |
| 4 | New set prefilled from previous set | When adding set, copy previous set’s weight, reps (and time if any) as default/placeholder. |
| 5 | Finish = save workout; Pause = discard | “Finish” → POST/PATCH and navigate; “Pause” → DELETE current workout (or clear draft) and navigate. |

---

## 7. Suggested Implementation Order

1. **Project setup** – Already done: Vite, React, TypeScript, TanStack Query, Tailwind, dark theme.
2. **Routing** – Add React Router; define routes (login, signup, dashboard, workout, history, settings, install).
3. **Auth** – Login, sign up (with language), password reminder; protect routes; store token and user.
4. **API client** – Base URL, interceptors (auth, errors), TanStack Query hooks for auth and workouts.
5. **Current workout** – Exercise picker, set table (reps, load, confirm, placeholders), comments, “last time” link; Finish vs Pause; integrate with save/discard endpoints.
6. **Training summary** – List with default 3 months, filters (period, exercise, muscle group); detail view; edit completed workout.
7. **Charts** – Body weight, volume (and any other metrics) using a small charting library.
8. **Account settings** – Profile form (name, password, height, weight, age, language); logout; delete account with confirmation.
9. **PWA** – Manifest, service worker, “How to install” page with Android/iOS screenshots.
10. **i18n** – Polish/English for all UI (and ensure language is saved in account and used on login).

---

## 8. Optional Extensions (Later)

- Email verification on sign up.
- “Change email” flow with verification.
- Notifications (e.g. “reminder to log workout”).
- Export data (e.g. CSV/PDF).
- Offline support for viewing history and drafting a workout (sync when online).

---

*Document version: 1.0 – structured implementation plan based on product requirements.*
