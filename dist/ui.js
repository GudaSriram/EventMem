/* Shared presentation primitives. All content here is static, not imported text. */
window.EMUI = (() => {
  const paths = {
    wave:'<path d="M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4"/>',
    spark:'<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z"/><path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6Z"/>',
    history:'<path d="M3 4v5h5"/><path d="M3.8 8A9 9 0 1 1 3 14"/><path d="M12 7v5l3 2"/>',
    memory:'<path d="m3 7 9-4 9 4-9 4Z"/><path d="m3 12 9 4 9-4M3 17l9 4 9-4"/>',
    shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    note:'<path d="M6 3h9l4 4v14H6Z"/><path d="M14 3v5h5M9 12h7m-7 4h5"/>',
    upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>',
    chat:'<path d="M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0Z"/><path d="M7 10h10m-10 4h6"/>',
    plus:'<path d="M12 5v14M5 12h14"/>'
  };
  const icon = name => `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
  const art = kind => `<div class="empty-state-symbol" aria-hidden="true">${icon(({transcript:'wave',connections:'memory',history:'history',memory:'note'})[kind])}</div>`;
  const empty = kind => {
    const copy = {
      transcript:['Stay in the conversation.','Start recording. Your words will appear here,<br>so you can focus on being there.','<span class="empty-caption">IN-PERSON TALKS · MEETINGS · BIG IDEAS</span>'],
      connections:['This is where ideas meet.','Bring your past notes. Discover how today’s<br>conversation connects to your work.','<button class="secondary" id="empty-import">＋ Add to my memory</button>'],
      history:['Your next great conversation goes here.','Every saved event becomes something you can return to.<br>Start a new event whenever you’re ready.','<span class="empty-caption">YOUR MOMENTS, READY TO REVISIT</span>'],
      memory:['A home for your thinking.','Your notes, questions, and past conversations<br>help make every new event more useful.','<span class="empty-caption">ADD A NOTE TO GET STARTED</span>']
    }[kind];
    return `<div class="empty empty-${kind}">${art(kind)}<h3>${copy[0]}</h3><p>${copy[1]}</p>${copy[2]}</div>`;
  };
  function decorate(root=document) {root.querySelectorAll('[data-icon]').forEach(el => el.innerHTML=icon(el.dataset.icon));}
  document.addEventListener('DOMContentLoaded',()=>decorate());
  return {icon,art,empty,decorate};
})();
