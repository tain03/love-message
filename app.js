class LoveAnimation {
  constructor() {
    this.container = document.getElementById('ui');
    this.starsContainer = document.getElementById('stars-container');
    this.elements = [];
    this.isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.count = 100;
    this.speed = 1.0;
    this.isPaused = false;
    this.orientationBlocked = false;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.userScale = 0.75;

    this.init();
    this.createGalaxyBackground();
    this.setupAudio();
    this.animate();

    this.updateOrientationBlock();
    this.computeDeviceScale();
    this.updateScaleToStage();
    window.addEventListener('resize', () => { this.updateOrientationBlock(); this.updateScaleToStage(); });
    window.addEventListener('orientationchange', () => { this.updateOrientationBlock(); this.updateScaleToStage(); });

    const stage = document.getElementById('stage');
    if (window.ResizeObserver && stage) {
      this._stageRO = new ResizeObserver(() => this.updateScaleToStage());
      this._stageRO.observe(stage);
    }
  }

  init() { this.generateElements(this.count); this.updateStats(); }

  createGalaxyBackground() {
    const starCount = this.isMobile ? 250 : 500;
    const shootingStarCount = this.isMobile ? 1 : 3;
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      const sizes = ['small','medium','large'];
      const size = sizes[Math.floor(Math.random()*sizes.length)];
      star.classList.add(size);
      star.style.left = Math.random()*100 + '%';
      star.style.top = Math.random()*100 + '%';
      star.style.animationDelay = Math.random()*3 + 's';
      this.starsContainer.appendChild(star);
    }
    for (let i = 0; i < shootingStarCount; i++) {
      const s = document.createElement('div');
      s.className = 'star shooting';
      s.style.left = Math.random()*100 + '%';
      s.style.top = Math.random()*100 + '%';
      s.style.animationDelay = Math.random()*4 + 's';
      this.starsContainer.appendChild(s);
    }
  }

  generateElements(count) {
    this.container.innerHTML = '';
    this.elements = [];
    for (let i = 0; i < count; i++) {
      const el = this.createLoveElement(i);
      this.container.appendChild(el);
      this.elements.push(el);
    }
  }

  updateScaleToStage() {
    const stage = document.getElementById('stage');
    const ui = this.container; if (!stage || !ui) return;
    const stageW = stage.clientWidth, stageH = stage.clientHeight;
    const base = 900, safe = 0.95;
    const scaleBase = Math.min(stageW, stageH) / base * safe;
    const device = this.deviceScale || 1;
    ui.style.transform = `scale(${scaleBase * device * (this.userScale || 1)})`;
  }

  computeDeviceScale() {
    const ua = navigator.userAgent || '';
    const isIphone = /iPhone/i.test(ua);
    const dw = Math.min(window.screen.width, window.screen.height);
    const dh = Math.max(window.screen.width, window.screen.height);
    const isIphone11Like = isIphone && ((dw === 414 && dh === 896) || window.devicePixelRatio === 2);
    const isPortrait = window.matchMedia('(orientation: portrait)').matches || (window.innerHeight > window.innerWidth);
    this.deviceScale = 1;
    if (this.isMobile) this.deviceScale = 0.9;
    if (isIphone11Like && isPortrait) this.deviceScale = 0.8;
  }

  createLoveElement(index) {
    const love = document.createElement('div'); love.className = 'love'; love.style.setProperty('--index', index);
    const horizontal = document.createElement('div'); horizontal.className = 'love_horizontal';
    const vertical = document.createElement('div'); vertical.className = 'love_vertical';
    const word = document.createElement('div'); word.className = 'love_word'; word.textContent = this.getRandomLoveText();
    if (index === this.count - 1) word.classList.add('special');
    const delay = -(index * 300); horizontal.style.animationDelay = `${delay}ms`; vertical.style.animationDelay = `${delay}ms`;
    horizontal.style.animationDuration = `${10000 / this.speed}ms`; vertical.style.animationDuration = `${20000 / this.speed}ms`;
    love.appendChild(horizontal); horizontal.appendChild(vertical); vertical.appendChild(word); return love;
  }

  getRandomLoveText() {
    const t = ['I Love You','Je t\'aime','Te amo','Ich liebe dich','Ti amo','Te quiero','愛してる','사랑해','我爱你','أحبك','iu cún','❤️','💕','💖','💝'];
    return t[Math.floor(Math.random()*t.length)];
  }

  setupControls() { /* removed */ }

  setAnimationsPlayState(state) {
    this.elements.forEach(el => {
      const h = el.querySelector('.love_horizontal');
      const v = el.querySelector('.love_vertical');
      if (h) h.style.animationPlayState = state;
      if (v) v.style.animationPlayState = state;
    });
  }

  setupAudio() {
    this.audio = document.getElementById('bg-audio');
    this.tracks = [
      { key:'xinloi', title:'Xin Lỗi', src:'xinloi.mp3' },
      { key:'truockhiemtontai', title:'Trước Khi Em Tồn Tại', src:'truockhiemtontai.mp3' },
      { key:'lancuoi', title:'Lần Cuối', src:'lancuoi.mp3' }
    ];
    this.currentTrackIndex = 0; this.loadTrack(this.tracks[this.currentTrackIndex].key);
    this.audio.volume = 0.7; this.audio.loop = false;
    const overlay = document.getElementById('sound-overlay');
    const tryPlay = () => this.audio.play();
    tryPlay().catch(()=>{ overlay.classList.add('show'); const once=()=>{ this.audio.play().finally(()=>overlay.classList.remove('show')); window.removeEventListener('click',once,{once:true}); window.removeEventListener('touchstart',once,{once:true}); }; window.addEventListener('click',once,{once:true}); window.addEventListener('touchstart',once,{once:true}); });
    const nextBtn = document.getElementById('next-track');
    nextBtn.addEventListener('click',()=>{ this.currentTrackIndex=(this.currentTrackIndex+1)%this.tracks.length; this.loadTrack(this.tracks[this.currentTrackIndex].key); this.audio.play().catch(()=>{}); });
    const toggleBtn = document.getElementById('music-toggle');
    const updateIcon=()=>{ 
      const icon = toggleBtn.querySelector('i');
      icon.className = this.audio.paused ? 'fas fa-play' : 'fas fa-pause';
    };
    updateIcon();
    toggleBtn.addEventListener('click',()=>{ if(this.audio.paused){ this.audio.play().catch(()=>{});} else { this.audio.pause(); } setTimeout(updateIcon,0); });
    this.audio.addEventListener('play',updateIcon); this.audio.addEventListener('pause',updateIcon);
  }

  loadTrack(key){ const track=this.tracks.find(t=>t.key===key)||this.tracks[0]; this.audio.src=track.src; }
  updateAnimationSpeed(){ this.elements.forEach(el=>{ const h=el.querySelector('.love_horizontal'); const v=el.querySelector('.love_vertical'); h.style.animationDuration=`${10000/this.speed}ms`; v.style.animationDuration=`${20000/this.speed}ms`; }); }
  updateStats(){ /* removed */ }
  animate(){ this.updateStats(); requestAnimationFrame(()=>this.animate()); }
}

document.addEventListener('DOMContentLoaded',()=>{ new LoveAnimation(); });

