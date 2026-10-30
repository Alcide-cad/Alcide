# ALCIDE 1.0.9 — Enregistrement DWG

## Commandes
- Enregistrer / Ctrl+S : sauvegarde le DWG actif sans dialogue de succès.
- Enregistrer sous / Ctrl+Maj+S : nom et dossier ; confirmation Windows habituelle pour remplacer un fichier existant. Le DWG choisi devient la destination active, dans le même onglet.
- Projet ALCIDE : commande distincte pour les données métier et les réglages éditables.
- Exporter DXF / Ctrl+E : copie DXF séparée, sans changer la destination DWG active.
- Menu visible à côté de la disquette ; menu natif, boutons, aides et raccourcis alignés. Ancien IPC et ancien parcours Export DWG retirés.

## Conservation
Le DWG est vérifié par conversion et relecture avant publication atomique. Lorsqu’un fichier DWG est remplacé, son contenu précédent est conservé dans Nom.dwg.bak. Une base interne immuable permet de conserver les modifications, les objets éditables et Undo dans la session sans les appliquer deux fois aux sauvegardes suivantes. Les projets et récupérations utilisent cette base.
Si la destination refuse l’écriture, le fichier précédent reste intact et une copie locale de secours est signalée. Une erreur ou une annulation ne marque pas le travail comme enregistré.

## Vérifications
- Save-dwg109 : remplacement du fichier ouvert, sauvegardes répétées, absence de doublons et de déplacement doublé, Save As avec remplacement, annulation, échec, projet ALCIDE relu, DXF séparé, menus et bridge nettoyés.
- Save-shortcuts109 : vrais Ctrl+S / Ctrl+Maj+S, première sauvegarde d’un dessin neuf, Undo après sauvegarde et retour d’onglet.
- Save-failures109 : échec du contrôle DWG = fichier et ancienne sauvegarde inchangés ; refus d’écriture = copie de secours.
- Save-real109 : sauvegarde vérifiée d’une copie du plan réel de plus de 20 000 éléments ; source de test conservée ; onglet et modèle en mémoire inchangés.
- Régressions barre flottante et remplissages : réussies.

Moteur reconstruit et testé. Aucun fichier utilisateur écrasé pendant ces tests. Installeur construit après autorisation explicite. Aucune installation automatique.
