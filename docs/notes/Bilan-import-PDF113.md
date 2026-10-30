# Vérification import PDF vectoriel

Fonction ajoutée : Accueil > Importer PDF, menu Fichier et ouverture PDF depuis le sélecteur. Page, aperçu, échelle imprimée et unité éditables. Les vrais calques PDF sont recréés avec leur état visible/masqué. Sans OCG, calque PDF_sans_calque ; aucune invention de calques par reconnaissance graphique.

Tests Python pdf113.py réussis : unités mm/cm/m, échelle 1:50, spline cubique exacte, textes, groupes masqués, exclusion optionnelle des masqués, page tournée à 90 degrés, masque interne de traits, remplissage avec trou en règle pair/impair, refus de destination existante, source inchangée, page sans vecteurs refusée.

Test Electron pdf113.cjs réussi avec le moteur compilé : choix de page, aperçu, import de 5 objets et 3 OCG, état masqué conservé, historique sans chemin technique, annulation sans changement du dessin actif. Enregistrement DWG par Ctrl+S puis réouverture contrôlée : objets et calque masqué présents. Capture ALCIDE-import.png inspectée : texte, courbe et remplissage cohérents. Les PDF de test sont synthétiques ; un plan de production reste à valider par l’utilisateur.

Limites explicites : pas d’OCR, pas de vectorisation de scan, images et dégradés exclus avec bilan. Les courbes découpées par un masque sont approchées en polylignes à tolérance 0,025 pt papier. Les textes découpés par des masques internes et les polices substituées sont signalés. Les objets graphiques PDF deviennent des objets CAD, pas des objets métier intelligents.

Aucun installeur construit et aucune installation réalisée pour cette fonction.
