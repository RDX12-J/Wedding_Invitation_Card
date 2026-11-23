
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
const eventGrid = document.querySelector('.event-grid');
const eventCards = eventGrid ? [...eventGrid.querySelectorAll('.event-card')] : [];
const eventStackMedia = window.matchMedia('(max-width: 560px)');
let ambienceRequested = false;
let welcomeImageTimer;
let activeEventIndex = 0;

if (eventGrid) {
  const updateEventStack = nextIndex => {
    activeEventIndex = Math.max(0, Math.min(nextIndex, eventCards.length - 1));
    eventCards.forEach((card, index) => {
      card.classList.toggle('is-active', index === activeEventIndex);
      card.classList.toggle('is-previous', index === activeEventIndex - 1);
      card.classList.toggle('is-next', index === activeEventIndex + 1);
      card.classList.toggle('is-back', Math.abs(index - activeEventIndex) > 1);
      if (index === activeEventIndex) {
        card.setAttribute('aria-current', 'true');
      } else {
        card.removeAttribute('aria-current');
      }
    });
  };

  updateEventStack(activeEventIndex);

  let dragStartX = 0;
  let dragStartScrollLeft = 0;
  let activeDragPointer = null;
  let dragStarted = false;
  let mobileGesture = null;

  eventGrid.addEventListener('pointerdown', event => {
    if (eventStackMedia.matches) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      mobileGesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        deltaX: 0,
        deltaY: 0
      };
      eventGrid.setPointerCapture(event.pointerId);
      return;
    }
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragStartX = event.clientX;
    dragStartScrollLeft = eventGrid.scrollLeft;
    activeDragPointer = event.pointerId;
    dragStarted = false;
    eventGrid.setPointerCapture(event.pointerId);
  });

  eventGrid.addEventListener('pointermove', event => {
    if (mobileGesture?.pointerId === event.pointerId) {
      mobileGesture.deltaX = event.clientX - mobileGesture.startX;
      mobileGesture.deltaY = event.clientY - mobileGesture.startY;
      if (Math.abs(mobileGesture.deltaX) > 10 &&
        Math.abs(mobileGesture.deltaX) > Math.abs(mobileGesture.deltaY)) {
        eventGrid.classList.add('is-swiping');
        const progress = Math.min(Math.abs(mobileGesture.deltaX) / 150, 1);
        eventGrid.style.setProperty('--event-drag-x', `${mobileGesture.deltaX}px`);
        eventGrid.style.setProperty('--event-drag-y', `${Math.min(Math.abs(mobileGesture.deltaX) * 0.035, 18)}px`);
        eventGrid.style.setProperty('--event-drag-rotate', `${Math.max(-6, Math.min(6, mobileGesture.deltaX * 0.025))}deg`);
        if (mobileGesture.deltaX < 0) {
          eventGrid.style.setProperty('--event-next-shift', `${48 * (1 - progress)}%`);
          eventGrid.style.setProperty('--event-next-scale', `${0.88 + progress * 0.12}`);
          eventGrid.style.setProperty('--event-next-y', `${18 * (1 - progress)}px`);
        } else {
          eventGrid.style.setProperty('--event-previous-shift', `${48 * (1 - progress)}%`);
          eventGrid.style.setProperty('--event-previous-scale', `${0.88 + progress * 0.12}`);
          eventGrid.style.setProperty('--event-previous-y', `${18 * (1 - progress)}px`);
        }
        if (event.cancelable) event.preventDefault();
      }
      return;
    }
    if (event.pointerId !== activeDragPointer) return;
    const distance = event.clientX - dragStartX;
    if (!dragStarted && Math.abs(distance) > 6) {
      dragStarted = true;
      eventGrid.classList.add('is-dragging');
    }
    if (dragStarted) {
      eventGrid.scrollTo({ left: dragStartScrollLeft - distance, behavior: 'instant' });
      event.preventDefault();
    }
  });

  const clearMobileGesture = () => {
    mobileGesture = null;
    eventGrid.classList.remove('is-swiping');
    [
      '--event-drag-x',
      '--event-drag-y',
      '--event-drag-rotate',
      '--event-next-shift',
      '--event-next-scale',
      '--event-next-y',
      '--event-previous-shift',
      '--event-previous-scale',
      '--event-previous-y'
    ].forEach(property => eventGrid.style.removeProperty(property));
  };

  const finishMobileGesture = (event, shouldAdvance) => {
    if (mobileGesture?.pointerId !== event.pointerId) return;
    const { deltaX, deltaY } = mobileGesture;
    clearMobileGesture();
    if (shouldAdvance && Math.abs(deltaX) > 56 && Math.abs(deltaX) > Math.abs(deltaY)) {
      updateEventStack(activeEventIndex + (deltaX < 0 ? 1 : -1));
    }
  };

  eventGrid.addEventListener('pointerup', event => finishMobileGesture(event, true));
  eventGrid.addEventListener('pointercancel', event => finishMobileGesture(event, false));
  eventGrid.addEventListener('lostpointercapture', event => finishMobileGesture(event, false));

  eventGrid.addEventListener('keydown', event => {
    if (!eventStackMedia.matches || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    updateEventStack(activeEventIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });

  const finishEventGridDrag = event => {
    if (event.pointerId !== activeDragPointer) return;
    activeDragPointer = null;
    if (dragStarted) {
      eventGrid.classList.remove('is-dragging');
      eventGrid.scrollTo({ left: eventGrid.scrollLeft, behavior: 'smooth' });
    }
    dragStarted = false;
  };

  eventGrid.addEventListener('pointerup', finishEventGridDrag);
  eventGrid.addEventListener('pointercancel', finishEventGridDrag);
  eventGrid.addEventListener('lostpointercapture', finishEventGridDrag);
}

document.querySelectorAll('.portrait-scratch').forEach(button => {
  const frame = button.closest('.portrait-frame');
  const canvas = button.querySelector('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let scratched = false;
  let revealed = false;
  let activePointer = null;
  let previousPoint = null;

  const drawScratchCover = () => {
    if (scratched || revealed) return;
    const bounds = button.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * pixelRatio);
    canvas.height = Math.round(bounds.height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const gradient = context.createLinearGradient(0, 0, bounds.width, bounds.height);
    gradient.addColorStop(0, '#f0d393');
    gradient.addColorStop(.48, '#bd8746');
    gradient.addColorStop(1, '#8e552b');
    context.fillStyle = gradient;
    context.fillRect(0, 0, bounds.width, bounds.height);

    context.strokeStyle = '#fff0c966';
    context.lineWidth = 1;
    for (let y = 16; y < bounds.height; y += 26) {
      for (let x = 16; x < bounds.width; x += 26) {
        context.beginPath();
        context.moveTo(x, y - 4);
        context.lineTo(x + 4, y);
        context.lineTo(x, y + 4);
        context.lineTo(x - 4, y);
        context.closePath();
        context.stroke();
      }
    }

    context.strokeStyle = '#fff0c9a8';
    context.strokeRect(8, 8, bounds.width - 16, bounds.height - 16);
  };

  const getScratchPoint = event => {
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const eraseScratch = (point, isStart) => {
    context.globalCompositeOperation = 'destination-out';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 46;
    context.beginPath();
    if (isStart) {
      context.arc(point.x, point.y, 23, 0, Math.PI * 2);
      context.fill();
    } else {
      context.moveTo(previousPoint.x, previousPoint.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    }
    previousPoint = point;
  };

  const getScratchCoverage = () => {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const sampleStep = 16;
    let transparentPixels = 0;
    let sampledPixels = 0;

    for (let y = 0; y < canvas.height; y += sampleStep) {
      for (let x = 0; x < canvas.width; x += sampleStep) {
        if (pixels[(y * canvas.width + x) * 4 + 3] < 32) transparentPixels += 1;
        sampledPixels += 1;
      }
    }
    return transparentPixels / sampledPixels;
  };

  const revealPortrait = () => {
    if (revealed) return;
    revealed = true;
    button.disabled = true;
    frame.classList.remove('is-scratching');
    frame.classList.add('is-revealing');
    window.setTimeout(() => {
      frame.classList.add('is-revealed');
      button.hidden = true;
    }, 650);
  };

  button.addEventListener('pointerdown', event => {
    if (revealed || (event.pointerType === 'mouse' && event.button !== 0)) return;
    activePointer = event.pointerId;
    scratched = true;
    frame.classList.add('is-scratching');
    button.setPointerCapture(event.pointerId);
    eraseScratch(getScratchPoint(event), true);
    event.preventDefault();
  });

  button.addEventListener('pointermove', event => {
    if (event.pointerId !== activePointer) return;
    eraseScratch(getScratchPoint(event), false);
    event.preventDefault();
  });

  const finishScratch = event => {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    previousPoint = null;
    frame.classList.remove('is-scratching');
    if (!revealed && getScratchCoverage() >= .4) revealPortrait();
  };

  button.addEventListener('pointerup', finishScratch);
  button.addEventListener('pointercancel', finishScratch);
  button.addEventListener('lostpointercapture', finishScratch);
  button.addEventListener('click', event => {
    if (event.detail === 0) revealPortrait();
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(drawScratchCover).observe(frame);
  } else {
    window.addEventListener('resize', drawScratchCover);
  }
  drawScratchCover();
});

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
  document.getElementById('countdown').scrollIntoView({ behavior: 'smooth' });
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
const eventCardZoom = document.getElementById('eventCardZoom');
const eventCardViewport = document.getElementById('eventCardViewport');
const eventCardImages = ['images/card.jpg', 'images/card-two.jpg'];
let activeEventCardImage = 0;
let eventCardScale = 1;
let eventCardOffsetX = 0;
let eventCardOffsetY = 0;
let eventCardGesture = null;
let eventCardPinched = false;
const eventCardPointers = new Map();

function clampEventCardOffset() {
  const viewportRect = eventCardViewport.getBoundingClientRect();
  const maxX = Math.max(0, (eventCardImage.offsetWidth * eventCardScale - viewportRect.width) / 2);
  const maxY = Math.max(0, (eventCardImage.offsetHeight * eventCardScale - viewportRect.height) / 2);
  eventCardOffsetX = Math.max(-maxX, Math.min(maxX, eventCardOffsetX));
  eventCardOffsetY = Math.max(-maxY, Math.min(maxY, eventCardOffsetY));
}

function updateEventCardZoom() {
  clampEventCardOffset();
  eventCardImage.style.transform =
    `translate3d(${eventCardOffsetX}px, ${eventCardOffsetY}px, 0) scale(${eventCardScale})`;
  eventCardZoom.textContent = eventCardScale > 1 ? 'Zoom Out' : 'Zoom In';
  eventCardZoom.setAttribute('aria-pressed', String(eventCardScale > 1));
}

function setEventCardZoom(scale) {
  eventCardScale = scale;
  eventCardOffsetX = 0;
  eventCardOffsetY = 0;
  updateEventCardZoom();
}

function closeEventCard() {
  eventCardOverlay.hidden = true;
  setEventCardZoom(1);
}

function showEventCardImage(index) {
  activeEventCardImage = (index + eventCardImages.length) % eventCardImages.length;
  eventCardImage.src = eventCardImages[activeEventCardImage];
  eventCardCount.textContent = `${activeEventCardImage + 1} / ${eventCardImages.length}`;
  setEventCardZoom(1);
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
eventCardZoom.addEventListener('click', () => {
  setEventCardZoom(eventCardScale > 1 ? 1 : 2);
});
eventCardOverlay.addEventListener('click', event => {
  if (event.target === eventCardOverlay) closeEventCard();
});
function getEventCardPinch() {
  const [first, second] = [...eventCardPointers.values()];
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  return {
    distance: Math.hypot(dx, dy),
    centerX: (first.x + second.x) / 2,
    centerY: (first.y + second.y) / 2
  };
}

eventCardViewport.addEventListener('pointerdown', event => {
  eventCardPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (eventCardPointers.size === 1) {
    eventCardPinched = false;
    eventCardGesture = {
      mode: eventCardScale > 1 ? 'pan' : 'swipe',
      startX: event.clientX,
      startY: event.clientY,
      offsetX: eventCardOffsetX,
      offsetY: eventCardOffsetY
    };
  } else if (eventCardPointers.size === 2) {
    const pinch = getEventCardPinch();
    const rect = eventCardViewport.getBoundingClientRect();
    eventCardPinched = true;
    eventCardGesture = {
      mode: 'pinch',
      scale: eventCardScale,
      distance: pinch.distance,
      contentX: (pinch.centerX - rect.left - rect.width / 2 - eventCardOffsetX) / eventCardScale,
      contentY: (pinch.centerY - rect.top - rect.height / 2 - eventCardOffsetY) / eventCardScale
    };
  }
});
eventCardViewport.addEventListener('pointermove', event => {
  if (!eventCardPointers.has(event.pointerId)) return;
  eventCardPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (eventCardGesture?.mode === 'pinch' && eventCardPointers.size === 2) {
    const pinch = getEventCardPinch();
    const rect = eventCardViewport.getBoundingClientRect();
    eventCardScale = Math.max(1, Math.min(4,
      eventCardGesture.scale * pinch.distance / eventCardGesture.distance));
    eventCardOffsetX = pinch.centerX - rect.left - rect.width / 2 - eventCardGesture.contentX * eventCardScale;
    eventCardOffsetY = pinch.centerY - rect.top - rect.height / 2 - eventCardGesture.contentY * eventCardScale;
    updateEventCardZoom();
  } else if (eventCardGesture?.mode === 'pan' && eventCardPointers.size === 1) {
    eventCardOffsetX = eventCardGesture.offsetX + event.clientX - eventCardGesture.startX;
    eventCardOffsetY = eventCardGesture.offsetY + event.clientY - eventCardGesture.startY;
    updateEventCardZoom();
  }
});
eventCardViewport.addEventListener('pointerup', event => {
  const pointer = eventCardPointers.get(event.pointerId);
  if (!pointer) return;
  eventCardPointers.delete(event.pointerId);
  if (eventCardPointers.size === 1 && eventCardPinched) {
    const remaining = [...eventCardPointers.values()][0];
    eventCardGesture = {
      mode: 'pan',
      startX: remaining.x,
      startY: remaining.y,
      offsetX: eventCardOffsetX,
      offsetY: eventCardOffsetY
    };
  } else if (eventCardPointers.size === 0) {
    if (!eventCardPinched && eventCardGesture?.mode === 'swipe') {
      const swipeDistance = event.clientX - eventCardGesture.startX;
      if (Math.abs(swipeDistance) >= 40) {
        showEventCardImage(activeEventCardImage + (swipeDistance < 0 ? 1 : -1));
      }
    }
    eventCardGesture = null;
    eventCardPinched = false;
  }
});
eventCardViewport.addEventListener('pointercancel', () => {
  eventCardPointers.clear();
  eventCardGesture = null;
  eventCardPinched = false;
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
      await navigator.share({ title: 'Double Wedding Invitation', text: 'You are invited to celebrate two beautiful weddings with us!', url });
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
const RSVP_API_URL = "https://wedding-rsvp-api.rishabhdhankhar.workers.dev/";

document.getElementById('rsvpForm').addEventListener('submit', async event => {
  event.preventDefault();

  const form = event.currentTarget;
  const feedback = document.getElementById('rsvpFeedback');
  const button = form.querySelector('button[type="submit"]');

  const name = form.elements.name.value.trim();
  const guests = form.elements.guests.value;
  const attendance = form.elements.attendance.value;
  const wishes = form.elements.wishes.value.trim();

  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = 'Submitting...';
  feedback.textContent = '';

  try {
    const response = await fetch(RSVP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        guests,
        attendance,
        ...(wishes ? { wishes } : {})
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Submission failed');
    }

    feedback.textContent = 'Thank you! Your RSVP has been saved successfully.';
    form.reset();

  } catch (error) {
    console.error('RSVP Error:', error);
    feedback.textContent = 'Unable to submit RSVP. Please try again.';

  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

/* Royal Wedding Visitor Counter */

(async function initWeddingVisitorCounter() {
  const API_URL =
    "https://wedding-visitor-counter.rishabhdhankhar.workers.dev";

  const totalElement = document.getElementById("totalVisits");
  const uniqueElement = document.getElementById("uniqueVisitors");

  if (!totalElement || !uniqueElement) return;

  try {
    let visitorId = localStorage.getItem("weddingVisitorId");

    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("weddingVisitorId", visitorId);
    }

    // Record this page opening
    const visitResponse = await fetch(`${API_URL}/visit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ visitorId })
    });

    if (!visitResponse.ok) {
      throw new Error("Unable to record visit");
    }

    // Fetch updated statistics
    const statsResponse = await fetch(`${API_URL}/stats`);

    if (!statsResponse.ok) {
      throw new Error("Unable to fetch statistics");
    }

    const stats = await statsResponse.json();

    totalElement.textContent =
      Number(stats.totalVisits).toLocaleString("en-IN");

    uniqueElement.textContent =
      Number(stats.uniqueVisitors).toLocaleString("en-IN");

  } catch (error) {
    console.error("Wedding visitor counter:", error);
    totalElement.textContent = "—";
    uniqueElement.textContent = "—";
  }
})();