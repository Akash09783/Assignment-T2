// Real-time Web Audio Synthesizer for Piezo Buzzer and User Interactions

class AudioManager {
  private ctx: AudioContext | null = null;
  private buzzerOsc: OscillatorNode | null = null;
  private buzzerGain: GainNode | null = null;
  private isBuzzerActive: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setBuzzer(active: boolean, frequency: number = 2400) {
    this.initContext();
    if (!this.ctx) return;

    if (active && !this.isBuzzerActive) {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Gentle volume

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();

        this.buzzerOsc = osc;
        this.buzzerGain = gain;
        this.isBuzzerActive = true;
      } catch (e) {
        console.warn('AudioContext error:', e);
      }
    } else if (!active && this.isBuzzerActive) {
      if (this.buzzerOsc) {
        try {
          this.buzzerOsc.stop();
          this.buzzerOsc.disconnect();
        } catch (e) {}
        this.buzzerOsc = null;
      }
      this.isBuzzerActive = false;
    }
  }

  public playClick() {
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }
}

export const audioManager = new AudioManager();
