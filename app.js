'use strict';
const topics = ['Rekenen', 'Spelling', 'Begrijpend lezen', 'Klokkijken'];
const key = 'dojo-level-up-v1';
const backupKey = 'dojo-level-up-history-v2';
const defaultTarget = 9;
const fresh = { target: defaultTarget, name: 'judoka', theme: 'forest', avatar: '🥋', days: {}, paid: {} };
let state = structuredClone(fresh);
try { state = { ...state, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch {}
try {
  const snapshot=JSON.parse(localStorage.getItem(backupKey)||'null');
  if(snapshot)state={...state,...snapshot,days:mergeSavedDays(state.days,snapshot.days)};
} catch {}
const worlds = { 'Rekenen': ['🧱', 'Blokkenbouw'], 'Spelling': ['⚡', 'Woordenwerkplaats'], 'Begrijpend lezen': ['🔍', 'Verhalenexpeditie'], 'Klokkijken':['🕒','Tijdreizigers'] };
let mission = null;
const captainGoals = [
  ['🔎', 'Ik controleer mijn antwoord', 'Lees de vraag nog eens en controleer of jouw antwoord erbij past.'],
  ['💡', 'Ik vraag hulp als ik vastloop', 'Een hint kan je helpen om een nieuwe stap te vinden.'],
  ['🌱', 'Ik probeer een nieuwe aanpak', 'Bij een fout kijk je naar de uitleg en probeer je het nog een keer.']
];
const skillStats = () => {
  const all = events();
  return [
    ['🧠', 'Denkkracht', all.filter(e => e.correct && !e.retry && e.help === false).length, 'eerste poging goed zonder hulp'],
    ['💡', 'Hulp gebruiken', all.filter(e => e.help).length, 'keer een hint of uitleg bekeken'],
    ['🌱', 'Doorzetten', all.filter(e => e.retry && e.correct).length, 'herkansingen gelukt']
  ];
};
let view = 'home', question, pending, answered, lastInput = 0, lastTick = Date.now();
const screen = document.querySelector('#screen');
function mergeSavedDays(previous, current) {
  const merged={...previous,...current};
  for(const date of Object.keys(merged)){
    const before=previous[date]||{events:[],seconds:0};
    const after=current[date]||before;
    const combine=(oldItems,newItems,type)=>{
      const entries=new Map();
      for(const items of [oldItems,newItems]){
        items.forEach((item,index)=>{
          const id=item.id??['legacy',date,type,index,JSON.stringify(item)].join('|');
          entries.set(id,{...item,id});
        });
      }
      return [...entries.values()];
    };
    merged[date]={...before,...after,
      seconds:Math.max(before.seconds,after.seconds),
      earned:Boolean(before.earned||after.earned),
      events:combine(before.events,after.events,'attempt'),
      reflections:combine(before.reflections||[],after.reflections||[],'reflection')};
  }
  return merged;
}
function save() {
  const recent=JSON.parse(localStorage.getItem(key)||'{}');
  const backup=JSON.parse(localStorage.getItem(backupKey)||'{}');
  state.days=mergeSavedDays(mergeSavedDays(recent.days||{},backup.days||{}),state.days);
  const serialized=JSON.stringify(state);
  localStorage.setItem(key,serialized);
  localStorage.setItem(backupKey,serialized);
}
const dateKey = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(date);
const rollout = state.rollout ??= dateKey();
const day = () => state.days[dateKey()] ??= { seconds: 0, events: [], target: state.target };
const completed = record => record.events.filter(event => !event.retry).length;
const earned = record => record.earned || (record.seconds >= 900 && completed(record) >= (record.target ?? 0));
const euro = days => days.filter(earned).length;
const todayEarned = () => {
  const record = day();
  record.target ??= state.target;
  if (earned(record) && !record.earned) { record.earned = true; playSound('goal'); }
};
for (const [date, record] of Object.entries(state.days)) {
  if (record.target == null && date <= rollout) {
    record.earned = record.seconds >= 900;
    record.target = state.target;
  }
}
save();
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = items => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const pick = items => shuffle(items)[0];
const number = (min,max) => Math.floor(Math.random() * (max-min+1)) + min;
const events = () => Object.keys(state.days).sort().flatMap(d => state.days[d].events);
const level = topic => {
  const recent = events().filter(e => e.topic === topic && !e.retry && e.skill!=='tafels').slice(-8);
  const score = recent.filter(e => e.correct).length;
  return score >= 7 ? 3 : score >= 4 ? 2 : 1;
};
function missionQueue() {
  return focusedMissionQueue();
}
function questionIdentity(item) {
  return item.sourceKey || (item.kind==='clock'?'clock|'+item.clockSet+'|'+item.clockTarget:null) || item.word || (item.title ? item.title+'|'+item.prompt : item.prompt);
}
function selectQuestion(topic,rank,previous) {
  const history=(state.questionHistory??{})[topic]??[];
  const pool=topic===topics[0] || topic===topics[3] ?
    Array.from({length:32},()=>build(topic,rank,previous)) :
    schoolQuestions(topic,rank,previous);
  const unseen=pool.filter(item=>!history.includes(questionIdentity(item)));
  const bankKey=topic+'|'+rank;
  const exhausted=state.completedBanks??={};
  if (!exhausted[bankKey] && unseen.length)return pick(unseen);
  if(topic===topics[1]||topic===topics[2]){
    exhausted[bankKey]=true;
    const generator=topic===topics[1]?generatedSpelling:generatedReading;
    let generated;
    for(let attempt=0;attempt<25;attempt++){
      generated=generator(rank,previous);
      if(!history.includes(questionIdentity(generated)))return generated;
    }
    return generated;
  }
  // When a compatible question set is exhausted, return the least recently seen.
  return pool.reduce((oldest,item)=>history.indexOf(questionIdentity(item))<history.indexOf(questionIdentity(oldest))?item:oldest);
}
const spelling = [
  ['grappig','Het stripverhaal was heel ___.'],['vrolijk','Na het spelen liep Noor ___ naar huis.'],
  ['handig','Een extra potlood is altijd ___.'],['eerlijk','Sam was ___ en gaf de gevonden munt terug.'],
  ['rustig','Wacht ___ tot de les begint.'],['gevaarlijk','Zonder helm fietsen kan ___ zijn.'],
  ['modderig','Na de regen werd het pad ___.'],['duidelijk','Leg het zo uit dat het voor iedereen ___ is.'],
  ['moeilijk','Ik vond deze puzzel best ___.'],['heerlijk','De soep smaakt ___.'],
  ['gelukkig','De kat is ___ weer thuis.'],['dorstig','Na het rennen was ik ___.'],
  ['vriendelijk','De trainer begroet iedereen ___.'],['zonnig','Vandaag is het buiten lekker ___.'],
  ['eindelijk','De brug is na drie weken ___ klaar.'],['krachtig','Zij duwt ___ tegen de zware deur.']
].filter(([word]) => /(?:ig|lijk)$/.test(word));
function schoolQuestions(topic,rank,previous) {
  if(topic===topics[1]) {
    const bank=[...spelling.map(([word,sentence])=>({kind:'ending',word,sentence})),...extraSpelling];
    const compatible=bank.filter(item=>!previous ||
      item.kind===previous.kind && (item.kind!=='ending' || item.word.endsWith(previous.word.endsWith('lijk')?'lijk':'ig')));
    const different=compatible.filter(item=>item.word!==previous?.word);
    return (different.length?different:compatible).map(item=>{
      if(item.kind!=='ending')return {kind:item.kind,word:item.word,prompt:'Welk woord hoort op de lege plek?',passage:item.sentence,
        answer:item.word,options:[item.word,...item.options],explanation:item.tip,skill:item.kind};
      const ending=item.word.endsWith('lijk')?'lijk':'ig';
      const stem=item.word.slice(0,-ending.length);
      return {kind:'ending',word:item.word,prompt:rank===1?'Welk woord is goed gespeld?':'Welk woord hoort op de lege plek?',
        passage:rank===1?'':item.sentence,answer:item.word,
        options:[item.word,stem+(ending==='lijk'?'luk':'ug'),stem+(ending==='lijk'?'leik':'ich')],
        explanation:`De vaste uitgang is -${ending}. Je hoort vaak een korte ‘uh’-klank, maar schrijft ${ending}. Kijk extra goed naar de laatste letters.`};
    });
  }
  const preferredSkills=rank===1?['informatie vinden','volgorde','woordbetekenis']:
    rank===3?['hoofdgedachte','afleiden','oorzaak en gevolg','tekstdoel','verwijswoorden']:[];
  const bank=schoolReading.flatMap(text=>{
    const preferred=text.questions.filter(item=>preferredSkills.includes(item[5]));
    const questions=previous?text.questions.filter(item=>item[5]===previous.skill):
      preferred.length?preferred:text.questions;
    return questions.map(([prompt,answer,wrong1,wrong2,explanation,skill])=>({
      kind:'reading',passage:text.passage,title:text.title,textType:text.type,icon:text.icon,
      prompt,answer,options:[answer,wrong1,wrong2],explanation,skill
    }));
  });
  const different=bank.filter(item=>item.passage!==previous?.passage);
  return different.length?different:bank;
}
function build(topic, rank, previous) {
  if(topic===topics[3])return buildClock(rank,previous);
  if(topic === topics[0]) {
    // Deliberate crossings of a ten: addition carries and subtraction borrows.
    const ranges=rank===1?[4,11,1,7]:rank===2?[12,44,3,12]:[25,74,8,21];
    const a=number(ranges[0],ranges[1])*10+number(6,9), b=number(ranges[2],ranges[3])*10+number(4,9);
    const kind = previous?.kind ?? pick(rank === 1 ? ['plus','min','ratio','divide','multi'] : ['plus','min','ratio','divide','money','time','measure','multi','multi', ...(rank===3?['multi']:[])]);
    if(kind === 'ratio') {
      const per = rank===3?number(12,19):number(3,rank===2?12:9), groups = number(3,9);
      const tens=Math.floor(per/10)*10,ones=per%10;
      return math(kind, `In elke kist zitten ${per} bouwblokken. Hoeveel blokken zitten in ${groups} kisten?`, per * groups,
        per>=10?`Splits ${per} in ${tens} en ${ones}. Eerst ${groups} × ${tens} = ${groups*tens}. Dan ${groups} × ${ones} = ${groups*ones}. Samen ${groups*tens} + ${groups*ones} = ${groups*per}.`:
        `Je hebt ${groups} gelijke groepjes van ${per}. Reken ${groups} × ${per} = ${groups*per}. Gebruik een keersom die je al kent als startpunt.`, [per+groups, per*(groups-1), per*(groups+1)]);
    }
    if (kind === 'divide') {
      const groups = number(2,10), per = rank===3?number(11,20):number(rank===2?6:2,rank===2?12:10);
      return math(kind,`Je verdeelt ${groups*per} potloden eerlijk over ${groups} bakjes. Hoeveel potloden komen in elk bakje?`,per,
        per>10?`Geef elk bakje eerst 10 potloden: dat zijn ${groups} × 10 = ${groups*10}. Er blijven ${groups*(per-10)} potloden over. Dat zijn nog ${per-10} per bakje. Samen 10 + ${per-10} = ${per}. Controleer: ${groups} × ${per} = ${groups*per}.`:
        `Zoek de keersom: ${groups} × hoeveel = ${groups*per}? Het antwoord is ${per}, want ${groups} × ${per} = ${groups*per}.`,[per+1,per-1,groups*per-groups]);
    }
    if (kind === 'money') {
      const book=number(17,rank===3?69:39),game=rank===1?0:number(12,rank===3?49:29),cost=book+game;
      const paid=rank===1?Math.ceil(cost/10)*10+10:Math.ceil((cost+1)/50)*50;
      return math(kind,`Een boek kost €${book}.${game?` Je koopt ook een spel van €${game}.`:''} Je betaalt met €${paid}. Hoeveel euro krijg je terug?`,paid-cost,
        `${game?`Tel eerst de prijzen op: ${book} + ${game} = ${cost}. `:''}Reken daarna ${paid} − ${cost} = ${paid-cost}. Controleer: ${cost} + ${paid-cost} = ${paid}. Je krijgt €${paid-cost} terug.`,[paid-cost+10,cost+paid,paid-cost-1]);
    }
    if (kind === 'time') {
      const hour = number(9,15), minute = pick([0,15,30]), duration = pick([15,30,45]);
      const end = hour*60+minute+duration;
      const display = `${hour}:${String(minute).padStart(2,'0')}`;
      const format = minutes => `${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}`;
      const answer = format(end);
      return {kind,prompt:`De judoles begint om ${display} en duurt ${duration} minuten. Hoe laat is de les klaar?`, answer,
        options:[answer,format(end+15),format(end-15)],
        explanation:`Begin bij ${display}. Tel ${duration} minuten verder. Bij 60 minuten begint het volgende uur. Je komt uit op ${answer}.`};
    }
    if (kind === 'measure') {
      const meters = number(1,5), extra = number(1,9)*10;
      return math(kind,`Een touw is ${meters} meter en ${extra} centimeter lang. Hoeveel centimeter is dat samen?`,meters*100+extra,
        `1 meter = 100 centimeter. ${meters} meter = ${meters*100} centimeter. Tel daar ${extra} bij op: ${meters*100+extra} centimeter.`,[meters+extra,meters*10+extra,meters*100]);
    }
    if(kind === 'multi') {
      const walls=number(3,rank===3?8:5),blocks=number(rank===1?4:8,rank===3?19:10),left=number(rank===1?15:35,rank===3?180:75),total=blocks*walls+left;
      return math(kind,`Je hebt ${total} blokken. Je bouwt ${walls} muren met elk ${blocks} blokken. Hoeveel blokken houd je over?`,left,
        `Eerst uitrekenen wat je gebruikt: ${blocks>10?`splits ${blocks} in 10 en ${blocks-10}. ${walls} × 10 = ${walls*10} en ${walls} × ${blocks-10} = ${walls*(blocks-10)}. Samen ${blocks*walls}.`:`${walls} × ${blocks} = ${blocks*walls}.`} Trek dat van je voorraad af: ${total} − ${blocks*walls} = ${left} blokken over. Controleer: ${left} + ${blocks*walls} = ${total}.`,[total-blocks,total+blocks,total-(walls-1)*blocks]);
    }
    const plus = kind === 'plus';
    const prompt = Math.random() < .5 ? `Hoeveel is ${plus?a:a+b} ${plus ? '+' : '−'} ${b}?` : plus ?
      `Je vindt ${a} munten en krijgt er nog ${b}. Hoeveel heb je samen?` :
      `Je hebt ${a+b} munten en geeft er ${b} uit. Hoeveel houd je over?`;
    const start = plus ? a : a+b;
    const sign = plus ? 1 : -1, goal = start + sign*b, tens = b - b%10;
    const intermediate=start+sign*tens;
    return math(kind,prompt,goal,`Splits ${b} in ${tens} en ${b%10}. Eerst ${start} ${plus?'+':'−'} ${tens} = ${intermediate}. Dan ${intermediate} ${plus?'+':'−'} ${b%10} = ${goal}. Je gaat hierbij over een tiental. Controleer met de omgekeerde som: ${goal} ${plus?'−':'+'} ${b} = ${start}.`,[start-sign*b,goal+10,goal-1]);
  }
  return pick(schoolQuestions(topic,rank,previous));
}

function math(kind,prompt,answer,explanation,wrong,retry) {
  if(retry) return retry();
  return {kind,prompt,answer:String(answer),options:[answer,...new Set(wrong.filter(n=>n!==answer && n>=0))].map(String),explanation};
}
function show(next) {
  if(!profileIsUnlocked()){profileGate();return;}
  if(view==='practice'&&next!=='practice'&&question&&!answered)question.fluencyInterrupted=true;
  if(next!=='practice')stopDictation();
  view = next;
  document.body.dataset.theme = state.theme;
  document.querySelectorAll('nav button').forEach(b => b.setAttribute('aria-current',b.dataset.view===view?'page':'false'));
  if(view==='home') home();
  if(view==='report') report();
  if(view==='settings') settings();
  if(view==='practice') practice();
  if(view==='choose') chooseMission();
  if(view==='finish') finish();
  if(view==='island') rewardIsland();
  if(view==='kindness') kindnessView();
  if(view==='progress') progressView();
}
function timerText(seconds) { return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`; }
function goalMarkup() {
  const record = day();
  const target = record.target ?? state.target;
  const count = completed(record);
  return `<div class="quest-goals">
    <div><p id="clock">⏱ ${timerText(record.seconds)} / 15:00 oefenen</p><progress id="meter" class="meter" aria-label="Actieve oefentijd vandaag" max="900" value="${record.seconds}"></progress></div>
    <div><p>🧩 ${count} / ${target} opdrachten</p><progress class="meter" aria-label="Opdrachten vandaag" max="${target}" value="${count}"></progress></div>
    </div><p id="reward-status" class="reward-status">${earned(record)?'🪙 €1 verdiend voor je dagtraining':'Beide doelen gehaald? Dan verdien je €1.'}</p>`;
}
function home() {
  const all = events();
  const stars = all.filter(e => e.correct).length;
  const belts = [['⬜','Witte band',0], ['🟨','Gele band',9], ['🟧','Oranje band',24], ['🟩','Groene band',48], ['🟦','Blauwe band',80]];
  const belt = belts.findLast(([, , goal]) => stars >= goal);
  const nextBelt = belts[belts.indexOf(belt)+1];
  screen.innerHTML = `<section class="hero">
      <img class="hero-art" src="dojo-world.webp" alt="" fetchpriority="high">
      <div class="hero-content"><p class="label">${esc(state.avatar)} Sensei Poko’s dojo</p><h1>Klaar, ${esc(state.name)}?</h1>
      <p>Vandaag maak je jouw basis sterker: tafels tot 10, spelling en rekenen. Ook lezen blijft erbij.</p>
      <button class="primary" id="start">${mission?'Ga verder met je missie':'▶ Start je missie'} <span aria-hidden="true">→</span></button></div>
    </section>
    <section class="status-strip" aria-label="Jouw voortgang">
      <div><span class="status-icon">⭐</span><strong>${stars}</strong><span>sterren door oefenen</span></div>
      <div><span class="status-icon">${belt[0]}</span><strong>${belt[1]}</strong><span>${nextBelt?`nog ${nextBelt[2]-stars} tot ${nextBelt[1].toLowerCase()}`:'hoogste band'}</span></div>
      <div><span class="status-icon">🌱</span><strong>${Object.values(state.days).reduce((sum,d)=>sum+(d.reflections?.length||0),0)}</strong><span>missies teruggekeken</span></div>
    </section>
    ${tableProgressMarkup()}
    <section class="card learning-plan"><p class="label">Jouw dagelijkse leerplan</p><h2>Eerst leren, dan verder bouwen</h2><p>Een gemengde ronde: 6 tafelsommen, 3 spellingwoorden, 2 rekenopdrachten en 1 leesopdracht. Je schrijft de spellingwoorden zelf. Daarna kijk je terug op wat jou hielp.</p><button id="daily-plan" class="primary">Start mijn dagtraining</button></section>
    <section class="adventure-map" aria-label="Avonturenkaart">
      <img src="adventure.webp" alt="Poko wacht bij drie zwevende eilanden met een dojo, een kristalgrot en een sterrentoren.">
      <div class="map-caption"><h2>Jouw volgende avontuur</h2><p>Elke opdracht opent een speelpauze.</p></div>
    </section>
    <section class="growth-section"><h2>Zo groeit jouw denkkracht</h2><div class="growth-grid">${skillStats().map(([icon,label,count,detail])=>`<article><span aria-hidden="true">${icon}</span><h3>${label}</h3><strong>${count}</strong><p>${detail}</p></article>`).join('')}</div>
      <p class="muted">Intelligentie gebruik je als je verbanden legt, een aanpak kiest en controleert wat werkt.</p></section>
    <div class="dashboard"><section class="journey"><h2>Jouw vakken</h2><div class="worlds">${topics.map(t=>`<article class="world"><span class="world-icon" aria-hidden="true">${worlds[t][0]}</span><h3>${worlds[t][1]}</h3><span>${t} · niveau ${level(t)}/3</span><progress class="meter" max="3" value="${level(t)}" aria-label="${t} niveau"></progress><button class="subject-start" data-practice-topic="${t}">${t===topics[3]?'Oefen met de klok':'Oefen '+t.toLowerCase()}</button></article>`).join('')}</div></section>
    <section class="card daily"><p class="label">🌱 Stap voor stap</p><h2>Jouw dagtraining</h2>${goalMarkup()}</section></div>
    <section class="island-teaser"><div><p class="label">Jouw vertrouwde wereld</p><h2>Even kijken naar wat jij bouwt</h2><p>${wallet().balance} bouwmunten om later mee verder te bouwen.</p><div class="answer-actions"><button id="open-island">Mijn wereld</button><button id="open-progress">Bekijk mijn groei</button></div></div><img src="island.webp" alt="Een eigen zwevend bouweiland"></section>`;
  document.querySelector('#start').onclick = () => mission ? startMission() : show('choose');
  screen.querySelector('#open-island').onclick=()=>show('island');
  screen.querySelector('#open-progress').onclick=()=>show('progress');
  screen.querySelector('#daily-plan').onclick=()=>mission?startMission():show('choose');
  bindTableTraining();
  screen.querySelectorAll('[data-practice-topic]').forEach(button=>button.onclick=()=>{
    mission={queue:Array(button.dataset.practiceTopic===topics[3]?4:6).fill(button.dataset.practiceTopic),steps:0,stars:0,goal:0,events:[]};
    pending=null;nextQuestion();
  });
}
function chooseMission() {
  screen.innerHTML = `<section class="card captain-choice"><p class="label">Leiderschap begint bij jouw keuzes</p><h1>Wat is jouw plan?</h1><p>Vandaag: 6 tafelsommen, 3 spellingwoorden, 2 rekenopdrachten en 1 leesopdracht. Een leider kiest een aanpak en durft hulp te vragen.</p>
    <div class="captain-options">${captainGoals.map(([icon,title,description],i)=>`<button data-goal="${i}"><span aria-hidden="true">${icon}</span><strong>${title}</strong><small>${description}</small></button>`).join('')}</div></section>`;
  screen.querySelectorAll('[data-goal]').forEach(button => button.onclick = () => {
    mission = {queue:missionQueue(),steps:0,stars:0,goal:Number(button.dataset.goal),events:[]};
    startMission();
  });
}
function startMission() {
  if (mission?.started && !answered) {
    lastInput = lastTick = Date.now();
    show('practice');
    return;
  }
  mission ??= { queue: missionQueue(), steps: 0, stars: 0, goal:0, events:[] };
  nextQuestion();
}
function finish() {
  playSound('mission');
  const completedMission = mission;
  const success = mission.events.filter(event=>event.retry && event.correct).length;
  screen.innerHTML = `<section class="hero finish"><img class="hero-art" src="dojo-world.webp" alt=""><div class="hero-content">
    <p class="label">Missie voltooid · even terugkijken</p><h1>Jij zet stappen.</h1><p>Je hebt je oefenronde afgemaakt. ${success ? `${success} herkansing${success>1?'en':''} gelukt. Je nieuwe poging maakte verschil.` : 'Kies iets wat jou hielp. Zo leer je jouw eigen aanpak kennen.'}</p></div></section>
    <section class="card reflection"><h2>Wat hielp jou vandaag?</h2><p class="reflection-bonus">◈ +10 bouwmunten voor jouw terugblik</p><p>Jouw plan was: ${captainGoals[mission.goal][1].toLowerCase()}.</p><div class="reflection-options">
      ${['Ik las of rekende nog een keer','Ik gebruikte een hint of uitleg','Ik probeerde een andere aanpak','Ik wil dit nog meer oefenen'].map(text=>`<button>${text}</button>`).join('')}</div><p id="reflection-feedback" aria-live="polite"></p>
      <div class="answer-actions"><button class="primary" id="again">Nieuwe missie →</button><button id="rest">Naar mijn dojo</button></div></section>
    <section class="card daily"><h2>Dagtraining</h2>${goalMarkup()}</section>`;
  mission = null;
  screen.querySelectorAll('.reflection-options button').forEach(button=>button.onclick=()=>{
    const reflections = day().reflections ??= [];
    reflections.push({id:crypto.randomUUID(),goal:completedMission.goal,thought:button.textContent});
    save();
    screen.querySelectorAll('.reflection-options button').forEach(option=>option.disabled=true);
    screen.querySelector('#reflection-feedback').textContent='+10 bouwmunten verdiend. Je kent je eigen aanpak nu beter. Kies bij je volgende opdracht één stap die je wilt gebruiken.';
  });
  document.querySelector('#again').onclick = () => show('choose');
  document.querySelector('#rest').onclick = () => show('home');
  screen.querySelector('h1').setAttribute('tabindex','-1');
  screen.querySelector('h1').focus();
}
function nextQuestion() {
  mission.total??=mission.queue.length;
  const retry = pending;
  if (!mission.queue.length && (!retry || mission.steps >= mission.total*2)) {
    pending = null;
    show('finish');
    return;
  }
  const canRetry = retry && (mission.steps + mission.queue.length < mission.total*2);
  const task = canRetry ? (retry.kind==='table'?'Tafels':retry.topic) : mission.queue.shift();
  const topic = task==='Tafels'?topics[0]:task;
  const rank = level(topic);
  let candidate=task==='Tafels'?buildTableQuestion(canRetry?retry:null,mission.table):selectQuestion(topic,rank,canRetry?retry:null);
  if(topic===topics[1])candidate=spellingDictation(candidate);
  const history=state.questionHistory??={};
  const id=questionIdentity(candidate);
  history[topic]=[...(history[topic]||[]).filter(value=>value!==id),id].slice(-100);
  question = {...candidate,topic,rank,retry:Boolean(canRetry),help:false,activeMs:0,fluencyInterrupted:false};
  question.readRequired=topic===topics[2]?Math.max(15,Math.min(55,Math.ceil((candidate.passage||'').split(/\s+/).length*.45))):0;
  question.readRemaining=question.readRequired;
  save();
  pending = null;
  answered = false;
  mission.started = true;
  lastInput = Date.now();
  lastTick = lastInput;
  show('practice');
  screen.querySelector('h2').focus();
}
function practice() {
  const [icon, area] = worlds[question.topic];
  const step = mission.total - mission.queue.length;
  const skillNames = {dubbel:'Korte klank', open:'Lange klank', verlengen:'Woord langer maken'};
  const skillLabel = skillNames[question.skill] || question.skill;
  const hints = {
    'Rekenen': 'Lees wat er met de blokken of munten gebeurt. Welk rekenteken past daarbij?',
    'Spelling': 'Zeg het woord zachtjes. Denk aan de spellingregel: maak het langer, verdeel het in klankgroepen of denk aan de vaste uitgang.',
    'Begrijpend lezen': 'Lees de vraag en zoek in het verhaal naar een aanwijzing.',
    'Klokkijken':'Zoek eerst de korte uurwijzer. Tel daarna met de lange wijzer in sprongen van vijf.'
  };
  const mathHints = {
    divide:'Verdeel eerlijk. Welke keersom hoort bij het aantal bakjes en het totaal?',
    ratio:'Tel het aantal kisten. In elke kist zit evenveel. Welke keersom past?',
    money:'Kijk hoeveel je betaalt en wat het kost. Welk verschil krijg je terug?',
    time:'Tel in sprongen van 15 minuten. Na 60 minuten begint een nieuw uur.',
    measure:'Zet eerst de meters om in centimeters. 1 meter is 100 centimeter.',
    multi:'Reken eerst uit hoeveel blokken je voor alle muren gebruikt. Trek dat van je voorraad af.'
  };
  const hint = question.kind==='table'?tableStrategy(question.factorA,question.factorB):mathHints[question.kind] || hints[question.topic];
  screen.innerHTML = `<p class="mission-intention">${captainGoals[mission.goal][0]} Mijn plan · ${captainGoals[mission.goal][1].toLowerCase()}</p><div class="mission-bar"><span>${question.kind==='table'?'🧠 Tafels tot 10':icon+' '+area}</span><span class="mission-step">Stap ${step} van ${mission.total}</span><button id="pause">Pauze</button></div>
  <section class="card arena" data-topic="${topics.indexOf(question.topic)}">
    <p class="label">${question.kind==='table'?`Tafel van ${question.factorA} · ${question.retry?'Nog een keer proberen':'Uit je hoofd'}`:`${skillLabel?esc(skillLabel)+' · ':''}${question.retry?'Tweede kans':question.topic} · niveau ${question.rank}`}</p><h2 tabindex="-1">${question.prompt}</h2>
    ${question.passage?`<blockquote>${question.title?`<span class="text-type">${question.icon} ${question.textType}</span><h3>${question.title}</h3>`:''}${question.passage}</blockquote>`:''}
    ${question.kind==='clock'?clockExerciseMarkup():''}
    ${question.readRemaining>0?`<div class="reading-gate"><p id="read-status" role="status">Lees rustig de tekst. Over ${question.readRemaining} seconden kun je antwoorden.</p><progress id="read-meter" class="meter" max="${question.readRequired}" value="${question.readRequired-question.readRemaining}" aria-label="Leestijd"></progress></div>`:''}
    ${question.inputMode?typedAnswerMarkup():''}
    <div class="choices" ${question.readRemaining>0||question.clockSet||question.inputMode?'hidden':''}>${shuffle(question.options).map((value,i)=>`<button ${question.readRemaining>0?'disabled':''}><span class="choice-key" aria-hidden="true">${'ABCD'[i]}</span><span class="choice-text">${esc(value)}</span></button>`).join('')}</div>
    <details class="hint"><summary>💡 Vraag Poko om een hint</summary><p>${hint}</p></details>
    <button class="lesson-button" id="lesson">▶ Uitleg met Poko</button><dialog id="lesson-dialog"></dialog>
    <div class="feedback" id="feedback" aria-live="polite"></div><div class="answer-actions">
      <button class="primary" id="next" hidden>Volgende vraag →</button>
      <button class="game-button" id="play-game" hidden>🎮 Kies je speelpauze</button>
    </div>
    <dialog id="game-dialog" aria-labelledby="game-title"></dialog>
  </section>
  <section class="practice-time">${goalMarkup()}</section>`;
  screen.querySelectorAll('.choices button').forEach(b=>b.onclick=()=>grade(b));
  bindTypedAnswer();
  if(question.kind==='clock')bindClock();
  screen.querySelector('#next').onclick=nextQuestion;
  screen.querySelector('#play-game').onclick=playAdventure;
  screen.querySelector('#pause').onclick=()=>show('home');
  screen.querySelector('#lesson').onclick=showLesson;
  screen.querySelector('.hint').ontoggle = event => {
    if (event.target.open && !answered) question.help = true;
  };
}
const clips = {
  plus: ['3tDBiUBiUQs', 'Optellen met tientallen en eenheden'],
  min: ['Wy6KOrsEUjo', 'Cijferend aftrekken'],
  story: ['ZmqrM5bQzTk', 'Een verhaalsom aanpakken'],
  signal: ['eNWKBtZZLBA', 'Signaalwoorden herkennen'],
  spelling: ['iQe1vuMTk-0', 'Taaljacht · De uitgangen -ig en -lijk']
};
function explain(q) {
  if(q.kind==='table')return {icon:'🧠',title:'Een handige som als startpunt',steps:[
    `${q.factorA} × ${q.factorB} betekent ${q.factorA} gelijke groepjes van ${q.factorB}.`,
    tableStrategy(q.factorA,q.factorB),
    'Zeg de hele keersom hardop. Probeer hem straks opnieuw uit je hoofd.'
  ]};
  if(q.kind==='clock')return {icon:'🕒',title:'De klok lezen in drie stappen',steps:[
    'Zoek de korte oranje wijzer. Die laat zien welk uur al begonnen is.',
    'De lange blauwe wijzer telt minuten. Elk cijfer verder is een sprong van vijf.',
    'Bij half vier is het vorige uur drie al begonnen: 3:30. Bij kwart voor vier is het 3:45.'
  ]};
  if (q.topic === 'Spelling') {
    const rules = {
      verlengen:['Maak het woord langer','Zeg bijvoorbeeld hond → honden.','Luister naar de letter die je nu duidelijk hoort: een d.','Schrijf die letter ook in het korte woord: hond.'],
      open:['Hoor je een lange klank?','Zeg het woord in klankgroepen: bo-men.','Aan het einde van bo hoor je een lange oo-klank.','Daar schrijf je één o. Controleer: bomen.'],
      dubbel:['Houd de korte klank kort','Zeg het woord in klankgroepen: bal-len.','De a is kort. Na deze korte klank komt een dubbele medeklinker.','Schrijf twee l’en: ballen. Lees het woord terug.']
    };
    if (rules[q.kind]) {
      const [title,...steps] = rules[q.kind];
      return {icon:'⚡',title,steps};
    }
    const long = q.word.endsWith('lijk');
    return { icon:'⚡', title: long ? 'De uitgang -lijk' : 'De uitgang -ig', clip:clips.spelling, steps: long ?
      ['Zeg: vrolijk. Je hoort aan het eind ongeveer «luk».','Kijk naar de hele uitgang: vro + lijk → vrolijk.','Probeer het met eer + lijk → eerlijk. Kijk bij je opdracht naar de laatste letters.'] :
      ['Zeg: jarig. Je hoort aan het eind ongeveer «ug».','Schrijf jar + ig → jarig. De uitgang is -ig.','Probeer het met zonn + ig → zonnig. Kijk bij je opdracht naar de laatste letters.'] };
  }
  if (q.topic === 'Begrijpend lezen') {
    const skills = {
      verwijswoorden:['Wie of wat bedoelt de schrijver?','Lees de zin met het verwijswoord, zoals die, hij of ze.','Lees één of twee zinnen terug. Wie of wat wordt daar genoemd?','Vul die naam of dat ding in de zin in. Klopt de betekenis?'],
      volgorde:['Wat gebeurt eerst?','Zoek woorden als eerst, dan, daarna en voordat.','Vertel de stappen in je eigen woorden.','Zoek de stap waar de vraag naar vraagt.'],
      woordbetekenis:['Gebruik de zinnen eromheen','Lees de zin met het moeilijke woord.','Lees ook de zin ervoor en erna. Welke aanwijzingen zie je?','Vul de mogelijke betekenis in en kijk of die past.'],
      'oorzaak en gevolg':['Wat gebeurt er en waardoor?','Zoek wat er gebeurt: dat is het gevolg.','Zoek waarom het gebeurt. Let op omdat, daarom en daardoor.','Controleer of de oorzaak echt in deze tekst staat.']
    };
    if (skills[q.skill]) {
      const [title,...steps]=skills[q.skill];
      return {icon:'🔎',title,steps,clip:q.skill==='volgorde'?clips.signal:null};
    }
    const titleQuestion = /titel|vooral bereiken/.test(q.prompt) || ['hoofdgedachte','tekstdoel'].includes(q.skill);
    const why = /waarom|afleiden/i.test(q.prompt);
    if (titleQuestion) return {icon:'📚',title:'Wat vertelt de hele tekst?',steps:['Denk: over wie of wat gaat het stukje?','Bedenk in één zin wat het belangrijkste is.','Kies de titel of bedoeling die bij het hele stukje past.']};
    if (why) return {icon:'🔍',title:'Speur naar aanwijzingen',steps:['Lees wat het personage doet of wat er gebeurt.','Zoek twee aanwijzingen vlak ervoor of erna.','Verbind die aanwijzingen. Welke keuze past bij allebei?']};
    return {icon:'🔎',title:'Zoek het bewijs in de tekst',steps:['Onderstreep in je hoofd het vraagwoord: wat, wanneer of hoeveel.','Zoek het woord of de gebeurtenis terug in de tekst.','Lees die zin helemaal. Kies het antwoord dat je kunt aanwijzen.'],clip:/eerst|vlak voor/i.test(q.prompt)?clips.signal:null};
  }
  const mathLessons = {
    divide:['Eerlijk verdelen','Er zijn 24 potloden en 6 bakjes. In elk bakje komt evenveel.','Zoek 6 × hoeveel = 24. Dat is 4.','Controleer: 6 bakjes met 4 potloden zijn samen 24.'],
    money:['Hoeveel krijg je terug?','Een boek kost €18. Je betaalt €30.','Vul aan: van 18 naar 20 is 2, van 20 naar 30 is 10.','Samen 12 euro terug. Controleer: 18 + 12 = 30.'],
    time:['Spring over de klok','Een les start om 14:30 en duurt 45 minuten.','Na 30 minuten is het 15:00. Er zijn nog 15 minuten over.','15 minuten verder is 15:15. Pas dit toe op jouw tijden.'],
    measure:['Van meters naar centimeters','Onthoud: 1 meter is 100 centimeter.','2 meter en 30 centimeter wordt 200 + 30 centimeter.','Dat is 230 centimeter. Controleer welke maat jouw vraag vraagt.']
  };
  if (mathLessons[q.kind]) {
    const [title,...steps]=mathLessons[q.kind];
    return {icon:'🧠',title,steps};
  }
  if (q.kind==='ratio') return {icon:'🧱',title:'Rekenen met gelijke groepjes',steps:['Stel je 3 kisten voor met 4 blokken per kist.','Tel 4 + 4 + 4. Dat kan korter: 3 × 4.','Dat is 12. Hoeveel kisten en blokken per kist staan in jouw opdracht?'],clip:clips.story};
  if (q.kind==='multi') return {icon:'🏗️',title:'Los een som op in twee stappen',steps:['Je hebt 40 blokken en bouwt 3 muren met elk 8 blokken.','Eerst: 3 × 8 = 24 blokken voor de muren.','Daarna: 40 − 24 = 16 blokken over. Doe nu hetzelfde met jouw getallen.'],clip:clips.story};
  if (q.kind==='plus') return {icon:'➕',title:'Tel op in twee sprongen',steps:['Neem 34 + 27. Splits 27 in 20 en 7.','Spring eerst 20 vooruit: 34 + 20 = 54.','Spring nog 7 vooruit: 54 + 7 = 61. Splits nu het tweede getal van jouw som.'],clip:clips.plus};
  return {icon:'➖',title:'Trek af in twee sprongen',steps:['Neem 63 − 25. Splits 25 in 20 en 5.','Spring eerst 20 terug: 63 − 20 = 43.','Spring nog 5 terug: 43 − 5 = 38. Splits nu het tweede getal van jouw som.'],clip:clips.min};
}
function showLesson() {
  if (!answered) question.help = true;
  const model = explain(question);
  const modal = screen.querySelector('#lesson-dialog');
  let step = 0;
  modal.innerHTML = `<div class="lesson-top"><span class="label">Sensei Poko legt uit</span><button id="lesson-close" aria-label="Sluit uitleg">✕</button></div>
    <h2>${model.title}</h2><div class="lesson-scene" aria-live="polite"></div>
    <div class="lesson-actions"><button id="lesson-back">← Terug</button><button id="lesson-next" class="primary"></button></div>
    ${model.clip?`<details class="video"><summary>▶ Video · ${model.clip[1]}</summary><div class="player"></div><a href="https://www.youtube.com/watch?v=${model.clip[0]}" target="_blank" rel="noopener noreferrer">Open de video op YouTube ↗</a></details>`:''}`;
  const scene = modal.querySelector('.lesson-scene');
  const next = modal.querySelector('#lesson-next');
  const back = modal.querySelector('#lesson-back');
  function draw() {
    scene.innerHTML = `<span aria-hidden="true">${model.icon}</span><div><small>Stap ${step+1} van ${model.steps.length}</small><p>${model.steps[step]}</p></div>`;
    back.disabled = step === 0;
    next.textContent = step === model.steps.length-1 ? 'Terug naar de opdracht' : 'Volgende stap →';
  }
  const video = modal.querySelector('.video');
  if (video) video.ontoggle = () => {
    if (!modal.open) return;
    video.querySelector('.player').innerHTML = video.open ?
      `<iframe title="${model.clip[1]}" src="https://www.youtube-nocookie.com/embed/${model.clip[0]}?rel=0" allow="fullscreen; encrypted-media" allowfullscreen></iframe>`:'';
  };
  back.onclick = () => { step--; draw(); };
  next.onclick = () => { if (step === model.steps.length-1) modal.close(); else { step++; draw(); } };
  modal.querySelector('#lesson-close').onclick = () => modal.close();
  modal.onclose = () => { modal.replaceChildren(); lastInput = lastTick = Date.now(); screen.querySelector('#lesson').focus(); };
  draw();
  modal.showModal();
}
function feedbackFor() {
  const specific=specificMistakeFeedback(question.selectedAnswer);
  if(specific)return esc(specific);
  if(question.kind==='clock')return 'Bekijk eerst de korte uurwijzer en tel daarna de minuten. Poko’s kloktrucjes helpen je.';
  if(question.topic===topics[1]) return 'Lees de spellingregel en vergelijk de letters in beide woorden.';
  if(question.topic===topics[2]) return 'Je antwoord past minder goed bij de aanwijzingen in de tekst. Zoek welke zin je keuze ondersteunt.';
  if(question.kind==='ratio') return 'Controleer of je gelijke groepjes hebt vermenigvuldigd.';
  if(question.kind==='multi') return 'Controleer of je alle muren hebt meegerekend. Trek daarna het totale aantal gebruikte blokken af.';
  if (['divide','money','time','measure'].includes(question.kind)) return 'Bekijk het voorbeeld bij Uitleg met Poko en controleer de stappen in jouw som.';
  return 'Controleer het reken­teken en splits het tweede getal in tientallen en losse eenheden.';
}
function grade(button, selectedAnswer) {
  if(answered || question.readRemaining>0) return;
  answered = true;
  const selected = selectedAnswer ?? button.querySelector('.choice-text').textContent;
  question.selectedAnswer=selected;
  const correct = selected===question.answer;
  if(correct)playSound('correct');
  const event = {id:crypto.randomUUID(),at:Date.now(),topic:question.topic,correct,retry:question.retry,rank:question.rank,skill:question.skill || question.kind,help:question.help};
  if(question.kind==='table')Object.assign(event,{factKey:question.factKey,factorA:question.factorA,factorB:question.factorB,durationMs:question.activeMs+Math.max(0,Math.min(2500,Date.now()-lastTick)),fluencyEligible:!question.fluencyInterrupted});
  if(question.inputMode==='spelling')Object.assign(event,{word:question.word,written:selected});
  day().events.push(event);
  mission.events.push(event);
  todayEarned();
  save();
  screen.querySelectorAll('#typed-answer-form input,#typed-answer-form button').forEach(control=>control.disabled=true);
  document.querySelector('.practice-time').innerHTML = goalMarkup();
  mission.steps++;
  if (correct) mission.stars++;
  if (!correct) pending = question;
  for (const option of screen.querySelectorAll('.choices button')) {
    if (option.querySelector('.choice-text').textContent === question.answer) option.classList.add('right-answer');
  }
  if (!correct) button.classList.add('chosen-answer');
  screen.querySelector('.hint').hidden = true;
  screen.querySelectorAll('.choices button').forEach(b=>b.disabled=true);
  screen.querySelectorAll('.clock-controls button').forEach(b=>b.disabled=true);
  const message = correct ? (question.retry ? '🌱 Je nieuwe poging is gelukt. Je gebruikte wat je net leerde.' :
    question.help ? '💡 Je gebruikte hulp en vond het antwoord. Dat is een slimme keuze.' :
    '⭐ Dat klopt. Kijk naar de uitleg en vergelijk die met jouw aanpak.') :
    `Je ${question.inputMode?'schreef':'koos'} “${esc(selected)}”. Het juiste antwoord is “${esc(question.answer)}”. ${feedbackFor()}`;
  const coins=!question.retry?5:correct?2:0;
  screen.querySelector('#feedback').innerHTML = `<div class="coin-earned">${coins?'+ '+coins+' ◈ bouwmunten':'🌱 Je oefent verder'}</div><strong>${message}</strong><p>${question.explanation}</p>${!correct?'<p class=coach-note>Een fout geeft je een volgende stap. Kies de uitleg of probeer een soortgelijke opdracht.</p>':''}`;
  if(question.kind==='clock'&&!correct){
    screen.querySelector('#feedback').innerHTML+=clockFaceMarkup(question.clockTarget,'answer-clock');
  }
  const next = screen.querySelector('#next');
  next.hidden = false;
  screen.querySelector('#play-game').hidden = false;
  const canRetry = !correct && mission.steps + mission.queue.length < mission.total*2;
  next.textContent = canRetry ? 'Probeer een soortgelijke vraag →' :
    mission.queue.length ? 'Volgende opdracht' : 'Bekijk je missieresultaat';
  const feedback = screen.querySelector('#feedback');
  feedback.setAttribute('tabindex','-1');
  feedback.focus();
}
function monday() {
  const date = new Date(dateKey()+'T12:00:00Z');
  date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);
  return date;
}
let weekOffset = 0;
function report() {
  const start = monday(); start.setUTCDate(start.getUTCDate()+weekOffset*7);
  const dates = Array.from({length:7},(_,i)=>dateKey(new Date(start.getTime()+i*86400000)));
  const records = dates.map(d=>state.days[d]??{seconds:0,events:[]});
  const all = records.flatMap(d=>d.events);
  const total = records.reduce((sum,d)=>sum+d.seconds,0);
  const first = all.filter(e=>!e.retry);
  const retry = all.filter(e=>e.retry);
  const weekEarned = euro(records);
  const tableFirst=first.filter(event=>event.skill==='tafels');
  const tableRows=tableSummary();
  screen.innerHTML = `<section class="card"><p class="label">Voor jou en thuis</p><h1>Weekrapport</h1><p>${dates[0]} t/m ${dates[6]}</p>
  <button id="earlier" aria-label="Vorige week">← Vorige week</button> <button id="later" ${weekOffset===0?'disabled':''}>Volgende week →</button>
  <div class="grid"><div class="card stat"><strong>${timerText(total)}</strong>min:sec geoefend</div><div class="card stat"><strong>${first.filter(e=>e.correct).length}/${first.length}</strong>in één keer goed</div><div class="card stat"><strong>€${weekEarned}</strong>deze week verdiend</div></div>
  <table><thead><tr><th>Vak</th><th>Eerste poging goed</th></tr></thead><tbody>${topics.map(t=>{const entries=first.filter(e=>e.topic===t);return `<tr><td>${t}</td><td>${entries.filter(e=>e.correct).length} / ${entries.length}</td></tr>`}).join('')}</tbody></table>
  <section class="report-growth"><h2>Tafels tot en met 10</h2><p>Deze week: ${tableFirst.length} tafelsommen, waarvan ${tableFirst.filter(event=>event.correct).length} in één keer goed. Deze sommen tellen ook mee bij Rekenen.</p><table><thead><tr><th>Tafel</th><th>3× zelfstandig goed</th><th>Op meerdere dagen vlot</th></tr></thead><tbody>${tableRows.map(row=>`<tr><td>${row.table}</td><td>${row.known}/10</td><td>${row.fluent}/10</td></tr>`).join('')}</tbody></table><p class="muted">De tabel toont alle bewaarde oefendagen. “Vlot” betekent hier: de laatste drie eerste pogingen goed, zonder hint of onderbreking, elk binnen zes seconden, op minstens twee dagen. Dit is een oefensignaal, geen schooltoets.</p></section>
  <section class="report-growth"><h2>Zelfvertrouwen door oefenen</h2>
    <p>${all.filter(e=>e.help).length} keer hulp gebruikt · ${retry.filter(e=>e.correct).length} herkansingen gelukt · ${records.reduce((sum,d)=>sum+(d.reflections?.length||0),0)} missies teruggekeken.</p>
    <p>Bespreek samen: “Welke aanpak hielp jou? Wat wil je de volgende keer proberen?”</p></section>
  <p>Samen goed doen · ${kindnessRecords().filter(record=>dates.includes(record.date)).length} bijdragen deze week. Helpacties zijn door het kind zelf ingevuld.</p>
  <p>Herkansingen goed · ${retry.filter(e=>e.correct).length} / ${retry.length}</p>
  <table><thead><tr><th>Dag</th><th>Oefentijd</th><th>Opdrachten</th><th>Beloning</th></tr></thead><tbody>${records.map((d,i)=>`<tr><td>${['Ma','Di','Wo','Do','Vr','Za','Zo'][i]} ${dates[i].slice(8)}</td><td>${timerText(d.seconds)}</td><td>${completed(d)}${d.target ? ' / '+d.target : ''}</td><td>${earned(d)?'€1':'—'}</td></tr>`).join('')}</tbody></table>
  <details class="school-notes"><summary>Wat oefent je kind?</summary><p>Het dagelijkse accent ligt op tafels 1 tot en met 10, spelling en rekenen. Een gemengde ronde bevat zes tafelsommen, drie spellingwoorden om zelf te schrijven, twee rekenopdrachten en één leesopdracht. Bij tafels vult het kind het antwoord zelf in. Lastige feiten komen later terug; herhaling over meerdere dagen blijft nodig.</p><p>Spelling oefent -ig/-lijk, verlengen en open en gesloten klankgroepen. De browser kan het woord en de voorbeeldzin voorlezen. Als het kind het woord bekijkt, wordt dat als hulp opgeslagen. Alleen bij begrijpend lezen geldt leestijd vóór het antwoorden. Klokkijken blijft apart beschikbaar.</p><p>De teksten en rekenopdrachten passen bij aanvullend oefenen in groep 5. De gebruikte methode en lesweek van school zijn nog onbekend. De niveaus volgen de laatste acht eerste pogingen per vak; tafelfeiten hebben een eigen voortgang.</p><p>Naam en voortgang staan in deze browser. De site verstuurt het weekrapport niet automatisch.</p></details>
  <p class="muted">De site houdt het tegoed bij. Thuis regelen jullie de uitbetaling.</p><button id="print">Afdrukken / opslaan als PDF</button></section>`;
  screen.querySelector('#earlier').onclick=()=>{weekOffset--;report();};
  screen.querySelector('#later').onclick=()=>{if(weekOffset<0)weekOffset++;report();};
  screen.querySelector('#print').onclick=()=>window.print();
}
function settings() {
  screen.innerHTML=`<section class="card"><h1>Mijn stijl</h1><form><label>Naam <input name="player" minlength="2" maxlength="24" required value="${esc(state.name)}"></label><label>Dojo-kleur <select name="theme"><option value="forest">Limoengroen</option><option value="ocean">IJsblauw</option><option value="ember">Vuuroranje</option></select></label><label>Jouw teken <select name="avatar"><option>🥋</option><option>🧱</option><option>⚡</option><option>🐉</option></select></label><label>Dagdoel opdrachten <input name="target" type="number" min="1" max="60" required value="${state.target}"></label><button class="primary">Bewaar instellingen</button></form><p class="muted">Je stijl en voortgang worden in deze browser bewaard.</p></section>`;
  const form=screen.querySelector('form');
  form.elements.theme.value=state.theme; form.elements.avatar.value=state.avatar;
  form.onchange=()=>{ document.body.dataset.theme=form.elements.theme.value; };
  form.onsubmit=event=>{
    event.preventDefault();
    state.name=form.elements.player.value.trim() || 'judoka';
    renameLocalProfile(state.name);
    state.theme=form.elements.theme.value;state.avatar=form.elements.avatar.value;
    state.target = Number(form.elements.target.value);
    if (!day().earned) day().target = state.target;
    todayEarned();
    save();show('home');
  };
}
function advanceReadingTime() {
  if(!question || answered || question.readRemaining<=0)return;
  question.readRemaining--;
  const status=screen.querySelector('#read-status');
  const meter=screen.querySelector('#read-meter');
  if(meter)meter.value=question.readRequired-question.readRemaining;
  if(question.readRemaining===0){
    screen.querySelector('.choices').hidden=false;
    screen.querySelectorAll('.choices button').forEach(button=>button.disabled=false);
    if(status)status.textContent='Je kunt nu antwoorden. Zoek het bewijs in de tekst.';
  } else if(status)status.textContent=`Lees rustig de tekst. Nog ${question.readRemaining} seconden leestijd.`;
}
document.addEventListener('pointerdown',enableSound,{passive:true});
document.addEventListener('keydown',enableSound);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&question&&!answered)question.fluencyInterrupted=true;});
document.querySelector('#sound-toggle').onclick=()=>{
  state.sound=state.sound===false;
  save();updateSoundButton();enableSound();
  if(state.sound)playSound('correct');
};
updateSoundButton();
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>show(b.dataset.view));
['keydown','pointerdown','scroll'].forEach(type=>document.addEventListener(type,()=>{if(view==='practice')lastInput=Date.now();},{passive:true}));
setInterval(()=>{
  const now=Date.now(), elapsed=now-lastTick;
  lastTick=now;
  const interrupted=document.hidden||document.querySelector('.arena dialog[open]')||now-lastInput>90000||elapsed>2500;
  if(view==='practice'&&question&&!answered){
    if(interrupted)question.fluencyInterrupted=true;
    else question.activeMs+=elapsed;
  }
  if(view!=='practice'||interrupted)return;
  advanceReadingTime();
  const current=day();
  current.seconds++;
  todayEarned();
  save();
  const clock=document.querySelector('#clock');
  if(clock)clock.textContent=`⏱ ${timerText(current.seconds)} / 15:00 oefenen`;
  const reward = document.querySelector('#reward-status');
  if (reward && earned(current)) reward.textContent = '🪙 €1 verdiend!';
  const meter=document.querySelector('#meter');
  if(meter)meter.value=current.seconds;
},1000);
document.querySelector('#profile-toggle').onclick=lockLocalProfile;
profileGate();
