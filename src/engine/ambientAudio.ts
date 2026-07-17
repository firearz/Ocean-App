// Ocean — Ambient Audio Engine
// Procedural Web Audio API synthesis. Zero bundled files.
// All sounds generated in real-time using noise buffers + filters + LFOs.

export type AmbientSound = 'none' | 'brown-noise' | 'ocean' | 'rain' | 'pink-noise' | 'white-noise';

const FADE_DURATION = 1.5; // seconds for volume fade transitions
const NOISE_BUFFER_DURATION = 4; // seconds per noise buffer (loops)

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sourceNodes: AudioNode[] = [];
  private lfoNodes: OscillatorNode[] = [];
  private currentSound: AmbientSound = 'none';
  private currentVolume = 0.6; // 0-1

  // ── Context init (lazy, requires user gesture) ──────────────────────────
  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMaster(): GainNode {
    const ctx = this.getContext();
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.currentVolume;
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  // ── Noise Buffer Factories ───────────────────────────────────────────────
  private createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufLen = Math.floor(ctx.sampleRate * NOISE_BUFFER_DURATION);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  private createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufLen = Math.floor(ctx.sampleRate * NOISE_BUFFER_DURATION);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5; // boost amplitude
    }
    return buf;
  }

  private createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    // Paul Kellet's pink noise approximation
    const bufLen = Math.floor(ctx.sampleRate * NOISE_BUFFER_DURATION);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) / 9;
      b6 = white * 0.115926;
    }
    return buf;
  }

  private makeLoopingSource(ctx: AudioContext, buf: AudioBuffer): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }

  // ── Sound Constructors ───────────────────────────────────────────────────
  private buildWhiteNoise(): void {
    const ctx = this.getContext();
    const master = this.getMaster();
    const src = this.makeLoopingSource(ctx, this.createWhiteNoiseBuffer(ctx));
    // Mild high-cut to remove harshness
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 8000;
    src.connect(filter);
    filter.connect(master);
    src.start();
    this.sourceNodes.push(src, filter);
  }

  private buildBrownNoise(): void {
    const ctx = this.getContext();
    const master = this.getMaster();
    const src = this.makeLoopingSource(ctx, this.createBrownNoiseBuffer(ctx));
    src.connect(master);
    src.start();
    this.sourceNodes.push(src);
  }

  private buildPinkNoise(): void {
    const ctx = this.getContext();
    const master = this.getMaster();
    const src = this.makeLoopingSource(ctx, this.createPinkNoiseBuffer(ctx));
    src.connect(master);
    src.start();
    this.sourceNodes.push(src);
  }

  private buildOcean(): void {
    const ctx = this.getContext();
    const master = this.getMaster();

    // Base: low brown noise
    const brownSrc = this.makeLoopingSource(ctx, this.createBrownNoiseBuffer(ctx));

    // Bandpass to shape the "wave" frequency range
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 400;
    bandpass.Q.value = 0.5;

    // Low-pass to soften
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800;

    // LFO for wave swell (~0.08 Hz = one wave every ~12 seconds)
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5; // depth of wave modulation

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;

    // LFO modulates amplitude gain
    const waveEnvelope = ctx.createGain();
    waveEnvelope.gain.value = 0.6;
    lfo.connect(lfoGain);
    lfoGain.connect(waveEnvelope.gain);

    brownSrc.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(waveEnvelope);
    waveEnvelope.connect(master);

    brownSrc.start();
    lfo.start();

    this.sourceNodes.push(brownSrc, bandpass, lowpass, waveEnvelope);
    this.lfoNodes.push(lfo);
  }

  private buildRain(): void {
    const ctx = this.getContext();
    const master = this.getMaster();

    // High-frequency filtered white noise (rain texture)
    const whiteSrc = this.makeLoopingSource(ctx, this.createWhiteNoiseBuffer(ctx));
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 1200;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 6000;

    // Fast tremolo LFO (~4 Hz) to simulate drip rhythm
    const tremoloLfo = ctx.createOscillator();
    tremoloLfo.type = 'sine';
    tremoloLfo.frequency.value = 4;
    const tremoloDepth = ctx.createGain();
    tremoloDepth.gain.value = 0.15;
    const tremoloEnv = ctx.createGain();
    tremoloEnv.gain.value = 0.85;

    tremoloLfo.connect(tremoloDepth);
    tremoloDepth.connect(tremoloEnv.gain);

    whiteSrc.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(tremoloEnv);
    tremoloEnv.connect(master);

    whiteSrc.start();
    tremoloLfo.start();

    this.sourceNodes.push(whiteSrc, highpass, lowpass, tremoloEnv);
    this.lfoNodes.push(tremoloLfo);
  }

  // ── Stop all running nodes ───────────────────────────────────────────────
  private stopAll(): void {
    for (const node of this.lfoNodes) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    for (const node of this.sourceNodes) {
      if (node instanceof AudioBufferSourceNode) {
        try { node.stop(); } catch { /* already stopped */ }
      }
    }
    this.sourceNodes = [];
    this.lfoNodes = [];
  }

  // ── Public API ───────────────────────────────────────────────────────────
  play(sound: AmbientSound): void {
    if (sound === 'none') {
      this.stop();
      return;
    }
    if (sound === this.currentSound) return;

    const ctx = this.getContext();
    const master = this.getMaster();

    // Fade out existing
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_DURATION * 0.7);

    setTimeout(() => {
      this.stopAll();
      this.currentSound = sound;

      // Rebuild master gain at 0, then fade in
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(this.currentVolume, ctx.currentTime + FADE_DURATION);

      switch (sound) {
        case 'white-noise':  this.buildWhiteNoise();  break;
        case 'brown-noise':  this.buildBrownNoise();  break;
        case 'pink-noise':   this.buildPinkNoise();   break;
        case 'ocean':        this.buildOcean();       break;
        case 'rain':         this.buildRain();        break;
      }
    }, FADE_DURATION * 700);
  }

  stop(): void {
    if (!this.ctx || !this.masterGain) {
      this.currentSound = 'none';
      return;
    }
    const ctx = this.ctx;
    const master = this.masterGain;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_DURATION);
    setTimeout(() => {
      this.stopAll();
      this.currentSound = 'none';
    }, FADE_DURATION * 1000 + 100);
  }

  setVolume(v: number): void {
    // v is 0-100 from settings, normalize to 0-1
    this.currentVolume = Math.max(0, Math.min(1, v / 100));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(
        this.currentSound === 'none' ? 0 : this.currentVolume,
        this.ctx.currentTime + 0.1
      );
    }
  }

  getCurrentSound(): AmbientSound {
    return this.currentSound;
  }
}

// Singleton export
export const ambientEngine = new AmbientAudioEngine();
