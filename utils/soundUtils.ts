// Simple oscillator-based sound effects to avoid loading external assets
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0) => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(audioCtx.currentTime + startTime);
  osc.stop(audioCtx.currentTime + startTime + duration);
};

export const playStartSound = () => {
  playTone(600, 'sine', 0.1);
};

export const playSuccessSound = () => {
  playTone(500, 'sine', 0.1, 0);
  playTone(800, 'sine', 0.2, 0.1);
};

export const playErrorSound = () => {
  playTone(150, 'sawtooth', 0.3);
};
