'use strict';
const decorations = [
  {id:'tree',icon:'🌸',name:'Bloesemboom',cost:20,description:'Een roze boom voor je eiland.'},
  {id:'crystal',icon:'💎',name:'Kristallen',cost:35,description:'Blauwe kristallen die oplichten.'},
  {id:'gate',icon:'⛩️',name:'Dojo-poort',cost:50,description:'Een eigen ingang voor jouw dojo.'},
  {id:'lantern',icon:'🏮',name:'Lantaarn',cost:70,description:'Warm licht op jouw bouwplek.'},
  {id:'tower',icon:'🏰',name:'Sterrentoren',cost:100,description:'Een toren met jouw gouden ster.'},
  {id:'dragon',icon:'🐉',name:'Eilanddraak',cost:160,description:'Een vriendelijke bewaker voor je eiland.'}
];
function wallet() {
  const all = events();
  const reflections = Object.values(state.days).reduce((sum,record)=>sum+(record.reflections?.length||0),0);
  const earnedCoins = all.filter(event=>!event.retry).length*5 +
    all.filter(event=>event.retry&&event.correct).length*2 + reflections*10;
  const owned = [...new Set(state.owned || [])].filter(id=>decorations.some(item=>item.id===id));
  const spent = decorations.filter(item=>owned.includes(item.id)).reduce((sum,item)=>sum+item.cost,0);
  return {earned:earnedCoins,spent,balance:earnedCoins-spent,owned};
}
function islandScene() {
  const account=wallet();
  const positions=state.placements || {};
  const hidden=state.hiddenDecorations || [];
  const slots=[[28,40],[48,25],[68,38],[39,48],[64,54],[53,43]];
  return `<div class="my-island" role="img" aria-label="Jouw zwevende eiland. Geplaatst: ${esc(decorations.filter(item=>account.owned.includes(item.id)&&!hidden.includes(item.id)).map(item=>item.name).join(', ') || 'nog geen decoraties')}">
    <img src="island.webp" alt="">
    ${decorations.map((item,i)=>{
      if(!account.owned.includes(item.id)||hidden.includes(item.id))return '';
      const [left,top]=slots[positions[item.id]??i];
      return `<span class="voxel-decor decor-${item.id}" style="left:${left}%;top:${top}%" aria-hidden="true"></span>`;
    }).join('')}
    <div class="island-name">${esc(state.name)}’s bouweiland</div></div>`;
}
function rewardIsland() {
  const account=wallet();
  screen.innerHTML=`<section class="island-heading"><div><p class="label">Jij bouwt aan je eigen avontuur</p><h1>Mijn bouweiland</h1></div><div class="coin-wallet"><span aria-hidden="true">◈</span><strong>${account.balance}</strong><span>bouwmunten</span></div></section>
    ${islandScene()}
    <p id="island-message" class="island-message" role="status">Kies wat jij mooi vindt en geef het een plek op je eiland.</p>
    <section class="build-rules"><span>🧩 Opdracht proberen <strong>+5</strong></span><span>🌱 Herkansing gelukt <strong>+2</strong></span><span>🧠 Missie terugkijken <strong>+10</strong></span></section>
    <p class="muted coin-info">Bouwmunten horen bij dit spel. Je verdient ze met oefenen en gebruikt ze voor je eiland.</p>
    <section class="decoration-grid">${decorations.map(item=>{
      const owned=account.owned.includes(item.id);
      const visible=owned&&!(state.hiddenDecorations||[]).includes(item.id);
      return `<article class="decoration-card"><span class="collection-icon sprite-item decor-${item.id}" aria-hidden="true"></span><h2>${item.name}</h2><p>${item.description}</p>
        <button data-decoration="${item.id}" class="${owned?'':'primary'}" ${!owned&&account.balance<item.cost?'disabled':''}>${owned ? visible?'Weghalen':'Plaatsen' : `Bouw voor ${item.cost} ◈`}</button>
        ${visible?`<button class="move-item" data-move="${item.id}">Verplaats</button>`:''}
        ${!owned&&account.balance<item.cost?`<small>Nog ${item.cost-account.balance} bouwmunten</small>`:''}</article>`;
    }).join('')}</section>
    <details class="coin-info"><summary>Hoe wordt mijn tegoed berekend?</summary><p>Je eerdere oefeningen tellen mee. Totaal verdiend ${account.earned} bouwmunten, gebruikt voor decoraties ${account.spent}. Het weekrapport toont ook je afgesproken eurobeloning.</p></details>`;
  screen.querySelectorAll('[data-decoration]').forEach(button=>button.onclick=()=>{
    const item=decorations.find(item=>item.id===button.dataset.decoration);
    const current=wallet();
    if(current.owned.includes(item.id)){
      const hidden=new Set(state.hiddenDecorations||[]);
      if(hidden.has(item.id))hidden.delete(item.id);else hidden.add(item.id);
      state.hiddenDecorations=[...hidden];
    } else {
      if(current.balance<item.cost)return;
      state.owned=[...current.owned,item.id];
    }
    save();
    rewardIsland();
    screen.querySelector('#island-message').textContent=`${item.name}: je eiland is bijgewerkt. Je hebt ${wallet().balance} bouwmunten over.`;
    screen.querySelector(`[data-decoration="${item.id}"]`).focus();
  });
  screen.querySelectorAll('[data-move]').forEach(button=>button.onclick=()=>{
    const id=button.dataset.move;
    const positions=state.placements??={};
    const slot=positions[id]??decorations.findIndex(item=>item.id===id);
    const next=(slot+1)%6;
    const other=decorations.find((item,i)=>item.id!==id&&wallet().owned.includes(item.id)&&(positions[item.id]??i)===next);
    if(other)positions[other.id]=slot;
    positions[id]=next;
    save();
    rewardIsland();
    screen.querySelector('#island-message').textContent='Een nieuwe plek gekozen. Zo maak je het eiland van jou.';
    screen.querySelector(`[data-move="${id}"]`).focus();
  });
}
function progressView() {
  const all=events();
  const first=all.filter(event=>!event.retry);
  const trainingDays=Object.values(state.days).filter(record=>record.events.length).length;
  const today=new Date(dateKey()+'T12:00:00Z');
  const dates=Array.from({length:7},(_,i)=>dateKey(new Date(today.getTime()-(6-i)*86400000)));
  const peak=Math.max(9,...dates.map(date=>completed(state.days[date]||{events:[]})));
  const badgeData=[
    ['🧭','Ontdekker',topics.every(topic=>all.some(event=>event.topic===topic)),'Oefen alle drie de vakken.'],
    ['💡','Slimme hulpvrager',all.some(event=>event.help),'Gebruik een hint of uitleg bij een opdracht.'],
    ['🌱','Doorzetter',all.some(event=>event.retry&&event.correct),'Maak een herkansing goed.'],
    ['🧠','Eigen leider',Object.values(state.days).some(record=>record.reflections?.length),'Kijk terug op jouw aanpak na een missie.']
  ];
  screen.innerHTML=`<section class="card"><p class="label">Jouw stappen blijven bewaard</p><h1>Mijn groei</h1><p>Je hebt ${first.length} opdrachten geprobeerd op ${trainingDays} ${trainingDays===1?'oefendag':'oefendagen'}.</p>
    <div class="practice-chart" aria-label="Opdrachten per dag in de afgelopen zeven dagen">${dates.map(date=>{
      const record=state.days[date]||{events:[],seconds:0};
      const count=completed(record);
      return `<div class="chart-day" aria-label="${date}: ${count} opdrachten en ${timerText(record.seconds)} oefentijd"><strong>${count}</strong><div class="bar-track"><div style="height:${Math.max(2,count/peak*100)}%"></div></div><span>${date.slice(8)}-${date.slice(5,7)}</span></div>`;
    }).join('')}</div>
    <p class="muted">Aantal opdrachten per dag · de afgelopen 7 dagen</p></section>
    <section class="growth-section"><h2>Jouw aanpak in beeld</h2><div class="growth-grid">${skillStats().map(([icon,label,count,detail])=>`<article><span aria-hidden="true">${icon}</span><h3>${label}</h3><strong>${count}</strong><p>${detail}</p></article>`).join('')}</div></section>
    <section class="card"><h2>Hoe gaat het per vak?</h2>${topics.map(topic=>{
      const history=first.filter(event=>event.topic===topic);
      const recent=history.slice(-8);
      const correct=recent.filter(event=>event.correct).length;
      const earlier=history.slice(-16,-8);
      return `<div class="subject-progress"><h3>${topic} · niveau ${level(topic)} van 3</h3><p>Laatste reeks · ${correct} van ${recent.length} opdrachten in één keer goed.</p><progress class="meter" max="${Math.max(1,recent.length)}" value="${correct}" aria-label="${topic}: ${correct} van ${recent.length} goed"></progress>
        <small>${earlier.length===8?`De 8 pogingen daarvoor: ${earlier.filter(event=>event.correct).length} goed.`:'Na meer oefenen zie je hier ook de vergelijking met je vorige 8 pogingen.'}</small></div>`;
    }).join('')}<p class="muted">Dit overzicht laat je oefenresultaten zien. Een nieuwe strategie proberen en hulp gebruiken horen ook bij leren.</p></section>
    <section class="growth-section"><h2>Jouw ontdekkingen</h2><div class="badge-grid">${badgeData.map(([icon,name,unlocked,detail])=>`<article class="${unlocked?'unlocked':''}"><span aria-hidden="true">${unlocked?icon:'🔒'}</span><h3>${name}</h3><p>${unlocked?'Behaald · ':''}${detail}</p></article>`).join('')}</div></section>
    <section class="card"><h2>Jouw bouwwerk groeit mee</h2><p>${wallet().balance} bouwmunten klaar · ${wallet().owned.length} van ${decorations.length} decoraties verzameld.</p><button class="primary" id="see-island">Naar mijn bouweiland →</button></section>`;
  screen.querySelector('#see-island').onclick=()=>show('island');
}
