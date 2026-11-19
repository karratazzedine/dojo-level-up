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
  const world=ensureWorld();
  const earnedCoins = all.filter(event=>!event.retry).length*5 +
    all.filter(event=>event.retry&&event.correct).length*2 + reflections*10 + world.claims.length*30;
  const owned = [...new Set(state.owned || [])].filter(id=>decorations.some(item=>item.id===id));
  const worldSpent=world.regions.reduce((sum,item)=>sum+item.paid,0)+world.pieces.reduce((sum,item)=>sum+item.paid,0);
  const spent = worldSpent + decorations.filter(item=>owned.includes(item.id)).reduce((sum,item)=>sum+item.cost,0);
  return {earned:earnedCoins,spent,balance:earnedCoins-spent,owned};
}
function rewardIsland() { renderWorld(); }
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
    ${worldGoalMarkup()}<section class="card"><h2>Jouw bouwwerk groeit mee</h2><p>${wallet().balance} bouwmunten klaar · ${ensureWorld().pieces.length} bouwstukken verdeeld over ${ensureWorld().regions.length} eilanden.</p><button class="primary" id="see-island">Naar mijn bouweiland →</button></section>`;
  screen.querySelector('#claim-route').onclick=()=>{if(claimWorldGoal())progressView();};
  screen.querySelector('#see-island').onclick=()=>show('island');
}
