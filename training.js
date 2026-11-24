'use strict';
// Practice priorities are additive: existing subjects and saved attempts retain their meaning.
function focusedMissionQueue() {
  const items=[...Array(6).fill('Tafels'),...Array(3).fill('Spelling'),...Array(2).fill('Rekenen'),'Begrijpend lezen'];
  let queue;
  for(let attempt=0;attempt<30;attempt++){
    queue=shuffle(items);
    if(!queue.some((topic,i)=>i>1&&topic===queue[i-1]&&topic===queue[i-2])&&queue.join('|')!==state.lastOrder?.join('|'))break;
  }
  state.lastOrder=[...queue];
  return queue;
}
function tableAttempts() { return events().filter(event=>event.skill==='tafels'&&event.factKey); }
function tableFactStatus(a,b) {
  const history=tableAttempts().filter(event=>event.factKey===a+'x'+b&&!event.retry);
  const recent=history.slice(-3);
  const clean=event=>event.correct&&!event.help;
  const fluent=event=>clean(event)&&event.fluencyEligible!==false&&Number.isFinite(event.durationMs)&&event.durationMs<=6000;
  const dates=new Set(recent.filter(fluent).map(event=>dateKey(new Date(event.at))));
  return {history,recent,known:recent.length===3&&recent.every(clean),fluent:recent.length===3&&recent.every(fluent)&&dates.size>=2};
}
function tableSummary() {
  return Array.from({length:10},(_,index)=>{
    const table=index+1,facts=Array.from({length:10},(_,i)=>tableFactStatus(table,i+1));
    return {table,practiced:facts.filter(fact=>fact.history.length).length,known:facts.filter(fact=>fact.known).length,fluent:facts.filter(fact=>fact.fluent).length};
  });
}
function tableProgressMarkup(compact=false) {
  const rows=tableSummary(),practiced=rows.reduce((sum,row)=>sum+row.practiced,0),known=rows.reduce((sum,row)=>sum+row.known,0),fluent=rows.reduce((sum,row)=>sum+row.fluent,0);
  return `<section class="card table-progress"><p class="label">Kleine rondes, sterke basis</p><h2>Tafels 1 t/m 10</h2><p>${practiced} van 100 sommen al geoefend. ${known} drie keer zelfstandig goed · ${fluent} ook op meerdere dagen vlot.</p>
    ${compact?'':`<div class="table-grid">${rows.map(row=>`<button data-table="${row.table}" aria-label="Oefen tafel van ${row.table}: ${row.known} van 10 sommen zelfstandig goed"><strong>${row.table}×</strong><span>${row.known}/10 goed</span><progress class="meter" max="10" value="${row.known}" aria-label="Tafel ${row.table}"></progress><small>${row.fluent}/10 vlot</small></button>`).join('')}</div>`}
    <div class="answer-actions"><button class="primary" id="train-tables">Oefen 10 tafelsommen</button></div><p class="muted">Je krijgt extra oefening met wat nog lastig is. Neem rustig de tijd: er is geen aftelklok.</p></section>`;
}
function bindTableTraining() {
  const start=screen.querySelector('#train-tables');
  if(start)start.onclick=()=>startTableTraining();
  screen.querySelectorAll('[data-table]').forEach(button=>button.onclick=()=>startTableTraining(Number(button.dataset.table)));
}
function startTableTraining(table=null) {
  mission={queue:Array(10).fill('Tafels'),steps:0,stars:0,goal:0,events:[],table};
  pending=null;nextQuestion();
}
function tableStrategy(a,b) {
  if(b===1)return `${a} groepjes met één erbij zijn ${a}. Dus ${a} × 1 = ${a}.`;
  if(a===1)return `Eén groepje van ${b} is ${b}. Dus 1 × ${b} = ${b}.`;
  if(a===2)return `Verdubbel ${b}: ${b} + ${b} = ${a*b}. Dus 2 × ${b} = ${a*b}.`;
  if(a===10)return `Tien groepjes van ${b} zijn ${a*b}. Dus 10 × ${b} = ${a*b}.`;
  if(b===2)return `Je mag een keersom omdraaien: ${a} × 2 = 2 × ${a}. Verdubbel ${a}: ${a} + ${a} = ${a*b}.`;
  if(b===10)return `Elk groepje bevat tien. ${a} tientallen zijn ${a*b}. Dus ${a} × 10 = ${a*b}.`;
  if(a===5)return `10 × ${b} = ${10*b}. Neem de helft: 5 × ${b} = ${5*b}.`;
  if(a>5)return `Gebruik 5 × ${b} = ${5*b}. Er komen ${a-5} groepjes van ${b} bij: ${5*b} + ${(a-5)*b} = ${a*b}.`;
  return `Gebruik 2 × ${b} = ${2*b}. Er ${a===3?'komt nog één groepje':'komen nog twee groepjes'} van ${b} bij: ${2*b} + ${(a-2)*b} = ${a*b}.`;
}
function buildTableQuestion(previous,table=null) {
  const all=tableAttempts(),recentKeys=all.slice(-3).map(event=>event.factKey);
  let facts=[];
  for(let a=1;a<=10;a++)for(let b=1;b<=10;b++)if(!table||a===table)facts.push({a,b,...tableFactStatus(a,b)});
  if(previous?.kind==='table'){
    // A nearby fact makes the child use the strategy; the missed fact returns later.
    const related=facts.filter(fact=>fact.a===previous.factorA&&fact.b!==previous.factorB&&!recentKeys.includes(fact.a+'x'+fact.b));
    if(related.length)facts=related;
  }
  const spaced=facts.filter(fact=>!recentKeys.includes(fact.a+'x'+fact.b));
  if(spaced.length)facts=spaced;
  const needsPractice=facts.filter(fact=>fact.history.at(-1)?.correct===false);
  const fresh=facts.filter(fact=>!fact.history.length);
  const developing=facts.filter(fact=>!fact.fluent);
  const candidates=needsPractice.length?needsPractice:fresh.length?fresh:developing.length?developing:facts;
  const least=Math.min(...candidates.map(fact=>fact.history.length));
  const chosen=pick(candidates.filter(fact=>fact.history.length===least));
  const {a,b}=chosen;
  return {kind:'table',skill:'tafels',inputMode:'number',factorA:a,factorB:b,factKey:a+'x'+b,
    sourceKey:'tafel|'+a+'|'+b,prompt:`${a} × ${b} = ?`,answer:String(a*b),options:[],
    explanation:tableStrategy(a,b)};
}
function spellingDictation(candidate) {
  const entry=[...spelling,...extraSpelling.map(item=>[item.word,item.sentence])].find(([word])=>word===candidate.word);
  if(!entry)return candidate;
  return {...candidate,inputMode:'spelling',prompt:'Luister, zeg na en schrijf het woord.',
    passage:entry[1],answer:candidate.word,options:[],speechText:`${candidate.word}. ${entry[1].replace('___',candidate.word)}. ${candidate.word}.`};
}
function typedAnswerMarkup() {
  const dictation=question.inputMode==='spelling';
  return `<form id="typed-answer-form" class="typed-answer">
    ${dictation?'<div class="dictation-controls"><button type="button" id="hear-word">🔊 Luister naar het woord</button><button type="button" id="show-word">Geen geluid? Bekijk het woord</button></div><p id="speech-status" role="status">Luister zo vaak als je wilt. Zeg het woord zachtjes na.</p><p id="word-preview" hidden></p>':''}
    <label for="typed-answer">${dictation?'Schrijf het woord':'Jouw antwoord'}</label><div class="typed-answer-row"><input id="typed-answer" name="answer" type="text" ${dictation?'':'inputmode="numeric" pattern="[0-9]*"'} autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" maxlength="${dictation?32:3}" required><button class="primary" type="submit">Controleer</button></div><p id="input-status" role="status"></p></form>`;
}
function stopDictation() {
  if('speechSynthesis' in window)window.speechSynthesis.cancel();
}
function bindTypedAnswer() {
  const form=screen.querySelector('#typed-answer-form');
  if(!form)return;
  const input=form.querySelector('#typed-answer');
  form.onsubmit=event=>{
    event.preventDefault();
    const raw=input.value.trim().normalize('NFC');
    if(!raw||question.inputMode==='number'&&!/^\d{1,3}$/.test(raw)){
      form.querySelector('#input-status').textContent=question.inputMode==='number'?'Vul een getal in.':'Schrijf eerst het woord.';return;
    }
    const answer=question.inputMode==='number'?String(Number(raw)):raw.toLocaleLowerCase('nl-NL');
    stopDictation();grade(form.querySelector('[type="submit"]'),answer);
  };
  if(question.inputMode!=='spelling')return;
  form.querySelector('#hear-word').onclick=()=>{
    const status=form.querySelector('#speech-status');
    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){
      status.textContent='Deze browser kan nu niet voorlezen. Gebruik “Bekijk het woord”, onthoud het en verberg het weer.';return;
    }
    stopDictation();
    const utterance=new SpeechSynthesisUtterance(question.speechText);utterance.lang='nl-NL';utterance.rate=.8;
    const voice=window.speechSynthesis.getVoices().find(item=>/^nl(?:-|_)/i.test(item.lang));
    if(voice)utterance.voice=voice;
    utterance.onerror=()=>{if(status.isConnected)status.textContent='Hoor je niets? Zet het geluid aan of gebruik “Bekijk het woord”.';};
    window.speechSynthesis.speak(utterance);
    status.textContent='Luister, zeg het woord na en schrijf het uit je hoofd.';
  };
  form.querySelector('#show-word').onclick=event=>{
    const preview=form.querySelector('#word-preview');
    preview.hidden=!preview.hidden;
    if(!preview.hidden){question.help=true;preview.textContent=question.word;}
    event.target.textContent=preview.hidden?'Bekijk het woord nog eens':'Ik onthoud het · verberg het woord';
    input.disabled=!preview.hidden;
    form.querySelector('[type="submit"]').disabled=!preview.hidden;
  };
}
function specificMistakeFeedback(selected) {
  if(question.kind==='table'){
    const a=question.factorA,b=question.factorB,value=Number(selected);
    if(value===a+b)return `Je antwoord past bij ${a} + ${b}. Het teken × vraagt om ${a} gelijke groepjes van ${b}.`;
    if(Math.abs(value-a*b)===b)return 'Je antwoord verschilt precies één groepje. Controleer hoeveel groepjes je nodig hebt.';
    return 'Gebruik een keersom die je al kent en bouw daarvandaan verder. Bekijk de tussenstappen hieronder.';
  }
  if(question.inputMode==='spelling'){
    const typed=[...selected],correct=[...question.answer];
    const index=correct.findIndex((letter,i)=>letter!==typed[i]);
    return index>=0?`Vergelijk vanaf letter ${index+1}. Jij schreef “${selected}”; het woord is “${question.answer}”. Zeg de spellingregel en schrijf het woord nog eens.`:'Controleer of er letters te veel achter het woord staan. Lees daarna de spellingregel.';
  }
  return null;
}
