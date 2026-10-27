// Extend the existing double right-click gesture to physical reinforcement assemblies.
(()=>{
 const previous=window.resumeObjectTool;window.resumeObjectTool=e=>e?.rebar?{name:e.rebar.model.kind==='mesh'?'le treillis '+e.rebar.model.ref:'l’armature HA'+e.rebar.model.diameter,run:()=>{window.closeRebarContextMenu?.();Reinforcement.resume(e.id);}}:previous(e);
 const p=text=>Object.assign(document.createElement('p'),{textContent:text});
 updateHelpTopic('Reprendre un objet · double clic droit',[
 p('Faites deux clics droits rapides au même endroit sur un objet : son outil de création redémarre avec ses propriétés. Le premier clic peut ouvrir le menu ; le second reprend l’objet. Le dessin d’origine reste en place.'),
 p('Armatures : la forme, le diamètre, les crosses, la quantité, l’espacement, le calque et le style du repère sont repris. Chaque nouvelle barre reçoit un nouveau numéro de position disponible. Les treillis reprennent leur référence et leur mode de pose. Le menu contextuel propose aussi Reprendre cette armature.'),
 p('Pose en continu : après validation d’une barre, d’un cadre, d’une épingle ou d’un treillis, la fonction reste active avec les mêmes réglages. Cliquez le départ suivant ou la prochaine position. Un double clic gauche pendant la pose ne doit pas ouvrir les propriétés. Échap termine la pose ; un second Échap ferme le panneau.'),
 p('Les lignes, polylignes, rectangles, textes et cotes utilisent également la reprise par double clic droit lorsque leur outil de création est disponible. Une représentation liée reste liée à sa position physique et n’ajoute pas de quantité au tableau.')]);
})();
