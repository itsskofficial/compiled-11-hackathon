/**
 * Voice-down. trd.md §5.4.
 *
 * Miso One is the primary voice, shipped as pre-rendered MP3s in public/audio/
 * rather than a live API call — Miso's hosted API is announced but not yet
 * available, and a pre-rendered file is identical in every take anyway.
 *
 * speechSynthesis is the fallback and the path for anything dynamic. Daniel
 * (en-GB) reads as institutional PA; the macOS default reads as a phone
 * assistant, and the accent shift alone makes a room register that the building
 * is talking rather than that a laptop is talking.
 */

const VOICE_PRIORITY = ['Daniel', 'Alex', 'Google UK English Male', 'Microsoft George', 'Samantha', 'Karen'];

export const VOICE_LINES = {
  primary: {
    text: 'This property is monitored. Security has been notified. Leave the premises now.',
    file: '/audio/voicedown-primary.mp3',
  },
  short: {
    text: 'This property is monitored. Security has been notified.',
    file: '/audio/voicedown-short.mp3',
  },
  callScript: {
    text:
      'Warden security operations, priority alert. Verified intruder at Maple Grove, Unit four-B — vacant unit, day twelve of turnover. One adult at the rear entry, no uniform, attempting the door. Voice deterrent has fired. Press one to dispatch a guard. Press two to notify police. Press three to dismiss.',
    file: '/audio/escalation-script.mp3',
  },
  callClose: {
    text: 'Dismissed. Logged as a manager dismissal. Evidence report is on your dashboard.',
    file: '/audio/escalation-close.mp3',
  },
} as const;

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  for (const name of VOICE_PRIORITY) {
    const v = voices.find((v) => v.name === name); // exact match, NEVER by index
    if (v) return v;
  }
  return voices.find((v) => v.lang === 'en-GB') ?? voices.find((v) => v.lang === 'en-US') ?? voices[0];
}

export function initVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  // getVoices() returns empty on the first call in most engines.
  speechSynthesis.onvoiceschanged = () => {
    cachedVoice = pickVoice();
  };
  cachedVoice = pickVoice();
}

/** Chrome will not speak without a prior user gesture. Call this on the first click. */
export function warmUpVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  try {
    speechSynthesis.speak(u);
  } catch {
    /* nothing to recover */
  }
  if (!cachedVoice) cachedVoice = pickVoice();
}

function speak(text: string) {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel(); // clear any stuck queue
  const u = new SpeechSynthesisUtterance(text);
  if (cachedVoice) u.voice = cachedVoice;
  u.rate = 0.92; // slower reads as authoritative
  u.pitch = 0.9;
  u.volume = 1;
  speechSynthesis.speak(u);
}

export type VoiceSource = 'miso' | 'speech_synthesis';

/**
 * Plays the pre-rendered Miso file if it is present, otherwise speaks the line.
 * Resolves with whichever source actually produced audio, so the action log can
 * record it truthfully.
 */
export async function voiceDown(line: keyof typeof VOICE_LINES = 'primary'): Promise<VoiceSource> {
  const { text, file } = VOICE_LINES[line];

  try {
    const audio = new Audio(file);
    audio.volume = 1;
    await audio.play();
    // A missing file can still reject after play() resolves in some engines.
    const failed = await new Promise<boolean>((resolve) => {
      const done = () => resolve(false);
      audio.addEventListener('error', () => resolve(true), { once: true });
      audio.addEventListener('playing', done, { once: true });
      setTimeout(done, 400);
    });
    if (!failed) return 'miso';
  } catch {
    /* fall through to speech synthesis */
  }

  speak(text);
  return 'speech_synthesis';
}

export function voiceSourceLabel(src: VoiceSource): string {
  return src === 'miso' ? 'MISO ONE' : 'SYSTEM VOICE';
}
