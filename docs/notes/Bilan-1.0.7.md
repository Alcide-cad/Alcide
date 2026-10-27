# ALCIDE 1.0.7 — Types de traits

- 18 types numérotés inspirés de la référence visuelle fournie, plus 8 variantes techniques. Les longueurs sont définies par ALCIDE : aucune équivalence numérique exacte avec les paramètres Allplan n’est revendiquée.
- Aperçus, recherche, favoris persistants, échelle de motif positive pour les objets et les prochains dessins.
- Sélecteurs communs : propriétés d’objet, dessin, barre rapide, calques, lignes de cote et rappels.
- Type de trait des calques éditable et conservé à l’export.
- Les motifs restent géométriques avec le zoom ; l’échelle de l’objet est exportée en LTSCALE.
- Menu dans la couche supérieure, sans débordement horizontal, testé à 640 × 600.

## Validation
Tests réels Electron : création au clic, styles et échelles, recherche, favoris, 26 aperçus, calques et cotes, bornes du menu.
Moteur Python : 26 motifs et styles de cote ; export DWG vérifié puis réouvert de 78 lignes, cercles et polylignes fermées ; motifs, échelle et calque conservés.
Les longueurs résiduelles de conversion inférieures à 1e-10 sont ignorées dans la table d’aperçu des traits afin d’éviter un motif impair.

Installeur construit seulement après demande explicite. Application utilisateur non fermée et plans utilisateur non modifiés.
