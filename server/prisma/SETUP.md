# Database Setup

## First Time Setup

```bash
cd server
npm install
npx prisma generate
npx prisma db push
```

## After Pulling Schema Changes

```bash
cd server
npx prisma generate
npx prisma db push
```

## Useful Commands

```bash
# View database in browser
npx prisma studio

# Regenerate types after schema changes
npx prisma generate
```

---

**Note:** We use `db push` (not migrations) since this is a desktop app. Each user gets their own local SQLite database at `prisma/lockit.db`.