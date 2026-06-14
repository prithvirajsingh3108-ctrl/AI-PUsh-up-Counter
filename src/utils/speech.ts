let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string, force: boolean = false, rate: number = 1.0) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  // If force is true, cancel current speaking immediately to speak the new alert
  if (force) {
    window.speechSynthesis.cancel();
  } else if (window.speechSynthesis.speaking) {
    // Avoid piling up counts or generic notifications if we're already speaking
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    
    // Choose a pleasant high quality voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                        voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Speech synthesis failed:', error);
  }
}

export function cancelSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function playSuccessChime() {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Simple short uplifting chime (C5 -> E5 -> G5)
    const playNote = (freq: number, delay: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + duration);
    };

    playNote(523.25, 0, 0.15); // C5
    playNote(659.25, 0.1, 0.15); // E5
    playNote(783.99, 0.2, 0.25); // G5
  } catch (e) {
    console.warn('Synth sound fail:', e);
  }
}

export function playWarningBeep() {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime); // Low warning buzz
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.warn('Synth sound fail:', e);
  }
}
