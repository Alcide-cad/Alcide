# ALCIDE 1.0.97 — nouveautés

## Zone du bas épurée
- **À gauche** : l'outil en cours et sa consigne, en clair (par exemple « Miroir — Cliquez les objets à ajouter ou retirer de la sélection, puis Entrée… »). Pas de doublon dans la barre d'état ; au-delà de deux lignes, le texte complet s'affiche au survol.
- **À droite**, alignées : la ligne de commande, le bouton **Barre rapide (F6)**, la console et l'aide.
- **Barre d'état** : l'espace (objet / mise en page) à gauche ; à droite, alignés : enregistrement, épaisseurs, mesures, pas, **Accrochages** et **Ortho** (nouvel interrupteur), récupération, coordonnées, ODA.
- Le texte n'est jamais réduit, de 1280 à 1920 px de large.

## Barre d'accès rapide en fenêtre
- La barre d'accès rapide (outils de la sélection, options de l'outil) n'est plus en bas. Elle est **masquée par défaut** et s'ouvre avec **F6**, le bouton **Barre rapide** en bas à droite, ou Affichage → Barre rapide.
- C'est une **fenêtre flottante** : déplacez-la par sa barre de titre, redimensionnez-la par le coin. Étroite et haute, les outils se rangent en colonnes ; large, ils se rangent en ligne. Sa position et sa taille sont mémorisées.
- Bouton **Autre écran** : la barre passe dans une fenêtre Windows séparée, à poser sur un second écran (redimensionnable, position mémorisée). « Rattacher » la ramène dans ALCIDE ; fermer cette fenêtre masque la barre.
- Le réglage « Rayon » d'un cercle ou d'un arc sélectionné reste toujours visible dans la barre (il ne passe plus dans « Plus de réglages »).

## Point de base temporaire au survol
- Survolez un point accroché (extrémité, milieu, centre, intersection, quadrant, insertion, nœud, perpendiculaire, tangente) pendant **600 ms** : il devient une base temporaire, marquée « Base » en cyan, avec un trait pointillé jusqu’au curseur.
- Visez une direction et tapez une distance, ou **@ΔX,ΔY** (la touche @ marche aussi avec AltGr) : le point suivant est placé depuis cette base.
- **Échap** efface la base. Le repère d’alignement à 300 ms fonctionne toujours.
- Réglages (fenêtre Accrochages) : activer ou non, délai de 100 à 5000 ms.

## Cotes CAO attachées
- Les cotes **angulaires, rayon, diamètre et longueur d’arc** restent attachées à leurs objets : elles suivent quand vous déplacez, étirez ou tournez les lignes, cercles et arcs, et quand vous déplacez la cote elle-même.
- Cote angulaire : l’arc reste centré sur le sommet, les flèches restent sur les lignes, et des lignes de rappel apparaissent quand l’arc dépasse les extrémités des lignes.
- Texte des cotes angulaires toujours horizontal. Une poignée en losange sur le texte permet de le **faire glisser le long de l’arc de cote** (une étape Ctrl+Z).

## Propriétés de plusieurs cotes à la fois
- Avec plusieurs cotes sélectionnées (CAO et classiques), chaque changement dans Propriétés s’applique à toutes : hauteur du texte, décimales, arrondi, unité, police, flèches, rappels, types et épaisseurs de trait, axe…
- Nouveau dans la carte Cotes : **Calque** et **Couleur** (DuCalque ou personnalisée).
- Les valeurs différentes s’affichent « varié ». Un seul Ctrl+Z annule le changement pour toutes les cotes.
- Les réglages d’unité de longueur ne s’appliquent pas aux cotes angulaires et n’empêchent plus le changement des autres cotes.

## Numéroter (repères d’armatures)
- La flèche s’arrête au bord du cadre (ou du texte) au lieu d’entrer dedans, y compris après un déplacement du repère.
- Option **« Sans flèche (repère seul) »** dans la fenêtre Numérotation, mémorisée : un clic pose le repère, sans flèche.
- Dans Propriétés, la case **« Flèche »** ajoute ou retire la flèche d’un repère existant (retrait : une étape Ctrl+Z ; ajout : cliquez ensuite la cible).
- Export DWG/DXF : repères avec et sans flèche correctement écrits.
