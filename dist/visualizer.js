/* Local recording feedback only. No idle animation or new microphone request. */
(() => {
  const bars=[...document.querySelectorAll('.input-level i')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=false,context,source,analyser,samples,frame=0,previous=0,level=0,generation=0;
  const reset=()=>bars.forEach(b=>b.style.transform='scaleY(.15)');
  const cancel=()=>{cancelAnimationFrame(frame);frame=0;previous=0};
  const allowed=()=>active&&analyser&&!document.hidden&&!reduced.matches&&!document.body.classList.contains('input-level-off');
  function tick(now){
    if(!allowed()){cancel();return}
    frame=requestAnimationFrame(tick);if(previous&&now-previous<66)return;previous=now;
    analyser.getByteTimeDomainData(samples);let sum=0;
    for(const s of samples){const n=(s-128)/128;sum+=n*n}
    level=level*.65+Math.min(1,Math.sqrt(sum/samples.length)*5)*.35;
    bars.forEach((b,i)=>b.style.transform=`scaleY(${(.15+level*[.45,.75,.85,.75,.45][i]).toFixed(3)})`);
  }
  function refresh(){cancel();reset();if(allowed())frame=requestAnimationFrame(tick)}
  function release(){source?.disconnect();source=analyser=samples=null;const old=context;context=null;if(old&&old.state!=='closed')old.close().catch(()=>{})}
  async function start(event){
    const token=++generation;cancel();release();active=true;document.body.classList.add('capture-active');
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(Audio&&event.detail?.stream)try{
      const current=context=new Audio();await current.resume();if(!active||token!==generation)return;
      source=current.createMediaStreamSource(event.detail.stream);analyser=current.createAnalyser();analyser.fftSize=256;samples=new Uint8Array(256);source.connect(analyser);
    }catch{if(token===generation)release()}
    refresh();
  }
  function stop(){generation++;active=false;cancel();release();level=0;reset();document.body.classList.remove('capture-active')}
  window.addEventListener('eventmemory:capture-start',start);window.addEventListener('eventmemory:capture-stop',stop);
  window.addEventListener('eventmemory:motion-change',refresh);document.addEventListener('visibilitychange',refresh);reduced.addEventListener('change',refresh);window.addEventListener('pagehide',stop);reset();
})();
