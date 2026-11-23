## ALCIDE 1.1.30 pour Windows

Cette version regroupe les améliorations apportées depuis la dernière publication GitHub.

- **Fonds pour Allplan.** Depuis le ruban Accueil, nettoyez un dossier de DWG, alignez le mur principal sur X ou Y et générez les vues d’impact des étages.
- **Comparaison archi et charpente.** Vérifiez la rotation et les écarts d’axes avant d’exporter. Les axes sont sur deux calques. Avec un IFC compatible, les platines et tiges d’ancrage sont reprises sur leurs calques dédiés. Les platines hors de l’emprise de l’implantation sont écartées. Les données IFC sont à vérifier sur les plans du charpentier avant utilisation pour le ferraillage.
- **Remplacement d’un DWG.** Le Nettoyeur exporte le dessin préparé pour l’aperçu validé. Il vérifie le DWG avant de remplacer une destination existante et conserve l’ancienne version dans un fichier `.dwg.bak`.
- **Présentations et PDF.** Créez une feuille avec une fenêtre à l’échelle choisie, encadrez la zone à la souris et modifiez ensuite le cadrage ou l’échelle d’une fenêtre existante.
- **Ruban réorganisé.** Les outils courants sont en tête de leur onglet, avec des icônes et libellés alignés.

### Installation et vérification

Téléchargez `Installer-ALCIDE-1.1.30.exe` et vérifiez son empreinte à l’aide du fichier `.sha256` joint. Dans PowerShell, depuis le dossier du téléchargement, lancez `Get-FileHash .\Installer-ALCIDE-1.1.30.exe -Algorithm SHA256`.

L’installeur est **non signé**. Windows SmartScreen peut afficher « Windows a protégé votre ordinateur ». Si vous avez téléchargé l’installeur depuis cette release officielle et que l’empreinte correspond, ouvrez **Informations complémentaires**, puis **Exécuter quand même** si Windows propose cette option.
