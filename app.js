'use strict';
const topics = ['Rekenen', 'Spelling', 'Begrijpend lezen'];
const key = 'dojo-level-up-v1';
const defaultTarget = 9;
const fresh = { target: defaultTarget, name: 'judoka', theme: 'forest', avatar: '🥋', days: {}, paid: {} };
let state = structuredClone(fresh);
try { state = { ...state, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch {}
const worlds = { 'Rekenen': ['🧱', 'Blokkenbouw'], 'Spelling': ['⚡', 'Woordenwerkplaats'], 'Begrijpend lezen': ['🔍', 'Verhalenexpeditie'] };
let mission = null;
let view = 'home', question, pending, answered, lastInput = 0, lastTick = Date.now();
const screen = document.querySelector('#screen');
const save = () => localStorage.setItem(key, JSON.stringify(state));
const dateKey = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(date);
const rollout = state.rollout ??= dateKey();
const day = () => state.days[dateKey()] ??= { seconds: 0, events: [], target: state.target };
const completed = record => record.events.filter(event => !event.retry).length;
const earned = record => record.earned || (record.seconds >= 900 && completed(record) >= (record.target ?? 0));
const euro = days => days.filter(earned).length;
const todayEarned = () => {
  const record = day();
  record.target ??= state.target;
  if (earned(record)) record.earned = true;
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
  const recent = events().filter(e => e.topic === topic && !e.retry).slice(-8);
  const score = recent.filter(e => e.correct).length;
  return score >= 7 ? 3 : score >= 4 ? 2 : 1;
};
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
const reading = [
  ['Mila bindt haar judoband vast. Op de mat ziet ze een nieuw kind helemaal alleen staan. Mila loopt erheen en vraagt of ze samen zullen opwarmen. Het kind glimlacht en knikt.',[
    ['Wat doet Mila vlak voor ze naar het kind gaat?','Ze ziet het kind alleen staan.','Ze warmt samen op.','Ze gaat naar huis.','Kijk naar de tweede zin. Daar staat wat Mila ziet voordat ze in actie komt.'],
    ['Waarom vraagt Mila dit waarschijnlijk?','Ze wil dat het kind mee kan doen.','Ze zoekt haar band.','Ze wil de training overslaan.','Verbind de aanwijzing “helemaal alleen” met het aanbod om samen op te warmen.']]],
  ['In een bouwspel maakt Dani een brug. Bij de eerste proef zakt die in het midden door. Dani zet daar twee extra steunpilaren neer. Nu komt de hele ploeg veilig aan de overkant.',[
    ['Wat verandert Dani na de eerste proef?','Dani voegt twee steunpilaren toe.','Dani maakt de brug smaller.','Dani stopt met bouwen.','Zoek de zin direct na het probleem. Die vertelt wat Dani verandert.'],
    ['Wat past het best als titel?','Een slimme oplossing voor een zwakke brug','De snelste speler van het spel','Hoe je een rivier vindt','Een titel vat het probleem én de oplossing samen. De brug zakt door en Dani herstelt die.']]],
  ['Ravi vindt een egel onder een stapel bladeren. Hij wil de bladeren opruimen, maar zijn buur legt uit dat de egel er schuilt. Ravi veegt alleen het tegelpad schoon en laat de stapel liggen.',[
    ['Wat ruimt Ravi wél op?','Hij maakt het tegelpad schoon.','Hij haalt de stapel weg.','Hij verplaatst de egel.','Lees de laatste zin. Daar staat wat Ravi opruimt en wat hij laat liggen.'],
    ['Waarom laat Ravi de bladeren liggen?','Ze zijn een schuilplek voor de egel.','Hij kan de bezem niet vinden.','De buur wil op het pad spelen.','Let op het woord “schuilt”. De stapel beschermt de egel.']]],
  ['De bibliotheek houdt woensdag een ruilmiddag. Neem maximaal drie boeken mee die je al uit hebt. De boeken moeten heel en schoon zijn. Om drie uur begint het ruilen.',[
    ['Hoeveel boeken mag je maximaal meenemen?','Drie','Eén','Vier','“Maximaal” betekent: zoveel mag, minder mag ook. Zoek het getal er direct achter.'],
    ['Wat wil de tekst vooral bereiken?','Vertellen hoe je mee kunt doen aan de ruilmiddag.','Uitleggen hoe je een boek schrijft.','Een spannend verhaal over boeken vertellen.','De tekst noemt een dag, een tijd en regels. Dat zijn aanwijzingen voor een praktische mededeling.']]],
  ['Aya pakt haar tas. De zon schijnt, maar aan de rand van het plein hangen donkere wolken. Ze stopt toch een regenjas in haar tas. Op de terugweg blijft alleen Aya droog.',[
    ['Wat stopt Aya in haar tas?','Een regenjas','Een handdoek','Een paraplu','Zoek in de derde zin wat Aya inpakt.'],
    ['Wat kun je afleiden uit de laatste zin?','Op de terugweg regent het.','Aya heeft haar tas verloren.','De zon schijnt de hele dag.','Combineer de donkere wolken met “blijft droog”. De schrijver geeft aanwijzingen zonder de regen letterlijk te noemen.']]],
  ['Bij de judoclub kunnen kinderen vrijdag een vriend meenemen. De trainer heeft leenpakken klaargelegd. De gasten oefenen eerst met vallen op een dikke mat. Daarna kijken ze naar een korte demonstratie.',[
    ['Wat doen de gasten eerst?','Ze oefenen met vallen.','Ze kijken naar een demonstratie.','Ze wassen de leenpakken.','“Eerst” geeft de volgorde aan. Zoek wat direct daarna wordt genoemd.'],
    ['Waarom heeft de trainer waarschijnlijk leenpakken klaargelegd?','Gasten hebben mogelijk zelf geen judopak.','De mat is nat.','Iedereen krijgt een pak cadeau.','Een leenpak gebruik je tijdelijk. De tekst gaat over gasten die kunnen meedoen.']]]
];
function build(topic, rank, previous) {
  if(topic === topics[0]) {
    const a = number(rank * 24,rank * 65), b = number(8,rank * 20);
    const kind = previous?.kind ?? pick(rank === 3 ? ['plus','min','ratio','multi'] : ['plus','min','ratio']);
    if(kind === 'ratio') {
      const per = number(3,rank+6), groups = number(3,rank+7);
      return math(kind, `In elke kist zitten ${per} bouwblokken. Hoeveel blokken zitten in ${groups} kisten?`, per * groups,
        `Je hebt ${groups} gelijke groepjes van ${per}. Reken ${groups} × ${per}. Weet je het niet uit je hoofd? Tel ${per} steeds erbij.`, [per+groups, per*(groups-1), per*(groups+1)]);
    }
    if(kind === 'multi') {
      return math(kind,`Je hebt ${a} blokken. Je bouwt 3 muren met elk ${b} blokken. Hoeveel blokken houd je over?`,a-3*b > 0 ? a-3*b : 0,
        `Bereken eerst 3 × ${b} = ${b*3}. Trek dat aantal daarna van ${a} af.`,[a-b,a+b,a-2*b],a>3*b ? null : () => build(topic,rank,{kind}));
    }
    const plus = kind === 'plus';
    const prompt = rank === 1 && Math.random() < .5 ? `Hoeveel is ${a} ${plus ? '+' : '−'} ${b}?` : plus ?
      `Je vindt ${a} munten en krijgt er nog ${b}. Hoeveel heb je samen?` :
      `Je hebt ${a+b} munten en geeft er ${b} uit. Hoeveel houd je over?`;
    const start = !plus && !prompt.startsWith('Hoeveel') ? a+b : a;
    const sign = plus ? 1 : -1, goal = start + sign*b, tens = b - b%10;
    return math(kind,prompt,goal,`Begin bij ${start}. ${plus ? 'Tel' : 'Haal'} eerst ${tens} ${plus ? 'erbij' : 'eraf'}. Doe daarna hetzelfde met ${b%10}. Controleer of je uitkomst ${plus ? 'groter' : 'kleiner'} is dan ${start}.`,[start-sign*b,goal+10,goal-1]);
  }
  if(topic === topics[1]) {
    const [word,sentence] = pick(spelling.filter(([w]) => !previous || previous.word !== w && w.endsWith(previous.word.endsWith('lijk') ? 'lijk' : 'ig')));
    const ending = word.endsWith('lijk') ? 'lijk' : 'ig';
    const stem = word.slice(0,-ending.length);
    return {word, prompt:rank===1?'Welk woord is goed gespeld?':'Welk woord hoort op de lege plek?', passage:rank===1?'':sentence,
      answer:word, options:[word,stem+(ending==='lijk'?'luk':'ug'),stem+(ending==='lijk'?'leik':'ich')],
      explanation:`De vaste uitgang is -${ending}. Je hoort vaak een korte ‘uh’-klank, maar schrijft ${ending}. Zeg het woord en kijk daarna extra goed naar de laatste letters.`};
  }
  const [passage,items] = pick(reading.filter(([story]) => story !== previous?.passage));
  const kinds = reading[0][1].map((_,i)=>i);
  const kind = previous?.kind ?? (rank===1?pick(kinds):1);
  const [prompt,answer,wrong1,wrong2,explanation] = items[kind];
  return {kind,passage,prompt,answer,options:[answer,wrong1,wrong2],explanation};
}
function math(kind,prompt,answer,explanation,wrong,retry) {
  if(retry) return retry();
  return {kind,prompt,answer:String(answer),options:[answer,...new Set(wrong.filter(n=>n!==answer && n>=0))].map(String),explanation};
}
function show(next) {
  view = next;
  document.body.dataset.theme = state.theme;
  document.querySelectorAll('nav button').forEach(b => b.setAttribute('aria-current',b.dataset.view===view?'page':'false'));
  if(view==='home') home();
  if(view==='report') report();
  if(view==='settings') settings();
  if(view==='practice') practice();
  if(view==='finish') finish();
}
function timerText(seconds) { return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`; }
function goalMarkup() {
  const record = day();
  const target = record.target ?? state.target;
  const count = completed(record);
  return `<div class="quest-goals">
    <div><p id="clock">⏱ ${timerText(record.seconds)} / 15:00 oefenen</p><progress id="meter" class="meter" aria-label="Actieve oefentijd vandaag" max="900" value="${record.seconds}"></progress></div>
    <div><p>🧩 ${count} / ${target} opdrachten</p><progress class="meter" aria-label="Opdrachten vandaag" max="${target}" value="${count}"></progress></div>
    </div><p id="reward-status" class="reward-status">${earned(record)?'🪙 €1 verdiend!':'🔒 Haal beide doelen voor €1'}</p>`;
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
      <p>Drie opdrachten. Drie eilanden. Spring je mee?</p>
      <button class="primary" id="start">${mission?'Ga verder met je missie':'▶ Start je missie'} <span aria-hidden="true">→</span></button></div>
    </section>
    <section class="status-strip" aria-label="Jouw voortgang">
      <div><span class="status-icon">⭐</span><strong>${stars}</strong><span>verdiende sterren</span></div>
      <div><span class="status-icon">${belt[0]}</span><strong>${belt[1]}</strong><span>${nextBelt?`nog ${nextBelt[2]-stars} tot ${nextBelt[1].toLowerCase()}`:'hoogste band'}</span></div>
      <div><span class="status-icon">🪙</span><strong>€${euro(Object.values(state.days))}</strong><span>totaal verdiend</span></div>
    </section>
    <div class="dashboard"><section class="journey"><h2>De eilanden</h2><div class="worlds">${topics.map(t=>`<article class="world"><span class="world-icon" aria-hidden="true">${worlds[t][0]}</span><h3>${worlds[t][1]}</h3><span>${t} · niveau ${level(t)}/3</span><progress class="meter" max="3" value="${level(t)}" aria-label="${t} niveau"></progress></article>`).join('')}</div></section>
    <section class="card daily"><p class="label">🪙 Jouw dagdoel</p><h2><span aria-hidden="true">🎁</span> Open de schatkist</h2>${goalMarkup()}</section></div>`;
  document.querySelector('#start').onclick = startMission;
}
function startMission() {
  if (mission && !answered) {
    lastInput = lastTick = Date.now();
    show('practice');
    return;
  }
  mission ??= { queue: shuffle(topics), steps: 0, stars: 0 };
  nextQuestion();
}
function finish() {
  const stars = '⭐'.repeat(Math.min(6, mission.stars));
  screen.innerHTML = `<section class="hero finish"><img class="hero-art" src="dojo-world.webp" alt=""><div class="hero-content">
  <p class="label">Missie voltooid</p><h1>High five!</h1><p>${stars || '🥋'} ${mission.stars} ${mission.stars===1?'ster':'sterren'} erbij. Je hebt alle drie de eilanden bezocht.</p>
  <button class="primary" id="again">Speel nog een missie →</button> <button id="rest">Naar de dojo</button></div></section>
  <section class="card daily"><h2>Dagdoel</h2>${goalMarkup()}</section>`;
  mission = null;
  document.querySelector('#again').onclick = startMission;
  document.querySelector('#rest').onclick = () => show('home');
  screen.querySelector('h1').setAttribute('tabindex','-1');
  screen.querySelector('h1').focus();
}
function nextQuestion() {
  const retry = pending;
  if (!mission.queue.length && (!retry || mission.steps >= 6)) {
    pending = null;
    show('finish');
    return;
  }
  const canRetry = retry && (mission.steps + mission.queue.length < 6);
  const topic = canRetry ? retry.topic : mission.queue.shift();
  const rank = level(topic);
  question = {...build(topic,rank,canRetry ? retry : null),topic,rank,retry:Boolean(canRetry)};
  pending = null;
  answered = false;
  lastInput = Date.now();
  lastTick = lastInput;
  show('practice');
  screen.querySelector('h2').focus();
}
function practice() {
  const [icon, area] = worlds[question.topic];
  const step = 3 - mission.queue.length;
  const hints = {
    'Rekenen': 'Lees wat er met de blokken of munten gebeurt. Welk rekenteken past daarbij?',
    'Spelling': 'Zeg de woorden zachtjes en kijk extra goed naar de laatste letters.',
    'Begrijpend lezen': 'Lees de vraag en zoek in het verhaal naar een aanwijzing.'
  };
  screen.innerHTML = `<div class="mission-bar"><span>${icon} ${area}</span><div class="pips" aria-label="Eiland ${step} van 3">${[1,2,3].map(i=>`<span class="${i<step?'done':i===step?'current':''}" aria-hidden="true">${i<step?'✓':i}</span>`).join('')}</div><button id="pause">Pauze</button></div>
  <section class="card arena" data-topic="${topics.indexOf(question.topic)}">
    <p class="label">${question.retry?'Tweede kans':question.topic} · niveau ${question.rank}</p><h2 tabindex="-1">${question.prompt}</h2>
    ${question.passage?`<blockquote>${question.passage}</blockquote>`:''}
    <div class="choices">${shuffle(question.options).map((value,i)=>`<button><span class="choice-key" aria-hidden="true">${'ABCD'[i]}</span><span class="choice-text">${esc(value)}</span></button>`).join('')}</div>
    <details class="hint"><summary>💡 Vraag Poko om een hint</summary><p>${hints[question.topic]}</p></details>
    <button class="lesson-button" id="lesson">▶ Uitleg met Poko</button><dialog id="lesson-dialog"></dialog>
    <div class="feedback" id="feedback" aria-live="polite"></div><div class="answer-actions">
      <button class="primary" id="next" hidden>Volgende vraag →</button>
      <button class="game-button" id="play-game" hidden>⭐ Speel Sterrensprong</button>
    </div>
    <dialog id="game-dialog" aria-labelledby="game-title"></dialog>
  </section>
  <section class="practice-time">${goalMarkup()}</section>`;
  screen.querySelectorAll('.choices button').forEach(b=>b.onclick=()=>grade(b));
  screen.querySelector('#next').onclick=nextQuestion;
  screen.querySelector('#play-game').onclick=playStarJump;
  screen.querySelector('#pause').onclick=()=>show('home');
  screen.querySelector('#lesson').onclick=showLesson;
}
const clips = {
  plus: ['3tDBiUBiUQs', 'Optellen met tientallen en eenheden'],
  min: ['Wy6KOrsEUjo', 'Cijferend aftrekken'],
  story: ['ZmqrM5bQzTk', 'Een verhaalsom aanpakken'],
  signal: ['eNWKBtZZLBA', 'Signaalwoorden herkennen'],
  spelling: ['iQe1vuMTk-0', 'Taaljacht · De uitgangen -ig en -lijk']
};
function explain(q) {
  if (q.topic === 'Spelling') {
    const long = q.word.endsWith('lijk');
    return { icon:'⚡', title: long ? 'De uitgang -lijk' : 'De uitgang -ig', clip:clips.spelling, steps: long ?
      ['Zeg: vrolijk. Je hoort aan het eind ongeveer «luk».','Kijk naar de hele uitgang: vro + lijk → vrolijk.','Probeer het met eer + lijk → eerlijk. Kijk bij je opdracht naar de laatste letters.'] :
      ['Zeg: jarig. Je hoort aan het eind ongeveer «ug».','Schrijf jar + ig → jarig. De uitgang is -ig.','Probeer het met zonn + ig → zonnig. Kijk bij je opdracht naar de laatste letters.'] };
  }
  if (q.topic === 'Begrijpend lezen') {
    const titleQuestion = /titel|vooral bereiken/.test(q.prompt);
    const why = /waarom|afleiden/i.test(q.prompt);
    if (titleQuestion) return {icon:'📚',title:'Wat vertelt de hele tekst?',steps:['Denk: over wie of wat gaat het stukje?','Bedenk in één zin wat het belangrijkste is.','Kies de titel of bedoeling die bij het hele stukje past.']};
    if (why) return {icon:'🔍',title:'Speur naar aanwijzingen',steps:['Lees wat het personage doet of wat er gebeurt.','Zoek twee aanwijzingen vlak ervoor of erna.','Verbind die aanwijzingen. Welke keuze past bij allebei?']};
    return {icon:'🔎',title:'Zoek het bewijs in de tekst',steps:['Onderstreep in je hoofd het vraagwoord: wat, wanneer of hoeveel.','Zoek het woord of de gebeurtenis terug in de tekst.','Lees die zin helemaal. Kies het antwoord dat je kunt aanwijzen.'],clip:/eerst|vlak voor/i.test(q.prompt)?clips.signal:null};
  }
  if (q.kind==='ratio') return {icon:'🧱',title:'Rekenen met gelijke groepjes',steps:['Stel je 3 kisten voor met 4 blokken per kist.','Tel 4 + 4 + 4. Dat kan korter: 3 × 4.','Dat is 12. Hoeveel kisten en blokken per kist staan in jouw opdracht?'],clip:clips.story};
  if (q.kind==='multi') return {icon:'🏗️',title:'Los een som op in twee stappen',steps:['Je hebt 40 blokken en bouwt 3 muren met elk 8 blokken.','Eerst: 3 × 8 = 24 blokken voor de muren.','Daarna: 40 − 24 = 16 blokken over. Doe nu hetzelfde met jouw getallen.'],clip:clips.story};
  if (q.kind==='plus') return {icon:'➕',title:'Tel op in twee sprongen',steps:['Neem 34 + 27. Splits 27 in 20 en 7.','Spring eerst 20 vooruit: 34 + 20 = 54.','Spring nog 7 vooruit: 54 + 7 = 61. Splits nu het tweede getal van jouw som.'],clip:clips.plus};
  return {icon:'➖',title:'Trek af in twee sprongen',steps:['Neem 63 − 25. Splits 25 in 20 en 5.','Spring eerst 20 terug: 63 − 20 = 43.','Spring nog 5 terug: 43 − 5 = 38. Splits nu het tweede getal van jouw som.'],clip:clips.min};
}
function showLesson() {
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
function feedbackFor(selected) {
  if(question.topic===topics[1]) return 'Je koos een andere schrijfwijze van de uitgang. Lees de laatste letters terug.';
  if(question.topic===topics[2]) return 'Je antwoord past minder goed bij de aanwijzingen in de tekst. Zoek welke zin je keuze ondersteunt.';
  if(question.kind==='ratio') return 'Controleer of je gelijke groepjes hebt vermenigvuldigd.';
  if(question.kind==='multi') return 'Controleer of je alle drie de muren hebt meegerekend.';
  return 'Controleer het reken­teken en splits het tweede getal in tientallen en losse eenheden.';
}
function grade(button) {
  if(answered) return;
  answered = true;
  const selected = button.querySelector('.choice-text').textContent;
  const correct = selected===question.answer;
  day().events.push({topic:question.topic,correct,retry:question.retry,rank:question.rank});
  todayEarned();
  save();
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
  const message = correct ? '⭐ +1 ster · ' + pick(['Raak!','Goed gezien!','Punt voor jou!','Netjes. Zelfs de judomat klapt mee!']) :
    `Je koos “${esc(selected)}”. Het juiste antwoord is “${esc(question.answer)}”. ${feedbackFor(selected)}`;
  screen.querySelector('#feedback').innerHTML = `<strong>${message}</strong><p>${question.explanation}</p>`;
  const next = screen.querySelector('#next');
  next.hidden = false;
  screen.querySelector('#play-game').hidden = false;
  const canRetry = !correct && mission.steps + mission.queue.length < 6;
  next.textContent = canRetry ? 'Probeer een soortgelijke vraag →' :
    mission.queue.length ? 'Naar het volgende eiland →' : 'Bekijk je missieresultaat →';
  next.focus();
}
function playStarJump() {
  const dialog = screen.querySelector('#game-dialog');
  const playButton = screen.querySelector('#play-game');
  const goal = 4;
  let caught = 0;
  let starPosition = -1;

  dialog.innerHTML = `<div class="game-head">
    <h2 id="game-title">Sterrensprong</h2>
    <button id="close-game" aria-label="Sluit Sterrensprong">✕</button>
  </div>
  <p id="game-status" aria-live="polite"></p>
  <div class="star-board">${Array.from({length:9}, (_, i) =>
    `<button type="button" aria-label="Tegel ${i+1}"></button>`).join('')}</div>
  <button class="primary" id="game-continue" hidden>Verder oefenen →</button>`;
  const board = dialog.querySelector('.star-board');
  const tiles = [...board.querySelectorAll('button')];
  const status = dialog.querySelector('#game-status');
  const continueButton = dialog.querySelector('#game-continue');
  const scenery = ['🍃', '🌸', '☁️', '🎋'];

  function revealStar(focusStar) {
    const positions = tiles.map((_, index) => index).filter(index => index !== starPosition);
    starPosition = pick(positions);
    status.textContent = `${caught} van ${goal} sterren · Tik op de gouden ster!`;
    for (const [index, tile] of tiles.entries()) {
      const hasStar = index === starPosition;
      tile.classList.toggle('has-star', hasStar);
      tile.setAttribute('aria-label', hasStar ? 'Pak de gouden ster' : `Tegel ${index+1}`);
      tile.textContent = hasStar ? '⭐' : scenery[index % scenery.length];
    }
    if (focusStar) tiles[starPosition].focus();
  }

  for (const [index, tile] of tiles.entries()) {
    tile.onclick = () => {
      if (index !== starPosition) return;
      caught++;
      if (caught < goal) {
        revealStar(true);
        return;
      }
      board.hidden = true;
      status.textContent = '🌟 Alle vier gevangen! Poko maakt een vreugdesprong.';
      continueButton.hidden = false;
      continueButton.focus();
    };
  }
  continueButton.onclick = () => { dialog.close(); nextQuestion(); };
  dialog.querySelector('#close-game').onclick = () => dialog.close();
  dialog.onclose = () => {
    lastInput = lastTick = Date.now();
    if (playButton.isConnected) playButton.focus();
  };
  revealStar(false);
  dialog.showModal();
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
  screen.innerHTML = `<section class="card"><p class="label">Voor jou en thuis</p><h1>Weekrapport</h1><p>${dates[0]} t/m ${dates[6]}</p>
  <button id="earlier" aria-label="Vorige week">← Vorige week</button> <button id="later" ${weekOffset===0?'disabled':''}>Volgende week →</button>
  <div class="grid"><div class="card stat"><strong>${timerText(total)}</strong>min:sec geoefend</div><div class="card stat"><strong>${first.filter(e=>e.correct).length}/${first.length}</strong>in één keer goed</div><div class="card stat"><strong>€${weekEarned}</strong>deze week verdiend</div></div>
  <table><thead><tr><th>Vak</th><th>Eerste poging goed</th></tr></thead><tbody>${topics.map(t=>{const entries=first.filter(e=>e.topic===t);return `<tr><td>${t}</td><td>${entries.filter(e=>e.correct).length} / ${entries.length}</td></tr>`}).join('')}</tbody></table>
  <p>Herkansingen goed · ${retry.filter(e=>e.correct).length} / ${retry.length}</p>
  <table><thead><tr><th>Dag</th><th>Oefentijd</th><th>Opdrachten</th><th>Beloning</th></tr></thead><tbody>${records.map((d,i)=>`<tr><td>${['Ma','Di','Wo','Do','Vr','Za','Zo'][i]} ${dates[i].slice(8)}</td><td>${timerText(d.seconds)}</td><td>${completed(d)}${d.target ? ' / '+d.target : ''}</td><td>${earned(d)?'€1':'—'}</td></tr>`).join('')}</tbody></table>
  <p class="muted">De site houdt het tegoed bij. Thuis regelen jullie de uitbetaling.</p><button id="print">Afdrukken / opslaan als PDF</button></section>`;
  screen.querySelector('#earlier').onclick=()=>{weekOffset--;report();};
  screen.querySelector('#later').onclick=()=>{if(weekOffset<0)weekOffset++;report();};
  screen.querySelector('#print').onclick=()=>window.print();
}
function settings() {
  screen.innerHTML=`<section class="card"><h1>Mijn stijl</h1><form><label>Naam <input name="player" maxlength="24" required value="${esc(state.name)}"></label><label>Dojo-kleur <select name="theme"><option value="forest">Limoengroen</option><option value="ocean">IJsblauw</option><option value="ember">Vuuroranje</option></select></label><label>Jouw teken <select name="avatar"><option>🥋</option><option>🧱</option><option>⚡</option><option>🐉</option></select></label><label>Dagdoel opdrachten <input name="target" type="number" min="1" max="60" required value="${state.target}"></label><button class="primary">Bewaar instellingen</button></form><p class="muted">Je stijl en voortgang worden in deze browser bewaard.</p></section>`;
  const form=screen.querySelector('form');
  form.elements.theme.value=state.theme; form.elements.avatar.value=state.avatar;
  form.onchange=()=>{ document.body.dataset.theme=form.elements.theme.value; };
  form.onsubmit=event=>{
    event.preventDefault();
    state.name=form.elements.player.value.trim() || 'judoka';
    state.theme=form.elements.theme.value;state.avatar=form.elements.avatar.value;
    state.target = Number(form.elements.target.value);
    if (!day().earned) day().target = state.target;
    todayEarned();
    save();show('home');
  };
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>show(b.dataset.view));
['keydown','pointerdown','scroll'].forEach(type=>document.addEventListener(type,()=>{if(view==='practice')lastInput=Date.now();},{passive:true}));
setInterval(()=>{
  const now=Date.now(), elapsed=now-lastTick;
  lastTick=now;
  if(view!=='practice'||document.hidden||document.querySelector('.arena dialog[open]')||now-lastInput>90000||elapsed>2500)return;
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
show('home');
