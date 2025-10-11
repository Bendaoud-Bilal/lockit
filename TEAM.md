# Équipe Lockit Password Manager

| Fonctionnalité | Branche | Responsable(s) |
|----------------|---------|----------------|
| Code partagé (crypto, modèles) | shared-core | Tous |
| Authentication & Sécurité | auth-feature | rymene |
| Vault (Gestionnaire MP) | vault-feature | abdelawal + melissa |
| 2FA Authenticator | authenticator-feature | ania |
| Dashboard | dashboard-feature | bilal |
| Send & Folders | send-folders-feature | mohammed |

## Workflow
- Mettre le code commun (crypto, API, utils) dans `shared-core`
- Merger `shared-core` vers `main` régulièrement
- Chaque branche part de `main` et merge vers `main`
