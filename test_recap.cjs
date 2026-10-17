const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const R=require('./dist/recap-engine.js');
const data=structuredClone(R.sample);
const sample=R.local(data);
assert.equal(sample.findings.length,1);
assert.equal(sample.mode,'guided');
assert.equal(sample.findings[0].evidence[1].quote,data.text);
assert.ok(sample.findings[0].evidence[1].timestamp.includes('timestamp unavailable'));
assert.deepEqual(R.local({...data,text:'A talk about coffee and pottery.'}).findings,[]);
assert.deepEqual(R.local({...data,problem:'Help me choose a camera.'}).findings,[]);
assert.throws(()=>R.local({...data,problem:''}),/current problem/);
assert.throws(()=>R.input({...data,text:'x'.repeat(12001)}),/too long/);
const forged=structuredClone(sample);forged.findings[0].evidence[1].quote='An invented guarantee';
assert.throws(()=>R.validate(forged,data),/exactly match/);
const renamed=structuredClone(sample);renamed.findings[0].evidence[1].source='Fake authority';
assert.equal(R.validate(renamed,data).findings[0].evidence[1].source,data.source);
assert.equal(R.validate({findings:[],reason:'Not enough evidence.'},data).findings.length,0);
assert.ok(R.prompt(data).includes(JSON.stringify(data,null,2)));

// Run actual UI handlers without a browser. The fixture models controls,
// storage and speech, so consent and stale-result behavior can be tested.
class Element {
  constructor(){this.value='';this.textContent='';this.checked=false;this.disabled=false;this.hidden=false;this.listeners={};this.attributes={};this.dataset={};this.children=[];}
  addEventListener(name,fn){this.listeners[name]=fn;}
  setAttribute(k,v){this.attributes[k]=v;}
  append(...items){this.children.push(...items);}
  replaceChildren(){this.children=[];}
  click(){return this.onclick?.({target:this});}
}
const html=fs.readFileSync('./dist/index.html','utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size,ids.length,'IDs must be unique');
const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
elements['recap-result'].hidden=true;
const feedback=['useful','known','irrelevant'].map(value=>{const e=new Element();e.dataset.recapFeedback=value;return e;});
const listeners={},saved=new Map();let requests=0,spoken=0,resolveFetch;
const win={EMRecap:R,addEventListener:(name,fn)=>listeners[name]=fn,speechSynthesis:{getVoices:()=>[{localService:true,lang:'en-IN'}],addEventListener(){},speak(){spoken++;},cancel(){}}};
const context={window:win,document:{getElementById:id=>{assert.ok(elements[id],id+' exists');return elements[id];},querySelectorAll:()=>feedback,createElement:()=>new Element()},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},navigator:{},SpeechSynthesisUtterance:function(text){this.text=text;},fetch:()=>{requests++;return new Promise(resolve=>{resolveFetch=resolve;});},console,setTimeout,Blob,URL};
vm.runInNewContext(fs.readFileSync('./dist/recap.js','utf8'),context);
const submit=()=>elements['recap-form'].listeners.submit({preventDefault(){}});
(async()=>{
  elements['recap-sample'].click();
  await submit();
  assert.equal(requests,0);assert.equal(spoken,0);assert.equal(saved.size,0);
  assert.match(elements['recap-status'].textContent,/Allow this context/);
  elements['recap-use-consent'].checked=true;await submit();
  assert.equal(elements['recap-result'].hidden,false);assert.equal(saved.size,0);
  elements['recap-listen'].click();assert.equal(spoken,0,'no voice without playback consent');
  elements['recap-voice-consent'].checked=true;elements['recap-listen'].click();assert.equal(spoken,1);
  elements['recap-remember'].checked=true;await submit();assert.equal(saved.size,1);
  elements['recap-text'].listeners.input();assert.equal(elements['recap-result'].hidden,true);assert.equal(elements['recap-use-consent'].checked,false);
  elements['recap-open-saved'].click();assert.equal(elements['recap-result'].hidden,false);
  listeners['eventmemory:backend']({detail:{ai:true}});
  elements['recap-ai'].checked=true;elements['recap-use-consent'].checked=true;
  await submit();assert.equal(requests,0,'AI is never called without provider consent');
  elements['recap-provider-consent'].checked=true;
  const pending=submit();assert.equal(requests,1);
  elements['recap-text'].value='Changed during the request';elements['recap-text'].listeners.input();
  resolveFetch({ok:true,json:async()=>sample});await pending;
  assert.equal(elements['recap-result'].hidden,true,'stale AI response cannot restore an old recap');
  listeners['eventmemory:deleted']();assert.equal(saved.size,0,'delete-all clears evening data');
  assert.equal(elements['recap-problem'].value,'');
  console.log('PASS: grounded sample, no forced match, forged quotes, source labels, consent, opt-in storage, voice gating, stale requests, delete-all and HTML control wiring');
})().catch(error=>{console.error(error);process.exitCode=1;});
