# CODEX.md

Main Codex configuration for this repository.

## Project

Support HR is an AI-assisted CV screening application.

## Stack

- React + Vite + TypeScript
- Firebase
- Vercel serverless API
- Gemini AI integration

## Working Rules

- Keep product information accurate. Do not invent metrics, claims, or features.
- Preserve the existing navy UI direction with light rounded corners.
- Keep changes scoped to the requested workflow or page.
- Prefer existing repo patterns before introducing new abstractions.
- Verify user-facing changes with `npm run build` when practical.

## Common Commands

- `npm run dev`: frontend only
- `npm run dev:full`: frontend + Vercel API locally
- `npm run build`: TypeScript check and production build

## Codex Tree

- `commands/`: reusable slash-command style workflows
- `agents/`: specialized role briefs
- `rules/`: mandatory engineering and product rules
- `skills/`: deeper task playbooks
- `references/`: compact checklists
- `settings.json`: Codex project settings
