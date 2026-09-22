/* Flat-pack search. No original objects are mutated while candidates are tested. */
function compactLayout(source) {
  const pkg={...source,items:source.items.map(item=>({...item})),fillers:[]};
  const ordered=pkg.items.slice().sort((a,b)=>b.width*b.depth-a.width*a.depth);
  const base=ordered[0];
  pkg.baseWidth=Math.max(base.width,base.depth);pkg.baseDepth=Math.min(base.width,base.depth);
  if(!pkg.items.every(item=>fits(item,pkg)))return null;
  const layers=[];
  // Keep thin HDF together above the rigid panels; do not mix 66 mm rails with 16 mm boards.
  ordered.sort((a,b)=>(a.height<15)-(b.height<15)||b.width*b.depth-a.width*a.depth);
  for(const item of ordered){
    let chosen=null;
    for(let i=0;i<layers.length;i++){
      if(Math.abs(layers[i].height-item.height)>CONFIG.eps)continue;
      const position=findFreePosition(pkg,item,i+1);
      if(position){chosen={...position,layer:i+1};break;}
    }
    if(!chosen){const layer=layers.length+1, rects=[{x:0,y:0,width:pkg.baseWidth,depth:pkg.baseDepth}];if(!place(item,rects,layer,0))return null;layers.push({height:item.height});continue;}
    if(chosen.rotated)[item.width,item.depth]=[item.depth,item.width];
    Object.assign(item,{x:chosen.x,y:chosen.y,layer:chosen.layer});
  }
  rebuildManualPackage(pkg);return pkg;
}
function packingCost(packages){return packages.reduce((sum,pkg)=>sum+pkg.baseWidth*pkg.baseDepth*pkg.innerHeight/1e6+pkg.fillers.length*.2,0)+packages.length*65;}
function optimizePackages(input,maxWeight){
  if(!Number.isFinite(maxWeight)||maxWeight<=0)throw new Error('Podaj dodatni limit wagi.');
  if(input.some(item=>item.suggested!=null)){
    const groups=new Map(),free=[];
    input.forEach(item=>{if(item.suggested==null)free.push(item);else {if(!groups.has(item.suggested))groups.set(item.suggested,[]);groups.get(item.suggested).push({...item,layer:0});}});
    const forced=[...groups].map(([id,items])=>{const pkg=compactLayout({id,items,maxWeight,locked:false});if(!pkg||packageWeights(pkg).total>maxWeight+CONFIG.eps)throw new Error(`Sugerowana paczka ${id} nie mieści się w obrysie lub limicie z opakowaniem.`);pkg.items.forEach(item=>item.pkgId=id);return pkg;});
    const remainder=free.length?optimizePackages(free,maxWeight):[];let next=1;
    remainder.forEach(pkg=>{while(groups.has(next))next++;pkg.id=next++;pkg.items.forEach(item=>item.pkgId=pkg.id);pkg.fillers.forEach(f=>f.pkgId=pkg.id);});return [...forced,...remainder];
  }
  const originals=input.map((item,index)=>({...item,_packingKey:index,layer:0}));
  const cache=new Map();
  const trial=items=>{
    if(!items.length)return null;
    const key=items.map(item=>item._packingKey).sort((a,b)=>a-b).join(',');
    if(cache.has(key))return cache.get(key);
    if(items.reduce((sum,item)=>sum+item.weight,0)>maxWeight){cache.set(key,null);return null;}
    const p=compactLayout({id:0,items:items.map(item=>({...item,layer:0})),maxWeight,locked:false});
    const best=p&&packageWeights(p).total<=maxWeight+CONFIG.eps?p:null;
    cache.set(key,best);return best;
  };
  let best=null;
  for(let variant=0;variant<6;variant++){
    const sorted=originals.slice().sort((a,b)=>{
      if(variant===1)return b.weight-a.weight;
      if(variant===2)return b.height-a.height||b.width*b.depth-a.width*a.depth;
      if(variant===3)return Math.max(b.width,b.depth)-Math.max(a.width,a.depth)||b.weight-a.weight;
      if(variant===4)return (a.height<15)-(b.height<15)||b.width*b.depth-a.width*a.depth;
      if(variant===5)return b.width*b.depth*b.height-a.width*a.depth*a.height;
      return b.width*b.depth-a.width*a.depth;
    });
    const packages=[];
    for(const item of sorted){
      let choice=null;
      for(let index=0;index<packages.length;index++){
        const group=packages[index];
        if(item.suggested!=null&&group.items.some(other=>other.suggested!=null&&other.suggested!==item.suggested))continue;
        const candidate=trial([...group.items,item]);if(!candidate)continue;
        const score=packingCost([candidate])-packingCost([group]);
        if(!choice||score<choice.score)choice={index,candidate,score};
      }
      const alone=trial([item]);
      if(!alone)throw new Error(`Element ${item.id} wraz z opakowaniem przekracza limit ${maxWeight} kg.`);
      if(choice&&choice.score<=packingCost([alone]))packages[choice.index]=choice.candidate;else packages.push(alone);
    }
    // Relocate individual parts when this reduces the complete package volume.
    for(let pass=0;pass<3;pass++){
      let improvement=null, current=packingCost(packages);
      for(let a=0;a<packages.length;a++)for(const item of packages[a].items){
        if(item.suggested!=null)continue;
        const remainder=trial(packages[a].items.filter(other=>other._packingKey!==item._packingKey));
        if(!remainder&&packages[a].items.length>1)continue;
        for(let b=0;b<packages.length;b++){
          if(a===b)continue;const target=trial([...packages[b].items,item]);if(!target)continue;
          const candidate=packages.filter((_,i)=>i!==a&&i!==b).concat(remainder?[remainder,target]:[target]);
          const cost=packingCost(candidate);if(cost<current-.001){current=cost;improvement=candidate;}
        }
      }
      if(!improvement)break;packages.splice(0,packages.length,...improvement);
    }
    if(!best||packingCost(packages)<packingCost(best))best=packages;
  }
  best.forEach((pkg,index)=>{pkg.id=index+1;pkg.items.forEach(item=>{item.pkgId=pkg.id;delete item._packingKey;});pkg.fillers.forEach(f=>f.pkgId=pkg.id);});return best;
}
