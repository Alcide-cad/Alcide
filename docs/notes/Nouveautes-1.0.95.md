# ALCIDE 1.0.95 — nouveautés

## Crayon : lissage réglable
- Carte **« Lissage du crayon »** bien visible en haut à gauche du dessin tant que le Crayon est actif : curseur de **0 (tracé brut) à 100 (très lissé)**, valeur affichée, boutons **− / +**, touches **[ et ]** (pas de 10).
- Plage élargie : à 0 le trait garde presque tous ses points ; à 100 il devient une courbe très douce de quelques points.
- La valeur s’applique aux prochains traits ; modifiée juste après un trait, elle relisse aussi ce trait en direct.

## Lissage modifiable après coup
- Les points bruts du tracé sont conservés avec le trait. Trait à main levée sélectionné : réglage **« Lissage du trait »** en tête des Propriétés (curseur, − / +, touches [ et ]) ; le trait est relissé en direct pendant le glisser, une seule étape Ctrl+Z.
- Fonctionne après déplacement, rotation, miroir, copie ou modification par poignées (le trait relissé reste à sa place).
- Les points bruts sont enregistrés dans le DXF / DWG (XDATA ALCIDE_PENCIL) : un trait rouvert reste réglable.

## Correctif (même version 1.0.95, reconstruite)
- **Bouton + du calque** ajouté dans « Style des prochains objets » (à côté de la liste Calque) : crée un calque et le choisit pour les prochains objets. Le + de « Aspect et calque » (objets sélectionnés) et « + Nouveau » du panneau Calques sont inchangés.
- **Poignées du trait au crayon** : glisser une poignée remodèle la courbe en douceur autour d'elle (l'arc s'agrandit ou se resserre, sans pli) ; aperçu en direct, Ctrl+Z. **Maj** + glisser : ne déplacer que ce point. Le lissage reste réglable ensuite sans perdre le remodelage.
- Arcs : rayon par poignée d'extrémité et champ « Rayon » vérifiés.
- Contrôle automatique avant installation : inventaire de tous les boutons et champs (onglets du ruban, panneaux, outils, fenêtres) comparé à la 1.0.94 ; aucun contrôle disparu ni déplacé (seul le curseur de lissage de la barre rapide du Crayon est remplacé par la carte « Lissage du crayon »).

- Panneau « Créer un texte » repensé : groupes Texte / Style / Placement / Cadre, barre de mise en forme groupée, aperçu en direct agrandi (police, hauteur, couleur, gras/italique, cadre, flèche, alignement, rotation, ancrage, échelle). Nouveau choix du **Calque** du texte (pastille de couleur + bouton « + » pour créer un calque), en création comme en modification ; une seule étape Ctrl+Z.
