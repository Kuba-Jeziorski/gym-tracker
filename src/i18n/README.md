# i18n readiness (Polish / English)

This note describes how the app is structured for adding translations later.

## Exercises

- **`unique_name`** – Stable, English, snake_case key. Use for:
  - Translation keys: `t('exercises.dumbbell_chest_press')`
  - API payloads, URLs, storage (never rename)
- **`name`** – Default English display text. When adding i18n:
  - Keep as fallback: `t(`exercises.${exercise.unique_name}`) ?? exercise.name`
  - Or move English strings into `en.json` under `exercises.*` and resolve by `unique_name`

## Other UI text

| Location        | Current shape              | i18n adjustment                                      |
|----------------|----------------------------|------------------------------------------------------|
| `navConfig.ts` | `label: 'Dashboard'`       | Use keys, e.g. `labelKey: 'nav.dashboard'`, then `t(labelKey)` in Layout |
| `routeTitles`  | Plain English strings      | Same: switch to keys and translate in `getPageTitle` or in a `t()` layer |
| Page content   | Inline strings in components | Replace with `t('workout.noCurrentWorkout')` etc.  |
| Muscle groups  | `main_muscle_group`, `all_muscle_groups` | Consider `muscle_group_key` for translation (e.g. `chest` → "Chest" / "Klata") |

## Suggested next steps

1. Add an i18n library (e.g. react-i18next + i18next) and a language context or store.
2. Add JSON files: `locales/en.json`, `locales/pl.json` with namespaces (e.g. `nav`, `exercises`, `workout`, `common`).
3. In Layout, use `t('nav.dashboard')` instead of `label`; either store keys in `navConfig` or map route → key and translate.
4. For exercises, use `unique_name` in translation files: `"exercises.dumbbell_chest_press": "Dumbbell chest press"` (EN), `"exercises.dumbbell_chest_press": "Wyciskanie sztangielek na ławce"` (PL).
5. Persist language in settings (already planned in implementation plan).

No code changes are required for exercises beyond using `unique_name` as the translation key and `name` as fallback; the rest is additive when you introduce i18n.
