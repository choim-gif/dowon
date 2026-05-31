/* ============================================================
   도원 케이스 공통 인터랙션 (case-1~16 공유)
   - .fade-in 자동 페이드인 (IntersectionObserver)
   - data-countup="숫자" 자동 카운트업 (정수 / 소수 자동 감지)
   - .scroll-progress 스크롤 진행률 바 자동 주입
   - iframe 높이 자동 전송 (아임웹 등 부모 페이지 자동 리사이즈)
   - prefers-reduced-motion 일괄 처리
   ============================================================ */
(function(){
  var hasIO = ('IntersectionObserver' in window);
  var prefersReduced = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. fade-in ---------- */
  function activateAllFades(){
    var els = document.querySelectorAll('.fade-in');
    for(var i=0;i<els.length;i++) els[i].classList.add('visible');
  }
  if(!hasIO || prefersReduced){
    activateAllFades();
  } else {
    var fadeObs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          fadeObs.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -60px 0px'});
    var fadeEls = document.querySelectorAll('.fade-in');
    for(var j=0;j<fadeEls.length;j++) fadeObs.observe(fadeEls[j]);
  }

  /* ---------- 2. data-countup ---------- */
  function countUp(el, target, duration, decimals, locale){
    var startTime = null;
    function step(now){
      if(!startTime) startTime = now;
      var progress = Math.min(1, (now - startTime) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      var text;
      if(decimals > 0){
        text = value.toFixed(decimals);
      } else {
        text = Math.floor(value).toLocaleString(locale || 'ko-KR');
      }
      el.textContent = text;
      if(progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCountUps(){
    var els = document.querySelectorAll('[data-countup]');
    if(!els.length) return;

    if(!hasIO || prefersReduced){
      for(var i=0;i<els.length;i++){
        var el = els[i];
        var target = parseFloat(el.getAttribute('data-countup'));
        var decimals = parseInt(el.getAttribute('data-countup-decimals') || '0', 10);
        if(isNaN(target)) continue;
        if(decimals > 0){
          el.textContent = target.toFixed(decimals);
        } else {
          el.textContent = Math.floor(target).toLocaleString('ko-KR');
        }
      }
      return;
    }

    var cuObs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var el = entry.target;
          var target = parseFloat(el.getAttribute('data-countup'));
          var duration = parseInt(el.getAttribute('data-countup-duration') || '1600', 10);
          var decimals = parseInt(el.getAttribute('data-countup-decimals') || '0', 10);
          var locale = el.getAttribute('data-countup-locale') || 'ko-KR';
          if(!isNaN(target)) countUp(el, target, duration, decimals, locale);
          cuObs.unobserve(el);
        }
      });
    }, {threshold:0.4});

    for(var k=0;k<els.length;k++) cuObs.observe(els[k]);
  }
  initCountUps();

  /* ---------- 3. 스크롤 진행률 바 ---------- */
  function initScrollProgress(){
    if(document.querySelector('.scroll-progress')) return;
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    var ticking = false;
    function update(){
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docEl = document.documentElement;
      var scrollHeight = docEl.scrollHeight - docEl.clientHeight;
      var percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.width = percent + '%';
      ticking = false;
    }
    function onScroll(){
      if(!ticking){
        requestAnimationFrame(update);
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll, {passive:true});
    update();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initScrollProgress);
  } else {
    initScrollProgress();
  }

  /* ---------- 4. iframe 자동 높이 전송 ---------- */
  function sendHeightToParent(){
    if(window.parent === window) return;
    var h = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0
    );
    try {
      window.parent.postMessage({
        type:'dw-iframe-resize',
        height: h,
        src: window.location.pathname
      }, '*');
    } catch(e){}
  }
  window.addEventListener('load', sendHeightToParent);
  var resizeT;
  window.addEventListener('resize', function(){
    clearTimeout(resizeT);
    resizeT = setTimeout(sendHeightToParent, 150);
  });
  setTimeout(sendHeightToParent, 400);
  setTimeout(sendHeightToParent, 1500);
  setTimeout(sendHeightToParent, 3500);
})();
