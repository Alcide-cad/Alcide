# ALCIDE 1.0.88

Dégradé visible et rapide à régler :
- ruban Dessin → Remplir → bouton « Dégradé ». Avec un contour fermé sélectionné (rectangle, polyligne fermée…), le dégradé est appliqué tout de suite. Sans sélection, il suffit de cliquer à l’intérieur d’un contour fermé ;
- panneau Remplissage / hachures : nouvelle carte « Dégradé », juste sous Remplissage, avec un interrupteur comme les autres cartes. Les 9 types d’AutoCAD sont des vignettes cliquables avec un vrai aperçu ;
- réglages compacts, un par ligne : Deux / Une couleur, Couleur 1, Couleur 2 ou curseur ombre ↔ teinte, Transparence, Angle, Centré, Inverser. L’aperçu et le dessin se mettent à jour en direct, Ctrl+Z annule ;
- les derniers réglages de dégradé sont mémorisés pour le prochain dégradé ;
- une hachure dégradée existante (DWG/DXF ou ALCIDE) sélectionnée ouvre la carte Dégradé dans les Propriétés, avec son type coché, et se modifie de la même façon ;
- la galerie des motifs contient aussi une vignette « Dégradé ».

Fonctions de la 1.0.87 plus faciles à trouver :
- ruban Dessin → Ajuster → bouton « Joindre » (joindre en polyligne ; toujours aussi dans le clic droit) ;
- ruban Annotations → Mesurer → « Mesure rapide », avec un pictogramme et son libellé complet.

Corrections :
- flèches ▴ / ▾ des champs numériques (espacement, angle… dans tous les panneaux) : un clic faisait défiler le panneau. Le panneau ne bouge plus, le bouton maintenu répète la valeur, et les touches ↑ / ↓ dans le champ changent la valeur sans faire défiler ;
- l’espacement ne s’affiche plus avec des décimales parasites (100,5 et non 100,49999999999999) ;
- après un dégradé, revenir à une hachure réaffiche bien l’angle et l’espacement, et le titre du panneau n’est plus renommé « Dégradé ».

Toujours sans PyMuPDF et sans ODA File Converter embarqué.
