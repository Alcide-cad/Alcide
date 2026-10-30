# Tests sur les PDF du Bureau / IMPRESSIONS

Les trois fichiers ont été lus et convertis localement. Aucune modification des PDF originaux (empreintes SHA-256 identiques avant/après).

| Plan | Calques PDF distincts | Objets CAD | Textes CAD |
|---|---:|---:|---:|
| Plan de test A (coffrage) | 30 | 116389 | 1636 |
| Plan de test B (armatures) | 23 | 36273 | 1661 |
| Plan de test C (armatures) | 26 | 35174 | 1272 |

Un calque PDF_sans_calque supplémentaire reçoit les éléments ne relevant d’aucun groupe OCG. Les groupes homonymes restent désormais séparés par suffixe numérique. Les caractères interdits dans les noms de calques DXF, comme /, sont remplacés par _. Correspondances conservées dans les métadonnées.

## Corrections issues des tests réels
- Calques OCG homonymes : auparavant fusionnés par nom ; chaque identifiant garde maintenant son propre calque et son état de visibilité.
- Affichage : option de fond blanc conservant les couleurs d’origine, sans la transformation monochrome ni l’assombrissement du thème clair. Aucun attribut enregistré n’est modifié par cette option.
- Polices : correspondance avec les polices effectivement installées, catalogue local mis en cache et invalidé lorsque les fichiers de polices changent. Les polices absentes restent signalées.
- Remplissages à trous : sommets de fermeture en double retirés à la création des contours. ODA supprimait ces doublons géométriquement inutiles et le contrôle strict bloquait l’export. Vérification conservée, aucune tolérance générale élargie.

## Vérifications
- Conversion des trois pages, puis ouverture dans ALCIDE ; captures alcide-1.png à alcide-3.png comparées visuellement avec original-1-1.png à original-3-1.png. La présentation générale, les traits, textes et remplissages sont présents. Les épaisseurs minimales d’écran accentuent les traits au dézoom par rapport au lecteur PDF.
- Échelle de test 1:50, dessin en cm : format papier du premier plan 1450 × 900 mm donnant 7250 × 4500 cm dans le dessin. Les détails imprimés à des échelles différentes ne retrouvent pas automatiquement chacun leur échelle métier.
- Plan Plan B testé dans le dialogue PDF avec le moteur compilé : 23 calques PDF + éléments sans calque, 36 273 objets. Modification d’un trait, Ctrl+Z, visibilité du calque FER 06.
- Ctrl+S : DWG enregistré avec contrôle de réouverture, puis relu par le moteur. 36 273 objets retrouvés et tous les calques conservés. PDF source vérifié inchangé.
- Diagnostic DXF > DWG > DXF : 141 divergences initiales, toutes dues à la répétition inutile du sommet de fermeture ; zéro divergence après correction des contours.
- Régression synthétique pdf113.py : unités mm/cm/m, courbes cubiques, groupes masqués, page tournée, masques, trous, destination existante protégée, page sans vecteurs refusée et calques homonymes distincts.

## Limites constatées
- Plusieurs polices PDF ne sont pas présentes sur cette machine : substitution signalée dans le bilan.
- Trois dégradés présents dans chacun des deux plans d’armatures ne sont pas importés.
- Deux textes du plan Plan B touchent les limites de page ; découpe des glyphes à vérifier. Les masques internes de texte restent également signalés, sans prétendre garantir leur fidélité.
- Les cotes et armatures du PDF deviennent des objets graphiques éditables ; elles ne redeviennent pas des objets métier intelligents.
- Import lourd : le plan de coffrage produit plus de 116 000 objets ; la conversion et l’ouverture prennent plusieurs dizaines de secondes selon le cache et la charge. Pas de promesse d’import instantané.

Aucun installeur construit ni installation réalisée pendant ces tests.
