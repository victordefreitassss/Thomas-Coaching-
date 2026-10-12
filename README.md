# NATIF BODY — Carnet de performances

Site statique : les fichiers décompressés se trouvent à la racine. Vercel ne décompresse pas le ZIP original.

## Vercel

- Framework Preset : Other
- Root Directory : racine du dépôt (laisser vide)
- Build Command : aucun
- Output Directory : `.`

La configuration `vercel.json` définit ces valeurs pour le déploiement. Si des réglages manuels du projet Vercel les remplacent, les aligner puis redéployer.

## Données

Cette version sauvegarde automatiquement dans le navigateur de chaque appareil. L’export JSON permet de sauvegarder les données et de les transférer. Firebase n’est pas encore configuré : le projet et l’authentification doivent être provisionnés avant d’activer une sauvegarde distante protégée.

## Correction

Les fichiers du site sont disponibles directement à la racine. L’ouverture d’une séance depuis la version Thomas affiche désormais le carnet de Thomas.
