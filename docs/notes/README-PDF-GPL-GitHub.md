# Reconstruction de la chaîne PDF pour le futur dépôt GitHub

Aucune publication ni création de dépôt n’a été effectuée.

Les sources utiles sont pdf_gpl_backend.py, pdf_vector_import.py, engine.py et les autres modules Python/JS fournis dans Sources. PyMuPDF/fitz est explicitement exclu de la compilation. Le rendu PDF utilise pdftoppm de Poppler GPL ; l’extraction utilise pdfminer.six MIT. Aucun abonnement ni licence commerciale PDF n’est requis par cette chaîne.

1. Dans un environnement Python 3.10 Windows x64, installer requirements-engine-gpl.txt.
2. Exécuter python build_pdf_engine_gpl.py. Le moteur apparaît dans build-gpl/dist/alcide-engine.
3. Placer le composant Poppler testé sous alcide-engine/poppler/bin, avec ses dépendances et les notices. Le manifeste poppler-provenance.json décrit les archives de référence. Conserver les éléments DWG nécessaires à part : ce remplacement concerne seulement la chaîne PDF.
4. Refaire les tests d’import, de calques, de texte et de sauvegarde DWG. Les PDF réels de Nicolas ne doivent pas être publiés ; utiliser des fixtures libres créées pour les tests.

Ne pas publier directement le dossier de travail complet : il contient des plans clients, profils de test, copies de DWG et anciens moteurs. Préparer un dépôt contenant les sources choisies, les licences et les instructions, avec les dossiers work, outputs, profils et fichiers utilisateur exclus. Grok pourra reprendre cette base plus tard.

Pour une release binaire GPL, compléter le dossier des sources correspondantes et notices de chaque DLL redistribuée (y compris les dépendances Poppler), puis vérifier les droits des composants DWG externes séparément. Les tests fonctionnels de cette tâche ne constituent pas cet audit de diffusion complet.
