/* 1.0.89 · « Hachures » scindé en trois familles partout où l'on filtre par type d'objet :
   Motifs (hachure à motif, avec ou sans fond uni / dégradé), Remplissages (SOLID uni) et Dégradés (hachure dégradée).
   Une hachure = une seule famille, pour que les compteurs s'additionnent et qu'un filtre ne touche jamais
   une autre famille par surprise : un motif posé sur un fond reste un Motif (le compteur indique « dont N avec fond »).
   Les remplissages dessinés dans ALCIDE sans contour (remplir au clic, union…) sont rangés de la même façon. */
(()=>{
 const KINDS={'HATCH:PATTERN':['Motif','Motifs'],'HATCH:SOLID':['Remplissage','Remplissages'],'HATCH:GRADIENT':['Dégradé','Dégradés']};
 for(const [k,[one]]of Object.entries(KINDS))objectNames[k]=one;
 function kind(e){if(!e)return null;const edit=edits[e.id]||{},p=edit.props||{};
  if(e.type!=='HATCH'&&!(p.filled&&p.fillOnly))return null;
  if(window.Gradient187?.spec?.(e))return 'HATCH:GRADIENT';
  const pattern=e.type==='HATCH'?(edit.hatchStyle&&edit.hatchStyle.pattern!=null?edit.hatchStyle.pattern:e.pattern):p.fillPattern;
  return !pattern||String(pattern).toUpperCase()==='SOLID'?'HATCH:SOLID':'HATCH:PATTERN';}
 function background(e){const edit=edits[e.id]||{},p=edit.props||{},s=edit.hatchStyle;
  if(e.type!=='HATCH')return !!(p.fillBackgroundColor||p.fillBackgroundGradient);
  if(s&&(Object.hasOwn(s,'backgroundColor')||Object.hasOwn(s,'backgroundGradient')))return !!(s.backgroundColor||s.backgroundGradient);
  return !!(e.backgroundColor||e.backgroundGradient);}
 const typeKey=e=>kind(e)||e.type;
 const record=selectionRecord;window.selectionRecord=function(e,cache){const hit=cache?.has(e.id);const r=record(e,cache);if(!hit&&r&&r.type===e.type){const k=kind(e);if(k)r.type=k;}return r;};
 window.HatchKind189={KINDS,kind,background,typeKey,plural:k=>KINDS[k]?.[1]||null};
})();
