# AGENTS.md - Repository Map

## App Roots for Deployment
- **Prism Publication:** `apps/main-site/` (Target: prismpublication.com)
- **Convo Margin:** `apps/tools/convomargin/` (Target: convomargin.pages.dev)
- **2nd Brain Vault:** `packages/2nd-brain/`

## Editing Guidelines
1. Edit static HTML/CSS inside `apps/main-site/` for hub updates.
2. Read prompt logs from `packages/2nd-brain/content/` when generating blog posts.
3. Keep logic decoupled; do not cross-import across `apps/`.
