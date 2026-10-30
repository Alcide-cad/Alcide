# Barre rapide flottante — ergonomie compacte

- En-tête de 28 px, commandes Ancrer/Fermer sous forme d'icônes avec explications au survol.
- Largeur automatique adaptée aux outils visibles ; en sélection, le test mesure environ 280 × 67 px au lieu d'une large bande vide.
- Poignée visible en bas à droite : agrandir ou réduire la largeur et la hauteur à la souris. Taille explicite conservée lors des changements d'outil, après ancrage/détachement et au prochain démarrage.
- Petites tailles : retour à la ligne et défilement interne pour conserver les commandes accessibles ; fenêtre maintenue dans l'écran.
- Les anciennes dimensions automatiques surdimensionnées sont réinitialisées une seule fois ; position et mode conservés.
- Zone de dessin et coordonnées du quadrillage inchangées pendant déplacement, redimensionnement, masquage et ancrage.

Vérifications : quickbar112.cjs (vrai glissement du coin dans les deux sens, persistance après rechargement, petite fenêtre, hauteur de l'en-tête et stabilité de la vue) ; quickbar108.cjs (déplacement, masquage/restauration, ancrage et commandes de dessin).

Sources synchronisées. Inclut également les optimisations de fluidité préparées précédemment. Installeur 1.0.11 construit après autorisation ; aucune installation automatique.
