# ALCIDE 1.0.93

- Mesure rapide : s’affiche dès que la souris bouge, sans zoomer. Cause : pendant un mouvement de souris, l’affichage est regroupé en une image par rafraîchissement ; cette image différée ne repassait que par la partie de la chaîne d’affichage chargée avant ce regroupement et effaçait le reste (mesure rapide, aperçus d’outils récents), qui ne revenait qu’au zoom suivant. L’image différée repasse maintenant par toute la chaîne.
- Repères d’armature dans l’outil Déplacer : un clic sur la bulle (ou une fenêtre autour) choisit le repère seul pendant l’étape « choisir les objets » ; il se déplace, la pointe du rappel reste accrochée à la barre. Miroir : un clic sur un repère prend sa barre. Copier et Rotation prennent aussi le repère cliqué.
- Aligner les textes : survol d’un bord = aperçu, clic = alignement appliqué (avant, le clic ne faisait que l’aperçu). La carte s’affiche au premier plan : elle n’était visible que dans l’onglet « Texte / repères » et pouvait être recouverte (ex. panneau d’une armature), le clic n’atteignait alors pas ses boutons. Fonctionne avec textes, textes multilignes et repères d’armature, seuls ou mélangés ; les rappels restent accrochés.
- Treillis soudés : plusieurs lits peuvent avoir la même position (« + lit inf. », « + lit sup. », × pour retirer ; sup. 1, sup. 2…). Le libellé du repère et la diagonale du panneau portent tous les lits, ex. « TS1 · ST25C inf. + 2×ST25C sup. » (texte réduit pour tenir sur la diagonale). Métré, nomenclature et découpe comptent chaque lit.

Toujours sans PyMuPDF et sans ODA File Converter embarqué.
