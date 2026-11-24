// Procedural Web Audio API sound effects & GTA-inspired chill synth background loop
// Works 100% offline in mobile APKs without external audio files.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private musicTimer: number | null = null;
  private musicStep: number = 0;
  private isPlayingMusic: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(nextMuted: boolean) {
    this.muted = nextMuted;
    if (nextMuted) {
      this.stopMusic();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.08,
    delay: number = 0,
    slideToFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, slideToFreq),
        now + duration
      );
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playSplashSting() {
    this.playTone(110, 0.7, 'triangle', 0.1, 0);
    this.playTone(220, 0.65, 'sine', 0.08, 0.06);
    this.playTone(329.63, 0.55, 'sine', 0.07, 0.14);
    this.playTone(440, 0.8, 'triangle', 0.07, 0.24);
  }

  public playClick() {
    this.playTone(540, 0.07, 'triangle', 0.06, 0, 320);
  }

  public playCoin() {
    this.playTone(880, 0.1, 'sine', 0.08, 0);
    this.playTone(1318.5, 0.22, 'sine', 0.08, 0.08);
  }

  public playDialogueBlip(pitchOffset = 0) {
    const base = 360 + pitchOffset + (Math.random() * 40 - 20);
    this.playTone(base, 0.075, 'triangle', 0.055, 0, base * 1.12);
  }

  public speakLine(text: string, speaker: string) {
    if (this.muted || typeof window === 'undefined') return;
    const isFemale = speaker === 'Aisha' || speaker === 'Maya' || speaker === 'Zara';
    this.playDialogueBlip(isFemale ? 120 : -40);
    try {
      if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.05;
        utter.pitch = isFemale ? 1.25 : 0.92;
        utter.volume = 0.75;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      // Gracefully ignore when speechSynthesis is unavailable
    }
  }

  public playPhoneRing() {
    this.playTone(659.25, 0.12, 'sine', 0.07, 0);
    this.playTone(783.99, 0.12, 'sine', 0.07, 0.12);
    this.playTone(1046.5, 0.25, 'sine', 0.08, 0.24);
  }

  public playDoor() {
    this.playTone(140, 0.16, 'triangle', 0.09, 0, 75);
    this.playTone(220, 0.12, 'sine', 0.05, 0.08);
  }

  public playNewYearFirework() {
    this.playTone(220, 0.28, 'sawtooth', 0.04, 0, 680);
    this.playTone(987.77, 0.2, 'sine', 0.07, 0.26);
    this.playTone(1174.66, 0.22, 'sine', 0.07, 0.34);
    this.playTone(1567.98, 0.35, 'triangle', 0.07, 0.42);
  }

  public playCarStart() {
    this.playTone(75, 0.25, 'sawtooth', 0.06, 0, 145);
    this.playTone(110, 0.2, 'triangle', 0.05, 0.18, 92);
  }

  public playCrash() {
    this.playTone(95, 0.32, 'sawtooth', 0.14, 0, 32);
    this.playTone(185, 0.2, 'square', 0.1, 0.03, 45);
    this.playTone(620, 0.15, 'triangle', 0.06, 0.05, 190);
  }

  public playWaterShower() {
    this.playTone(420, 0.22, 'sine', 0.04, 0, 640);
    this.playTone(540, 0.28, 'triangle', 0.03, 0.12, 380);
  }

  public playRomanticChime() {
    this.playTone(523.25, 0.35, 'sine', 0.07, 0);
    this.playTone(659.25, 0.4, 'sine', 0.07, 0.12);
    this.playTone(783.99, 0.5, 'triangle', 0.07, 0.24);
    this.playTone(1046.5, 0.65, 'sine', 0.06, 0.38);
  }

  public playWeddingCelebration() {
    this.playTone(392, 0.28, 'triangle', 0.08, 0);
    this.playTone(493.88, 0.28, 'triangle', 0.08, 0.14);
    this.playTone(587.33, 0.35, 'sine', 0.09, 0.28);
    this.playTone(783.99, 0.65, 'sine', 0.09, 0.44);
  }

  public startMusic() {
    if (this.muted || this.isPlayingMusic) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.isPlayingMusic = true;

    // Chill West-Coast GTA synth groove (16-step loop at ~100 BPM = 300ms per eighth note)
    const bassNotes = [
      110, 0, 110, 130.81,
      98, 0, 98, 110,
      87.31, 0, 87.31, 98,
      82.41, 0, 98, 110,
    ];
    const leadNotes = [
      440, 0, 523.25, 0,
      392, 0, 440, 0,
      349.23, 0, 392, 0,
      329.63, 392, 440, 0,
    ];

    this.musicTimer = window.setInterval(() => {
      if (this.muted || !this.isPlayingMusic) return;
      const step = this.musicStep % 16;
      const bass = bassNotes[step];
      const lead = leadNotes[step];

      if (bass > 0) {
        this.playTone(bass, 0.24, 'triangle', 0.04);
      }
      if (lead > 0 && step % 2 === 0) {
        this.playTone(lead, 0.28, 'sine', 0.025, 0.02);
      }
      this.musicStep += 1;
    }, 300);
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
