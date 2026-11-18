'use strict';
function playAdventure() {
  const dialog = screen.querySelector('#game-dialog');
  const playButton = screen.querySelector('#play-game');
  let selection = [];
  let found = 0;
  const games = [
    ['🌉', 'Sterrenbrug', 'Bouw een route door het patroon af te maken.', bridge],
    ['💎', 'Kristalgrot', 'Zoek de kristallen die bij elkaar horen.', memory],
    ['🌟', 'Sterrensprong', 'Laat Poko van ster naar ster springen.', stars]
  ];
  dialog.innerHTML = `<div class="game-head"><div><p class="label">Kleine speelpauze</p><h2 id="game-title">Kies je avontuur</h2></div><button id="close-game" aria-label="Sluit spel">✕</button></div>
    <div class="game-view"></div><button class="primary" id="game-continue">Verder oefenen →</button>`;
  const area = dialog.querySelector('.game-view');
  const next = dialog.querySelector('#game-continue');
  next.onclick = () => { dialog.close(); nextQuestion(); };
  dialog.querySelector('#close-game').onclick = () => dialog.close();
  dialog.onclose = () => {
    lastInput = lastTick = Date.now();
    if (playButton.isConnected) playButton.focus();
  };
  area.innerHTML = `<div class="game-choices">${games.map(([icon,title,description],i) =>
    `<button data-game="${i}"><span aria-hidden="true">${icon}</span><strong>${title}</strong><small>${description}</small></button>`).join('')}</div>`;
  area.querySelectorAll('[data-game]').forEach(button => {
    button.onclick = () => {
      const game = games[Number(button.dataset.game)];
      dialog.querySelector('#game-title').textContent = game[1];
      game[3]();
    };
  });
  function complete(message) {
    area.innerHTML = `<div class="game-land victory"><span class="celebration" aria-hidden="true">✨</span><div class="game-banner"><strong>Avontuur voltooid!</strong><p>${message}</p></div></div>`;
    next.textContent = 'Ik ben klaar voor de volgende stap →';
    next.focus();
  }
  function bridge() {
    const patterns = shuffle([
      ['🌸','🍃','🌸','🍃'], ['💎','💎','⭐','💎','💎','⭐'],
      ['🍃','🌸','⭐','🍃','🌸','⭐'], ['⭐','🌸','🌸','⭐','🌸','🌸']
    ]);
    let stage = 0;
    function draw() {
      const pattern = patterns[stage];
      const answer = pattern.at(-1);
      const options = shuffle([...new Set([...pattern, '💎', '🍃'])]).slice(0,4);
      if (!options.includes(answer)) options[0] = answer;
      area.innerHTML = `<p class="game-instruction">Kijk naar wat zich herhaalt. Welke steen past op de lege plek?</p>
        <div class="game-land bridge-land"><div class="bridge-path" aria-label="Patroon">
          ${pattern.map((icon,i)=>`<span class="bridge-stone ${i===pattern.length-1?'missing':''}">${i===pattern.length-1?'?':icon}</span>`).join('')}</div>
          <div class="game-banner" aria-live="polite">Brug ${stage+1} van 3</div></div>
        <div class="pattern-options">${options.map(icon=>`<button aria-label="Kies ${icon}">${icon}</button>`).join('')}</div>
        <p class="game-tip" aria-live="polite"></p>`;
      area.querySelectorAll('.pattern-options button').forEach(button => {
        button.onclick = () => {
          if (button.textContent !== answer) {
            area.querySelector('.game-tip').textContent = 'Bekijk een stukje dat terugkomt. Zeg het patroon zachtjes hardop.';
            return;
          }
          stage++;
          if (stage === 3) complete('Je hebt patronen ontdekt en een brug naar het volgende eiland gebouwd.');
          else draw();
        };
      });
    }
    draw();
  }
  function memory() {
    const pairs = shuffle(['💎','🌸','⭐','🍃','🔮','☀️']).slice(0,3);
    const cards = shuffle([...pairs,...pairs]);
    const matched = new Set();
    area.innerHTML = `<p class="game-instruction">Ontdek drie paren. Neem rustig de tijd om de plekken te onthouden.</p>
      <div class="game-land memory-land"><div class="memory-board">${cards.map((_,i)=>`<button aria-label="Bekijk kristalkaart ${i+1}" data-card="${i}"><span>◆</span></button>`).join('')}</div>
        <div class="game-banner" aria-live="polite">0 van 3 paren gevonden</div></div>
      <button id="turn-cards" hidden>Deze plekken onthoud ik · keer om</button>`;
    const buttons = [...area.querySelectorAll('[data-card]')];
    const turn = area.querySelector('#turn-cards');
    function hideSelection() {
      for (const index of selection) {
        buttons[index].classList.remove('revealed');
        buttons[index].querySelector('span').textContent = '◆';
        buttons[index].setAttribute('aria-label', `Bekijk kristalkaart ${index+1}`);
      }
      selection = [];
      turn.hidden = true;
    }
    turn.onclick = hideSelection;
    buttons.forEach((button,i) => {
      button.onclick = () => {
        if (matched.has(i) || selection.includes(i)) return;
        if (selection.length === 2) hideSelection();
        selection.push(i);
        button.classList.add('revealed');
        button.querySelector('span').textContent = cards[i];
        button.setAttribute('aria-label', `Kristalkaart ${i+1}: ${cards[i]}`);
        if (selection.length < 2) return;
        if (cards[selection[0]] !== cards[selection[1]]) {
          turn.hidden = false;
          area.querySelector('.game-banner').textContent = 'Twee nieuwe plekken ontdekt. Onthoud ze voor je volgende beurt.';
          return;
        }
        selection.forEach(index => {
          matched.add(index);
          buttons[index].classList.add('matched');
          buttons[index].disabled = true;
        });
        selection = [];
        found++;
        area.querySelector('.game-banner').textContent = `${found} van 3 paren gevonden`;
        if (found === 3) complete('Je keek goed, onthield plekken en vond alle kristalparen.');
      };
    });
  }
  function stars() {
    let caught = 0;
    let position = -1;
    area.innerHTML = `<p class="game-instruction">Vang vier sterren. Elke ster brengt Poko een sprong verder.</p>
      <div class="game-land stars-land"><div class="star-board">${Array.from({length:9},()=>'<button type="button"></button>').join('')}</div>
      <div class="game-banner" aria-live="polite"></div></div>`;
    const buttons = [...area.querySelectorAll('.star-board button')];
    function draw() {
      position = pick(buttons.map((_,i)=>i).filter(i=>i!==position));
      area.querySelector('.game-banner').textContent = `${caught} van 4 sterren · Vind de gouden ster`;
      buttons.forEach((button,i) => {
        button.classList.toggle('has-star',i===position);
        button.textContent = i===position?'⭐':['🍃','🌸','☁️'][i%3];
        button.setAttribute('aria-label', i===position?'Pak de gouden ster':`Wolk ${i+1}`);
      });
    }
    buttons.forEach((button,i)=> {
      button.onclick=()=>{
        if(i!==position)return;
        caught++;
        if(caught===4)complete('Je hebt alle sterren gevonden. Poko is weer klaar voor een nieuwe opdracht.');
        else { draw(); buttons[position].focus(); }
      };
    });
    draw();
  }
  dialog.showModal();
}
