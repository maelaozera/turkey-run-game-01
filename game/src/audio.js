// Every sound in Gobble Dash is synthesized with WebAudio: no audio files,
// no network. A cheerful banjo-ish loop for the run, and one-shot effects
// for jumping, gobbling, picking corn, getting hit, and the two endings.
export function createAudio() {
  let context = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicTimer = null;
  let step = 0;

  try {
    muted = window.localStorage.getItem('gobble-dash-muted') === '1';
  } catch {
    muted = false;
  }

  // Banjo-pluck melody (C major pentatonic, bouncy) over a simple bass line.
  const MELODY = [
    523, 0, 659, 0, 784, 0, 659, 0, 880, 0, 784, 659, 587, 0, 523, 0,
    523, 0, 659, 0, 784, 0, 880, 0, 784, 0, 659, 0, 587, 659, 523, 0,
  ];
  const BASS = [131, 0, 0, 0, 175, 0, 0, 0, 196, 0, 0, 0, 175, 0, 165, 0];

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume().catch(() => {});
      return true;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(context.destination);
    musicGain = context.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
    return true;
  }

  function tone(frequency, duration, type, volume, when = 0, slideTo = 0) {
    if (!context || !master) return;
    const start = context.currentTime + when;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
    if (slideTo > 0) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  function musicTone(frequency, duration, type, volume, when = 0) {
    if (!context || !musicGain) return;
    const start = context.currentTime + when;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(musicGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  function playMusicStep() {
    if (!context || muted) return;
    const beat = 0.16;
    const melodyNote = MELODY[step % MELODY.length];
    const bassNote = BASS[step % BASS.length];
    if (melodyNote > 0) musicTone(melodyNote, beat * 0.9, 'triangle', 0.9);
    if (bassNote > 0) musicTone(bassNote, beat * 1.8, 'sine', 0.9);
    if (step % 4 === 2) musicTone(1046, beat * 0.5, 'square', 0.12);
    step += 1;
  }

  return {
    unlock() {
      ensure();
    },
    isMuted() {
      return muted;
    },
    setMuted(value) {
      muted = value;
      try {
        window.localStorage.setItem('gobble-dash-muted', value ? '1' : '0');
      } catch {
        // Storage can be off: mute lasts this visit only.
      }
      if (master) master.gain.value = value ? 0 : 0.9;
    },
    startMusic() {
      if (!ensure() || musicTimer !== null) return;
      step = 0;
      musicTimer = window.setInterval(playMusicStep, 160);
    },
    stopMusic() {
      if (musicTimer !== null) {
        window.clearInterval(musicTimer);
        musicTimer = null;
      }
    },
    click() {
      if (!ensure()) return;
      tone(660, 0.07, 'square', 0.12);
    },
    jump() {
      if (!ensure()) return;
      tone(280, 0.16, 'sine', 0.35, 0, 620);
    },
    land() {
      if (!ensure()) return;
      tone(140, 0.08, 'sine', 0.2, 0, 70);
    },
    pickup(combo) {
      if (!ensure()) return;
      const base = 660 + Math.min(combo, 5) * 90;
      tone(base, 0.09, 'triangle', 0.3);
      tone(base * 1.5, 0.12, 'triangle', 0.25, 0.06);
    },
    feather() {
      if (!ensure()) return;
      tone(880, 0.1, 'triangle', 0.3);
      tone(1174, 0.14, 'triangle', 0.28, 0.07);
      tone(1568, 0.18, 'triangle', 0.22, 0.14);
    },
    gobble() {
      if (!ensure()) return;
      // A turkey gobble: three quick low clucks, pitch dropping.
      tone(320, 0.09, 'sawtooth', 0.16, 0, 180);
      tone(260, 0.09, 'sawtooth', 0.16, 0.11, 150);
      tone(210, 0.14, 'sawtooth', 0.18, 0.22, 120);
    },
    whoosh() {
      if (!ensure()) return;
      tone(900, 0.22, 'sawtooth', 0.1, 0, 240);
    },
    hit() {
      if (!ensure()) return;
      tone(180, 0.25, 'square', 0.3, 0, 60);
      tone(90, 0.3, 'sine', 0.4, 0.02, 45);
    },
    hide() {
      if (!ensure()) return;
      tone(500, 0.1, 'sine', 0.2, 0, 900);
      tone(700, 0.12, 'sine', 0.18, 0.08, 1100);
    },
    yell() {
      if (!ensure()) return;
      tone(220, 0.35, 'sawtooth', 0.25, 0, 440);
      tone(330, 0.3, 'sawtooth', 0.2, 0.1, 180);
    },
    win() {
      if (!ensure()) return;
      const notes = [523, 659, 784, 1046, 1318];
      notes.forEach((note, index) => tone(note, 0.28, 'triangle', 0.3, index * 0.13));
    },
    lose() {
      if (!ensure()) return;
      const notes = [392, 330, 262, 196];
      notes.forEach((note, index) => tone(note, 0.35, 'sawtooth', 0.2, index * 0.18));
    },
  };
}
