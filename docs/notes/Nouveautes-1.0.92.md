# ALCIDE 1.0.92

Dégradés :
- plus de bandeau bleu en haut de la fenêtre quand un objet avec dégradé est sélectionné. Cause : l’aperçu du dégradé (petit canvas de la carte Dégradé) héritait de la règle générale de style.css `canvas { position:absolute; inset:0; width:100% }` ; sans parent positionné, il se plaçait en haut à gauche de la fenêtre, sur toute la largeur (30 px de haut), et redessinait le type choisi. Il reste maintenant dans la carte ;
- carte simplifiée : 5 types (Linéaire, Cylindre, Sphère, Hémi, Courbe), toujours deux couleurs, bouton ⇄ pour permuter couleur 1 et couleur 2. Les types « inversés », le choix Une/Deux couleurs et la case Inverser sont retirés (inverser = permuter les couleurs) ;
- les dégradés inversés des DWG/DXF existants (INVCYLINDER, INVSPHERICAL, INVHEMISPHERICAL, INVCURVED) s’ouvrent comme le type de base aux couleurs permutées ; l’export reste un dégradé AutoCAD natif.

Toujours sans PyMuPDF et sans ODA File Converter embarqué.
