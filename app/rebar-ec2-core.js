// NF EN 1992-1-1:2005+A1:2015, French NA March 2016. Units: mm, MPa, N.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RebarEC2=api;})(globalThis,()=>{
const exposures=['X0','XC1','XC2/XC3','XC4','XD1/XS1','XD2/XS2','XD3/XS3'];
const covers=[[10,10,10,15,20,25,30],[10,10,15,20,25,30,35],[10,10,20,25,30,35,40],[10,15,25,30,35,40,45],[15,20,30,35,40,45,50],[20,25,35,40,45,50,55]];
const positive=(v,n)=>{if(!Number.isFinite(v)||v<=0)throw Error(n+' doit être positif.');return v;};
function calculate(p){const phi=positive(p.diameter,'Diamètre'),fck=positive(p.fck,'fck'),fctk=positive(p.fctk,'fctk,0.05'),sigma=positive(p.sigma,'Contrainte acier'),rho=positive(p.rho,'Pourcentage de recouvrement');if(phi>40||fck>50||rho>100||sigma>500/1.15+1e-6||![.7,1].includes(p.eta1))throw Error('Domaine : barre HA simple Ø ≤ 40, béton normal fck ≤ 50, acier B500 ELU persistant, adhérence 1 ou 0,7 et recouvrements ≤ 100 %.');
const sc=p.structuralClass,ix=exposures.indexOf(p.exposure);if(!Number.isInteger(sc)||sc<1||sc>6||ix<0)throw Error('Classe structurale/exposition manquante.');
if(!Number.isFinite(p.dg)||p.dg<0)throw Error('Granulat incorrect.');
const fcd=fck/1.5,fctd=fctk/1.5,eta2=phi<=32?1:(132-phi)/100,fbd=2.25*p.eta1*eta2*fctd,lb=phi/4*sigma/fbd;
// All favourable alpha1..5 reductions deliberately = 1; alpha6 from 8.7.3.
const alpha6=Math.min(1.5,Math.max(1,Math.sqrt(rho/25))),anchorage=Math.max(lb,(p.compression?.6:.3)*lb,10*phi,100),lap=Math.max(alpha6*lb,.3*alpha6*lb,15*phi,200);
const cDur=covers[sc-1][ix],cBond=phi+(p.dg>32?5:0),cover=Math.max(cDur,cBond,10)+10;
const steelMandrel=(phi<=16?4:7)*phi;let concreteMandrel=null;if(p.ab!=null){positive(p.ab,'a_b');concreteMandrel=(sigma*Math.PI*phi*phi/4)*(1/p.ab+1/(2*phi))/fcd;}
return {fcd,fctd,fbd,lb,alpha6,anchorage,lap,cDur,cBond,cover,steelMandrel,concreteMandrel,mandrel:Math.max(steelMandrel,concreteMandrel||0),hook135:Math.max(5*phi,50),hook90:Math.max(10*phi,70),clauses:'3.1.6 ; 4.4.1 ; 8.3 ; 8.4.2–4 ; 8.5 ; 8.7.3',assumptions:'ELU persistant : γc=1,5 ; γs=1,15 ; αcc=αct=1. α1…α5=1 sans réduction favorable. Δcdev=10 mm. Classe structurale choisie par le projeteur selon tableau 4.3NF.'};}
function secondaryMeshLap(phi,pitch){positive(phi,'Diamètre fil');positive(pitch,'Pas transversal');if(phi>12)throw Error('Fil de répartition hors tableau 8.4 (Ø > 12).');return Math.max(phi<=6?150:phi<=8.5?250:350,(phi<=6?1:2)*pitch);}
return {calculate,secondaryMeshLap,exposures};
});
