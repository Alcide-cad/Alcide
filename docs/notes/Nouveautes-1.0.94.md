# ALCIDE 1.0.94 — nouveautés

## Enregistrement DWG sans ODA File Converter (priorité)
- Plus de message d’erreur brut : si ODA File Converter (gratuit) n’est pas installé au moment d’enregistrer en DWG, une fenêtre claire propose :
  - **Installer ODA File Converter automatiquement** : téléchargement depuis opendesign.com (jamais embarqué dans ALCIDE), installation pour l’utilisateur sans droits administrateur (sinon installeur officiel), conversion d’essai, puis l’enregistrement DWG reprend tout seul. Progression affichée ; en cas d’échec, la page officielle s’ouvre.
  - **Télécharger ODA File Converter (gratuit)** : ouvre la page officielle.
  - **Enregistrer en DXF à la place** : Enregistrer sous, même nom en .dxf.
  - **Réessayer** (ODA est recherché à chaque enregistrement, sans redémarrer) et **Annuler**.
- Indicateur permanent dans la barre d’état : « DWG : ODA détecté / ODA non installé » (clic = fenêtre ODA).
- Paramètres : entrée « ODA File Converter : détecté / non installé » avec Installer / Page officielle / Vérifier.
- Avis discret, une seule fois, à l’ouverture d’un DWG sans ODA (l’ouverture DWG fonctionne toujours grâce à LibreDWG).
- Détection élargie : Program Files, Program Files (x86), dossiers utilisateur, registre Windows (désinstallation, App Paths), PATH.
- LibreDWG (dxf2dwg 0.11 et 0.14) a été évalué comme écrivain DWG hors ligne : ses DWG ne sont pas relus par ODA sur 8 plans d’essai sur 9 ; il n’est donc pas utilisé pour l’enregistrement.

## Dessin : Spline et Crayon (ruban Dessin, à côté de Polyligne)
- **Spline** (comme SPLINE d’AutoCAD) : points de lissage par défaut (la courbe passe par les clics) ou sommets de contrôle ; aperçu en direct, accrochages, Retour arrière / Ctrl+Z retire le dernier point, Entrée ou clic droit termine, « Fermée » (touche C ou clic sur le premier point). Modifiable ensuite par poignées ; déplacer, copier, rotation, miroir conservés.
- **Crayon** : dessin à main levée lissé automatiquement (moyenne glissante + Ramer-Douglas-Peucker) en spline harmonieuse ; curseur « Lissage » ; boucle refermée automatiquement.
- Export en vraies entités SPLINE dans le DXF et le DWG (relues à l’identique, contrôle de réouverture DWG compris).

## Fenêtre « Aligner les textes »
- Déplaçable par sa barre de titre, reste dans l’écran, position mémorisée (double-clic sur le titre : position d’origine). Un glisser n’applique jamais d’alignement.
