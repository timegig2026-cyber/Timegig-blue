export function playNotificationSound() {
  if (localStorage.getItem('alertSounds') === 'false') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // A pleasant "ding-ding" notification sound
    playTone(523.25, ctx.currentTime, 0.2); // C5
    playTone(659.25, ctx.currentTime + 0.15, 0.4); // E5
  } catch (e) {
    console.error('Audio play failed:', e);
  }
}
