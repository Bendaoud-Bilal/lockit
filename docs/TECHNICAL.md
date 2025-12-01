# Lockit — Technical Documentation

This document provides a concise technical overview for developers and maintainers.

## Architecture Overview

- Electron desktop app with a React frontend (client/) and a Node/Express backend (server/).
- Zero-knowledge encryption: sensitive fields (credential data, TOTP secrets) are encrypted client-side using AES-256-GCM. The server stores only encrypted blobs and metadata.
- Prisma is used as ORM for the database (`server/prisma/schema.prisma`).

```
Client (Electron + React)  <-->  Server (Express + Prisma)  <-->  Database
```

## Folder Layout (short)

- `client/` — React app, components, hooks, services.
- `server/` — Express app, controllers, services, routes, prisma client.
- `electron/` — main electron process & preload scripts.
- `docs/` — documentation.

## Security Model (Zero-Knowledge)

- The vault key is derived client-side and used to encrypt/decrypt credentials locally. The server never receives plaintext vault keys or unencrypted credential data.
- Encrypted fields in DB: `dataEnc`, `dataIv`, `dataAuthTag` (AES-256-GCM) and similar for TOTP secrets.
- Recovery key: optionally used to dual-wrap the vault key. The server stores the recovery-wrapped blob but cannot decrypt it.

## Important Files & Services

- `server/services/crypto.service.js` — server-side helpers for encryption-related flows (vault wrapping/unwrapping compatibility).
- `client/src/services/cryptoService.js` — browser WebCrypto helpers used throughout the UI.
- `server/services/totp.service.js` — TOTP CRUD and zero-knowledge handling.

## Security Dashboard — Implementation

The Security Dashboard is implemented across both client and server components:

- Client UI: React dashboard components live under `client/src/components/dashboard/` and `client/src/components/dashboard/components/`. These components display the security score, breach alerts, weak/reused password lists, and 2FA status.
- Backend services: several server-side services support dashboard features:
	- `server/services/hibpService.js` — helpers to query and normalize external breach data sources (HaveIBeenPwned and similar integrations).
	- `server/services/breachDetectionService.js` — core logic to detect breaches and connect breach records to user credentials.
	- `server/services/securityScoreService.js` — computes composite security scores and aggregates metrics used by the dashboard.
	- `server/services/credentialStatusService.js` — checks for password reuse and other credential-level status checks.
	- `server/scheduler/breachScheduler.js` — scheduled job that runs periodic breach checks (cron-style) and triggers re-scans.

### Data flow

1. Credentials and TOTP secrets are stored in the DB as encrypted blobs (`dataEnc`, `dataIv`, `dataAuthTag`).
2. The backend services operate on metadata and, where necessary, perform privacy-preserving checks against external breach sources (for example k-anonymity hashed-prefix queries to HIBP).
3. Results (breach flags, reused-password markers, weak-password markers) are stored as metadata fields (e.g., `compromised`, `passwordReused`, `passwordStrength`) so the client can display them without exposing plaintext.

### Privacy considerations

- The project aims to minimize sending plaintext secrets to third-party services; when external breach APIs are used, the implementation prefers k-anonymity or hashed-prefix checks.
- The server stores only encrypted credential blobs and derived metadata needed to drive the dashboard UI. The zero-knowledge model remains the primary design goal: only the client can decrypt sensitive credential data.

### Files to inspect when changing dashboard behavior

- Client rendering and UX: `client/src/components/dashboard/`.
- Breach detection and integration: `server/services/hibpService.js`, `server/services/breachDetectionService.js`.
- Score and status computation: `server/services/securityScoreService.js`, `server/services/credentialStatusService.js`.
- Scheduler: `server/scheduler/breachScheduler.js`.


## API

See `server/API_DOCUMENTATION.md` for the Vault API overview and examples.

## Development Notes

- Local DB: use Prisma commands:

```powershell
npx prisma generate
npx prisma db push
```

- Seed: `server/prisma/seed.cjs` creates example data.

## Documentation Standards

- Prefer JSDoc-style block comments for exported functions and services. Include `@param` and `@returns` for clarity.
- For React components and hooks, document props and exposed behavior. Consider using TypeScript or `propTypes` for stricter contracts.

## Runtime & Testing

- Start full stack: `npm run dev` from project root (this launches server, client, and electron dev process depending on scripts in `package.json`).
