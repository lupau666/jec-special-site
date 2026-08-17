/* =========================================
   日本電子専門学校 Webデザイン科 特設サイト
   script.js
   ※ アニメーションを追加していく想定なので、
     機能ごとに関数を分けています。
========================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initCourseCarousel();
  initCareerLastPin(); 
});

/* ---------- ① ハンバーガーメニュー（1024px以下） ---------- */
function initNavToggle() {
  const navToggle = document.querySelector('.nav-toggle');
  const navPill = document.querySelector('.nav-pill');
  if (!navToggle || !navPill) return;

  navToggle.addEventListener('click', () => {
    navPill.classList.toggle('is-open');
    navToggle.classList.toggle('is-active');
  });

  document.querySelectorAll('.main-nav a').forEach(link => {
    link.addEventListener('click', () => {
      navPill.classList.remove('is-open');
      navToggle.classList.remove('is-active');
    });
  });
}



/* ---------- ② 授業内容カルーセル ----------
   一般的なスライダー方式：.course-track 全体を
   transform: translateX() で1枚分ずつ動かす。
   「次へ」を押すと右に半分見えていたカードがそのまま
   スライドして中央に入ってくる（＝右から新しいカードが入る）。
   端（1枚目・4枚目）では矢印が disabled になり、ループしない。
------------------------------------------------- */
function initCourseCarousel() {
  const viewport = document.querySelector('.course-viewport');
  const track = document.querySelector('.course-track');
  const originalCards = Array.from(document.querySelectorAll('.course-card'));
  const dots = Array.from(document.querySelectorAll('.dot'));
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');

  if (!track || !originalCards.length) return;

  const totalReal = originalCards.length;
  
  // 關鍵修正：將緩衝卡片增加到 3 張，徹底消除邊界露出的延遲感
  const cloneCount = 3; 

  // 1. 產生複製品 (按順序塞入前後)
  for (let i = 0; i < cloneCount; i++) {
    // 往前塞：依序塞入最後幾張 (以 4 張為例：塞入 4, 3, 2)
    const prependClone = originalCards[totalReal - 1 - i].cloneNode(true);
    track.insertBefore(prependClone, track.firstChild);

    // 往後塞：依序塞入最前幾張 (以 4 張為例：塞入 1, 2, 3)
    const appendClone = originalCards[i].cloneNode(true);
    track.appendChild(appendClone);
  }

  const allCards = Array.from(document.querySelectorAll('.course-card'));

  // 2. 初始設定
  // 起點是 cloneCount (3) + 1 = 4 (這對應到真實陣列的第 2 張卡片)
  let current = cloneCount + 1; 
  let isTransitioning = false;

  function getOffset(index) {
    const viewportWidth = viewport.offsetWidth;
    const cardWidth = allCards[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    const slot = cardWidth + gap;
    const centerOffset = (viewportWidth - cardWidth) / 2;
    return centerOffset - index * slot;
  }

  function updateDOM(index) {
    // 只有置中的那張會加上 isActive (純色+放大)
    allCards.forEach((card, i) => card.classList.toggle('isActive', i === index));

    // 計算對應的真實圓點
    let realIndex = index - cloneCount;
    realIndex = (realIndex % totalReal + totalReal) % totalReal;
    dots.forEach((d, i) => d.classList.toggle('dot--active', i === realIndex));
  }

  function goTo(index) {
    if (isTransitioning) return;
    isTransitioning = true;
    current = index;

    track.style.transition = ''; 
    allCards.forEach(c => c.style.transition = '');

    track.style.transform = `translateX(${getOffset(current)}px)`;
    updateDOM(current);
  }

  // 3. 無縫跳轉
  track.addEventListener('transitionend', (e) => {
    if (e.target !== track || e.propertyName !== 'transform') return;

    // 判斷是否滑入複製品區 (<3 或 >=7)
    if (current < cloneCount || current >= cloneCount + totalReal) {
      
      if (current < cloneCount) {
         current += totalReal; 
      } else {
         current -= totalReal;
      }

      // 關閉動畫，瞬間移動
      track.style.transition = 'none';
      allCards.forEach(c => c.style.transition = 'none');

      track.style.transform = `translateX(${getOffset(current)}px)`;
      updateDOM(current);

      track.offsetHeight; // 強制瀏覽器重繪

      requestAnimationFrame(() => {
        track.style.transition = '';
        allCards.forEach(c => c.style.transition = '');
        isTransitioning = false;
      });
    } else {
      isTransitioning = false; 
    }
  });

  // 4. 事件監聽
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));
  dots.forEach((d, i) => {
    d.addEventListener('click', () => {
      if (isTransitioning) return;
      goTo(i + cloneCount); 
    });
  });

  window.addEventListener('resize', () => {
    track.style.transition = 'none';
    track.style.transform = `translateX(${getOffset(current)}px)`;
    track.offsetHeight;
    track.style.transition = '';
  });

  // 5. 初始化執行
  track.style.transition = 'none';
  allCards.forEach(c => c.style.transition = 'none');
  track.style.transform = `translateX(${getOffset(current)}px)`;
  updateDOM(current);
  track.offsetHeight;
  track.style.transition = '';
  allCards.forEach(c => c.style.transition = '');
}

/* ---------- ③ 卒業進路（Career）の Sticky Card ----------
   基本はCSSの position:sticky でスタッキングさせていますが、
   将来的にスクロール量に応じてフェード／スケールなどの
   演出を追加する場合はここに IntersectionObserver 等を追加してください。
   例）
   const stickyCards = document.querySelectorAll('.career-sticky');
   const observer = new IntersectionObserver((entries) => { ... });
   stickyCards.forEach(el => observer.observe(el));
------------------------------------------------- */

/* ---------- ④ Career 最後一張卡片：GSAP ScrollTrigger pin ----------
   BLUE / GREEN は position:sticky のままでOK（次のカードが覆ってくれるため）。
   RED は覆ってくれる次のカードが無いので、ScrollTrigger の pin 機能で
   「一定のスクロール量だけ画面に固定→自動でその分の余白を確保→解除」を
   丸ごと任せる。手動でmin-height等を計算する必要がなくなる。
------------------------------------------------- */
function initCareerLastPin() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const target = document.querySelector('.career-sticky:nth-of-type(3)');
  if (!target) return;

  ScrollTrigger.create({
    trigger: target,
    start: 'top 240px',   // 他のカードのtop値(240px)と揃える
    end: '+=600',        // ここが「滞留させたい距離」＝1200px
    pin: true,
    pinSpacing: true,     // 解除後の余白はGSAPが自動計算してくれる
    invalidateOnRefresh: true,
    media: '(min-width: 1025px)', // 1024px以下では発動しない
  });
}


// ===== 滑鼠絲滑實體漸層軌跡特效 =====
(function () {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  document.body.appendChild(canvas);

  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.style.opacity = '0.6';

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  });

  const points = [];
  
 window.addEventListener('mousemove', (e) => {
    
    // 🌟 新增這一段：如果游標碰到導覽列(.nav-pill)、任何連結(a)或按鈕(button)
    // 就直接 return 結束，不要記錄新的點
    if (e.target.closest('.nav-pill, a, button, header, footer')) {
      return; 
    }

    points.push({ x: e.clientX, y: e.clientY, age: 0 });
  });

  

  // 🌟 自動計算軌跡漸層顏色的工具函數
  // t=0 是軌跡頭 (最新)，t=1 是軌跡尾巴 (最老)
  function getGradientColor(t) {
    let r, g, b;
    if (t < 0.5) {
      // 0.0 ~ 0.5: 從 #0AD498 (綠) 漸變到 #6D7EFF (藍)
      const p = t / 0.5; // 正規化為 0~1
      r = Math.round(10 + (109 - 10) * p);
      g = Math.round(212 + (126 - 212) * p);
      b = Math.round(152 + (255 - 152) * p);
    } else {
      // 0.5 ~ 1.0: 從 #6D7EFF (藍) 漸變到 #FA7C7C (橘紅)
      const p = (t - 0.5) / 0.5;
      r = Math.round(109 + (250 - 109) * p);
      g = Math.round(126 + (124 - 126) * p);
      b = Math.round(255 + (124 - 255) * p);
    }
    return `rgb(${r}, ${g}, ${b})`;
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const maxAge = 20;       // 尾巴長度
    const maxLineWidth = 10; // 軌跡最粗的寬度

    // 更新點的老化
    for (let i = 0; i < points.length; i++) {
      points[i].age += 1;
      if (points[i].age > maxAge) {
        points.splice(i, 1);
        i--;
      }
    }

    // 🌟 這裡使用二次貝茲曲線 (Quadratic Bezier Curve) 來消除折角
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];

      // 抓取點跟點之間的中間值作為曲線的轉折點
      const mid1x = (p0.x + p1.x) / 2;
      const mid1y = (p0.y + p1.y) / 2;
      const mid2x = (p1.x + p2.x) / 2;
      const mid2y = (p1.y + p2.y) / 2;

      ctx.beginPath();
      ctx.moveTo(mid1x, mid1y);
      ctx.quadraticCurveTo(p1.x, p1.y, mid2x, mid2y);

      // 根據該線段的年紀決定顏色 (保證 100% 不透明)
      let t = p1.age / maxAge;
      ctx.strokeStyle = getGradientColor(t);
      
      // 線條寬度依舊是頭粗尾細
      ctx.lineWidth = maxLineWidth * Math.max(0, (1 - t)); 
      ctx.stroke();
    }

    // 補上最前端的一小段 (讓軌跡緊緊貼住游標，不會有延遲感)
    if (points.length > 1) {
      const p1 = points[points.length - 2];
      const p2 = points[points.length - 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = getGradientColor(0); // 最前端是首色(綠)
      ctx.lineWidth = maxLineWidth;
      ctx.stroke();
    }

    requestAnimationFrame(render);
  }

  render();
})();


//進場動畫//

// 確保網頁載入後才執行
window.addEventListener('DOMContentLoaded', () => {
  
  // 1. 註冊 ScrollTrigger 套件
  gsap.registerPlugin(ScrollTrigger);

  // 2. 選取畫面上所有的 <section> 標籤 (如果你的區塊是用 class 區分，也可以改成 '.section')
  const sections = document.querySelectorAll('.section:not(.hero):not(.works):not(.career):not(before-after):not(.cta-cards)');

  // 3. 幫每一個 section 綁定捲動動畫
  sections.forEach((sec) => {
    
    // 設定區塊的「初始狀態」：透明度 0、往下位移 50px
    gsap.set(sec, {
      opacity: 0,
      y: 70 
    });

    // 設定區塊的「進場動畫」
    gsap.to(sec, {
      scrollTrigger: {
        trigger: sec,         // 觸發點是這個 section 本身
        start: "top 85%",     // 當 section 的頂部，碰到視窗由上往下 85% 的位置時開始動畫
        toggleActions: "play none none none" // 只播放一次，往回滾不會重複播放
      },
      opacity: 1,             // 最終透明度變為 1
      y: 0,                   // 回到原本的位置
      duration: 1.5,            // 動畫執行時間 1 秒
      ease: "power3.out"      // 絲滑的減速效果 (一開始快，後面慢)
    });
    
  });
});