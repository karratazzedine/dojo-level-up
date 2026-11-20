'use strict';
const localProfileKey='dojo-level-up-profile-v1';
const beforeProfileKey='dojo-level-up-before-profile-v1';
const profileIterations=120000;
let unlockedProfileId=null;
let profileBusy=false;

function readLocalProfile() {
  try {
    const profile=JSON.parse(localStorage.getItem(localProfileKey)||'null');
    if(profile?.version===1&&profile.id&&profile.name&&profile.salt&&profile.codeHash)return profile;
  } catch {}
  return null;
}
function profileIsUnlocked() {
  const profile=readLocalProfile();
  return Boolean(profile&&unlockedProfileId===profile.id);
}
function normalizedProfileName(name) {
  return name.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('nl-NL');
}
function bytesToHex(bytes) {
  return Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
}
async function profileDigest(secret,salt,iterations=profileIterations) {
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),'PBKDF2',false,['deriveBits']);
  const saltBytes=Uint8Array.from(salt.match(/.{2}/g),byte=>parseInt(byte,16));
  const result=await crypto.subtle.deriveBits({name:'PBKDF2',salt:saltBytes,iterations,hash:'SHA-256'},material,256);
  return bytesToHex(new Uint8Array(result));
}
function validateNewProfile(name,code,confirmation) {
  if(name.trim().length<2||name.trim().length>24)return 'Kies een naam van 2 tot 24 tekens.';
  if(!/^[0-9]{4,8}$/.test(code))return 'Kies een code met 4 tot 8 cijfers.';
  if(code!==confirmation)return 'De twee codes zijn nog verschillend. Probeer ze rustig gelijk te maken.';
  return '';
}
async function createLocalProfile(name,code,confirmation) {
  const error=validateNewProfile(name,code,confirmation);
  if(error)throw new Error(error);
  if(readLocalProfile())throw new Error('Op deze browser bestaat al een profiel. Log daarmee in.');
  const salt=bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const recoveryCode=bytesToHex(crypto.getRandomValues(new Uint8Array(8))).toUpperCase();
  const codeHash=await profileDigest(code,salt);
  const recoveryHash=await profileDigest('recovery:'+recoveryCode,salt);
  // Preserve both existing data keys and an immutable snapshot before attaching a name.
  save();
  const snapshot=JSON.stringify({createdAt:new Date().toISOString(),state});
  if(!localStorage.getItem(beforeProfileKey)){
    localStorage.setItem(beforeProfileKey,snapshot);
    if(localStorage.getItem(beforeProfileKey)!==snapshot)throw new Error('De herstelkopie kon niet worden bewaard. Je gegevens blijven staan.');
  }
  const profile={version:1,id:crypto.randomUUID(),name:name.trim(),salt,iterations:profileIterations,codeHash,recoveryHash,createdAt:new Date().toISOString()};
  if(readLocalProfile())throw new Error('Het profiel is ondertussen aangemaakt. Log daarmee in.');
  localStorage.setItem(localProfileKey,JSON.stringify(profile));
  if(readLocalProfile()?.id!==profile.id)throw new Error('Je profiel kon nog niet worden bewaard. Je oefengegevens blijven staan.');
  state.name=profile.name;
  save();
  return {profile,recoveryCode};
}
async function verifyLocalProfile(name,code) {
  const profile=readLocalProfile();
  if(!profile||normalizedProfileName(name)!==normalizedProfileName(profile.name))return false;
  return await profileDigest(code,profile.salt,profile.iterations)===profile.codeHash?profile:false;
}
async function replaceProfileCode(recoveryCode,code,confirmation) {
  const profile=readLocalProfile();
  if(!profile)throw new Error('Maak eerst je eigen profiel.');
  const error=validateNewProfile(profile.name,code,confirmation);
  if(error)throw new Error(error);
  const recovery=recoveryCode.replace(/[\s-]/g,'').toUpperCase();
  if(!/^[0-9A-F]{16}$/.test(recovery)||await profileDigest('recovery:'+recovery,profile.salt,profile.iterations)!==profile.recoveryHash){
    throw new Error('De herstelcode klopt nog niet. Kijk samen thuis naar de herstelcode.');
  }
  const codeHash=await profileDigest(code,profile.salt,profile.iterations);
  const current=readLocalProfile();
  if(current?.id!==profile.id)throw new Error('Het profiel is veranderd. Open het inlogscherm opnieuw.');
  const updated={...current,codeHash};
  localStorage.setItem(localProfileKey,JSON.stringify(updated));
  return updated;
}
function renameLocalProfile(name) {
  const profile=readLocalProfile();
  if(profile&&profileIsUnlocked()){
    localStorage.setItem(localProfileKey,JSON.stringify({...profile,name}));
  }
}
function enterLocalProfile(profile) {
  unlockedProfileId=profile.id;
  state.name=profile.name;
  save();
  delete document.body.dataset.locked;
  document.querySelector('#profile-toggle').hidden=false;
  document.querySelector('#profile-toggle').textContent='🔒 Uitloggen';
  show('home');
}
function lockLocalProfile() {
  save();
  unlockedProfileId=null;
  mission=null;question=null;pending=null;answered=false;
  profileGate();
}
function profileFormError(message) {
  const target=screen.querySelector('#profile-error');
  if(target)target.textContent=message;
}
async function runProfileAction(form,action) {
  if(profileBusy)return;
  profileBusy=true;
  const button=form.querySelector('button[type="submit"]');
  button.disabled=true;
  profileFormError('');
  try { await action(); }
  catch(error){profileFormError(error?.message||'Opslaan lukt nog niet. Je oefengegevens blijven staan. Probeer het opnieuw.');}
  finally {profileBusy=false;if(button.isConnected)button.disabled=false;}
}
function codeFields(confirmation=false) {
  return `<label>Jouw ${confirmation?'nieuwe ':''}code<input name="code" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" autocomplete="off" required><small>4 tot 8 cijfers die jij kiest.</small></label>
    ${confirmation?'<label>Nog een keer dezelfde code<input name="confirmation" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" autocomplete="off" required></label>':''}`;
}
function profileGate() {
  view='login';
  document.body.dataset.locked='true';
  document.querySelector('#profile-toggle').hidden=true;
  const profile=readLocalProfile();
  const existing=events().length||state.world?.pieces?.length||kindnessRecords().length;
  screen.innerHTML=`<section class="profile-page"><div class="profile-welcome"><img src="dojo-world.webp" alt="Poko verwelkomt je bij de dojo"><div><p class="label">Jouw naam · jouw keuzes · jouw wereld</p><h1>${profile?'Welkom terug!':'Maak jouw eigen profiel'}</h1><p>${profile?'Poko en jouw bouwwereld wachten op je.':'Jij kiest je naam en je eigen toegangscode.'}</p></div></div>
    <section class="card profile-card"><h2>${profile?'Open je dojo':'Dit is jouw plek'}</h2>
      ${!profile&&existing?'<p class="profile-preserved">🌱 Je bestaande oefeningen, bouwmunten en wereld staan klaar in deze browser. Je koppelt ze nu aan je eigen naam.</p>':''}
      <form id="profile-form"><label>Jouw naam<input name="player" type="text" minlength="2" maxlength="24" autocomplete="username" value="${esc(profile?.name||(state.name!=='judoka'?state.name:''))}" required></label>
        ${codeFields(!profile)}
        <p id="profile-error" class="profile-error" role="alert"></p><button type="submit" class="primary">${profile?'Log in →':'Maak mijn profiel →'}</button></form>
      ${profile?'<button id="forgot-profile" class="profile-link">Code vergeten?</button>':''}
      <p class="muted profile-local">Dit profiel en je voortgang horen bij deze browser op dit apparaat.</p></section></section>`;
  const form=screen.querySelector('#profile-form');
  form.onsubmit=event=>{
    event.preventDefault();
    runProfileAction(form,async()=>{
      const name=form.elements.player.value;
      const code=form.elements.code.value;
      if(profile){
        const verified=await verifyLocalProfile(name,code);
        if(!verified){profileFormError('Naam of code klopt nog niet. Kijk rustig of je alles goed hebt ingevuld.');return;}
        enterLocalProfile(verified);
      } else {
        const result=await createLocalProfile(name,code,form.elements.confirmation.value);
        showRecoveryCard(result);
      }
    });
  };
  const forgot=screen.querySelector('#forgot-profile');
  if(forgot)forgot.onclick=showProfileRecovery;
}
function showRecoveryCard(result) {
  const formatted=result.recoveryCode.match(/.{4}/g).join('-');
  screen.innerHTML=`<section class="card profile-card recovery-card"><p class="label">Je profiel is klaar</p><h1>Welkom, ${esc(result.profile.name)}!</h1><p>Je oefengegevens, bouwmunten en bouwwerken zijn gekoppeld aan jouw profiel.</p><h2>Herstelcode voor thuis</h2><p>Schrijf deze code samen thuis op en bewaar hem. Daarmee kun je een nieuwe toegangscode kiezen als je die vergeet.</p><div class="recovery-code">${formatted}</div><button id="enter-dojo" class="primary">Naar mijn dojo →</button></section>`;
  screen.querySelector('#enter-dojo').onclick=()=>enterLocalProfile(result.profile);
}
function showProfileRecovery() {
  screen.innerHTML=`<section class="card profile-card recovery-card"><p class="label">Samen thuis herstellen</p><h1>Een nieuwe code</h1><p>Gebruik de herstelcode die je bij het maken van je profiel kreeg. Je wereld en oefengegevens blijven bij je profiel.</p>
    <form id="recovery-form"><label>Herstelcode<input name="recovery" autocomplete="off" required maxlength="24"></label>${codeFields(true)}<p id="profile-error" class="profile-error" role="alert"></p><button type="submit" class="primary">Bewaar mijn nieuwe code</button></form><button id="back-to-login" class="profile-link">Terug naar inloggen</button></section>`;
  const form=screen.querySelector('#recovery-form');
  form.onsubmit=event=>{
    event.preventDefault();
    runProfileAction(form,async()=>{
      const profile=await replaceProfileCode(form.elements.recovery.value,form.elements.code.value,form.elements.confirmation.value);
      enterLocalProfile(profile);
    });
  };
  screen.querySelector('#back-to-login').onclick=profileGate;
}
