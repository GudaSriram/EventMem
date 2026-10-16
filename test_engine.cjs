const assert=require('node:assert/strict');const E=require('./dist/engine.js');
const notes=[{id:'a',title:'Agent planning',date:'2026-10-11',dateVerified:true,text:'Google Cloud agents diagnose failed Kubernetes deployments. Evaluate tool permissions before production.'},{id:'b',title:'Lunch plans',text:'Vegetable soup and coffee after lunch.'}];
const matches=E.retrieve('Google Cloud agents Kubernetes deployment tool permissions',notes);assert.equal(matches[0].sourceId,'a');assert.equal(matches[0].date,'2026-10-11');assert.ok(matches.every(x=>x.sourceId!=='b'));
assert.deepEqual(E.retrieve('medieval pottery glaze ceramics',notes),[]);assert.deepEqual(E.retrieve('agents',[]),[]);
const c=E.chunk('x'.repeat(3000));assert.ok(c.length>1);assert.equal(c.at(-1).slice(-30),'x'.repeat(30));
assert.equal(E.cosine({},{}),0);assert.equal(E.cosine({a:1},{a:1}),1);assert.equal(E.cosine({a:1},{b:1}),0);
assert.equal(E.topics([{at:0,text:'Agent evaluation and Kubernetes cloud tools'}])[0].title,'AI agents');
assert.ok(E.extractJSON(JSON.stringify([{title:'Export',mapping:{x:{message:{author:{role:'user'},content:{parts:['Use agents']}}}}}])).includes('user: Use agents'));
console.log('PASS: source identity/date, unrelated-memory rejection, empty-memory handling, chunk coverage, similarity, topic grouping, chat import');
