(function () {
  'use strict';
  const $=id=>document.getElementById(id), R=window.EMRecap, KEY='em-evening-v1';
  const fields=['problem','ability','text','source','date','timing'];
  let event=null, ai=false, result=null, snapshot=null, revision=0, busy=false, voices=[], speaking=false;
  const read=()=>Object.fromEntries(fields.map(k=>[k,$('recap-'+k).value]));
  const fill=value=>fields.forEach(k=>$('recap-'+k).value=value[k]||'');
  const status=message=>$('recap-status').textContent=message;
  function stored(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
  function stop(){if(speaking)window.speechSynthesis?.cancel();speaking=false;$('recap-listen').textContent='Listen';}
  function invalidate(){revision++;result=null;snapshot=null;stop();$('recap-result').hidden=true;$('recap-use-consent').checked=false;$('recap-provider-consent').checked=false;$('recap-voice-consent').checked=false;$('recap-import').value='';$('recap-prompt-preview').hidden=true;status('Inputs changed. Review them before making a new recap.');}
  function eligible(){const data=R.input(read());if(!$('recap-use-consent').checked)throw Error('Allow this context and excerpt to be used for the recap first.');return data;}
  function refreshVoices(){voices=(window.speechSynthesis?.getVoices()||[]).filter(v=>v.localService);const localEnglish=voices.find(v=>/^en[-_]/i.test(v.lang));$('recap-listen').disabled=!localEnglish;$('recap-voice-note').textContent=localEnglish?'Listen uses an on-device English voice after you allow playback.':'No on-device English voice is available in this browser. The written recap still works.';}
  function render(){
    stop();$('recap-result').hidden=false;$('recap-finding').hidden=!result.findings.length;$('recap-none').hidden=!!result.findings.length;
    $('recap-mode').textContent=result.mode==='guided'?'Guided local test · prepared rule':result.mode==='ai'?'AI interpretation · check the evidence':'Imported AI interpretation · check the evidence';
    $('recap-none').textContent=result.reason||'';
    const f=result.findings[0];
    if(f){$('recap-category').textContent=f.category;$('recap-headline').textContent=f.headline;$('recap-connection').textContent=f.connection;$('recap-action').textContent=f.this_week;$('recap-caution').textContent=f.caution;
      $('recap-evidence').replaceChildren();for(const e of f.evidence){const item=document.createElement('div'),quote=document.createElement('blockquote'),source=document.createElement('p');quote.textContent=e.quote;source.textContent=e.source+' · '+e.timestamp;source.className='muted small';item.append(quote,source);$('recap-evidence').append(item);}
    }
    $('recap-feedback-status').textContent='';document.querySelectorAll('[data-recap-feedback]').forEach(b=>b.setAttribute('aria-pressed','false'));
    $('recap-voice-consent').checked=false;refreshVoices();
  }
  function remember(){
    if(!$('recap-remember').checked)return;
    try{localStorage.setItem(KEY,JSON.stringify({version:1,context:{problem:snapshot.problem,ability:snapshot.ability},input:snapshot,result,created:new Date().toISOString()}));$('recap-open-saved').hidden=false;status('Recap and context saved on this device.')}catch{status('Recap created, but device storage is unavailable. Download it to keep a copy.');}
  }
  async function generate(e){
    e.preventDefault();if(busy)return;let data;
    try{data=eligible();if($('recap-ai').checked&&(!$('recap-provider-consent').checked||!ai))throw Error('Allow the provider request, or use the local test.');}catch(error){return status(error.message)}
    const ticket=++revision;busy=true;$('recap-generate').disabled=true;stop();$('recap-result').hidden=true;status($('recap-ai').checked?'Creating a connection from the approved inputs…':'Checking the local example…');
    try{
      let next;if($('recap-ai').checked){const response=await fetch('api/evening-recap',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context:data,consent:true})});const body=await response.json();if(!response.ok)throw Error(body.error||'The AI request failed.');next=R.validate(body,data,'ai');}else next=R.local(data);
      if(ticket!==revision)return;result=next;snapshot=data;render();status(result.findings.length?'One possible connection. Review the evidence, then choose a test.':'No connection was forced.');remember();
    }catch(error){if(ticket===revision)status(error.message)}finally{busy=false;$('recap-generate').disabled=false;}
  }
  function download(){if(!result)return;const blob=new Blob([JSON.stringify({input:snapshot,...result},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='eventmemory-evening-recap.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('recap-form').addEventListener('submit',generate);
  fields.forEach(k=>$('recap-'+k).addEventListener('input',invalidate));
  $('recap-sample').onclick=()=>{invalidate();fill(R.sample);$('recap-ai').checked=false;$('recap-provider-label').hidden=true;status('Example loaded. The event idea is a recollection, edited for clarity. The suggested application will be a test hypothesis.');};
  $('recap-current').onclick=()=>{if(!event?.segments?.length)return status('Capture or paste a transcript in Workspace first.');const text=event.segments.map(s=>{const secs=Math.floor(s.at||0),time=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');return '['+time+'] '+s.text;}).join('\n');if(text.length>12000)return status('This transcript is too long for one recap. Copy one relevant excerpt into the event field.');invalidate();$('recap-text').value=text;$('recap-source').value=event.title;$('recap-date').value='';$('recap-timing').value=event.demo?'Fictional sample session; timestamps from the sample.':'Imported transcript timings may be estimates or chunk starts. Source date not supplied.';status('Current event copied into the form. Add or confirm your problem, then allow the recap.');};
  $('recap-ai').onchange=()=>{invalidate();$('recap-provider-label').hidden=!$('recap-ai').checked;};
  $('recap-use-consent').onchange=()=>{revision++;stop();};
  $('recap-provider-consent').onchange=()=>{revision++;};
  $('recap-copy-prompt').onclick=async()=>{try{const text=R.prompt(eligible());$('recap-prompt').value=text;$('recap-prompt-preview').hidden=false;if(!navigator.clipboard?.writeText){status('Select and copy the prepared prompt below. Nothing has been sent.');return;}await navigator.clipboard.writeText(text);status('Prompt copied. Paste it into your assistant, then bring the JSON response back here. Nothing was sent automatically.');}catch(error){status(error.message)}};
  $('recap-import-button').onclick=()=>{try{const data=eligible();const next=R.validate(JSON.parse($('recap-import').value),data);revision++;result=next;snapshot=data;render();status('Imported. Both source quotes match your input; the interpretation still needs your judgment.');remember();}catch(error){status(error instanceof SyntaxError?'Paste the assistant’s JSON object without Markdown fences.':error.message)}};
  $('recap-listen').onclick=()=>{if(speaking){stop();return;}if(!result)return;if(!$('recap-voice-consent').checked)return status('Allow voice playback below the recap first.');refreshVoices();const voice=voices.find(v=>/^en[-_]/i.test(v.lang));if(!voice)return;const utterance=new SpeechSynthesisUtterance(R.text(result));utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.98;utterance.onend=()=>{speaking=false;$('recap-listen').textContent='Listen';};utterance.onerror=()=>{stop();status('Voice playback was interrupted. You can read the recap or try again.');};speaking=true;$('recap-listen').textContent='Stop listening';window.speechSynthesis.speak(utterance);};
  $('recap-voice-consent').onchange=e=>{if(!e.target.checked)stop();};
  $('recap-download').onclick=download;
  document.querySelectorAll('[data-recap-feedback]').forEach(button=>button.onclick=()=>{if(!result)return;document.querySelectorAll('[data-recap-feedback]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('recap-feedback-status').textContent=button.dataset.recapFeedback==='useful'?'Useful connection noted. Try the small test before treating it as a conclusion.':button.dataset.recapFeedback==='known'?'Already known. A useful companion needs to add a new angle.':'Not relevant. No need to force this connection.';if($('recap-remember').checked){try{const saved=stored();if(saved&&JSON.stringify(saved.input)===JSON.stringify(snapshot)){saved.feedback=button.dataset.recapFeedback;localStorage.setItem(KEY,JSON.stringify(saved));}}catch{status('Feedback could not be saved on this device.');}}});
  $('recap-open-saved').onclick=()=>{const saved=stored();if(!saved?.input||!saved?.result)return;try{const checked=R.validate(saved.result,saved.input,saved.result.mode);invalidate();fill(saved.input);snapshot=R.input(saved.input);result=checked;render();status('Saved recap opened. No new analysis or provider request.');}catch{status('Saved recap could not be loaded. Create a new one.');}};
  $('recap-forget').onclick=()=>{localStorage.removeItem(KEY);invalidate();fill({});$('recap-remember').checked=false;$('recap-open-saved').hidden=true;status('Saved evening context, recap, and feedback cleared from this device.');};
  window.addEventListener('eventmemory:event',e=>{event=e.detail;$('recap-current').disabled=!event?.segments?.length;});
  window.addEventListener('eventmemory:backend',e=>{ai=!!e.detail.ai;$('recap-ai-option').hidden=!ai;});
  window.addEventListener('eventmemory:view',e=>{if(e.detail!=='evening')stop();});
  window.addEventListener('eventmemory:deleted',()=>{$('recap-forget').click();});
  window.addEventListener('pagehide',stop);
  window.speechSynthesis?.addEventListener('voiceschanged',refreshVoices);
  const saved=stored();if(saved?.context)fill(saved.context);$('recap-open-saved').hidden=!saved?.result;
  window.EMCompanion={saved:stored};
})();
