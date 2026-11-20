'use strict';
function generatedReading(rank, previous) {
  const name=pick(['Noor','Ayan','Mila','Ravi','Sem','Lina','Adam','Yara','Finn','Dani','Aya','Bo']);
  const friend=pick(['Sam','Ilias','Lotte','Sara','Yusuf','Elin','Tess','Omar'].filter(item=>item!==name));
  const day=pick(['maandag','dinsdag','woensdag','donderdag','vrijdag']);
  const amount=number(4,12);
  const place=pick(['de klas','de bibliotheek','de gymzaal','het buurthuis','de judoclub']);
  const object=pick([
    {plural:'boeken',single:'boek'},{plural:'bouwplaten',single:'bouwplaat'},
    {plural:'tekeningen',single:'tekening'},{plural:'puzzels',single:'puzzel'}
  ]);
  const stories=[
    {
      title:'Een plek voor iedereen',
      passage:`Op ${day} maakt ${name} een plan voor een spelmiddag in ${place}. Er komen ${amount} kinderen. ${friend} merkt dat een nieuw kind stil bij de deur staat. Samen vragen ze welk spel het kind leuk vindt. Het kiest een bouwspel. ${name} schuift een stoel bij de tafel en verdeelt de materialen. Iedereen krijgt iets te doen. Aan het einde laat het nieuwe kind trots een brug zien. Het zegt dat het volgende keer graag weer meedoet.`,
      questions:[
        ['Hoeveel kinderen komen er?',String(amount),String(amount+2),String(amount-1),`In de tweede zin staat dat er ${amount} kinderen komen.`,'informatie vinden'],
        ['Waarom wordt er een stoel bijgeschoven?','Zodat het nieuwe kind ook kan meedoen.','Omdat het spel al is afgelopen.','Omdat alle stoelen kapot zijn.','De kinderen vragen wat het nieuwe kind wil spelen. Daarna maken ze er een plek voor.','afleiden'],
        ['Welke titel past het best?','Samen kan iedereen meedoen','Een middag zonder spellen','Op zoek naar een verdwenen stoel','Het hele verhaal draait om een nieuw kind dat wordt uitgenodigd om mee te doen.','hoofdgedachte']
      ]
    },
    {
      title:'De ruiltafel',
      passage:`In ${place} staat op ${day} een ruiltafel. ${name} legt er ${amount} ${object.plural} neer. Bij elk voorwerp ligt een kaartje met uitleg. ${friend} leest eerst de kaartjes en kiest dan één ${object.single}. Er komt ook iemand die niets heeft meegebracht. “Kies gerust iets”, zegt ${name}. “De tafel is er om spullen opnieuw te gebruiken.” Na afloop leggen ze wat overblijft netjes in een doos. Die bewaren ze voor de volgende ruilmiddag.`,
      questions:[
        ['Wat leest de bezoeker voordat die iets kiest?','De kaartjes met uitleg.','Een lijst met prijzen.','Een brief van de trainer.','Er staat dat de bezoeker eerst de kaartjes leest en dan iets kiest.','volgorde'],
        ['Wat betekent “opnieuw gebruiken”?','Iets nog een keer gebruiken.','Iets meteen weggooien.','Iets altijd nieuw kopen.','De spullen krijgen bij de ruiltafel een volgende gebruiker.','woordbetekenis'],
        ['Waarom bewaren ze de overgebleven spullen?','Voor de volgende ruilmiddag.','Om ze allemaal weg te gooien.','Omdat niemand spullen mag meenemen.','De laatste zin noemt waarvoor de doos wordt bewaard.','informatie vinden']
      ]
    },
    {
      title:'Een brug die bleef staan',
      passage:`${name} en ${friend} bouwen op ${day} een brug van ${amount*5} blokken. De brug moet een speelgoedauto dragen. Bij de eerste proef zakt het midden naar beneden. Ze stoppen even om naar hun bouwwerk te kijken. ${friend} ziet dat er alleen aan de uiteinden steunen staan. Samen plaatsen ze ook een steun onder het midden. Daarna proberen ze het opnieuw. Nu rijdt de auto veilig naar de overkant. ${name} schrijft op welke verandering hielp.`,
      questions:[
        ['Wat zetten de kinderen onder het midden?','Een extra steun.','Een speelgoedauto.','Een vel papier.','Na het bekijken van de brug plaatsen ze een steun onder het midden.','informatie vinden'],
        ['Waarom blijft de brug bij de tweede proef staan?','Het midden krijgt nu ook steun.','De kinderen hebben alle steunen weggehaald.','De auto rijdt niet meer.','Het probleem is het doorzakken van het midden. De extra steun lost dat op.','oorzaak en gevolg'],
        ['Wat doen de kinderen direct na de eerste proef?','Ze bekijken hun bouwwerk.','Ze pakken de brug meteen in.','Ze rijden met alle auto’s tegelijk.','Na het doorzakken stoppen ze om goed naar de brug te kijken.','volgorde']
      ]
    },
    {
      title:'De planning van de klas',
      passage:`De klas bereidt een tentoonstelling voor. Op ${day} mogen de ouders komen kijken. ${name} wil ${amount} ${object.plural} klaarleggen. ${friend} maakt kaartjes voor de bezoekers. Eerst spreken ze af wie welke taak doet. Dan merkt ${name} dat één tafel te klein is. Samen schuiven ze er een tweede tafel naast. Nu is er genoeg ruimte om alles goed te bekijken. Ze lopen als laatste zelf langs de tentoonstelling om te controleren of de kaartjes bij de juiste spullen liggen.`,
      questions:[
        ['Wanneer komen de ouders kijken?',day,'zondag','zaterdag',`De tweede zin noemt ${day} als bezoekdag.`,'informatie vinden'],
        ['Waarom schuiven ze een tweede tafel erbij?','De eerste tafel biedt te weinig ruimte.','De tentoonstelling is afgelopen.','De ouders mogen nergens kijken.','De tekst noemt eerst het ruimteprobleem en daarna de oplossing.','oorzaak en gevolg'],
        ['Waarom lopen ze zelf nog langs de tentoonstelling?','Om te controleren of alles goed ligt.','Om alle kaartjes te verstoppen.','Om de bezoekers weg te sturen.','De laatste zin zegt dat ze de kaartjes bij de spullen controleren.','afleiden']
      ]
    },
    {
      title:'Een klein bedankje',
      passage:`${name} oefent in ${place} met een moeilijke opdracht. ${friend} vraagt of hulp welkom is. Ze bekijken samen één voorbeeld. Daarna probeert ${name} de volgende opdracht zelf. Dat lukt. Op ${day} geeft ${name} een zelfgemaakte kaart aan ${friend}. Op de kaart staat precies welke uitleg geholpen heeft. ${friend} leest de kaart en glimlacht. Ze spreken af dat ze elkaar voortaan eerst vragen wat de ander al heeft geprobeerd.`,
      questions:[
        ['Wat bekijkt het tweetal samen?','Eén voorbeeld.','Alle antwoorden van de toets.','Een lijst met cadeaus.','In de derde zin bekijken ze samen één voorbeeld.','informatie vinden'],
        ['Waarom geeft de leerling een kaart?','Om te bedanken voor de hulp.','Om te vragen of alle antwoorden worden gegeven.','Om te zeggen dat oefenen nooit meer nodig is.','De kaart beschrijft welke uitleg heeft geholpen. Dat is een bedankje.','afleiden'],
        ['Welke afspraak maken ze aan het einde?','Eerst vragen wat de ander al heeft geprobeerd.','Nooit meer zelf een opdracht proberen.','Elke dag cadeaus kopen.','De laatste zin noemt hun nieuwe afspraak.','informatie vinden']
      ]
    },
    {
      title:'Zo organiseren we een speelhoek',
      passage:`Wil je in ${place} een rustige speelhoek maken? Kies eerst een plek waar de deur vrij blijft. Leg ${amount} ${object.plural} op een lage tafel. Maak een bordje met de afspraak: na het spelen leg je alles terug. Vraag iemand of de hoek prettig is ingericht. Verander iets als een bezoeker een goed idee heeft. Kijk op ${day} welke spullen vaak worden gebruikt. Ruim beschadigde spullen apart op en bespreek samen wat ermee kan gebeuren.`,
      questions:[
        ['Wat doe je eerst?','Een plek kiezen waar de deur vrij blijft.','Alle spullen meteen weggooien.','Een bezoeker de deur laten blokkeren.','Het woord “eerst” staat bij het kiezen van een veilige plek.','volgorde'],
        ['Wat is het doel van deze tekst?','Uitleggen hoe je een speelhoek inricht.','Een spannend verhaal over een deur vertellen.','Vertellen dat samenspelen verboden is.','De tekst geeft stappen en afspraken. Het is een instructie.','tekstdoel'],
        ['Wat doe je als iemand een goed idee heeft?','Je past iets aan in de speelhoek.','Je negeert die bezoeker altijd.','Je sluit de hoek voorgoed.','De vijfde zin vertelt dat je iets kunt veranderen bij een goed idee.','informatie vinden']
      ]
    }
  ];
  stories.push({
    title:'Samen sorteren',
    passage:`${name} en ${friend} helpen op ${day} in ${place}. Er staan twee dozen met boeken. In de rode doos zitten ${amount} boeken, in de blauwe doos zitten ${amount+3} boeken. Ze leggen de boeken op een tafel. Daarna kijken ze welke boeken nog heel zijn. Beschadigde boeken gaan apart, zodat een volwassene kan bekijken of ze gemaakt kunnen worden. De andere boeken leggen ze netjes klaar voor een ruilmiddag. Zo krijgt elk bruikbaar boek de kans op een nieuwe lezer.`,
    questions:[
      ['In welke doos zitten de meeste boeken?','In de blauwe doos.','In de rode doos.','In beide dozen evenveel.',`Vergelijk ${amount} en ${amount+3}. De blauwe doos heeft er drie meer.`,'informatie vergelijken'],
      ['Wie bedoelt de schrijver met “Ze leggen de boeken op een tafel”?',`${name} en ${friend}.`,'Alle bezoekers.','De ouders van de klas.','De eerste zin noemt het tweetal dat helpt. “Ze” verwijst naar dat tweetal.','verwijswoorden'],
      ['Waarom leggen ze beschadigde boeken apart?','Zodat een volwassene kan kijken of ze gerepareerd kunnen worden.','Omdat alle boeken meteen weg moeten.','Zodat niemand ooit meer kan lezen.','Het woord “zodat” verbindt het apart leggen met het doel ervan.','tekstverband']
    ]
  });
  const eligible=stories.flatMap(story=>story.questions.map(item=>({story,item})))
    .filter(({item})=>previous?item[5]===previous.skill:
      rank===1?['informatie vinden','volgorde','woordbetekenis'].includes(item[5]):
      rank===3?['afleiden','hoofdgedachte','oorzaak en gevolg','verwijswoorden','tekstdoel','tekstverband'].includes(item[5]):true);
  const choice=pick(eligible.length?eligible:stories.flatMap(story=>story.questions.map(item=>({story,item}))));
  const [prompt,answer,wrong1,wrong2,explanation,skill]=choice.item;
  return {kind:'reading',title:choice.story.title,passage:choice.story.passage,textType:choice.story.title.startsWith('Zo ')?'Instructie':'Verhaal',icon:'📖',
    prompt,answer,options:[answer,wrong1,wrong2],explanation,skill,
    sourceKey:choice.story.passage+'|'+prompt};
}
function generatedSpelling(rank,previous) {
  const base=pick(schoolQuestions(topics[1],rank,previous));
  const name=pick(['Noor','Ayan','Mila','Ravi','Sem','Lina','Dani','Bo']);
  const activity=pick(['een kaart','een verslag','een briefje','een verhaal','een uitnodiging','een bericht']);
  const sentence=base.passage||[...spelling,...extraSpelling.map(item=>[item.word,item.sentence])].find(([word])=>word===base.word)[1];
  if(rank>=2 && Math.random()<.45) {
    const rules={
      ending:base.word.endsWith('lijk')?'Ik schrijf de vaste uitgang -lijk.':'Ik schrijf de vaste uitgang -ig.',
      verlengen:'Ik maak het woord langer en luister naar d of t.',
      open:'Aan het eind van deze klankgroep hoor ik een lange klank. Ik schrijf één klinker.',
      dubbel:'Na een korte klank verdubbel ik de volgende medeklinker.'
    };
    const rule=rules[base.kind];
    const wrongRules=shuffle(Object.entries(rules).filter(([kind])=>kind!==base.kind).map(([,text])=>text)).slice(0,2);
    return {...base,prompt:`Welke uitleg helpt bij het woord “${base.word}”?`,
      passage:`${name} schrijft ${activity}. In de zin staat: ${sentence.replace('___',base.word)}`,
      answer:rule,options:[rule,...wrongRules],
      sourceKey:base.word+'|regel|'+name+'|'+activity};
  }
  return {...base,prompt:'Welk woord maakt de zin goed?',
    passage:`${name} schrijft ${activity}. Lees de zin: ${sentence}`,
    sourceKey:base.word+'|zin|'+name+'|'+activity};
}
function clockDigital(minutes) {
  const normalized=(minutes%720+720)%720;
  return `${Math.floor(normalized/60)||12}:${String(normalized%60).padStart(2,'0')}`;
}
function clockWords(minutes) {
  const normalized=(minutes%720+720)%720;
  const hour=Math.floor(normalized/60)||12;
  const next=hour%12+1;
  const minute=normalized%60;
  const labels={0:`${hour} uur`,5:`5 over ${hour}`,10:`10 over ${hour}`,15:`kwart over ${hour}`,
    20:`10 voor half ${next}`,25:`5 voor half ${next}`,30:`half ${next}`,35:`5 over half ${next}`,
    40:`10 over half ${next}`,45:`kwart voor ${next}`,50:`10 voor ${next}`,55:`5 voor ${next}`};
  return labels[minute];
}
function buildClock(rank,previous) {
  const hour=number(0,11);
  const minute=pick(rank===1?[0]:rank===2?[0,15,30,45]:[0,5,10,15,20,25,30,35,40,45,50,55]);
  const target=hour*60+minute;
  const set=previous?previous.clockSet:Math.random()<.5;
  const answer=clockDigital(target);
  const offsets=rank===1?[60,-60,120]:[15,-15,60];
  return {kind:'clock',clockSet:set,clockTarget:target,clockShown:set?0:target,clockStep:rank===1?60:rank===2?15:5,
    skill:rank===1?'Hele uren':rank===2?'Halve uren en kwartieren':'Sprongen van vijf minuten',
    prompt:set?`Zet de klok op ${clockWords(target)}.`:'Hoe laat is het op de klok?',
    answer,options:[answer,...offsets.map(offset=>clockDigital(target+offset))],
    explanation:`Dit is ${clockWords(target)}: ${answer}. De lange blauwe wijzer wijst naar ${minute===0?'12':minute/5}. ${minute===30?`Half ${(hour%12)+1} is halverwege naar ${(hour%12)+1} uur. Het is dus ${hour||12}:30.`:`Elke stap naar het volgende cijfer is 5 minuten. ${minute/5} stappen zijn ${minute} minuten.`}`};
}
function clockFaceMarkup(minutes,id='exercise-clock') {
  const normalized=(minutes%720+720)%720;
  const hourAngle=normalized/2;
  const minuteAngle=(normalized%60)*6;
  return `<div class="clock-face" id="${id}" role="img" aria-label="De korte oranje wijzer staat ${normalized%60?'tussen '+(Math.floor(normalized/60)||12)+' en '+((Math.floor(normalized/60)%12)+1):'op '+(Math.floor(normalized/60)||12)}. De lange blauwe wijzer staat op ${normalized%60===0?12:(normalized%60)/5}.">
    ${Array.from({length:12},(_,i)=>{
      const angle=(i+1)*Math.PI/6;
      return `<span class="clock-number" style="left:${50+40*Math.sin(angle)}%;top:${50-40*Math.cos(angle)}%">${i+1}</span>`;
    }).join('')}
    <span class="clock-hand hour-hand" style="transform:rotate(${hourAngle}deg)"></span>
    <span class="clock-hand minute-hand" style="transform:rotate(${minuteAngle}deg)"></span><span class="clock-pin"></span></div>`;
}
function clockExerciseMarkup() {
  return `<section class="clock-exercise"><div class="clock-holder">${clockFaceMarkup(question.clockShown)}</div>
    <p class="clock-legend"><span>🟠 Kort = het uur</span><span>🔵 Lang = de minuten</span></p>
    ${question.clockSet?`<div class="clock-controls"><button data-clock-add="60">Uur +1</button>${question.clockStep<60?'<button data-clock-add="'+question.clockStep+'">Minuten +'+question.clockStep+'</button>':''}<button id="check-clock" class="primary">Zo staat mijn klok goed</button></div>`:''}
    <details class="clock-trick"><summary>💡 Poko’s kloktrucjes</summary><p>De lange wijzer springt in vijven: 1 = 5, 2 = 10, 3 = 15, 6 = 30 en 9 = 45 minuten.</p><p>Half vier? Je bent halverwege van drie naar vier. Dat is 3:30.</p><p>Kwart over heeft 15 minuten gehad. Kwart voor heeft nog 15 minuten te gaan.</p></details></section>`;
}
function bindClock() {
  screen.querySelectorAll('[data-clock-add]').forEach(button=>button.onclick=()=>{
    if(answered)return;
    question.clockShown=(question.clockShown+Number(button.dataset.clockAdd))%720;
    screen.querySelector('.clock-holder').innerHTML=clockFaceMarkup(question.clockShown);
    playSound('tick');
  });
  const check=screen.querySelector('#check-clock');
  if(check)check.onclick=()=>grade(check,clockDigital(question.clockShown));
}
