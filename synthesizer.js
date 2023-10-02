document.addEventListener("DOMContentLoaded", () => {
  const synthInstances = [];

  document.getElementById('addSynth').addEventListener('click', () => {
    addNewSynthesizer(synthInstances);
  });

  document.getElementById('masterStart').addEventListener('click', () => {
    synthInstances.forEach(synth => synth.start());
  });

  document.getElementById('masterStop').addEventListener('click', () => {
    synthInstances.forEach(synth => synth.stop());
  });

  document.getElementById('masterTempo').addEventListener('change', (event) => {
    const masterTempo = parseFloat(event.target.value);
    synthInstances.forEach(synth => synth.setMasterTempo(masterTempo));
  });
});

function addNewSynthesizer(synthInstances) {
  const card = document.createElement('div');
  card.className = "synthCard";
  card.innerHTML = `
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">Synthesizer</h5>
            <div class="row">
                <div class="col-md-3 form-group">
                    <label for="leftFrequency">Left Freq (Hz): </label>
                    <input type="number" class="form-control leftFrequency" value="300" min="1" max="1000">
                </div>
                <div class="col-md-3 form-group">
                    <label for="rightFrequency">Right Freq (Hz): </label>
                    <input type="number" class="form-control rightFrequency" value="310" min="1" max="1000">
                </div>
                <div class="col-md-2 form-group">
                    <label for="leftVolume">Left Volume: </label>
                    <input type="range" class="form-control-range leftVolume" min="0" max="1" step="0.01" value="0.5">
                </div>
                <div class="col-md-2 form-group">
                    <label for="rightVolume">Right Volume: </label>
                    <input type="range" class="form-control-range rightVolume" min="0" max="1" step="0.01" value="0.5">
                </div>
                <div class="col-md-2 form-group">
                    <label for="waveform">Waveform: </label>
                    <select class="form-control waveform">
                        <option value="sine">Sine</option>
                        <option value="square">Square</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="triangle">Triangle</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-secondary muteButton">Mute</button>
            <button class="btn btn-primary unmuteButton">Unmute</button>
        </div>
    </div>
`;



  document.getElementById('synths').appendChild(card);

  const synth = new BinauralSynthesizer(card);
  // card.querySelector('.startButton').addEventListener('click', () => synth.start());
  // card.querySelector('.stopButton').addEventListener('click', () => synth.stop());
  synthInstances.push(synth);
}

class BinauralSynthesizer {
  constructor(cardDiv) {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.isPlaying = false;
    this.masterTempo = 120;
    this.cardDiv = cardDiv;
    this.muted = false;
    this.initializeControls();
  }

  initializeControls() {
    this.leftFrequencyInput = this.cardDiv.querySelector('.leftFrequency');
    // Initialize other controls similarly
    this.rightFrequencyInput = this.cardDiv.querySelector('.rightFrequency');
    this.leftVolumeInput = this.cardDiv.querySelector('.leftVolume');
    this.rightVolumeInput = this.cardDiv.querySelector('.rightVolume');
    this.waveformInput = this.cardDiv.querySelector('.waveform');

    this.cardDiv.querySelector('.muteButton').addEventListener('click', () => this.mute());
    this.cardDiv.querySelector('.unmuteButton').addEventListener('click', () => this.unmute());
  }

  setMasterTempo(tempo) {
    this.masterTempo = tempo;
  }

  updateParameters() {
    if (this.isPlaying) {
      const leftFrequency = parseFloat(this.leftFrequencyInput.value);
      const rightFrequency = parseFloat(this.rightFrequencyInput.value);
      const leftVolume = parseFloat(this.leftVolumeInput.value);
      const rightVolume = parseFloat(this.rightVolumeInput.value);
      const waveform = this.waveformInput.value;

      this.leftOscillator.type = waveform;
      this.rightOscillator.type = waveform;

      this.leftOscillator.frequency.setValueAtTime(leftFrequency, this.audioCtx.currentTime);
      this.rightOscillator.frequency.setValueAtTime(rightFrequency, this.audioCtx.currentTime);

      this.leftGain.gain.setValueAtTime(this.muted ? 0 : leftVolume, this.audioCtx.currentTime);
      this.rightGain.gain.setValueAtTime(this.muted ? 0 : rightVolume, this.audioCtx.currentTime);
    }
  }

  createOscillatorAndGain(frequency, type, panValue) {
    const oscillator = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const panner = new StereoPannerNode(this.audioCtx, { pan: panValue });

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    oscillator.connect(gain).connect(panner).connect(this.audioCtx.destination);

    return { oscillator, gain };
  }


  start() {
    if (!this.isPlaying) {
      const { oscillator: leftOscillator, gain: leftGain } = this.createOscillatorAndGain(300, 'sine', -1);
      const { oscillator: rightOscillator, gain: rightGain } = this.createOscillatorAndGain(310, 'sine', 1);

      this.leftOscillator = leftOscillator;
      this.rightOscillator = rightOscillator;
      this.leftGain = leftGain;
      this.rightGain = rightGain;

      this.leftOscillator.start();
      this.rightOscillator.start();
      this.isPlaying = true;

      this.interval = setInterval(() => this.updateParameters(), 100);
    }
  }

  stop() {
    if (this.isPlaying) {
      this.leftOscillator.stop();
      this.rightOscillator.stop();
      this.isPlaying = false;
      clearInterval(this.interval);
    }
  }

  mute() {
    this.muted = true;
  }

  unmute() {
   this.muted = false;
  }
}
