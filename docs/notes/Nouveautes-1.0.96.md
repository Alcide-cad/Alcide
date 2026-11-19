# ALCIDE 1.0.96 — nouveautés

Toutes les nouvelles commandes sont aussi dans le nouvel onglet **CAO** du ruban (ajouté après Affichage : aucun bouton existant n’a bougé) et dans la **ligne de commande** (barre du bas).

## Cotes (onglet Annotations → groupe « Cotes CAO »)
- **Rayon** (DRA), **Diamètre** (DDI) : cliquez un cercle ou un arc, puis placez le texte.
- **Angulaire** (DAN) : deux lignes puis l’arc de cote, ou sommet + deux points. L’angle mesuré est celui du côté où vous placez la cote.
- **Longueur d’arc** (DAR) : cliquez un arc puis la position.
- **Ligne de base** (DBA) : origine commune, deuxième point, position de la première cote, puis chaque point suivant ; les cotes s’empilent automatiquement. Entrée ou clic droit termine.
- Ce sont de vraies cotes DXF/DWG (DIMENSION / ARC_DIMENSION) au style de cote courant (hauteur, précision, facteur, unité), sur le calque des cotes. Les cotes en ligne de base sont des cotes ALCIDE modifiables comme les autres.

## Blocs (onglet CAO → « Blocs »)
- **Créer bloc** (B) : nom, description, point de base (saisi ou cliqué), calque, attributs (étiquette, invite, valeur par défaut) ; la sélection peut être remplacée par le bloc.
- **Insérer** (I) : liste des blocs avec aperçus et recherche par nom, échelle, rotation, calque, valeurs des attributs, puis clic dans le plan (aperçu sous le curseur).
- **Modifier attributs** (ATTEDIT) : valeurs des attributs du bloc sélectionné (cartouches, repères…).
- **WBLOC** (W) : écrit la sélection ou le bloc dans un fichier DWG/DXF séparé.
- **Décomposer** (X) : décompose uniquement les blocs sélectionnés, d’un niveau.

## Réseau (onglet CAO → « Réseau »)
- **Rectangulaire** (AR), **Polaire** (centre cliqué ou saisi, nombre, angle, rotation des éléments), **Trajectoire** (ligne, polyligne, arc ; nombre ou espacement, alignement).
- Aperçu en direct pendant le réglage ; le réseau entier est une seule étape Ctrl+Z.
- **Modifier réseau** : sélectionnez un élément du réseau pour changer ses paramètres.

## Allonger (onglet CAO → « Modifier », commande ALLONGER / LEN)
- Modes **Delta** (valeur ajoutée, négative pour raccourcir), **Total** (longueur voulue), **Pourcentage**, **Dynamique** (clic de la nouvelle extrémité). Touches D / T / P / Y pendant la commande.
- Lignes, polylignes ouvertes (segment d’extrémité), arcs (rayon conservé) et armatures linéaires.
- **Différence avec Étirer** : Allonger change la longueur d’un seul objet par l’extrémité cliquée, le reste ne bouge pas. Étirer déplace tous les sommets pris dans une fenêtre (plusieurs objets à la fois).

## Ligne de commande (barre du bas)
- Alias AutoCAD : L, PL, C, A, REC, POL, SPL, CO/CP, M, RO, MI, TR, EX, O, F, CHA, S, SC, AR, LEN, E, DIM/DLI, DRA, DDI, DAN, DAR, DBA, B, I, ATTEDIT, W, X, T/MT, H, DI, Z, RE, U, REDO, LA, OS, PR… (AIDE ou ? pour la liste).
- Autocomplétion (Tab, flèches), historique (↑ ↓), **Entrée valide**, **Entrée sur un champ vide ou dans le plan répète la dernière commande**, **Échap annule**, l’invite de l’étape en cours s’affiche dans le champ.
- Bouton ⌨ : frappe directe des commandes dans le plan (désactivée par défaut pour garder les raccourcis à une lettre).

## Accrochages
- Nouveaux : **perpendiculaire, tangente, quadrant, insertion, nœud, extension, parallèle**, avec les marqueurs AutoCAD.
- Chaque accrochage s’active ou se désactive dans les réglages des accrochages (onglet CAO → Accrochages, ou bouton Grille).

## Correctifs
- Les objets natifs ajoutés après l’ouverture (cotes, blocs, objets collés) gardent le rendu optimisé.

## Contrôles avant installation
- Inventaire automatique de tous les boutons et champs comparé à la 1.0.95 : aucun contrôle disparu ni déplacé ; seuls ajouts : onglet CAO, ligne de commande, bouton ⌨, groupe « Cotes CAO ».

## Correctif 1.0.96 (même version)

- **Déplacer les nouvelles cotes** : les cotes angulaire, rayon, diamètre et longueur d'arc ont maintenant la poignée centrale de déplacement (glisser = déplacer, comme les autres objets). Déplacer, Copier, Rotation et Miroir fonctionnent aussi sur elles (la longueur d'arc était refusée par Déplacer/Copier/Rotation/Miroir). Ctrl+Z annule.
- **Poignée de position** (losange bleu) sur une cote CAO sélectionnée : glisser pour placer l'arc de la cote angulaire, le texte du rayon/diamètre ou l'arc de la longueur d'arc ; la cote est recalculée. Ctrl+Z annule.
- **Cote angulaire compacte** : ses lignes de rappel s'arrêtent à l'arc de cote (l'emprise ne s'étend plus jusqu'au bout des grandes lignes).
- **Créer bloc quasi instantané** : seuls les objets choisis et leurs ressources sont extraits (plus de copie, d'écriture et de relecture du plan entier). Sur le grand plan de fondations : ~4,8 s → ~0,4 s.
- **Réseau quasi instantané** : une seule mise à jour du dessin pour tout le réseau (5×10 : ~3,5 s → ~0,3 s ; 1000 copies : > 30 s → ~0,4 s).
- **Réseau : avertissement** dans la fenêtre quand un espacement nul superposerait les copies (ex. 5 lignes avec espacement Y = 0).
