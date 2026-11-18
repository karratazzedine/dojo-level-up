'use strict';
// Original practice texts, with explicit evidence for each answer.
const schoolReading = [
  {
    title:'Een tuin voor de school', type:'Informatieve tekst', icon:'🌱',
    passage:'Naast het schoolplein ligt een strook kale grond. Groep 5 wil daar een tuin maken. De kinderen onderzoeken eerst welke planten op die plek kunnen groeien. Er valt veel zon en de grond is vaak droog. Daarom kiezen ze planten die weinig water nodig hebben. Ook zetten ze een regenton neer. Daarin vangen ze regenwater op voor droge dagen. Iedere week zorgt een ander groepje voor de tuin.',
    questions:[
      ['Waarvoor gebruiken de kinderen de regenton?','Om regenwater te bewaren.','Om planten in te laten groeien.','Om droge grond weg te brengen.','In de regenton vangen ze regenwater op voor droge dagen.','informatie vinden'],
      ['Waarom kiezen ze planten die weinig water nodig hebben?','De grond op die plek is vaak droog.','De tuin ligt helemaal in de schaduw.','Er mag geen regenton op school staan.','Lees de twee zinnen rond “Daarom”. De droge grond is de reden voor hun keuze.','oorzaak en gevolg'],
      ['Wat is het belangrijkste onderwerp van de tekst?','Hoe groep 5 een schooltuin voorbereidt.','Welke bloemen de mooiste kleur hebben.','Hoe je een schoolplein betegelt.','De hele tekst vertelt welke stappen groep 5 neemt om een tuin te maken.','hoofdgedachte']
    ]
  },
  {
    title:'Bouw een papieren brug', type:'Instructie', icon:'🌉',
    passage:'Je hebt twee stapels boeken, een vel papier en een paar munten nodig. Zet de stapels een handbreedte uit elkaar. Leg het papier als een brug tussen de stapels. Leg nu voorzichtig één munt in het midden. Zakt het papier door? Vouw het vel dan om en om tot een waaier. Leg deze gevouwen brug tussen de boeken en probeer het opnieuw. Vergelijk hoeveel munten beide bruggen kunnen dragen.',
    questions:[
      ['Wat doe je voordat je de eerste munt neerlegt?','Je legt het papier tussen de boeken.','Je gooit het papier weg.','Je legt alle munten op de vloer.','De instructie noemt eerst het plaatsen van het papier, daarna het neerleggen van een munt.','volgorde'],
      ['Waarnaar verwijst “deze gevouwen brug”?','Naar het papier dat als een waaier is gevouwen.','Naar de stapels boeken.','Naar de munten op tafel.','Lees één zin terug. Daar wordt het vel om en om gevouwen.','verwijswoorden'],
      ['Wat wil de schrijver vooral?','Uitleggen hoe je een proefje doet.','Een spannend verhaal vertellen.','Boeken verkopen.','De tekst vertelt wat je nodig hebt en geeft stappen. Dat hoort bij een instructie.','tekstdoel']
    ]
  },
  {
    title:'Het nieuwe teamlid', type:'Verhaal', icon:'🥋',
    passage:'Tijdens de judoles wijst de trainer een nieuw kind aan. “Dit is Sem. Wie wil met hem oefenen?” Ayan kijkt naar zijn vriend. Ze oefenen altijd samen. Toch steekt Ayan zijn hand op. Hij laat Sem rustig zien hoe je veilig op de mat valt. Bij de tweede poging lukt het al beter. Na de les vraagt Sem of ze volgende week weer samen kunnen oefenen. Ayan glimlacht. Hij heeft er een oefenmaatje bij.',
    questions:[
      ['Met wie oefent Ayan meestal?','Met zijn vriend.','Met Sem.','Altijd met de trainer.','Aan het begin staat dat Ayan en zijn vriend altijd samen oefenen.','informatie vinden'],
      ['Waarom laat Ayan het vallen rustig zien?','Sem is nieuw en moet het nog leren.','De trainer heeft de les afgezegd.','Ayan wil als eerste naar huis.','Verbind “nieuw kind” met “rustig zien hoe je veilig ... valt”. Ayan helpt Sem leren.','afleiden'],
      ['Welke titel past ook bij dit verhaal?','Een extra oefenmaatje','De verdwenen judoband','Een wedstrijd zonder trainer','Het verhaal gaat over Ayan die door zijn hulp een nieuw oefenmaatje krijgt.','hoofdgedachte']
    ]
  },
  {
    title:'Boekenruil op vrijdag', type:'Bericht', icon:'📚',
    passage:'Vrijdag organiseert groep 5 een boekenruil in de schoolbibliotheek. De ruil duurt van twee tot drie uur. Neem maximaal twee boeken mee die je thuis al hebt gelezen. Zorg dat ze heel en schoon zijn. Voor elk ingeleverd boek krijg je een kaartje. Met één kaartje mag je één ander boek kiezen. Heb je geen boek om te ruilen? Dan kun je toch komen kijken en naar de voorleeshoek gaan.',
    questions:[
      ['Hoeveel boeken mag je hoogstens meenemen?','Twee.','Drie.','Zoveel als er in je tas passen.','“Maximaal twee” betekent dat twee het hoogste aantal is.','woordbetekenis'],
      ['Wat kan een kind zonder ruilboek doen?','Komen kijken en naar de voorleeshoek gaan.','Twee kaartjes kopen.','Alleen thuis een boek lezen.','De laatste zin geeft een mogelijkheid voor kinderen zonder ruilboek.','informatie vinden'],
      ['Wat is het doel van dit bericht?','Vertellen hoe je aan de boekenruil kunt meedoen.','Uitleggen hoe een boek wordt gedrukt.','Vertellen dat lezen gevaarlijk is.','Het bericht geeft de tijd, plaats en regels van de boekenruil.','tekstdoel']
    ]
  },
  {
    title:'Wie woont er onder het blad?', type:'Informatieve tekst', icon:'🐞',
    passage:'Onder een stapel bladeren leven allerlei kleine dieren. Wormen trekken stukjes blad de grond in. Daar wordt het blad langzaam afgebroken. Ook pissebedden eten dode plantenresten. Ze zoeken graag vochtige, donkere plekken. In de zon drogen ze snel uit. Wil je de dieren bekijken? Til dan voorzichtig een paar bladeren op. Leg die na het kijken weer terug. Zo blijft hun schuilplek heel.',
    questions:[
      ['Waarom zoeken pissebedden vochtige plekken?','Ze kunnen snel uitdrogen.','Ze eten alleen regenwater.','Ze hebben zonlicht nodig om te slapen.','Lees de zin na “vochtige, donkere plekken”. Die legt de reden uit.','oorzaak en gevolg'],
      ['Waarnaar verwijst “die” in “Leg die na het kijken weer terug”?','Naar de bladeren.','Naar de wormen.','Naar de zonnestralen.','In de zin ervoor til je bladeren op. Die leg je later weer terug.','verwijswoorden'],
      ['Welke zin vat de tekst het beste samen?','Onder bladeren leven dieren die daar een geschikte plek vinden.','Alle kleine dieren wonen in bomen.','Wormen eten het liefst verse bloemen.','De tekst beschrijft dieren onder bladeren en waarom die plek geschikt is.','hoofdgedachte']
    ]
  },
  {
    title:'Een plan voor de speeltuin', type:'Verhaal', icon:'🛝',
    passage:'Noor en Ilias bouwen een speeltuin in een digitaal bouwspel. Noor wil meteen een hoge glijbaan maken. Ilias tekent eerst een plattegrond. “Dan weten we waar de paden komen”, zegt hij. Eerst vindt Noor dat langzaam gaan. Maar als ze gaan bouwen, passen de schommels en de glijbaan precies naast elkaar. Er blijft zelfs ruimte voor een bankje. Noor pakt het plan erbij. “Volgende keer tekenen we samen.”',
    questions:[
      ['Wat doet Ilias voordat hij bouwt?','Hij tekent een plattegrond.','Hij verwijdert de glijbaan.','Hij bouwt een bankje.','Aan het begin staat dat Ilias eerst een plattegrond tekent.','volgorde'],
      ['Waarom verandert Noor van mening over het plan?','Ze merkt dat de onderdelen dankzij het plan goed passen.','Ilias heeft het spel afgesloten.','De glijbaan heeft een andere kleur.','Kijk naar het resultaat van het plan: alles past en er is ruimte over.','afleiden'],
      ['Wat betekent “plattegrond” hier?','Een tekening van een plek van bovenaf.','Een lijst met spelersnamen.','Een foto van de onderkant van een bank.','Het plan laat zien waar paden en onderdelen moeten komen.','woordbetekenis']
    ]
  },
  {
    title:'Zo maak je een windvaan', type:'Instructie', icon:'🌬️',
    passage:'Knip een pijl en een staart uit stevig papier. Plak ze aan de twee uiteinden van een rietje. Vraag een volwassene een speld door het midden van het rietje te steken. Die speld gaat in het gummetje van een potlood. Controleer of het rietje vrij kan draaien. Zet je windvaan buiten. De wind duwt tegen de brede staart. Daardoor draait de punt van de pijl naar de kant waar de wind vandaan komt.',
    questions:[
      ['Waar steek je de speld in?','In het gummetje van een potlood.','In de staart van de pijl.','In een stapel boeken.','De vierde zin noemt het gummetje van het potlood.','informatie vinden'],
      ['Wat betekent “daardoor” in de laatste zin?','Het draaien komt door de wind tegen de staart.','De pijl draait omdat het regent.','Het papier draait omdat het nat is.','Lees de zin ervoor. De wind duwt tegen de staart en dat veroorzaakt het draaien.','oorzaak en gevolg'],
      ['Waarom is “Zo maak je een windvaan” een passende titel?','De tekst legt stap voor stap uit hoe je die maakt.','De tekst vertelt alleen over potloden.','De tekst is een wedstrijdverslag.','De schrijver noemt materiaal en stappen om zelf iets te maken.','tekstdoel']
    ]
  },
  {
    title:'De regenmeter', type:'Verslag', icon:'🌧️',
    passage:'Groep 5 wil weten hoeveel regen er valt. De kinderen zetten een regenmeter op het plein, ver van de bomen. Iedere ochtend leest een tweetal de hoeveelheid af. Daarna maken ze de meter leeg. Op maandag staat er vier millimeter in. Dinsdag valt er geen regen. Woensdag meten ze zes millimeter. In de klas tekenen ze de metingen in een grafiek. Zo zien ze snel op welke dag de meeste regen viel.',
    questions:[
      ['Op welke dag meten de kinderen de meeste regen?','Woensdag.','Maandag.','Dinsdag.','Vergelijk vier, nul en zes millimeter. Zes is het meest.','informatie vergelijken'],
      ['Wat doen ze nadat ze de hoeveelheid hebben afgelezen?','Ze maken de meter leeg.','Ze zetten de meter onder een boom.','Ze stoppen met meten.','De tekst gebruikt “Daarna” om de volgende stap aan te geven.','volgorde'],
      ['Waarom maken de kinderen een grafiek?','Om de metingen gemakkelijk te vergelijken.','Om de regen sneller te laten vallen.','Om een regenmeter te vervangen.','De laatste zin noemt het doel: snel zien op welke dag de meeste regen viel.','tekstverband']
    ]
  },
  {
    title:'Een slimme oplossing', type:'Verhaal', icon:'🧩',
    passage:'Op het schoolplein rolt een bal onder het hek. Niemand kan erbij. “Ik klim er wel overheen”, zegt Bo. Sara schudt haar hoofd. Aan de andere kant liggen scherpe stenen. Ze haalt de meester erbij. Die weet waar de poort open kan. Samen lopen ze veilig om het hek heen. Bo krijgt de bal terug. “Goed dat je hulp vroeg”, zegt hij tegen Sara. Het spel kan weer verder.',
    questions:[
      ['Waarom wil Sara niet dat Bo over het hek klimt?','Aan de andere kant liggen scherpe stenen.','Ze wil de bal zelf houden.','De meester heeft de bal verstopt.','De zin over de scherpe stenen vertelt waarom klimmen gevaarlijk kan zijn.','oorzaak en gevolg'],
      ['Wie bedoelt de schrijver met “Die weet waar de poort open kan”?','De meester.','Bo.','Sara.','Lees de zin ervoor. Sara haalt de meester erbij. “Die” verwijst naar hem.','verwijswoorden'],
      ['Welke keuze helpt de kinderen veilig verder?','Sara vraagt hulp aan de meester.','Bo klimt meteen over het hek.','Iedereen stopt voorgoed met spelen.','De hulp van de meester leidt tot een veilige route naar de bal.','afleiden']
    ]
  }
];
const extraSpelling = [
  {kind:'verlengen', word:'hond', sentence:'De ___ rent naar de bal.', options:['hont','hondt'], tip:'Maak het woord langer: honden. Je hoort een d, dus schrijf je hond.'},
  {kind:'verlengen', word:'paard', sentence:'Het ___ staat in de wei.', options:['paart','paardt'], tip:'Maak het woord langer: paarden. Je hoort een d, dus schrijf je paard.'},
  {kind:'verlengen', word:'strand', sentence:'We wandelen over het ___.', options:['strant','strandt'], tip:'Maak het woord langer: stranden. Je hoort een d, dus schrijf je strand.'},
  {kind:'verlengen', word:'kast', sentence:'Het boek ligt in de ___.', options:['kasd','kasdt'], tip:'Maak het woord langer: kasten. Je hoort een t, dus schrijf je kast.'},
  {kind:'open', word:'bomen', sentence:'In het park staan hoge ___.', options:['boomen','bommen'], tip:'Je zegt bo-men. De eerste klankgroep eindigt op een lange oo-klank. Daar schrijf je één o.'},
  {kind:'open', word:'ramen', sentence:'Ik kijk door de ___ naar buiten.', options:['raamen','rammen'], tip:'Je zegt ra-men. De eerste klankgroep eindigt op een lange aa-klank. Daar schrijf je één a.'},
  {kind:'open', word:'muren', sentence:'De ___ van het huis zijn wit.', options:['muuren','murren'], tip:'Je zegt mu-ren. De eerste klankgroep eindigt op een lange uu-klank. Daar schrijf je één u.'},
  {kind:'dubbel', word:'ballen', sentence:'In de bak liggen drie ___.', options:['balen','baallen'], tip:'Je zegt bal-len. Na de korte a-klank schrijf je twee l’en, zodat de a kort blijft.'},
  {kind:'dubbel', word:'kippen', sentence:'De ___ pikken graan van de grond.', options:['kipen','kiepen'], tip:'Je zegt kip-pen. Na de korte i-klank schrijf je twee p’s, zodat de i kort blijft.'},
  {kind:'dubbel', word:'bussen', sentence:'Bij de halte staan twee ___.', options:['busen','buusen'], tip:'Je zegt bus-sen. Na de korte u-klank schrijf je twee s’en, zodat de u kort blijft.'}
];
