# ALCIDE 1.0.12

Import de PDF vectoriels avec page, aperçu, échelle et unité. Calques PDF conservés, y compris les groupes masqués et homonymes. Objets CAD modifiables et sauvegarde DWG contrôlée.

Chaîne PDF : Poppler GPL pour l’aperçu, pdfminer.six MIT pour l’extraction. Pas de bibliothèque PyMuPDF/MuPDF dans le moteur empaqueté. Sources, licences et instructions de reconstruction jointes.

Fond blanc conservant les couleurs PDF d’origine. Correspondance des polices installées, avec repli signalé. Contours de remplissage nettoyés pour une conversion DWG sans doublon de fermeture.

Limites : images scannées non vectorisées, dégradés non repris, masques de texte et polices absentes à contrôler. Une seule échelle par import. Les objets PDF ne deviennent pas automatiquement des objets métier intelligents.

Validé sur les trois PDF réels d’IMPRESSIONS, sans modification des originaux. L’import de fichiers denses prend plusieurs dizaines de secondes. Aucune promesse d’optimisation absolue pour tous les fichiers.
