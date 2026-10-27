/* Small explicit AutoLISP interpreter. Unsupported operations fail transactionally. */
(function(global){
const sym=s=>({symbol:s.toUpperCase()}),isSym=x=>x&&typeof x==='object'&&'symbol'in x;
const pair=(a,b)=>({car:a,cdr:b}),truth=x=>x!==null&&x!==false;
function parse(code){
 const tokens=code.match(/;[^\r\n]*|"(?:\\.|[^"\\])*"|[()']|[^\s()';]+/g)||[];let n=0;
 const ts=tokens.filter(t=>!t.startsWith(';'));
 function read(){const t=ts[n++];if(t===undefined)throw Error('Expression LISP incomplète.');
 if(t==='('){let a=[];while(ts[n]!==')'){if(n>=ts.length)throw Error('Parenthèse LISP manquante.');if(ts[n]==='.'){n++;let tail=read();if(ts[n++]!==')')throw Error('Paire pointée incorrecte.');for(let i=a.length-1;i>=0;i--)tail=pair(a[i],tail);return tail;}a.push(read());}n++;return a;}
 if(t===')')throw Error('Parenthèse LISP inattendue.');if(t==="'")return [sym('QUOTE'),read()];
 if(t[0]==='"')return t.slice(1,-1).replace(/\\n/g,'\n').replace(/\\r/g,'\r').replace(/\\t/g,'\t').replace(/\\"/g,'"').replace(/\\\\/g,'\\');
 if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(t))return Number(t);
 return sym(t);}
 const forms=[];while(n<ts.length)forms.push(read());return forms;
}
class Env{constructor(parent=null){this.parent=parent;this.values=new Map();}get(s){if(this.values.has(s))return this.values.get(s);return this.parent?this.parent.get(s):null;}set(s,v){let e=this;while(e){if(e.values.has(s)){e.values.set(s,v);return v;}e=e.parent;}this.values.set(s,v);return v;}}
class Lisp{
 constructor(host){this.host=host;this.env=new Env();this.funcs=new Map();this.env.values.set('T',true);this.env.values.set('NIL',null);this.vars={TRANSPARENCYDISPLAY:1};this.steps=0;this.output=[];}
 evaluate(x,env=this.env){if(++this.steps>100000)throw Error('Limite d’exécution LISP atteinte.');if(isSym(x))return env.get(x.symbol);if(!Array.isArray(x))return x;if(!x.length)return null;
 const name=isSym(x[0])?x[0].symbol:null;const args=x.slice(1);const ev=a=>this.evaluate(a,env);
 if(name==='QUOTE')return args[0];
 if(name==='SETQ'){let v=null;for(let i=0;i<args.length;i+=2){if(!isSym(args[i]))throw Error('SETQ attend un symbole.');v=env.set(args[i].symbol,ev(args[i+1]));}return v;}
 if(name==='IF')return truth(ev(args[0]))?ev(args[1]):args.length>2?ev(args[2]):null;
 if(name==='PROGN'){let v=null;for(const a of args)v=ev(a);return v;}
 if(name==='AND'){let v=true;for(const a of args){v=ev(a);if(!truth(v))return null;}return v;}
 if(name==='OR'){for(const a of args){const v=ev(a);if(truth(v))return v;}return null;}
 if(name==='COND'){for(const a of args)if(truth(ev(a[0]))){let v=true;for(const b of a.slice(1))v=ev(b);return v;}return null;}
 if(name==='WHILE'){let v=null;while(truth(ev(args[0])))for(const a of args.slice(1))v=ev(a);return v;}
 if(name==='REPEAT'){const c=ev(args[0]);if(c<0||c>10000)throw Error('REPEAT hors limite.');let v=null;for(let i=0;i<c;i++)for(const a of args.slice(1))v=ev(a);return v;}
 if(name==='FOREACH'){const list=ev(args[1])||[];let v=null;for(const item of list){env.set(args[0].symbol,item);for(const a of args.slice(2))v=ev(a);}return v;}
 if(name==='DEFUN'){const fn=args[0].symbol;this.funcs.set(fn,{params:args[1],body:args.slice(2)});return args[0];}
 const values=args.map(ev);
 if(this.funcs.has(name)){const f=this.funcs.get(name),local=new Env(env);let slash=false,i=0;for(const p of f.params){if(p.symbol==='/'){slash=true;continue;}local.values.set(p.symbol,slash?null:values[i++]??null);}let v=null;for(const b of f.body)v=this.evaluate(b,local);return v;}
 return this.builtin(name,values);
 }
 builtin(n,a){const h=this.host;const list=x=>Array.isArray(x)?x:[];
 switch(n){
 case 'LIST':return a.length?a:null;case 'CONS':return Array.isArray(a[1])?[a[0],...a[1]]:a[1]===null?[a[0]]:pair(a[0],a[1]);
 case 'CAR':return Array.isArray(a[0])?a[0][0]??null:a[0]?.car??null;case 'CDR':return Array.isArray(a[0])?(a[0].length>1?a[0].slice(1):null):a[0]?.cdr??null;
 case 'CADR':return list(a[0])[1]??null;case 'CADDR':return list(a[0])[2]??null;case 'NTH':return list(a[1])[a[0]]??null;
 case 'LENGTH':return list(a[0]).length;case 'APPEND':return a.flatMap(list);case 'REVERSE':return [...list(a[0])].reverse();
 case 'ASSOC':return list(a[1]).find(p=>(p.car??p[0])===a[0])??null;
 case 'SUBST':return list(a[2]).map(v=>JSON.stringify(v)===JSON.stringify(a[1])?a[0]:v);
 case 'MEMBER':{let i=list(a[1]).findIndex(v=>JSON.stringify(v)===JSON.stringify(a[0]));return i<0?null:a[1].slice(i);}
 case '=':case 'EQ':case 'EQUAL':return a.every(v=>JSON.stringify(v)===JSON.stringify(a[0]))?true:null;
 case '/=':return a[0]!==a[1]?true:null;case '<':return a[0]<a[1]?true:null;case '>':return a[0]>a[1]?true:null;case '<=':return a[0]<=a[1]?true:null;case '>=':return a[0]>=a[1]?true:null;
 case 'NOT':case 'NULL':return truth(a[0])?null:true;
 case '+':return a.reduce((v,x)=>v+x,0);case '-':return a.length===1?-a[0]:a.slice(1).reduce((v,x)=>v-x,a[0]);case '*':return a.reduce((v,x)=>v*x,1);case '/':return a.slice(1).reduce((v,x)=>v/x,a[0]);
 case '1+':return a[0]+1;case '1-':return a[0]-1;case 'ABS':return Math.abs(a[0]);case 'FIX':return Math.trunc(a[0]);case 'FLOAT':return Number(a[0]);case 'MIN':return Math.min(...a);case 'MAX':return Math.max(...a);
 case 'ITOA':return String(Math.trunc(a[0]));case 'ATOI':return parseInt(a[0])||0;case 'ATOF':return parseFloat(a[0])||0;case 'RTOS':return Number(a[0]).toFixed(a[2]??2);case 'STRCAT':return a.join('');case 'STRCASE':return a[1]?a[0].toLowerCase():a[0].toUpperCase();
 case 'PRINC':case 'PRINT':case 'PROMPT':if(a.length)this.output.push(typeof a[0]==='string'?a[0]:JSON.stringify(a[0]));return a[0]??null;
 case 'GETVAR':{const v=a[0].toUpperCase();if(v==='CVPORT')return h.layout()==='Model'?2:1;if(v==='CTAB')return h.layout();if(v in this.vars)return this.vars[v];throw Error('Variable AutoCAD non prise en charge : '+v);}
 case 'SETVAR':{const v=a[0].toUpperCase();if(v!=='TRANSPARENCYDISPLAY')throw Error('Variable non modifiable : '+v);this.vars[v]=a[1];return a[1];}
 case 'SSGET':{const mode=typeof a[0]==='string'?a[0].toUpperCase():'_X';if(!['_X','X','_I','I'].includes(mode))throw Error('SSGET : seuls _X et _I sont pris en charge.');const filters=a.find(Array.isArray)||[];const entities=mode.includes('I')?h.selection():h.entities();const ids=entities.filter(e=>filters.every(p=>{const key=p.car??p[0],val=p.cdr??p[1];if(key===-4)throw Error('Filtres SSGET logiques non pris en charge.');const actual=e.tags[String(key)];if(typeof val==='string'){const re=new RegExp('^(?:'+val.split(',').map(v=>v.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')).join('|')+')$','i');return re.test(String(actual??''));}return actual===val;})).map(e=>e.id);return ids.length?{selection:ids}:null;}
 case 'SSLENGTH':return a[0]?.selection?.length??0;case 'SSNAME':return a[0]?.selection?.[a[1]]??null;
 case 'SSADD':{const ss=a[1]||{selection:[]};if(a[0]&&!ss.selection.includes(a[0]))ss.selection.push(a[0]);return ss;}
 case 'SSDEL':{const ss=a[1];ss.selection=ss.selection.filter(x=>x!==a[0]);return ss;}
 case 'SSSETFIRST':h.select(a[1]?.selection||[]);return a[1];
 case 'ENTGET':{const e=h.entity(a[0]);if(!e)return null;return Object.entries(e.tags).map(([k,v])=>pair(Number(k),v)).concat([pair(440,(0x02000000|Math.round(255*(1-h.opacity(e.id)/100)))>>>0)]);}
 case 'ENTMOD':{const id=list(a[0]).find(p=>p.car===5)?.cdr;const e=h.entity(id);if(!e)throw Error('ENTMOD : entité inconnue.');const value=list(a[0]).find(p=>p.car===440)?.cdr;if(value===undefined)throw Error('ENTMOD : seule la transparence (440) est modifiable dans cette version.');for(const p of list(a[0]))if(p.car!==440&&e.tags[String(p.car)]!==undefined&&e.tags[String(p.car)]!==p.cdr)throw Error('ENTMOD : propriété non prise en charge : '+p.car);h.setOpacity([id],Math.round((1-(value&255)/255)*100));return a[0];}
 case 'ENTUPD':return a[0];
 case 'COMMAND':case 'VL-CMDF':{const c=String(a[0]).replace(/[_.]/g,'').toUpperCase();if(c==='REGEN'||c==='REGENALL')return null;if(c==='CHPROP'){const ss=a[1]?.selection;if(!ss)throw Error('CHPROP attend un jeu de sélection.');const p=a.findIndex(x=>typeof x==='string'&&x.replace(/^_/,'').toUpperCase()==='TRANSPARENCY');if(p<0)throw Error('CHPROP : seule la transparence est prise en charge.');const val=Number(a[p+1]);if(!Number.isFinite(val)||val<0||val>90)throw Error('Transparence AutoLISP attendue entre 0 et 90.');h.setOpacity(ss,val);return null;}throw Error('Commande AutoCAD non prise en charge : '+c);}
 case 'VL-LOAD-COM':throw Error('ActiveX / Visual LISP COM non pris en charge.');
 default:throw Error('Fonction AutoLISP non prise en charge : '+(n||'expression dynamique'));
 }
 }
 run(code){this.steps=0;this.output=[];const forms=parse(code);let v=null;for(const f of forms)v=this.evaluate(f);return {value:v,output:this.output.join(''),commands:[...this.funcs.keys()].filter(n=>n.startsWith('C:')).map(n=>n.slice(2))};}
 command(name){name=name.toUpperCase();if(!this.funcs.has('C:'+name))throw Error('Commande LISP inconnue : '+name);this.steps=0;this.output=[];this.evaluate([sym('C:'+name)]);return this.output.join('');}
}
global.AlcideLisp=Lisp;
})(typeof window==='undefined'?globalThis:window);
