/* Gentle visual feedback with a reduced-motion override. */
(() => {
  const toggle=document.getElementById('animate-background');
  const hint=document.getElementById('motion-hint');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let enabled=true;
  try{enabled=localStorage.getItem('em-input-level')!=='false'}catch{}
  function apply(){
    document.body.classList.toggle('input-level-off',!enabled||reduced.matches);
    toggle.checked=enabled&&!reduced.matches;toggle.disabled=reduced.matches;
    hint.textContent=reduced.matches?'Input animation is off because your device uses reduced motion.':'A flowing orange ribbon and gentle scroll reveals. Turn off for a still workspace.';
    window.dispatchEvent(new Event('eventmemory:motion-change'));
  }
  toggle.addEventListener('change',()=>{enabled=toggle.checked;try{localStorage.setItem('em-input-level',String(enabled))}catch{}apply()});
  reduced.addEventListener('change',apply);apply();
})();

/* Animate decoration only; all content remains visible without JavaScript. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const paths=[...document.querySelectorAll('.quiet-wave .ribbon-layer')];
 const hero=document.querySelector('.hero');
 let frame=0,last=0,visible=true,phase=0;
 const allowed=()=>!reduced.matches&&!document.hidden&&!document.body.classList.contains('input-level-off');
 function tick(now){
  if(!allowed()||!visible){frame=0;return}
  frame=requestAnimationFrame(tick);if(last&&now-last<33)return;
  phase+=last?Math.min(now-last,80)/1000:0;last=now;
  paths.forEach((path,layer)=>{
   let d='';for(let x=0;x<=600;x+=6){const envelope=Math.sin(Math.PI*x/600)**.6;const y=50+envelope*(20*Math.sin(x/46-phase*.85)+(layer-6)*2.2*Math.sin(x/70+phase*.4+1));d+=(x?' L':'M')+x+' '+y.toFixed(2)}
   path.setAttribute('d',d);
  });
 }
 function refresh(){cancelAnimationFrame(frame);frame=0;last=0;if(allowed()&&visible)frame=requestAnimationFrame(tick)}
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;refresh()}).observe(hero);
  const motions=new Map();
  const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&allowed()){
   motions.get(e.target)?.cancel();const a=e.target.animate([{opacity:.35,transform:'translateY(24px) scale(.965)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});motions.set(e.target,a);
  }}},{threshold:.12});
  document.querySelectorAll('.workspace-label,.sessionbar,.panel,.session-tools,.briefcall,.sectionhead,.memorytip,.importpanel').forEach(el=>{el.classList.add('reveal-target');observer.observe(el)});
  window.addEventListener('eventmemory:motion-change',()=>{if(!allowed()){for(const a of motions.values())a.cancel()}refresh()});
 }
 document.addEventListener('visibilitychange',refresh);reduced.addEventListener('change',refresh);window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));refresh();
})();
