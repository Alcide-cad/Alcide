# Import PDF — nouvelle passe GPL/MIT du 30 octobre 2026

## Chaîne courante
- Extraction vectorielle et calques : pdfminer.six 20260107 (MIT), avec adaptateur ALCIDE GPL.
- Aperçu et contrôle visuel : Poppler 26.09.0 (GPL).
- PyMuPDF/fitz/MuPDF retirés du moteur compilé. Les anciens essais AGPL sont archivés hors du runtime distribué.

## PDF réels actuels du Bureau / IMPRESSIONS
Les chiffres concernent les fichiers présents pendant cette passe ; certains diffèrent des PDF testés le 28 octobre. Aucun original modifié : empreintes SHA-256 contrôlées.

| PDF | Calques OCG | Objets CAD | Textes |
|---|---:|---:|---:|
| Plan de test A (coffrage) | 30 | 116389 | 1636 |
| Plan de test B (armatures) | 24 | 36712 | 1686 |
| Plan de test C (armatures) | 26 | 36244 | 1284 |

Un calque supplémentaire reçoit les objets sans OCG. Calques homonymes distincts, état masqué conservé, caractères incompatibles avec DXF renommés avec correspondance dans les métadonnées.

## Vérifications effectuées
- Tests synthétiques : unités mm/cm/m, échelle 1:50, spline cubique, groupes masqués, exclusion des groupes masqués, rotation de page, clips, trous pair/impair, protection de la destination et source inchangée, refus d’une page sans vecteurs, OCG homonymes distincts.
- Exécution dans le moteur Windows compilé : aperçu Poppler, dialogue de page/échelle, ouverture et calques.
- Trois plans convertis puis ouverts dans ALCIDE ; captures alcide-1.png à alcide-3.png comparées aux rendus Poppler original-1.png à original-3.png.
- Mode détails complets et zoom sur les tableaux : textes présents et lisibles. En mode automatique, les textes trop petits sont volontairement allégés au dézoom.
- Sur Plan B : modification d’un trait, Ctrl+Z, masquage puis réaffichage du calque FER 06. Sauvegarde DWG puis réouverture : 36 712 objets et tous les calques retrouvés.
- Le contrôle strict de sauvegarde DWG est conservé. Aucun nouveau contournement de validation.
- Inspection du moteur empaqueté : aucun module PyMuPDF/fitz et aucune bibliothèque native MuPDF. Le fichier adaptateur optionnel d’ezdxf nommé pymupdf.py reste du code MIT d’ezdxf, sans bibliothèque AGPL incluse ; son import est exclu.

## Limites maintenues
- Trois dégradés dans chacun des deux plans d’armatures ne sont pas reconstruits en DXF ; ils sont signalés.
- Polices absentes remplacées avec avertissement ; textes partiellement découpés par le bord ou par un masque interne à vérifier.
- Les objets du PDF ne redeviennent pas des armatures ou cotes intelligentes ; ils deviennent des objets graphiques modifiables.
- Une échelle globale est choisie ; les détails imprimés à plusieurs échelles ne sont pas recalibrés séparément automatiquement.
- Le gros plan contient plus de 116 000 objets : la conversion reste un traitement de plusieurs dizaines de secondes. Tests réalisés pendant des tâches de compilation ; pas de comparaison chronométrique contrôlée avec l’ancien moteur.

## Préparation du futur dépôt
Sources, versions Python figées, notices, empreintes des archives Poppler et procédure de reconstruction regroupées dans Sources. Aucun dépôt créé ni publié. README-PDF-GPL-GitHub.md indique les dossiers privés à exclure et les obligations restant à traiter pour une diffusion binaire complète : notices et sources correspondantes des DLL tierces, contrôle séparé des outils DWG externes.

Aucun installeur construit et aucune installation effectuée.
