# Équipe Lockit Password Manager

| Fonctionnalité | Branche | Responsable(s) |
|----------------|---------|----------------|
| Code partagé (crypto, modèles) | shared-core | Tous |
| Authentication & Sécurité | auth-feature | [Nom 1] |
| Vault (Gestionnaire MP) | vault-feature | [Nom 2 & Nom 3] |
| 2FA Authenticator | authenticator-feature | [Nom 4] |
| Dashboard | dashboard-feature | [Nom 5] |
| Send & Folders | send-folders-feature | [Nom 6] |

## Workflow
- Mettre le code commun (crypto, API, utils) dans `shared-core`
- Merger `shared-core` vers `main` régulièrement
- Chaque branche part de `main` et merge vers `main`
