# ALCIDE 1.0.86

Version de corrections issue d’une revue complète du code 1.0.85. Aucune nouvelle fonction. Seules les armatures très détaillées (voir ci-dessous) sont enregistrées sous une forme compressée.

Ouverture DXF : un fichier dont des objets utilisent un calque absent de la table des calques s’ouvre désormais, comme dans AutoCAD. Les calques manquants sont créés et signalés dans la barre d’état. Avant, l’ouverture échouait avec pour seul message le nom du calque.

Export PDF vectoriel : le rendu optimisé de l’écran n’est plus désactivé après le premier export PDF. Le zoom et le déplacement de la vue restent fluides pendant toute la session. Le PDF produit est identique.

Moteur de dessin : s’il s’arrête ou plante, il redémarre automatiquement à l’action suivante et recharge les dessins ouverts. Un message l’indique. Les modifications non enregistrées restent dans la fenêtre et peuvent être enregistrées normalement. Après trois arrêts en deux minutes, ALCIDE demande de relancer le logiciel au lieu de boucler.

Ouverture des gros fichiers : le délai d’attente augmente avec la taille du fichier et repart à chaque étape de progression, au lieu d’un délai fixe de 3 minutes.

Fichier modifié hors d’ALCIDE : la protection qui existait pour les DWG s’applique aussi aux DXF. Si le fichier a changé sur le disque depuis son ouverture, ALCIDE refuse de l’écraser et propose Enregistrer sous.

Annuler / Rétablir : revenir exactement à l’état ouvert ou enregistré retire l’indicateur « modifié ».

Enregistrement des poutres : un dessin contenant une poutre paramétrique (ou un autre ensemble d’armatures très détaillé) ne pouvait plus être enregistré : « Armature trop complexe pour les métadonnées DWG ». Ces données sont désormais compressées dans le fichier et relues normalement. Les dessins existants restent lisibles ; un fichier enregistré avec une telle poutre par la 1.0.86 n’est pas relu comme armature par les versions antérieures.

Linteaux, poteaux, poutres : après la pose d’une vue, la fenêtre « Objets sous le pointeur » ne s’ouvre plus et l’élément posé reste sélectionné. Le bouton Linteau propose donc bien « Ajouter l’élévation liée » : la seconde vue partage les quantités au lieu de créer un second linteau compté deux fois dans la nomenclature.

Arrondi des longueurs : le réglage (par défaut 1 cm au plus proche) s’applique de nouveau à L= dans les repères d’armatures et les repères placés. Le développé exact, les poids et la nomenclature ne changent pas.

Maintenance : liste de compilation du moteur complétée (olefile 0.47, aperçus des objets OLE), version Python documentée (3.12), chemin d’outil de développement retiré de la recherche d’ODA File Converter, fichier d’interface inutilisé supprimé, nettoyage de variables inutilisées, moteur plus robuste face à une requête illisible.

Toujours sans PyMuPDF et sans ODA File Converter embarqué.
