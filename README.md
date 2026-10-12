# NATIF BODY — Carnet de performances

Site statique déployé sur Vercel ; les fichiers doivent être à la racine du dépôt.

## Hébergement

Vercel : Framework Other, aucun build, sortie `.` (voir vercel.json).
Domaine de production : https://thomascoaching.vercel.app

## Sauvegarde Firebase

Projet : `natif-body-coaching`, Firestore Standard à Paris (`europe-west9`), forfait Spark.
Connexion Google : chaque compte conserve ses propres carnets Thomas/Pierre. Reconnectez-vous au même compte pour retrouver les données sur un autre appareil. Il n’y a pas encore de partage coach/adhérents entre comptes différents.

Les modifications sont enregistrées localement et placées dans une file persistante lors des coupures réseau. La synchronisation utilise un document par valeur éditable pour éviter qu’une modification de charge écrase les répétitions saisies sur un autre appareil. Si la même valeur est modifiée simultanément, la dernière écriture confirmée par Firebase gagne.

Les anciennes données du navigateur ne sont pas envoyées automatiquement au compte. Après connexion, cliquez sur « Récupérer les anciennes données de cet appareil » pour ajouter les valeurs manquantes. Les valeurs déjà présentes en ligne sont conservées. L’import JSON est disponible et remplace les données du compte après confirmation.

Les règles `firestore.rules` refusent tous les accès hors du UID propriétaire et valident les champs des écritures. Ce sont des règles initiales, à revoir avant une diffusion large. Aucun accès public aux performances. Aucun secret administrateur dans le site : la configuration SDK Firebase est publique par conception.

La sauvegarde cloud est une conservation synchronisée, pas une sauvegarde historique. Gardez des exports JSON réguliers. Les sauvegardes planifiées natives ne sont pas activées sur Spark.

## Vérification

Vérification syntaxique du JavaScript, démarrage/onglets/sauvegarde locale, tests de synchronisation avec SDK simulé (reconnexion, file hors connexion et isolation UID). Le simulateur Firestore vérifie les règles de lecture. La publication de règles dans Firebase valide leur syntaxe.
