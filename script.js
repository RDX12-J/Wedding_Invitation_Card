
document.body.classList.add('intro-locked');
const envelopeIntro = document.getElementById('envelopeIntro');
const envelopeWrap = document.getElementById('envelopeWrap');
const revealInvitation = document.getElementById('revealInvitation');
const musicToggle = document.getElementById('musicToggle');
const ambienceAudio = document.getElementById('ambienceAudio');
const musicLabel = document.getElementById('musicLabel');
const skyshotCanvas = document.getElementById('skyshotCanvas');
const skyshotContext = skyshotCanvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const welcomeImageOverlay = document.getElementById('welcomeImageOverlay');
let ambienceRequested = false;
let welcomeImageTimer;

let skyshotWidth = 0;
let skyshotHeight = 0;
let skyshotFrame = 0;
let nextFireworkAt = 0;
let lastSkyshotFrame = 0;
let skyshotsStarted = false;
const rockets = [];
const sparks = [];
const fireworkHues = [42, 350, 18, 205];
const maxSparks = 150;
const frameInterval = 1000 / 24;

function resizeSkyshotCanvas() {
  if (!skyshotContext) return;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1) * 0.65;
  skyshotWidth = window.innerWidth;
  skyshotHeight = window.innerHeight;
  skyshotCanvas.width = Math.round(skyshotWidth * pixelRatio);
  skyshotCanvas.height = Math.round(skyshotHeight * pixelRatio);
  skyshotContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function launchFirework() {
  const x = skyshotWidth * (0.12 + Math.random() * 0.76);
  const y = skyshotHeight * (0.82 + Math.random() * 0.14);
  rockets.push({
    x,
    y,
    previousY: y,
    targetY: skyshotHeight * (0.1 + Math.random() * 0.42),
    speed: 470 + Math.random() * 190,
    hue: fireworkHues[Math.floor(Math.random() * fireworkHues.length)],
    size: 2.2 + Math.random() * 1.2
  });
}

function burstFirework(rocket) {
  const particleCount = 48 + Math.floor(Math.random() * 17);
  for (let index = 0; index < particleCount; index += 1) {
    if (sparks.length >= maxSparks) break;
    const angle = (Math.PI * 2 * index) / particleCount + (Math.random() - 0.5) * 0.16;
    const speed = 60 + Math.random() * 145;
    const life = 1.2 + Math.random() * 0.8;
    sparks.push({
      x: rocket.x,
      y: rocket.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      hue: Math.random() < 0.2 ? 45 : rocket.hue + Math.random() * 24 - 12,
      size: 1.8 + Math.random() * 2.1,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  for (let index = 0; index < 10; index += 1) {
    if (sparks.length >= maxSparks) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 105;
    const life = 0.7 + Math.random() * 0.5;
    sparks.push({
      x: rocket.x,
      y: rocket.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      hue: 45,
      size: 1 + Math.random() * 1.2,
      twinkle: Math.random() * Math.PI * 2
    });
  }
}

function animateSkyshots(timestamp) {
  if (document.visibilityState === 'hidden') {
    skyshotFrame = 0;
    return;
  }
  if (timestamp - lastSkyshotFrame < frameInterval) {
    skyshotFrame = window.requestAnimationFrame(animateSkyshots);
    return;
  }
  const delta = Math.min((timestamp - lastSkyshotFrame) / 1000, 0.04);
  lastSkyshotFrame = timestamp;
  skyshotContext.clearRect(0, 0, skyshotWidth, skyshotHeight);

  if (timestamp >= nextFireworkAt) {
    launchFirework();
    nextFireworkAt = timestamp + 1600 + Math.random() * 900;
  }

  skyshotContext.save();
  skyshotContext.globalCompositeOperation = 'lighter';
  skyshotContext.shadowBlur = 0;
  for (let index = rockets.length - 1; index >= 0; index -= 1) {
    const rocket = rockets[index];
    rocket.previousY = rocket.y;
    rocket.y -= rocket.speed * delta;
    skyshotContext.beginPath();
    skyshotContext.moveTo(rocket.x, rocket.previousY + 8);
    skyshotContext.lineTo(rocket.x, rocket.y);
    skyshotContext.strokeStyle = `hsla(${rocket.hue}, 100%, 78%, 0.9)`;
    skyshotContext.shadowColor = `hsl(${rocket.hue}, 100%, 70%)`;
    skyshotContext.lineWidth = rocket.size;
    skyshotContext.stroke();
    skyshotContext.beginPath();
    skyshotContext.arc(rocket.x, rocket.y, rocket.size * 1.4, 0, Math.PI * 2);
    skyshotContext.fillStyle = '#fff7dc';
    skyshotContext.fill();
    if (rocket.y <= rocket.targetY) {
      burstFirework(rocket);
      rockets.splice(index, 1);
    }
  }

  for (let index = sparks.length - 1; index >= 0; index -= 1) {
    const spark = sparks[index];
    spark.life -= delta;
    spark.vy += 74 * delta;
    spark.vx *= 1 - delta * 0.22;
    spark.vy *= 1 - delta * 0.22;
    spark.x += spark.vx * delta;
    spark.y += spark.vy * delta;
    if (spark.life <= 0) {
      sparks.splice(index, 1);
      continue;
    }

    const opacity = spark.life / spark.maxLife;
    const twinkle = 0.8 + Math.sin(timestamp / 130 + spark.twinkle) * 0.2;
    skyshotContext.beginPath();
    skyshotContext.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
    skyshotContext.fillStyle = `hsla(${spark.hue}, 100%, 78%, ${opacity * twinkle})`;
    skyshotContext.fill();
  }
  skyshotContext.restore();
  skyshotFrame = window.requestAnimationFrame(animateSkyshots);
}

function startSkyshots() {
  if (reducedMotion.matches || !skyshotContext) return;
  skyshotsStarted = true;
  if (document.visibilityState === 'hidden' || skyshotFrame) return;
  resizeSkyshotCanvas();
  skyshotCanvas.hidden = false;
  lastSkyshotFrame = performance.now();
  nextFireworkAt = lastSkyshotFrame;
  skyshotFrame = window.requestAnimationFrame(animateSkyshots);
}

function closeWelcomeImage() {
  window.clearTimeout(welcomeImageTimer);
  welcomeImageOverlay.hidden = true;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    window.cancelAnimationFrame(skyshotFrame);
    skyshotFrame = 0;
    return;
  }
  if (skyshotsStarted) startSkyshots();
});

window.addEventListener('resize', resizeSkyshotCanvas);

revealInvitation.addEventListener('click', () => {
  ambienceRequested = true;
  playAmbience();
  startSkyshots();
  welcomeImageOverlay.hidden = false;
  welcomeImageTimer = window.setTimeout(closeWelcomeImage, 5000);
  envelopeWrap.classList.add('opened');
  revealInvitation.disabled = true;
  revealInvitation.textContent = 'Revealing your invitation…';
  window.setTimeout(() => {
    envelopeIntro.classList.add('is-opening');
    document.body.classList.remove('intro-locked');
    window.setTimeout(() => envelopeIntro.remove(), 900);
  }, 950);
});

welcomeImageOverlay.addEventListener('click', closeWelcomeImage);
welcomeImageOverlay.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    closeWelcomeImage();
  }
});

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false');
}));
document.getElementById('openInvite').addEventListener('click', () => {
  document.getElementById('countdown').scrollIntoView({behavior:'smooth'});
});

const countdownElements = {
  days: document.getElementById('countdownDays'),
  hours: document.getElementById('countdownHours'),
  minutes: document.getElementById('countdownMinutes'),
  seconds: document.getElementById('countdownSeconds')
};
const countdownMessage = document.getElementById('countdownMessage');
const weddingDate = new Date(2026, 11, 4);
const celebrationHasBegun = weddingDate.getTime() <= Date.now();

function updateCountdown() {
  const remainingSeconds = Math.max(0, Math.floor((weddingDate.getTime() - Date.now()) / 1000));
  countdownElements.days.textContent = String(Math.floor(remainingSeconds / 86400)).padStart(2, '0');
  countdownElements.hours.textContent = String(Math.floor((remainingSeconds % 86400) / 3600)).padStart(2, '0');
  countdownElements.minutes.textContent = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
  countdownElements.seconds.textContent = String(remainingSeconds % 60).padStart(2, '0');
}

if (celebrationHasBegun) {
  countdownMessage.textContent = 'The celebration day is here!';
  updateCountdown();
} else {
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
}

function setMusicState(playing) {
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicLabel.textContent = playing ? 'Pause ambience' : 'Play ambience';
  musicToggle.querySelector('.music-icon').textContent = playing ? 'Ⅱ' : '♫';
}

async function playAmbience() {
  if (!ambienceAudio.paused) {
    setMusicState(true);
    return;
  }

  try {
    await ambienceAudio.play();
    setMusicState(true);
  } catch (error) {
    setMusicState(false);
    if (error.name !== 'NotAllowedError') {
      console.error('Unable to play the wedding ambience audio.', error);
    }
  }
}

function stopAmbience() {
  ambienceAudio.pause();
  ambienceAudio.currentTime = 0;
  setMusicState(false);
}

musicToggle.addEventListener('click', () => {
  if (ambienceAudio.paused) {
    ambienceRequested = true;
    playAmbience();
  } else {
    ambienceRequested = false;
    ambienceAudio.pause();
    setMusicState(false);
  }
});
ambienceAudio.addEventListener('error', () => {
  setMusicState(false);
  console.error('Unable to load the wedding ambience audio.', ambienceAudio.error);
});

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (link && new URL(link.href, window.location.href).origin !== window.location.origin) {
    stopAmbience();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') stopAmbience();
  else if (ambienceRequested) playAmbience();
});
window.addEventListener('pagehide', stopAmbience);
window.addEventListener('pageshow', event => {
  if (event.persisted && ambienceRequested) playAmbience();
});

const mainImage = document.querySelector('.gallery-main img');
const thumbs = [...document.querySelectorAll('.thumb')];
let activeIndex = 0;
function setGallery(index) {
  activeIndex = (index + thumbs.length) % thumbs.length;
  mainImage.src = thumbs[activeIndex].dataset.image;
  thumbs.forEach((thumb, i) => thumb.classList.toggle('active', i === activeIndex));
}
thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => setGallery(index)));
document.querySelector('.gallery-arrow.prev').addEventListener('click', () => setGallery(activeIndex - 1));
document.querySelector('.gallery-arrow.next').addEventListener('click', () => setGallery(activeIndex + 1));

const eventCardOverlay = document.getElementById('eventCardOverlay');
const eventCardImage = document.getElementById('eventCardImage');
const eventCardCount = document.getElementById('eventCardCount');
const eventCardImages = ['images/card.svg', 'images/card-two.svg'];
let activeEventCardImage = 0;
let swipeStartX = null;

function closeEventCard() {
  eventCardOverlay.hidden = true;
}

function showEventCardImage(index) {
  activeEventCardImage = (index + eventCardImages.length) % eventCardImages.length;
  eventCardImage.src = eventCardImages[activeEventCardImage];
  eventCardCount.textContent = `${activeEventCardImage + 1} / ${eventCardImages.length}`;
}

document.querySelectorAll('.event-open-card').forEach(button => {
  button.addEventListener('click', () => {
    showEventCardImage(0);
    eventCardImage.alt = `${button.dataset.cardEvent} invitation card preview`;
    eventCardOverlay.hidden = false;
    eventCardOverlay.focus();
  });
});
eventCardOverlay.querySelector('.event-card-arrow.prev').addEventListener('click', event => {
  event.stopPropagation();
  showEventCardImage(activeEventCardImage - 1);
});
eventCardOverlay.querySelector('.event-card-arrow.next').addEventListener('click', event => {
  event.stopPropagation();
  showEventCardImage(activeEventCardImage + 1);
});
eventCardOverlay.querySelector('.event-card-close').addEventListener('click', closeEventCard);
eventCardOverlay.addEventListener('click', event => {
  if (event.target === eventCardOverlay) closeEventCard();
});
eventCardImage.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch') swipeStartX = event.clientX;
});
eventCardImage.addEventListener('pointerup', event => {
  if (swipeStartX === null) return;
  const swipeDistance = event.clientX - swipeStartX;
  swipeStartX = null;
  if (Math.abs(swipeDistance) < 40) return;
  showEventCardImage(activeEventCardImage + (swipeDistance < 0 ? 1 : -1));
});
eventCardImage.addEventListener('pointercancel', () => {
  swipeStartX = null;
});
document.addEventListener('keydown', event => {
  if (eventCardOverlay.hidden) return;
  if (event.key === 'Escape') closeEventCard();
  if (event.key === 'ArrowLeft') showEventCardImage(activeEventCardImage - 1);
  if (event.key === 'ArrowRight') showEventCardImage(activeEventCardImage + 1);
});

async function shareInvitation() {
  const feedback = document.getElementById('shareFeedback');
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({title: 'Double Wedding Invitation', text: 'You are invited to celebrate two beautiful weddings with us!', url});
      feedback.textContent = 'Sharing opened.';
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      feedback.textContent = 'Invitation link copied!';
    } else {
      window.prompt('Copy your invitation link:', url);
      feedback.textContent = 'Copy the link shown above.';
    }
  } catch (err) {
    if (err.name !== 'AbortError') feedback.textContent = 'You can copy the page URL from your browser.';
  }
}
document.getElementById('shareButton').addEventListener('click', shareInvitation);
document.getElementById('shareTop').addEventListener('click', shareInvitation);
document.getElementById('rsvpButton').addEventListener('click', () => {
  document.getElementById('shareFeedback').textContent = 'RSVP form can be connected when event details are ready.';
  document.getElementById('shareButton').scrollIntoView({behavior:'smooth', block:'center'});
});