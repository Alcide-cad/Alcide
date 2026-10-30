# Import PDF — chaîne sans MuPDF

- ALCIDE : GPL-3.0-or-later (licence générale existante).
- Extraction vectorielle : pdfminer.six 20260107, licence MIT. Courbes, textes, chemins, motifs simples, clips et groupes de contenu optionnel (OCG) sont traités par pdf_gpl_backend.py et pdf_vector_import.py.
- Aperçu et contrôle visuel : Poppler 26.09.0, GPL (voir COPYING/COPYING3 joints). Source amont : https://poppler.freedesktop.org/poppler-26.09.0.tar.xz . Paquet Windows utilisé pour les tests : https://github.com/oschwartz10612/poppler-windows/releases/tag/v26.09.0-0 .
- Géométrie DXF : ezdxf (MIT), Shapely (BSD), FontTools (MIT), avec leurs notices propres.

PyMuPDF/MuPDF ne sont plus importés ni inclus comme bibliothèque native dans le moteur PDF courant. Le module optionnel nommé pymupdf.py dans ezdxf est un adaptateur MIT d’ezdxf ; ce n’est pas la bibliothèque AGPL MuPDF, et son import est exclu de la compilation.

Les GPL, notices, empreintes des binaires et archive source amont Poppler sont jointes dans engine/poppler. Les DLL tierces du paquet Windows ont leurs propres licences. Pour une publication de binaires, conserver leurs notices et fournir les sources correspondantes et recettes de construction nécessaires ; l’archive source amont Poppler seule ne couvre pas toutes ces DLL.

Les tests ne prouvent pas une compatibilité parfaite avec tous les PDF. Les dégradés, masques de transparence et modes de découpe de texte non reproduits sont signalés. Les annotations et armatures restent des objets graphiques après import, pas des objets métier reconstruits.
