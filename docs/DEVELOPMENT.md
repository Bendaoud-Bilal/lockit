# Development & Contribution Guide

This file explains how to contribute, run the project locally, and add documentation.

## Local development

1. Install dependencies:

```powershell
npm run install:all
```

2. Prepare the database (server):

```powershell
cd server
npx prisma generate
npx prisma db push
node prisma/seed.cjs
cd ..
```

3. Run in development:

```powershell
npm run dev
```

## Branches and commits

- Use feature branches named `feature/your-feature` or `fix/short-description`.
- Write clear commit messages. Squash small WIP commits before merging.

## Coding & documentation standards

- Use JSDoc for exported functions; include `@param`, `@returns`, and a brief description.
- Keep inline comments for non-obvious code. Avoid redundant comments that restate code.
- For React components, document props with JSDoc or use `propTypes` / TypeScript.

## Requesting documentation changes

- If you update a flow that affects users (e.g., new recovery steps), update `docs/USER_MANUAL.md` and include new screenshots.