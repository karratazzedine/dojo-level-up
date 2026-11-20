'use strict';
const helpMissions=[
  {id:'help-home',icon:'🏡',title:'Helpende handen',task:'Vraag thuis welke kleine taak helpt. Help ongeveer vijf minuten mee.'},
  {id:'include',icon:'🤝',title:'Iedereen doet mee',task:'Vraag iemand of die bij een spel of activiteit wil meedoen. Luister ook naar het antwoord.'},
  {id:'explain',icon:'💡',title:'Samen slim',task:'Vraag of iemand hulp wil bij iets dat jij kunt. Laat één stap zien en geef de ander de tijd om zelf te proberen.'},
  {id:'thank',icon:'💌',title:'Een echt bedankje',task:'Maak een kaartje of vertel iemand precies welke hulp je fijn vond.'},
  {id:'care',icon:'🌱',title:'Zorgen voor je omgeving',task:'Kies thuis samen een plant of een gedeelde plek die verzorging nodig heeft. Spreek af wat jij kunt doen.'},
  {id:'reuse',icon:'🧸',title:'Een tweede avontuur',task:'Kijk met een volwassene welk speelgoed of boek een ander blij kan maken. Beslis samen wat je wilt doorgeven.'}
];
function kindnessRecords() { return state.kindness || []; }
function addKindness(record) {
  const entry={id:crypto.randomUUID(),date:dateKey(),...record};
  (state.kindness??=[]).push(entry);
  const unlocked=awardKindnessGifts();
  save();playSound('kindness');
  return unlocked;
}
function awardKindnessGifts() {
  const world=ensureWorld();
  const claimed=world.helpRewards??=[];
  const helps=kindnessRecords().filter(record=>record.kind==='help');
  const targets=[
    {id:'first-help',type:'birdhouse',met:helps.length>=1},
    {id:'three-ways',type:'bench',met:new Set(helps.map(record=>record.action)).size>=3},
    {id:'five-days',type:'fountain',met:new Set(helps.map(record=>record.date)).size>=5}
  ];
  const names=[];
  for(const target of targets){
    if(!target.met||claimed.includes(target.id))continue;
    claimed.push(target.id);
    world.pieces.push({id:'help-'+target.id,type:target.type,region:world.active,cell:null,variant:1,paid:0});
    names.push(decorations.find(item=>item.id===target.type).name);
  }
  return names;
}
function donateCoins(amount) {
  if(![5,10,20].includes(amount)||wallet().balance<amount)return false;
  addKindness({kind:'coins',amount});
  return true;
}
function giveBuilding(id) {
  const piece=ensureWorld().pieces.find(item=>item.id===id&&!item.gifted);
  if(!piece)return false;
  piece.gifted=true;piece.region='community';piece.cell=null;
  addKindness({kind:'gift',piece:piece.id,type:piece.type,amount:0});
  return true;
}
function logHelp(action,reflection) {
  if(!helpMissions.some(mission=>mission.id===action)||reflection.trim().length<8)return false;
  if(kindnessRecords().some(record=>record.kind==='help'&&record.action===action&&record.date===dateKey()))return false;
  return addKindness({kind:'help',action,reflection:reflection.trim().slice(0,180),amount:0});
}
function kindnessView(message='Jij kiest wat je wilt delen: tijd, aandacht, spullen of bouwmunten.') {
  const records=kindnessRecords();
  const helps=records.filter(record=>record.kind==='help');
  const coins=records.reduce((sum,record)=>sum+(record.amount||0),0);
  const gifts=records.filter(record=>record.kind==='gift');
  const growth=helps.length*2+gifts.length*2+Math.floor(coins/5);
  const gardenNumber=Math.floor(growth/12)+1;
  const gardenGrowth=growth%12;
  const world=ensureWorld();
  const available=world.pieces.filter(piece=>!piece.gifted);
  const completedToday=new Set(helps.filter(record=>record.date===dateKey()).map(record=>record.action));
  const scenePieces=gifts.slice(-5).map(record=>record.type);
  while(scenePieces.length<Math.min(6,Math.floor(gardenGrowth/2)))scenePieces.push('tree');
  const slots=[[28,39],[55,34],[72,44],[42,52],[61,57],[45,38]];
  screen.innerHTML=`<section class="island-heading"><div><p class="label">Samen maken we ruimte voor anderen</p><h1>Samen goed doen</h1></div><div class="coin-wallet"><strong>${wallet().balance} ◈</strong><span>jouw bouwmunten</span></div></section>
    <section class="community-garden"><img src="island.webp" alt="Een gezamenlijke tuin die groeit door bijdragen">
      ${scenePieces.map((type,i)=>`<span class="voxel-decor decor-${type} world-piece" style="left:${slots[i][0]}%;top:${slots[i][1]}%" aria-hidden="true"></span>`).join('')}
      <div class="community-caption"><h2>Zorgtuin ${gardenNumber}</h2><p>${growth} groeiharten door samen te helpen en te delen.</p><progress class="meter" max="12" value="${gardenGrowth}" aria-label="Groei van de gezamenlijke tuin"></progress></div>
    </section>
    <p id="kindness-status" class="island-message" role="status">${esc(message)}</p>
    <div class="kindness-options">
      <section class="card"><h2>Deel bouwmunten</h2><p>Met je spelmunten groeit de gezamenlijke tuin. Je kiest zelf wat je wilt bijdragen.</p><div class="answer-actions">${[5,10,20].map(amount=>`<button data-give-coins="${amount}" ${wallet().balance<amount?'disabled':''}>Geef ${amount} ◈</button>`).join('')}</div></section>
      <section class="card"><h2>Geef een bouwstuk</h2><p>Kies een stuk dat je naar de gezamenlijke tuin wilt brengen.</p><label>Bouwstuk <select id="gift-building"><option value="">Kies zelf een stuk</option>${available.map((piece,i)=>`<option value="${piece.id}">${decorations.find(item=>item.id===piece.type).name} · stuk ${i+1}</option>`).join('')}</select></label><button id="give-building" disabled>Breng naar de zorgtuin</button></section>
    </div>
    <section class="card help-section"><p class="label">Een kleine daad buiten het spel</p><h2>Wat kun jij voor iemand doen?</h2><p>Kies een missie, doe die eerst en kijk daarna terug op wat er gebeurde.</p>
      <div class="help-grid">${helpMissions.map(mission=>`<article><span aria-hidden="true">${mission.icon}</span><h3>${mission.title}</h3><p>${mission.task}</p><button data-help="${mission.id}" ${completedToday.has(mission.id)?'disabled':''}>${completedToday.has(mission.id)?'Vandaag teruggekeken':'Ik heb dit gedaan'}</button></article>`).join('')}</div>
      <dialog id="help-dialog" aria-labelledby="help-title"></dialog>
    </section>
    <section class="card"><h2>Jouw zorg groeit mee</h2><p>Na je eerste helpmissie krijg je een vogelhuisje om zelf te plaatsen. Na drie verschillende helpmissies volgt een samenbankje. Na helpen op vijf verschillende dagen volgt een hartenfontein.</p><p>Je beschrijft zelf wat je deed en wat het veranderde. In het weekrapport kunnen jullie hier samen op terugkijken.</p></section>
    <section class="card"><h2>Jouw bijdragen</h2><p>${helps.length} ${helps.length===1?'helpmissie':'helpmissies'} teruggekeken · ${coins} bouwmunten gedeeld · ${gifts.length} ${gifts.length===1?'bouwstuk':'bouwstukken'} doorgegeven.</p>
      ${helps.length?`<ul>${helps.slice(-5).reverse().map(record=>`<li>${esc(record.date)} · ${helpMissions.find(item=>item.id===record.action)?.title||'Helpmissie'}<p>${esc(record.reflection)}</p></li>`).join('')}</ul>`:'<p>Je eerste bijdrage krijgt hier een plek.</p>'}
      <button class="primary" id="kindness-to-world">Naar mijn wereld →</button></section>`;
  screen.querySelectorAll('[data-give-coins]').forEach(button=>button.onclick=()=>{
    if(donateCoins(Number(button.dataset.giveCoins)))kindnessView('Je bijdrage helpt de zorgtuin groeien. Bedankt dat je zelf koos om te delen.');
  });
  const giftSelect=screen.querySelector('#gift-building');
  giftSelect.onchange=()=>{screen.querySelector('#give-building').disabled=!giftSelect.value;};
  screen.querySelector('#give-building').onclick=()=>{
    if(giveBuilding(giftSelect.value))kindnessView('Je bouwstuk staat nu in de gezamenlijke tuin. Zo krijgt het een plek voor iedereen.');
  };
  screen.querySelectorAll('[data-help]').forEach(button=>button.onclick=()=>openHelpReflection(button.dataset.help));
  screen.querySelector('#kindness-to-world').onclick=()=>show('island');
}
function openHelpReflection(id) {
  const mission=helpMissions.find(item=>item.id===id);
  const dialog=screen.querySelector('#help-dialog');
  dialog.innerHTML=`<form><h2 id="help-title">${mission.title}</h2><p>${mission.task}</p><label>Wat deed je en wat veranderde er door jouw hulp?<textarea name="reflection" minlength="8" maxlength="180" required rows="4"></textarea></label><div class="answer-actions"><button class="primary">Mijn ervaring bewaren</button><button type="button" id="cancel-help">Terug</button></div></form>`;
  dialog.querySelector('#cancel-help').onclick=()=>dialog.close();
  dialog.querySelector('form').onsubmit=event=>{
    event.preventDefault();
    const reflection=event.target.elements.reflection.value;
    const rewards=logHelp(id,reflection);
    if(rewards===false)return;
    dialog.close();
    kindnessView(rewards.length?`Je hielp en dacht na over het effect. ${rewards.join(' en ')} ligt klaar in je bouwvoorraad.`:'Je ervaring is bewaard. Je aandacht voor een ander maakte een verschil.');
  };
  dialog.showModal();
}
