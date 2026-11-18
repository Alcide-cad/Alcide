# ALCIDE 1.0.87

Mesure rapide (comme MESUREGEOM « Rapide » d’AutoCAD) : bouton « ⌖ Mesure rapide » à côté de Mesurer. En survolant le dessin, ALCIDE affiche en direct les distances horizontale et verticale entre les objets qui entourent le pointeur. Les valeurs sont arrondies proprement selon la précision et l’unité du dessin (219 et non 218,9999). Clic droit ou Échap pour quitter.

Joindre en polyligne (comme JOIN / JOINDRE d’AutoCAD) : dans le menu du clic droit, avec au moins deux lignes, arcs ou polylignes ouvertes sélectionnés. Les objets qui se touchent bout à bout (avec une petite tolérance) deviennent une seule polyligne ; les arcs sont conservés. Une chaîne qui se referme, par exemple quatre traits formant un carré, donne une polyligne fermée. La polyligne garde le calque et les propriétés du premier objet. Les objets qui ne touchent rien restent inchangés. Un message indique combien d’objets ont été joints. Annuler revient en arrière en une seule fois ; la polyligne est conservée à l’export DXF et DWG.

Dégradés (comme les remplissages dégradés d’AutoCAD) : dans le panneau de hachures et remplissages, choisir « Dégradé ». Les 9 types d’AutoCAD sont disponibles (linéaire, cylindre, cylindre inversé, sphérique, sphérique inversé, hémisphérique, hémisphérique inversé, courbe, courbe inversée), avec une ou deux couleurs, la teinte (du plus foncé au plus clair) pour une couleur, la transparence, l’angle, « Centré » et « Inverser le sens » qui permute les couleurs. Un aperçu montre le résultat. Le contour se choisit comme pour une hachure. Les dégradés des fichiers DWG/DXF s’affichent et se modifient depuis le même panneau. À l’export, ils restent de vrais dégradés AutoCAD et se relisent à l’identique.

Types de traits (audit) :
- les types de traits complexes (avec texte ou symbole, par exemple « ----GAZ----  ») s’affichaient en trait continu ; leurs tirets et espaces sont maintenant respectés (le texte ou le symbole lui-même n’est pas encore dessiné) ;
- les points des types pointillés disparaissaient sur les objets modifiés ou dessinés dans ALCIDE ; ils restent visibles à tous les zooms ;
- polylignes : comme AutoCAD, le motif recommence à chaque sommet quand l’option « génération du type de ligne » (PLINEGEN) est désactivée, ce qui est le cas de la plupart des plans Allplan. Avant, le motif était continu sur toute la polyligne. Les polylignes dessinées dans ALCIDE sont exportées avec cette option activée, pour un motif continu identique dans AutoCAD ;
- présentations : dans les fenêtres de présentation, les tirets étaient trop longs (multipliés par l’échelle de la fenêtre) et la variable PSLTSCALE était ignorée ; ils ont maintenant la longueur affichée par AutoCAD ;
- vérifiés sans changement : LTSCALE, échelle propre à chaque objet, DuCalque / DuBloc, définitions des types de traits conservées à l’export, types ALCIDE identiques à l’écran et à l’export.

Remplissages : un remplissage dont le contour comporte des arcs garde ses arcs à l’export (il était exporté avec des segments droits entre les sommets).

Installeur : l’installeur 1.0.86 était plus gros (331 Mo au lieu d’environ 230 Mo) parce que d’anciens dossiers de construction restés dans l’installation de base étaient recopiés. Ils ne sont plus recopiés, et l’installation supprime ces dossiers et les fichiers de l’ancien moteur laissés par les versions précédentes.

Toujours sans PyMuPDF et sans ODA File Converter embarqué.
