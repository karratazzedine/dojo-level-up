'use strict';
const worldBiomes = ['Bloesemvallei','Kristalkust','Drakenheuvel','Gouden duinen','IJsblauwe baai','Schemerbos'];
let selectedBuilding = 'tree';
let buildingMode = 'build';
let movingPiece = null;

function ensureWorld() {
  state.world ??= {regions:[{id:'home',name:'Mijn eerste eiland',biome:0,paid:0}],pieces:[],claims:[],legacy:[]};
  const world = state.world;
  // Previous collection purchases become reusable pieces on the first island.
  for (const id of state.owned || []) {
    if (world.legacy.includes(id)) continue;
    const index=decorations.findIndex(item=>item.id===id);
    if(index<0||index>=6)continue;
    const occupied=new Set(world.pieces.filter(piece=>piece.region==='home').map(piece=>piece.cell));
    const preferred=[8,10,13,21,25,27][index];
    const cell=!occupied.has(preferred)?preferred:Array.from({length:36},(_,i)=>i).find(i=>!occupied.has(i));
    world.pieces.push({id:'legacy-'+id,type:id,region:'home',cell:(state.hiddenDecorations||[]).includes(id)?null:cell??null,variant:0,paid:0});
    world.legacy.push(id);
  }
  if (!world.regions.some(region=>region.id===world.active))world.active=world.regions[0].id;
  return world;
}
function worldGoal() {
  const world=ensureWorld();
  const stage=world.claims.length;
  const round=Math.floor(stage/3)+1;
  const all=events();
  const goals=[
    {title:'Veelzijdige ontdekker',target:round*3,value:Math.min(...topics.map(topic=>all.filter(event=>!event.retry&&event.topic===topic).length)),
      description:`Probeer in elk vak ${round*3} opdrachten. Je oefent verschillende manieren van denken.`},
    {title:'Slimme oplosser',target:round*6,value:all.filter(event=>event.correct).length,
      description:`Beantwoord in totaal ${round*6} vragen goed. Hulp gebruiken mag.`},
    {title:'Leider van je leerplan',target:round*3,value:Object.values(state.days).reduce((sum,record)=>sum+(record.reflections?.length||0),0),
      description:`Kijk na ${round*3} missies terug op wat jou hielp.`}
  ];
  return {...goals[stage%3],id:'route-'+stage,number:stage+1,bonus:30};
}
function claimWorldGoal() {
  const world=ensureWorld();
  const goal=worldGoal();
  if(goal.value<goal.target||world.claims.includes(goal.id))return false;
  world.claims.push(goal.id);
  save();
  playSound('goal');
  return true;
}
function worldGoalMarkup() {
  const goal=worldGoal();
  return `<section class="world-goal"><div><p class="label">Ontdekkingsroute ${goal.number}</p><h2>${goal.title}</h2><p>${goal.description}</p></div><div><strong>${Math.min(goal.value,goal.target)} / ${goal.target}</strong><progress class="meter" value="${goal.value}" max="${goal.target}" aria-label="${goal.title}"></progress><button id="claim-route" class="primary" ${goal.value<goal.target?'disabled':''}>Ontvang 30 ◈</button></div></section>`;
}
function renderWorld(message='Kies een bouwstuk en tik op een lege bouwplek. Jij bent de ontwerper.') {
  const world=ensureWorld();
  const region=world.regions.find(item=>item.id===world.active);
  const account=wallet();
  const expansionCost=100+50*(world.regions.length-1);
  const pieces=world.pieces.filter(piece=>piece.region===region.id&&piece.cell!==null);
  const cells=Array.from({length:36},(_,cell)=>{
    const row=Math.floor(cell/6),column=cell%6;
    const left=50+(column-row)*6;
    const top=19+(column+row)*4.2;
    const piece=pieces.find(item=>item.cell===cell);
    const title=piece?decorations.find(item=>item.id===piece.type).name:'Lege bouwplek';
    return `<button class="plot ${piece?'occupied':''}" data-cell="${cell}" style="left:${left}%;top:${top}%" aria-label="Bouwplek ${cell+1}: ${title}">${piece?'':'+'}</button>${piece?`<span class="voxel-decor decor-${piece.type} world-piece variant-${piece.variant||0}" style="left:${left}%;top:${top+3}%" aria-hidden="true"></span>`:''}`;
  }).join('');
  screen.innerHTML=`<section class="island-heading"><div><p class="label">Jouw wereld groeit met je mee</p><h1>Wereldbouwer</h1></div><div class="coin-wallet"><strong>${account.balance} ◈</strong><span>bouwmunten</span></div></section>
    <div class="region-tabs" aria-label="Jouw eilanden">${world.regions.map(item=>`<button data-region="${item.id}" aria-pressed="${item.id===region.id}">${esc(item.name)}</button>`).join('')}</div>
    <div class="world-viewport"><div class="world-stage biome-${region.biome}"><img src="island.webp" alt="Een zwevend eiland met zelf gekozen bouwwerken">${cells}</div></div>
    <p class="island-message" id="island-message" role="status">${esc(message)}</p>
    <section class="world-toolbar"><label>Wat wil je doen? <select id="build-mode"><option value="build">Bouwen</option><option value="move">Verplaatsen</option><option value="paint">Kleur veranderen</option><option value="store">Opbergen</option></select></label>
    <label>Eilandnaam <input id="region-name" maxlength="28" value="${esc(region.name)}"></label><button id="rename-region">Naam bewaren</button></section>
    <section class="building-palette" aria-label="Bouwstukken">${decorations.map(item=>{
      const stored=world.pieces.filter(piece=>piece.type===item.id&&piece.cell===null&&!piece.gifted).length;
      return `<button data-building="${item.id}" aria-pressed="${selectedBuilding===item.id}"><span class="collection-icon sprite-item decor-${item.id}" aria-hidden="true"></span><strong>${item.name}</strong><small>${stored?stored+' op voorraad':item.cost+' ◈ per stuk'}</small></button>`;
    }).join('')}</section>
    <p class="muted">Bouw zoveel stukken als jij wilt. Opbergen bewaart een stuk voor later. Bij verplaatsen tik je eerst op het stuk en daarna op de bestemming.</p>
    <section class="card expansion"><h2>Ontdek je volgende eiland</h2><p>Nieuwe bouwgrond in ${worldBiomes[world.regions.length%worldBiomes.length]}. Elk eiland heeft 36 bouwplekken. Je kunt steeds een volgend eiland ontdekken.</p><button id="expand-world" class="primary" ${account.balance<expansionCost?'disabled':''}>Nieuw eiland · ${expansionCost} ◈</button></section>
    ${worldGoalMarkup()}
    <section class="build-rules"><span>🧩 Opdracht proberen <strong>+5</strong></span><span>🌱 Herkansing gelukt <strong>+2</strong></span><span>🧠 Missie terugkijken <strong>+10</strong></span></section>
    <p class="muted coin-info">Je hebt ${world.pieces.filter(piece=>!piece.gifted).length} ${world.pieces.filter(piece=>!piece.gifted).length===1?'eigen bouwstuk':'eigen bouwstukken'} en ${world.regions.length} ${world.regions.length===1?'eiland':'eilanden'}. Bouwmunten horen bij dit spel.</p>`;
  screen.querySelector('#build-mode').value=buildingMode;
  screen.querySelector('#build-mode').onchange=event=>{buildingMode=event.target.value;movingPiece=null;};
  screen.querySelectorAll('[data-region]').forEach(button=>button.onclick=()=>{
    world.active=button.dataset.region;movingPiece=null;save();renderWorld();
  });
  screen.querySelectorAll('[data-building]').forEach(button=>button.onclick=()=>{
    selectedBuilding=button.dataset.building;buildingMode='build';movingPiece=null;
    renderWorld(`Gekozen: ${decorations.find(item=>item.id===selectedBuilding).name}. Tik op een lege bouwplek.`);
  });
  screen.querySelectorAll('[data-cell]').forEach(button=>button.onclick=()=>editWorldCell(Number(button.dataset.cell)));
  screen.querySelector('#rename-region').onclick=()=>{
    region.name=screen.querySelector('#region-name').value.trim()||'Mijn eiland';
    save();renderWorld('Jouw eiland heeft een eigen naam.');
  };
  screen.querySelector('#expand-world').onclick=()=>{
    if(wallet().balance<expansionCost)return;
    const index=world.regions.length;
    const next={id:crypto.randomUUID(),name:worldBiomes[index%worldBiomes.length]+' '+(index+1),biome:index%worldBiomes.length,paid:expansionCost};
    world.regions.push(next);world.active=next.id;save();playSound('goal');
    renderWorld('Nieuw eiland ontdekt! Hier begint jouw volgende bouwplan.');
  };
  screen.querySelector('#claim-route').onclick=()=>{
    if(claimWorldGoal())renderWorld('30 bouwmunten verdiend. Je volgende ontdekkingsroute staat al klaar.');
  };
}
function editWorldCell(cell) {
  const world=ensureWorld();
  const piece=world.pieces.find(item=>item.region===world.active&&item.cell===cell);
  if(buildingMode==='move') {
    if(!movingPiece){
      if(!piece)return;
      movingPiece=piece.id;
      screen.querySelector('#island-message').textContent='Stuk gekozen. Tik op de nieuwe bouwplek.';
      return;
    }
    const selected=world.pieces.find(item=>item.id===movingPiece);
    if(piece)piece.cell=selected.cell;
    selected.cell=cell;movingPiece=null;
  } else if(buildingMode==='paint') {
    if(!piece)return;
    piece.variant=((piece.variant||0)+1)%4;
  } else if(buildingMode==='store') {
    if(!piece)return;
    piece.cell=null;
  } else {
    if(piece) {
      buildingMode='move';movingPiece=piece.id;
      screen.querySelector('#build-mode').value='move';
      screen.querySelector('#island-message').textContent='Stuk opgepakt. Tik op de nieuwe bouwplek om het te verplaatsen.';
      return;
    }
    const stored=world.pieces.find(item=>item.type===selectedBuilding&&item.cell===null&&!item.gifted);
    if(stored){stored.region=world.active;stored.cell=cell;}
    else {
      const price=decorations.find(item=>item.id===selectedBuilding).cost;
      if(wallet().balance<price){
        screen.querySelector('#island-message').textContent=`Voor dit stuk heb je ${price} bouwmunten nodig. Je volgende oefenmissie helpt je verder.`;
        return;
      }
      world.pieces.push({id:crypto.randomUUID(),type:selectedBuilding,region:world.active,cell,variant:0,paid:price});
    }
  }
  save();playSound('build');renderWorld('Bouwplan uitgevoerd. Maak er helemaal jouw eigen plek van.');
}
