# ALCIDE 1.0.91

Correction des dégradés :
- toucher un réglage de la carte Dégradé ne fait plus apparaître de grande zone bleue ailleurs dans le plan. Cause : le dégradé ne pouvait pas être transmis au moteur d’affichage rapide (worker), qui se coupait pour toute la session ; le plan entier était alors redessiné autrement (motifs très serrés pleins, à pleine densité). Le worker reçoit maintenant la géométrie du dégradé et le dessine lui-même : rien d’autre ne change à l’écran ;
- l’interrupteur Dégradé coupe vraiment le dégradé d’un contour ou d’un remplissage (avant, le dégradé était réappliqué aussitôt et l’interrupteur se rallumait). Ctrl+Z le rétablit.

Toujours sans PyMuPDF et sans ODA File Converter embarqué.
