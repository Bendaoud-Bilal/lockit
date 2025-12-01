# Lockit — User Manual

This user manual explains how to install, run and use Lockit (Windows desktop application).

## Overview

Lockit is a secure desktop password manager with built-in 2FA authenticator. This manual covers common user tasks and includes guidance for adding screenshots to the documentation.

## Signing Up and First Run

1. Launch the app.
![Welcome screen](assets/screenshots/welcome.png)
2. Click **Sign Up** and create your account (username, email, master password).
![Signup screen](assets/screenshots/signup.png)
![Full Signup screen](assets/screenshots/signup-full.png)
3. The app will generate a vault key and ask you to save the recovery key. Keep this recovery key safe — it can recover vault data without the master password.
![Recovery Key screen](assets/screenshots/recovery-key.png)

## Unlocking the Vault

- Enter your master password on the unlock screen to load the in-memory vault key.
![Unlock screen](assets/screenshots/unloack.png)
- The plaintext vault key is kept only in memory and is not persisted by the app.
![Vault screen](assets/screenshots/vault.png)

## Common Tasks

- Add a credential: Go to the Vault, click **Add**, fill details, encrypts locally and sends encrypted blob to server.
![Add Item screen](assets/screenshots/add-item.png)
![Added Item screen](assets/screenshots/added_item.png)
- Edit credential: Select an item and and edit any data except cateory.
![Edit Item screen](assets/screenshots/edit-item.png)
![Edit Item - Add Attachement screen](assets/screenshots/edit-add-attach.png)
- Manage folders: Create, rename, and delete folders to organize credentials.
![Add Folder screen](assets/screenshots/add-folder.png)
![Add Credetential to Folder screen](assets/screenshots/add-cred-folder.png)
![Folder Options screen](assets/screenshots/folder-options.png)
![Open Folder screen](assets/screenshots/opened-folder.png)
- Use Authenticator: Add a TOTP entry (QR or secret); TOTP secrets are encrypted client-side.
![Add TOTP screen](assets/screenshots/add-totp.png)
![Added TOTP screen](assets/screenshots/added-totp.png)
![Show 2FA screen](assets/screenshots/show-2fa.png)

## Send (Share) Feature

- The Send feature allows sharing encrypted content. Follow the UI prompts to create a shareable send.
![Create Send screen](assets/screenshots/create_send.png)
![Created Send screen](assets/screenshots/created-send.png)
![Receive Send screen 1](assets/screenshots/receive-send.png)
![Receive Send screen 2](assets/screenshots/receive2.png)
![Receive Send screen 3](assets/screenshots/receive3.png)

## Security Dashboard

The Security Dashboard provides an at-a-glance view of your vault's overall security posture and actionable alerts.

- **Access:** open the app and go to the **Dashboard** or **Security** section in the left menu.
- **What it shows:**
	- **Security Score:** a composite score that summarizes password strength, reuse, and compromise indicators.
	- **Breach Alerts / Compromised Credentials:** lists credentials that appear in breach data sources. Each alert includes the affected credential title and suggested remediation.
	- **Weak Passwords:** credentials with low password strength (easy-to-guess or short passwords).
	- **Reused Passwords:** credentials detected to share the same password across multiple logins.
	- **Old Passwords:** credetentails older than 90 days.

- **Actions you can take from the dashboard:**
	- Open a credential and rotate the password (generate a new strong password and save).
	- Delete or archive old/unneeded credentials.
	- Dismiss reviewed breaches.
![Dashboard screen](assets/screenshots/security-dashboard.png)

### Safety & privacy notes (user-facing)

- Lockit follows a zero-knowledge design: credential data is stored encrypted client-side and the server stores encrypted blobs and metadata. The dashboard highlights risks derived from metadata and breach checks performed by backend services.
- When checking for breaches (external sources such as HaveIBeenPwned), the project uses privacy-preserving techniques (k-anonymity / hashed prefixes) where possible to avoid sending plaintext secrets to third-parties. The app minimizes sending plaintext secrets off-device.

See `docs/TECHNICAL.md` for more details about how the dashboard is implemented and which services are involved.

## WARNING

- If you lose access to the vault and don't have the recovery key or re-wrapped blob, data cannot be recovered (zero-knowledge model).

## Where to find API docs

API documentation for the Vault is located at `server/API_DOCUMENTATION.md` in this repository.