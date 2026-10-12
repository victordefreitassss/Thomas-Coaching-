# NATIF BODY — Carnets partagés

Site statique sur Vercel : Framework Other, aucun build, sortie `.`.
Production : https://thomascoaching.vercel.app

## Utilisation

Les deux personnes ouvrent le même lien privé d’espace. Aucun compte Google ni formulaire de connexion n’est requis. Firebase identifie automatiquement chaque navigateur par une session anonyme. Le lien et l’espace sont mémorisés sur l’appareil. Les carnets Thomas et Pierre sont visibles et modifiables par les deux utilisateurs.

Le bouton « Partager l’accès » dans Sauvegarde et transfert permet de transmettre le même espace à l’autre utilisateur. Toute personne possédant ce lien peut lire et modifier ses carnets. Le lien contient un identifiant aléatoire de 192 bits, qui n’est ni inclus dans les sources ni publié dans ce dépôt. Un autre espace possède une autre URL et ses propres données.

## Firebase

Projet `natif-body-coaching`, Firestore Standard à Paris (`europe-west9`), forfait Spark. Auth anonyme activée. Les données partagées se trouvent dans `rooms/{identifiant-prive}/records/{recordId}`. La liste des espaces est interdite. Les règles vérifient l’identification automatique, le format de l’identifiant et le schéma des documents. Les accès précédents `users/{uid}/records` restent limités au propriétaire pour conserver les anciennes données privées.

Ces règles initiales utilisent la possession d’un lien privé comme autorisation. Elles ne limitent pas l’espace à exactement deux appareils : une personne peut ouvrir le lien sur plusieurs appareils. Elles doivent être revues avant une diffusion large. Pour révoquer un lien, une migration vers un nouvel espace privé est nécessaire.

Les anciennes valeurs locales manquantes sont récupérées automatiquement une fois par appareil/espace, sans remplacer les valeurs en ligne. Les anciennes données d’un éventuel compte Google déjà connecté sont également récupérées. Les suppressions logiques en ligne sont conservées, sans résurrection d’anciennes données locales. Le bouton de récupération permet une nouvelle tentative manuelle.

Les modifications sont conservées localement et dans une file persistante hors connexion. La dernière écriture Firebase gagne si la même valeur est modifiée simultanément. Des modifications de champs différents ne s’écrasent pas. L’import JSON remplace les carnets de cet espace après confirmation ; conservez des exports réguliers. La conservation synchronisée n’est pas une sauvegarde historique.

## Adresse simple

Après la première ouverture du lien privé, l’identifiant de l’espace est conservé sur l’appareil et retiré de la barre d’adresse. Le lien de base suffit ensuite sur cet appareil. Sur un nouvel appareil ou après effacement des données du navigateur, ouvrir une fois le lien de partage. Il peut être recopié depuis Programme > Sauvegarde et transfert > Partager l’accès. Le bandeau technique Firebase n’est plus affiché. Aucun identifiant d’espace privé n’est ajouté aux sources publiques.
