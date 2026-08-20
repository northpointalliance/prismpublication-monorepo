# apps/tools/convomargin

Cloudflare Pages root for **convomargin.pages.dev**.

## Pages project settings

| Setting | Value |
|---|---|
| Build command | *(empty)* |
| Build output directory | `apps/tools/convomargin` |
| Production branch | `main` |
| Cloudflare account | `f8c334c2394fdd6ec4ea9cf013cd941e` (Prism) |

## Migration status

The live site currently deploys from the standalone `northpointalliance/convomargin` repo, with a working copy on the Desktop and a third copy under `daniels_corner/packages/convomargin`. Nothing has been copied in here yet, so this folder is a placeholder root.

To consolidate, move these in from the standalone repo and retire the other copies:

| Source | Destination here |
|---|---|
| `dist/*` | `./` (static files at the Pages root) |
| `functions/api/lead.js` | `functions/api/lead.js` |
| `functions/api/usage.js` | `functions/api/usage.js` |
| `functions/lib/snapshot.js` | `functions/lib/snapshot.js` |
| `migrations/*.sql` | `migrations/` |
| `dist/project-traces/*.json` | `project-traces/` |

Pick one home before copying. Editing two roots is what caused the earlier "edits do not appear on the live site" failures.

## Bindings

Set on the Pages project, not in this repo:

- `DB` — D1 database `convomargin-leads` (exact binding name, case sensitive)
- `RESEND_API_KEY` — secret
- `NOTIFY_EMAIL`, `FROM_EMAIL`

## Notes

Per `.cursorrules`, do not cross-import between `apps/`. Shared schemas belong in `packages/2nd-brain/schemas/`.
