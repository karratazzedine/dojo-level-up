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
  ensureWorldMap(world);
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
