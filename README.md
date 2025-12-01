# lockit
Secure desktop password manager with 2FA authenticator built with Electron + React

Windows Installer Link : [Download Lockit - Windows Installer](https://www.mediafire.com/file/cwhjgxeldn2lure/Lockit-1.0.0-Setup.exe/file)

- NB.1 : Lockit is currently a windows only application
- NB.2 : You can build installer yourself following instructions bellow [To run Lockit in production (Windows only)]

## To run Lockit in development
After cloning repository, in root directory :

### Install necessary depndencies

```bash
npm run install:all
```

### Generate and push db

```bash
cd server
npx prisma generate
npx prisma db push
cd ..
```

### Run Lockit

```bash
npm run dev
```
Now you can use Lockit in developpment mode !


## To run Lockit in production (Windows only)
After cloning repository, in root directory :

### Install necessary depndencies

```bash
npm run install:all
```

### Generate and push db

```bash
cd server
npx prisma generate
npx prisma db push
cd ..
```

### Build Lockit

```bash
npm run build
```

### Execute the Installer
The installer will be created --> \dist\Lockit-1.0.0-Setup.exe, execute it and follow wizard instruction

### Welcome to Lockit !
- After installation finishes, you can directly launch the app !
- You will also have the Lockit Shortcut in Desktop, ready to use !

## Documentation

- User Manual: `docs/USER_MANUAL.md` — step-by-step usage and screenshots guidance.
- Technical docs: `docs/TECHNICAL.md` — architecture and security notes for developers.
- Development & Contribution: `docs/DEVELOPMENT.md` — how to run locally, contribute, and where to add screenshots.
- API docs (Vault): `server/API_DOCUMENTATION.md` — endpoints, examples, and security notes.
