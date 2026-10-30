# ALCIDE — Fluidité, modifications prêtes pour la prochaine version

## Problème principal corrigé
Un seul texte libre, même illisible au dézoom, désactivait le rendu accéléré de tous les objets du plan. Les textes placés au-dessus du dessin sont désormais peints en couche supérieure sur le canevas principal, avant les cotes et décorations du canevas d'interaction. L'ordre entre textes est conservé. Si un texte est volontairement intercalé derrière un graphique, le rendu exact ordonné reste utilisé.

Le mode existant « Détails selon le zoom » allège également les textes libres de moins de 2,5 pixels physiques. Ils reviennent au zoom ou en mode détails complets, et restent affichés lorsqu'ils sont sélectionnés. Données et exports complets conservés. Les fantômes de création/modification restent dessinés sur le canevas d'interaction.

## Autres optimisations
- Réutilisation des enregistrements du moteur graphique pour les objets natifs non édités : 19641 objets réutilisés dans le test. Les objets édités, textes natifs et objets personnalisés passent par le calcul complet. Changement de document, calque, visibilité, unité, densité de pixels et représentation à l'écran invalident les caches concernés.
- Sélection des annotations, chaînes et tableaux : listes spécialisées mises à jour avec la géométrie au lieu de recopier et parcourir tous les objets à chaque clic. Priorité de sélection conservée.
- Repères d'armatures : données statiques réutilisées ; recalcul lors des modifications. Le déplacement d'une pointe, les poignées, les repères groupés et l'export restent calculés directement.
- Navigation : restitution du bitmap à sa taille réelle en pixels, sans réduction fractionnaire parasite ; évite une perte de netteté. Les textes transparents ne sont pas peints deux fois dans les images de navigation.

## Mesures sur cette machine
Plan de test : copie de DWG de 20 016 objets, avec un texte libre ajouté. Profils isolés, même taille de fenêtre. Le mode de compatibilité interne permet de réactiver le parcours de rendu antérieur pour la comparaison. Ce ne sont pas des garanties universelles de fréquence d'affichage.

| Mesure | Avant | Après |
|---|---:|---:|
| Dessin synchrone côté interface, médiane (détails automatiques) | 157.7 ms | 1.4 ms |
| Gestes réels zoom/panoramique : intervalle médian entre images | 33.4 ms | 16.7 ms |
| Même séquence : 95e percentile d'intervalle | 116.7 ms | 33.4 ms |
| Même séquence : pauses de plus de 50 ms | 17 | 0 |
| Repères sur 16 répartitions de 24 barres : calcul/affichage médian | 9.7 ms | 5.5 ms |

Le temps synchrone ne mesure pas tout le travail graphique : la préparation et le rendu vectoriel du worker restent en arrière-plan. La navigation réutilise le dernier bitmap pendant le calcul. Les textes intercalés derrière des graphiques gardent le parcours exact plus coûteux. Pas de refonte du lecteur DWG ni de promesse d'ouverture plus rapide ; ouverture du plan de référence vérifiée sans ralentissement évident sur ce test.

## Vérifications réussies
- fluidity-correctness111.cjs : comparaisons pixel à pixel avant/après sur textes superposés, remplissages, ordre modifié, Undo, rotation et thème clair ; petites différences d'anticrénelage tolérées en vue tournée (< 0,1 % des pixels). Double-clic d'édition fonctionnel.
- Même test : réutilisation de 19 641 objets natifs ; modification de géométrie, couleur et type de trait ; invalidation calque et monochrome ; détails automatiques/complets ; vrais gestes de molette et bouton central.
- Captures de navigation comparées aux densités 1, 1,25 et 2 : pas de rétrécissement ni de double peinture du texte transparent.
- fluidity-rebar111.cjs : amélioration mesurée, quantité modifiée, annulation, déplacement de la pointe avec calcul direct.
- picking111.cjs : sélection des chaînes et tableaux, suppression puis annulation, identités conservées.
- associations111.cjs : version actuelle du runtime ; cotation par clic, associations géométriques, ajout/retrait/repositionnement de points de chaîne et Undo.
- middle-view108.cjs, fill-repeat108.cjs, quickbar108.cjs : zoom global au double-clic central, déplacement central, remplissages successifs, barre flottante et stabilité de la zone de dessin.
- position-edit101.cjs, rebar-audit-views100.cjs, consistency110.cjs : édition des repères au double-clic, suppression/Undo, répartition en vue tournée et miroir, contrôle des positions.
- save-real109.cjs : sauvegarde vérifiée d'une copie du plan réel, source de référence intacte.

Les tests travaillent sur des copies et des profils isolés. Aucun dessin utilisateur modifié. Sources synchronisées ; installeur 1.0.11 construit après autorisation ; aucune installation automatique.
