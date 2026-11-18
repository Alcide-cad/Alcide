# ALCIDE 1.0.89

Treillis soudés sur plusieurs lits :
- zone TS sélectionnée (ou panneau TS avant la pose) → carte « Lits de treillis », toujours visible : boutons 1 · 2 · 3 · 4 lits, puis pour chaque lit le treillis, la position (inf. / sup. / interm.) et un décalage facultatif en cm ;
- libellé : « TS1 · 2 lits ST25C » si les lits sont identiques, sinon « TS1 · ST25C inf. + ST15C sup. » ;
- dessin : un seul contour et une seule diagonale par panneau (le calepinage est commun aux lits, usage des plans français), les lits sont portés par le libellé ;
- métré, nomenclature et plan de découpe comptent chaque lit. Ctrl+Z annule ; les lits sont conservés à l’enregistrement, à l’export et à la réouverture. Les anciennes zones TS restent à 1 lit.

Repères d’aciers :
- Maj+clic ou Ctrl+clic sur les bulles : plusieurs repères sélectionnés ensemble ; une fenêtre (ou une capture) autour des bulles prend les repères seuls ; « Tout sélectionner » puis la nouvelle puce « Repères » du filtre ;
- Déplacer (ruban, barre d’outils) et le glisser d’une bulle déplacent tout le groupe ; les rappels restent accrochés à leurs barres ; une seule étape d’annulation ;
- « Aligner les repères » (ruban Armatures et clic droit dès 2 repères ou textes) : gauche, centre, droite, haut, milieu, bas, répartir horizontalement / verticalement, ou aligner sur un repère de référence cliqué. Fonctionne aussi sur les textes simples.
- Copier n’agit pas sur un repère seul (il appartient à sa barre) : un message l’indique.

Dessin et sélection :
- dégradé sous un motif : comme un fond de couleur, un dégradé se cumule avec un motif. Il s’affiche sous les traits et s’exporte en deux hachures (dégradé, puis motif) ;
- filtre de sélection : « Hachures » est remplacé par « Motifs », « Remplissages » et « Dégradés », avec leurs nombres (aussi dans la sélection rapide et l’affinage par calque). Un motif avec fond compte dans Motifs (« dont N avec fond ») ;
- filtre par couleur, référence pointée : « Terminer » ou Entrée sélectionne directement les objets correspondants (couleurs DuCalque et blocs compris) et quitte le mode ; Échap revient à l’état précédent ;
- Joindre en polyligne : les sommets intermédiaires alignés et les points doublés sont supprimés (un carré fait 4 sommets, fermé), sans fusion à travers un arc ;
- Mesure rapide : fonctionne sur les plans importés (lignes, polylignes, blocs, contours de hachures).

Corrections :
- curseur de transparence, listes, couleurs, interrupteurs : le panneau ne défile plus quand on les manipule ;
- rotation : déplacement rigide. Longueurs, rayons, textes, motifs et échelles de hachure sont inchangés quel que soit l’angle, sans dérive après plusieurs rotations (le motif d’une forme remplie tourne avec elle).

Toujours sans PyMuPDF et sans ODA File Converter embarqué.
