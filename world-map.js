'use strict';
const continuousWorldBackupKey='dojo-level-up-before-continuous-world-v1';
const groundPrice=5;
const stackPrice=2;
const tileWidth=72;
const tileHeight=36;
const blockDepth=12;
const materials={grass:'Gras',stone:'Steen',brick:'Baksteen',sand:'Zand',water:'Water',path:'Pad'};
const worldCamera={zoom:null,focus:null};
let selectedMaterial='grass';
let worldResizeObserver=null;
let worldPresentation='classic';

function tileKey(x,y) { return x+','+y; }
function legacyChunk(index) {
  let x=0,y=0,dx=1,dy=0,segment=1,travelled=0,turns=0;
  for(let step=0;step<index;step++){
    x+=dx;y+=dy;travelled++;
    if(travelled===segment){
      travelled=0;[dx,dy]=[-dy,dx];turns++;
      if(turns%2===0)segment++;
    }
  }
  return {x:x*6,y:y*6};
}
function ensureWorldMap(world) {
  if(!world.grid){
    try {
      if(!localStorage.getItem(continuousWorldBackupKey)){
        localStorage.setItem(continuousWorldBackupKey,JSON.stringify({createdAt:new Date().toISOString(),state}));
      }
    } catch {}
    world.grid={version:1,name:world.regions[0]?.name||'Mijn wereld',land:{},origins:{},blockPurchases:[],looseBlocks:[],zoom:null};
  }
  const grid=world.grid;
  for(const region of world.regions){
    if(grid.origins[region.id])continue;
    let index=0,origin;
    do {
      origin=legacyChunk(index++);
    } while(Array.from({length:36},(_,i)=>tileKey(origin.x+i%6,origin.y+Math.floor(i/6))).some(key=>grid.land[key]));
    grid.origins[region.id]=origin;
    for(let cell=0;cell<36;cell++){
      const x=origin.x+cell%6,y=origin.y+Math.floor(cell/6);
      grid.land[tileKey(x,y)]={x,y,material:'grass',stack:[],paid:0,sourceRegion:region.id};
    }
  }
}
function placedPosition(world,piece) {
  if(piece.gifted||piece.cell===null)return null;
  if(Number.isInteger(piece.position?.x)&&Number.isInteger(piece.position?.y))return piece.position;
  const origin=world.grid.origins[piece.region];
  if(!origin||!Number.isInteger(piece.cell))return null;
  return {x:origin.x+piece.cell%6,y:origin.y+Math.floor(piece.cell/6)};
}
function mapFrontier(grid) {
  const frontier=new Map();
  for(const tile of Object.values(grid.land)){
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const x=tile.x+dx,y=tile.y+dy,key=tileKey(x,y);
      if(!grid.land[key])frontier.set(key,{x,y});
    }
  }
  return [...frontier.values()];
}
function projectTile(x,y) { return {x:(x-y)*tileWidth/2,y:(x+y)*tileHeight/2}; }
function mapLayout(grid) {
  const tiles=[...Object.values(grid.land),...mapFrontier(grid)];
  const projected=tiles.map(tile=>projectTile(tile.x,tile.y));
  const minX=Math.min(...projected.map(point=>point.x))-100;
  const minY=Math.min(...projected.map(point=>point.y))-220;
  const maxX=Math.max(...projected.map(point=>point.x))+100;
  const maxY=Math.max(...projected.map(point=>point.y))+100;
  return {offsetX:-minX,offsetY:-minY,width:maxX-minX,height:maxY-minY};
}
function worldMapMarkup(world,layout) {
  const pieces=new Map();
  for(const piece of world.pieces){
    const position=placedPosition(world,piece);
    if(position)pieces.set(tileKey(position.x,position.y),piece);
  }
  const tiles=Object.values(world.grid.land).sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x);
  const minDepth=Math.min(...tiles.map(tile=>tile.x+tile.y));
  const land=tiles.map(tile=>{
    const projected=projectTile(tile.x,tile.y);
    const piece=pieces.get(tileKey(tile.x,tile.y));
    const name=piece?decorations.find(item=>item.id===piece.type)?.name:'Lege bouwplek';
    const levels=[tile.material,...tile.stack.map(block=>block.material)];
    const height=tile.stack.length*blockDepth;
    return `<div class="land-cell" style="left:${projected.x+layout.offsetX-tileWidth/2}px;top:${projected.y+layout.offsetY}px;z-index:${(tile.x+tile.y-minDepth)*10+10}">
      ${levels.map((material,level)=>`<span class="block-voxel material-${material}" style="top:${-level*blockDepth}px" aria-hidden="true"><i></i><b></b><em></em></span>`).join('')}
      ${piece?`<button class="voxel-decor decor-${piece.type} map-piece variant-${piece.variant||0}" data-map-tile="${tile.x},${tile.y}" style="top:${tileHeight/2-height+8}px" aria-label="Bouwstuk ${name} bij ${tile.x}, ${tile.y}"></button>`:''}
      <button class="land-hit" data-map-tile="${tile.x},${tile.y}" style="top:${-height}px" aria-label="Bouwplek ${tile.x}, ${tile.y}: ${name}; ${materials[levels.at(-1)]}; ${levels.length} ${levels.length===1?'blok':'blokken'} hoog"></button></div>`;
  }).join('');
  const frontier=mapFrontier(world.grid).map(tile=>{
    const point=projectTile(tile.x,tile.y);
    return `<button class="frontier-tile" data-new-land="${tile.x},${tile.y}" style="left:${point.x+layout.offsetX-tileWidth/2}px;top:${point.y+layout.offsetY}px" aria-label="Grondblok toevoegen bij ${tile.x}, ${tile.y} voor ${groundPrice} bouwmunten"><span>＋</span></button>`;
  }).join('');
  return land+frontier;
}
function captureWorldCamera() {
  const viewport=screen.querySelector('#map-viewport');
  if(!viewport)return;
  const zoom=worldCamera.zoom||1;
  worldCamera.focus={
    x:(viewport.scrollLeft+viewport.clientWidth/2-Number(viewport.dataset.padX||0))/zoom-Number(viewport.dataset.offsetX),
    y:(viewport.scrollTop+viewport.clientHeight/2-Number(viewport.dataset.padY||0))/zoom-Number(viewport.dataset.offsetY)
  };
}
function renderWorld(message='Tik op een plusblokje aan de rand om je wereld groter te maken.') {
  if(worldPresentation==='classic')return renderClassicWorld(message);
  return renderBuildMap(message);
}
function renderBuildMap(message) {
  captureWorldCamera();
  const world=ensureWorld(),grid=world.grid,account=wallet(),layout=mapLayout(grid);
  const landCount=Object.keys(grid.land).length;
  screen.innerHTML=`<section class="island-heading"><div><p class="label">Bouw verder aan jouw eigen plek</p><h1>${esc(grid.name)}</h1></div><div class="coin-wallet"><strong>${account.balance} ◈</strong><span>bouwmunten</span></div></section>
    <div class="world-view-actions"><button id="back-classic">Terug naar mijn vertrouwde wereld</button><button id="back-learning">Verder leren</button></div>
    <div class="map-controls" aria-label="Wereld bekijken"><button id="zoom-out" aria-label="Uitzoomen">−</button><strong id="zoom-label">100%</strong><button id="zoom-in" aria-label="Inzoomen">＋</button><button id="zoom-fit">Hele wereld</button><span>Sleep om rond te kijken · twee vingers om te zoomen</span></div>
    <div id="map-viewport" class="block-world-viewport" tabindex="0" aria-label="Jouw uitbreidbare bouwwereld" data-offset-x="${layout.offsetX}" data-offset-y="${layout.offsetY}">
      <div id="map-size"><div id="map-scene" class="block-world-scene" style="width:${layout.width}px;height:${layout.height}px">${worldMapMarkup(world,layout)}</div></div></div>
    <p class="island-message" id="island-message" role="status">${esc(message)}</p>
    <section class="world-toolbar"><label>Wat wil je doen? <select id="build-mode">
      <option value="build">Bouwstuk plaatsen</option><option value="move">Bouwstuk verplaatsen</option><option value="paint">Bouwstuk andere kleur</option><option value="store">Bouwstuk opbergen</option>
      <option value="terrain">Grond een kleur geven</option><option value="stack">Blok stapelen · ${stackPrice} ◈</option><option value="unstack">Bovenste blok opbergen</option></select></label>
      <label>Soort blok <select id="ground-material">${Object.entries(materials).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
      <label>Naam van je wereld <input id="world-name" maxlength="28" value="${esc(grid.name)}"></label><button id="rename-world">Naam bewaren</button></section>
    <section class="building-palette" aria-label="Bouwstukken">${decorations.map(item=>{
      const stored=world.pieces.filter(piece=>piece.type===item.id&&piece.cell===null&&!piece.gifted).length;
      return `<button data-building="${item.id}" aria-pressed="${selectedBuilding===item.id}"><span class="collection-icon sprite-item decor-${item.id}" aria-hidden="true"></span><strong>${item.name}</strong><small>${stored?stored+' op voorraad':item.cost+' ◈ per stuk'}</small></button>`;
    }).join('')}</section>
    <p class="muted map-help">Grond erbij? Tik op ＋ aan de rand · ${groundPrice} ◈ per grondblok. Je kunt tot 6 extra blokken stapelen. Opgeborgen blokken gebruik je opnieuw. Tik op een gebouwd stuk en daarna op een andere plek om het te verplaatsen.</p>
    ${world.regions.length>1?`<details class="old-neighbourhoods"><summary>Ga naar een bestaand gebied in je wereld</summary><div class="region-tabs">${world.regions.map(region=>`<button data-neighbourhood="${region.id}">${esc(region.name)}</button>`).join('')}</div></details>`:''}
    ${worldGoalMarkup()}
    <p class="muted coin-info">${landCount} grondblokjes · ${world.pieces.filter(piece=>!piece.gifted).length} eigen bouwstukken · ${grid.looseBlocks.length} losse blokken op voorraad.</p>`;
  screen.querySelector('#build-mode').value=buildingMode;
  screen.querySelector('#back-classic').onclick=()=>{captureWorldCamera();worldPresentation='classic';renderWorld('Je kijkt weer van dichtbij naar jouw eigen plek.');};
  screen.querySelector('#back-learning').onclick=()=>show('home');
  screen.querySelector('#build-mode').onchange=event=>{buildingMode=event.target.value;movingPiece=null;};
  screen.querySelector('#ground-material').value=selectedMaterial;
  screen.querySelector('#ground-material').onchange=event=>{selectedMaterial=event.target.value;};
  screen.querySelector('#rename-world').onclick=()=>{
    grid.name=screen.querySelector('#world-name').value.trim()||'Mijn wereld';save();renderWorld('Jouw wereld heeft een eigen naam.');
  };
  screen.querySelectorAll('[data-building]').forEach(button=>button.onclick=()=>{
    selectedBuilding=button.dataset.building;buildingMode='build';movingPiece=null;
    renderWorld(`Gekozen: ${decorations.find(item=>item.id===selectedBuilding).name}. Tik op een lege bouwplek.`);
  });
  screen.querySelectorAll('[data-map-tile]').forEach(button=>button.onclick=()=>{
    if(Date.now()<Number(screen.querySelector('#map-viewport').dataset.suppressClick||0))return;
    editWorldTile(...button.dataset.mapTile.split(',').map(Number));
  });
  screen.querySelectorAll('[data-new-land]').forEach(button=>button.onclick=()=>{
    if(Date.now()<Number(screen.querySelector('#map-viewport').dataset.suppressClick||0))return;
    addWorldGround(...button.dataset.newLand.split(',').map(Number));
  });
  screen.querySelector('#claim-route').onclick=()=>{if(claimWorldGoal())renderWorld('30 bouwmunten verdiend. Jouw volgende ontdekkingsroute staat klaar.');};
  bindWorldCamera(world,layout);
  screen.querySelectorAll('[data-neighbourhood]').forEach(button=>button.onclick=()=>{
    const origin=grid.origins[button.dataset.neighbourhood];
    const point=projectTile(origin.x+2.5,origin.y+2.5);
    centerWorldAt(point,layout);
  });
}
function addWorldGround(x,y) {
  const world=ensureWorld(),grid=world.grid,key=tileKey(x,y);
  if(!Number.isInteger(x)||!Number.isInteger(y)||grid.land[key])return false;
  const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>grid.land[tileKey(x+dx,y+dy)]);
  if(!adjacent)return false;
  if(wallet().balance<groundPrice){
    screen.querySelector('#island-message').textContent=`Voor een grondblok heb je ${groundPrice} bouwmunten nodig.`;return false;
  }
  grid.land[key]={x,y,material:selectedMaterial,stack:[],paid:groundPrice};
  save();playSound('build');renderWorld('Je wereld is een grondblok groter. Hier kun je meteen verder bouwen.');return true;
}
function editWorldTile(x,y) {
  const world=ensureWorld(),grid=world.grid,tile=grid.land[tileKey(x,y)];
  if(!tile)return false;
  const piece=world.pieces.find(item=>{const p=placedPosition(world,item);return p?.x===x&&p?.y===y;});
  if(buildingMode==='move'){
    if(!movingPiece){
      if(!piece)return false;movingPiece=piece.id;
      screen.querySelector('#island-message').textContent='Stuk gekozen. Tik op de nieuwe bouwplek.';return true;
    }
    const selected=world.pieces.find(item=>item.id===movingPiece&&!item.gifted);
    if(!selected){movingPiece=null;return false;}
    const before=placedPosition(world,selected);
    if(piece)piece.position={...before};
    selected.position={x,y};movingPiece=null;
  } else if(buildingMode==='paint'){
    if(!piece)return false;piece.variant=((piece.variant||0)+1)%4;
  } else if(buildingMode==='store'){
    if(!piece)return false;piece.cell=null;
  } else if(buildingMode==='terrain'){
    if(tile.stack.length)tile.stack.at(-1).material=selectedMaterial;
    else tile.material=selectedMaterial;
  } else if(buildingMode==='stack'){
    if(tile.stack.length>=6){screen.querySelector('#island-message').textContent='Dit torentje heeft al zes extra blokken. Kies een andere plek.';return false;}
    const index=grid.looseBlocks.findIndex(block=>block.material===selectedMaterial);
    let block;
    if(index>=0)block=grid.looseBlocks.splice(index,1)[0];
    else {
      if(wallet().balance<stackPrice){screen.querySelector('#island-message').textContent='Voor een nieuw stapelblok heb je 2 bouwmunten nodig.';return false;}
      block={id:crypto.randomUUID(),material:selectedMaterial};
      grid.blockPurchases.push({id:block.id,paid:stackPrice});
    }
    tile.stack.push(block);
  } else if(buildingMode==='unstack'){
    if(!tile.stack.length)return false;
    grid.looseBlocks.push(tile.stack.pop());
  } else {
    if(piece){
      movingPiece=piece.id;buildingMode='move';screen.querySelector('#build-mode').value='move';
      screen.querySelector('#island-message').textContent='Stuk opgepakt. Tik op de nieuwe bouwplek.';return true;
    }
    const stored=world.pieces.find(item=>item.type===selectedBuilding&&item.cell===null&&!item.gifted);
    if(stored){stored.position={x,y};stored.cell=0;}
    else {
      const price=decorations.find(item=>item.id===selectedBuilding).cost;
      if(wallet().balance<price){screen.querySelector('#island-message').textContent=`Voor dit bouwstuk heb je ${price} bouwmunten nodig.`;return false;}
      world.pieces.push({id:crypto.randomUUID(),type:selectedBuilding,region:world.regions[0].id,cell:0,position:{x,y},variant:0,paid:price});
    }
  }
  save();playSound('build');renderWorld('Bouwplan uitgevoerd. Jouw wereld groeit met je mee.');return true;
}
function centerWorldAt(point,layout) {
  const viewport=screen.querySelector('#map-viewport'),zoom=worldCamera.zoom;
  viewport.scrollLeft=(point.x+layout.offsetX)*zoom+Number(viewport.dataset.padX||0)-viewport.clientWidth/2;
  viewport.scrollTop=(point.y+layout.offsetY)*zoom+Number(viewport.dataset.padY||0)-viewport.clientHeight/2;
  captureWorldCamera();
}
function bindWorldCamera(world,layout) {
  if(worldResizeObserver)worldResizeObserver.disconnect();
  const viewport=screen.querySelector('#map-viewport'),size=screen.querySelector('#map-size'),scene=screen.querySelector('#map-scene');
  function setZoom(zoom,anchor,remember=true) {
    const oldZoom=worldCamera.zoom||1;
    const center=anchor||{x:viewport.clientWidth/2,y:viewport.clientHeight/2};
    const raw={x:(viewport.scrollLeft+center.x-Number(viewport.dataset.padX||0))/oldZoom,y:(viewport.scrollTop+center.y-Number(viewport.dataset.padY||0))/oldZoom};
    worldCamera.zoom=Math.max(.2,Math.min(2.4,zoom));
    scene.style.transform=`scale(${worldCamera.zoom})`;
    const padX=Math.max(0,(viewport.clientWidth-layout.width*worldCamera.zoom)/2);
    const padY=Math.max(0,(viewport.clientHeight-layout.height*worldCamera.zoom)/2);
    viewport.dataset.padX=padX;viewport.dataset.padY=padY;
    scene.style.left=padX+'px';scene.style.top=padY+'px';
    size.style.width=Math.max(viewport.clientWidth,layout.width*worldCamera.zoom)+'px';
    size.style.height=Math.max(viewport.clientHeight,layout.height*worldCamera.zoom)+'px';
    viewport.scrollLeft=raw.x*worldCamera.zoom+padX-center.x;
    viewport.scrollTop=raw.y*worldCamera.zoom+padY-center.y;
    captureWorldCamera();
    screen.querySelector('#zoom-label').textContent=Math.round(worldCamera.zoom*100)+'%';
    if(remember){world.grid.zoom=worldCamera.zoom;save();}
  }
  function fit() {
    const zoom=Math.min(1.4,(viewport.clientWidth-28)/layout.width,(viewport.clientHeight-28)/layout.height);
    setZoom(zoom,null);
    centerWorldAt({x:layout.width/2-layout.offsetX,y:layout.height/2-layout.offsetY},layout);
  }
  screen.querySelector('#zoom-out').onclick=()=>setZoom(worldCamera.zoom/1.25);
  screen.querySelector('#zoom-in').onclick=()=>setZoom(worldCamera.zoom*1.25);
  screen.querySelector('#zoom-fit').onclick=fit;
  requestAnimationFrame(()=>{
    const focus=worldCamera.focus;
    if(worldCamera.zoom||world.grid.zoom){
      setZoom(worldCamera.zoom||world.grid.zoom,null,false);
      centerWorldAt(focus||{x:layout.width/2-layout.offsetX,y:layout.height/2-layout.offsetY},layout);
    } else fit();
  });
  if(typeof ResizeObserver!=='undefined'){
    let width=viewport.clientWidth,height=viewport.clientHeight;
    worldResizeObserver=new ResizeObserver(()=>{
      if(!viewport.isConnected){worldResizeObserver.disconnect();return;}
      if(width===viewport.clientWidth&&height===viewport.clientHeight)return;
      width=viewport.clientWidth;height=viewport.clientHeight;
      const focus=worldCamera.focus;
      setZoom(worldCamera.zoom,null,false);
      if(focus)centerWorldAt(focus,layout);
    });
    worldResizeObserver.observe(viewport);
  }
  const pointers=new Map();
  let dragStart=null,pinchStart=null,dragging=false;
  const localPoint=event=>{
    const rect=viewport.getBoundingClientRect();
    return {x:event.clientX-rect.left,y:event.clientY-rect.top};
  };
  viewport.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    pointers.set(event.pointerId,localPoint(event));
    dragStart={point:localPoint(event),left:viewport.scrollLeft,top:viewport.scrollTop};
    if(pointers.size===2){
      const [a,b]=[...pointers.values()];
      pinchStart={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:worldCamera.zoom};
      viewport.dataset.suppressClick=Date.now()+1000;
    }
  });
  viewport.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId))return;
    const point=localPoint(event);pointers.set(event.pointerId,point);
    if(pointers.size===2&&pinchStart){
      const [a,b]=[...pointers.values()];
      const distance=Math.hypot(a.x-b.x,a.y-b.y);
      if(pinchStart.distance>0)setZoom(pinchStart.zoom*distance/pinchStart.distance,{x:(a.x+b.x)/2,y:(a.y+b.y)/2},false);
      viewport.dataset.suppressClick=Date.now()+500;
    } else if(pointers.size===1&&dragStart){
      const dx=point.x-dragStart.point.x,dy=point.y-dragStart.point.y;
      if(Math.hypot(dx,dy)>6)dragging=true;
      if(dragging){
        if(!viewport.hasPointerCapture(event.pointerId))viewport.setPointerCapture(event.pointerId);
        viewport.scrollLeft=dragStart.left-dx;viewport.scrollTop=dragStart.top-dy;
        viewport.dataset.suppressClick=Date.now()+500;
      }
    }
  });
  function finishPointer(event){
    if(!pointers.has(event.pointerId))return;
    const hadPinch=Boolean(pinchStart);
    pointers.delete(event.pointerId);
    if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
    if(dragging||hadPinch){world.grid.zoom=worldCamera.zoom;save();captureWorldCamera();}
    pinchStart=null;dragging=false;
    dragStart=pointers.size?{point:[...pointers.values()][0],left:viewport.scrollLeft,top:viewport.scrollTop}:null;
  }
  viewport.addEventListener('pointerup',finishPointer);
  viewport.addEventListener('pointercancel',finishPointer);
  viewport.addEventListener('wheel',event=>{
    if(!event.ctrlKey&&!event.metaKey)return;
    event.preventDefault();
    setZoom(worldCamera.zoom*Math.exp(-event.deltaY*.01),localPoint(event));
  },{passive:false});
}

// The original large island is the default view of the same saved world.
// Every edit uses the shared grid and object records, including additions made on the map.
function renderClassicWorld(message) {
  captureWorldCamera();
  if(worldResizeObserver)worldResizeObserver.disconnect();
  const world=ensureWorld(),grid=world.grid;
  const region=world.regions.find(item=>item.id===world.active)||world.regions[0];
  const origin=grid.origins[region.id];
  const pieces=new Map(world.pieces.map(piece=>[placedPosition(world,piece),piece]).filter(([position])=>position).map(([position,piece])=>[tileKey(position.x,position.y),piece]));
  const cells=Array.from({length:36},(_,cell)=>{
    const row=Math.floor(cell/6),column=cell%6,x=origin.x+column,y=origin.y+row,tile=grid.land[tileKey(x,y)];
    const piece=pieces.get(tileKey(x,y)),item=decorations.find(item=>item.id===piece?.type);
    const left=50+(column-row)*6,top=19+(column+row)*4.2;
    const lift=tile.stack.length*1.1;
    const surface=tile.stack.at(-1)?.material||tile.material;
    return `${surface!=='grass'||tile.stack.length?`<span class="classic-ground material-${surface}" style="left:${left}%;top:${top-lift}%" aria-hidden="true"></span>`:''}
      <button class="plot ${piece?'occupied':''}" data-classic-tile="${x},${y}" style="left:${left}%;top:${top-lift}%" aria-label="Bouwplek ${cell+1}: ${item?.name||'Lege bouwplek'}">${piece?'':tile.stack.length?tile.stack.length+1:'+'}</button>
      ${piece?`<span class="voxel-decor decor-${piece.type} world-piece variant-${piece.variant||0}" style="left:${left}%;top:${top+3-lift}%" aria-hidden="true"></span>`:''}`;
  }).join('');
  const additions=Object.values(grid.land).filter(tile=>!tile.sourceRegion).length;
  screen.innerHTML=`<section class="island-heading"><div><p class="label">Jouw vertrouwde plek · kijk van dichtbij</p><h1>${esc(grid.name)}</h1></div><div class="coin-wallet"><strong>${wallet().balance} ◈</strong><span>bouwmunten</span></div></section>
    <div class="world-view-actions"><button class="primary" id="back-learning">Verder leren</button><button id="extend-classic">Verder bouwen · grond erbij</button></div>
    ${world.regions.length>1?`<nav class="region-tabs" aria-label="Gebieden van dezelfde wereld">${world.regions.map(item=>`<button data-classic-region="${item.id}" aria-pressed="${item.id===region.id}">${esc(item.name)}</button>`).join('')}</nav>`:''}
    <div class="world-viewport"><div class="world-stage biome-${region.biome}"><img src="island.webp" alt="Jouw grote, vertrouwde eiland met ruimte voor eigen bouwwerken">${cells}</div></div>
    <p class="island-message" id="island-message" role="status">${esc(message?.startsWith('Tik op een plusblokje')?'Kies een bouwstuk en tik op een lege plek. Wil je meer ruimte? Kies Verder bouwen.':message)}</p>
    <section class="world-toolbar"><label>Wat wil je doen? <select id="build-mode"><option value="build">Bouwstuk plaatsen</option><option value="move">Bouwstuk verplaatsen</option><option value="paint">Bouwstuk andere kleur</option><option value="store">Bouwstuk opbergen</option><option value="terrain">Grond een kleur geven</option><option value="stack">Blok stapelen · 2 ◈</option><option value="unstack">Bovenste blok opbergen</option></select></label>
      <label>Soort blok <select id="ground-material">${Object.entries(materials).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><label>Naam van je wereld <input id="world-name" maxlength="28" value="${esc(grid.name)}"></label><button id="rename-world">Naam bewaren</button></section>
    <section class="building-palette" aria-label="Bouwstukken">${decorations.map(item=>{
      const stored=world.pieces.filter(piece=>piece.type===item.id&&piece.cell===null&&!piece.gifted).length;
      return `<button data-building="${item.id}" aria-pressed="${selectedBuilding===item.id}"><span class="collection-icon sprite-item decor-${item.id}" aria-hidden="true"></span><strong>${item.name}</strong><small>${stored?stored+' op voorraad':item.cost+' ◈ per stuk'}</small></button>`;
    }).join('')}</section>
    <p class="muted map-help">Je kijkt naar een deel van jouw wereld. ${additions?`Je hebt al ${additions} ${additions===1?'grondblokje':'grondblokjes'} aangebouwd. `:''}Via Verder bouwen zie je ook alle uitbreidingen. Alles hoort bij dezelfde wereld en blijft bewaard.</p>`;
  screen.querySelector('#back-learning').onclick=()=>show('home');
  screen.querySelector('#extend-classic').onclick=()=>{
    worldPresentation='map';worldCamera.zoom=1.2;worldCamera.focus=projectTile(origin.x+2.5,origin.y+2.5);
    renderWorld('Bouw hier verder aan dezelfde wereld. Tik op een plusblokje aan de rand voor extra grond.');
  };
  screen.querySelectorAll('[data-classic-region]').forEach(button=>button.onclick=()=>{world.active=button.dataset.classicRegion;movingPiece=null;save();renderWorld();});
  screen.querySelector('#build-mode').value=buildingMode;
  screen.querySelector('#build-mode').onchange=event=>{buildingMode=event.target.value;movingPiece=null;};
  screen.querySelector('#ground-material').value=selectedMaterial;
  screen.querySelector('#ground-material').onchange=event=>{selectedMaterial=event.target.value;};
  screen.querySelector('#rename-world').onclick=()=>{grid.name=screen.querySelector('#world-name').value.trim()||'Mijn wereld';save();renderWorld('Jouw wereld heeft een eigen naam.');};
  screen.querySelectorAll('[data-classic-tile]').forEach(button=>button.onclick=()=>editWorldTile(...button.dataset.classicTile.split(',').map(Number)));
  screen.querySelectorAll('[data-building]').forEach(button=>button.onclick=()=>{selectedBuilding=button.dataset.building;buildingMode='build';movingPiece=null;renderWorld('Bouwstuk gekozen. Tik op een lege plek.');});
}
