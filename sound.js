'use strict';
let dojoAudio;
function enableSound() {
  if(state.sound===false)return;
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  try {
    dojoAudio??=new Audio();
    if(dojoAudio.state==='suspended')dojoAudio.resume().catch(()=>{});
  } catch {}
}
function playSound(type) {
  if(state.sound===false)return;
  enableSound();
  if(!dojoAudio||dojoAudio.state!=='running')return;
  const melodies={correct:[523,659],goal:[523,659,784,1047],build:[392,523],mission:[392,523,659]};
  const melody=melodies[type]||melodies.correct;
  const start=dojoAudio.currentTime;
  melody.forEach((frequency,index)=>{
    const oscillator=dojoAudio.createOscillator();
    const volume=dojoAudio.createGain();
    oscillator.type='sine';
    oscillator.frequency.value=frequency;
    const at=start+index*.12;
    volume.gain.setValueAtTime(0,at);
    volume.gain.linearRampToValueAtTime(.065,at+.015);
    volume.gain.exponentialRampToValueAtTime(.001,at+.19);
    oscillator.connect(volume);volume.connect(dojoAudio.destination);
    oscillator.start(at);oscillator.stop(at+.2);
  });
}
function updateSoundButton() {
  const button=document.querySelector('#sound-toggle');
  button.textContent=state.sound===false?'🔇 Geluid uit':'🔊 Geluid aan';
  button.setAttribute('aria-pressed',String(state.sound!==false));
}
