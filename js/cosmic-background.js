// Cosmic background — canvas, rAF, DPR-capped, pauses when hidden, respects reduced motion.
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let w,h,dpr,stars=[],raf;
  function size(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    w = canvas.width = innerWidth*dpr; h = canvas.height = innerHeight*dpr;
    canvas.style.width = innerWidth+'px'; canvas.style.height = innerHeight+'px';
    const count = Math.min(90, Math.floor((innerWidth*innerHeight)/9000));
    stars = Array.from({length:count}, () => ({
      x:Math.random()*w, y:Math.random()*h, r:(Math.random()*1.3+.3)*dpr,
      a:Math.random()*.5+.35, s:Math.random()*.5+.15, ph:Math.random()*Math.PI*2
    }));
  }
  function frame(t){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#eaf0ff';
    stars.forEach(st=>{
      ctx.globalAlpha = reduce ? st.a : st.a*(0.6+0.4*Math.sin(t/1200*st.s+st.ph));
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI*2); ctx.fill();
    });
    const sx=w*.82, sy=h*.15, base=3.2*dpr, pulse = reduce?1:0.75+0.25*Math.sin(t/1800);
    const grd = ctx.createRadialGradient(sx,sy,0,sx,sy,base*6*pulse);
    grd.addColorStop(0,'rgba(150,195,255,.85)'); grd.addColorStop(1,'rgba(150,195,255,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(sx,sy,base*6*pulse,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#dfedff';
    ctx.beginPath(); ctx.arc(sx,sy,base*pulse,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    if(!document.hidden && !reduce) raf = requestAnimationFrame(frame);
  }
  size(); frame(0);
  window.addEventListener('resize', ()=>{ size(); if(reduce) frame(0); });
  document.addEventListener('visibilitychange', ()=>{
    if(!document.hidden && !reduce) raf = requestAnimationFrame(frame);
    else cancelAnimationFrame(raf);
  });
})();
