let audioCtx: AudioContext | null = null;

const initializeAudio = () => {
    if (typeof window !== 'undefined' && !audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
};

export const playSound = (
    frequency: number,
    duration: number, // in seconds
    type: OscillatorType,
    volume: number = 0.3
) => {
    try {
        if (!audioCtx) {
            initializeAudio();
        }
        if (!audioCtx) return;

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.error("Could not play sound", e);
    }
};
