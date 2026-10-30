# Fiabilisation DWG et cohérence des armatures

## Modification
Nouvelle commande « Cohérence des aciers » dans le ruban Armatures, aux côtés du contrôle des superpositions. Panneau non modal à droite, redimensionnable ; résultats cliquables pour sélectionner et recentrer les objets. Aucune correction destructive automatique.

Contrôles : numéro de position positif, même numéro affecté à des formes/dimensions différentes, diamètres HA hors liste proposée, quantités et masses invalides, modèle incalculable, vue sans propriétaire, repère sans position/vue, élément dont tous les repères sont masqués (information). Les vues liées ne multiplient pas les quantités. Les composants des éléments BA sont examinés séparément du nom général C1/D1.

Le contrôle des superpositions reste distinct, accessible depuis le bilan. Les recouvrements partiels, les collisions 3D et le dimensionnement structurel ne sont pas vérifiés. Un repère masqué peut être volontaire. Les résultats d'une autre présentation invitent à ouvrir celle-ci. Après modification du dessin, le bilan est recalculé avant de naviguer vers une ancienne anomalie.

## Vérifications effectuées
- consistency110.cjs : vues liées comptées une fois ; conflit de position ; sélection et recentrage ; bilan périmé ; repères masqués/orphelins ; positions des composants d'un poteau généré.
- rebar-audit100.cjs : 138 configurations valides, masses/longueurs/quantités et stations ; 18 configurations incompatibles refusées.
- rebar-audit-views100.cjs : répartition suivant largeur, miroir et rotation ; déplacement manuel conservé.
- save-real109.cjs : copie d'un plan réel de plus de 20 000 objets sauvegardée, original de référence inchangé.
- save-dwg109.cjs : sauvegarde puis relecture native, sauvegardes répétées sans doublons ni déplacement doublé ; présentations conservées ; aides exclues ; remplacement, annulation, échec, projet ALCIDE et DXF séparé.
- save-shortcuts109.cjs : vrais Ctrl+S / Ctrl+Maj+S, Undo et changement d'onglet.
- save-failures109.py : refus de vérification et refus d'écriture ; fichier précédent et sauvegarde conservés, secours disponible.

Tests réalisés dans des profils isolés et sur des copies. Aucun dessin utilisateur modifié. Aucune nouvelle correction du moteur DWG nécessaire à l'issue de ces tests. Il ne s'agit pas d'une garantie sur tous les DWG ni d'un contrôle réglementaire des armatures.

Installeur 1.0.10 construit après autorisation. Aucune installation automatique.
