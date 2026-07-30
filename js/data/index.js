import { MODULES_A } from './curriculum-a.js';
import { MODULES_B } from './curriculum-b.js';

export const MODULES = [...MODULES_A, ...MODULES_B];

export function getModule(id) {
  return MODULES.find(m => m.id === id);
}

export function getLesson(moduleId, lessonId) {
  const mod = getModule(moduleId);
  return mod ? mod.lessons.find(l => l.id === lessonId) : null;
}

// total count of completable items (lessons + one quiz per module)
export const TOTAL_ITEMS = MODULES.reduce((n, m) => n + m.lessons.length + 1, 0);

// ---- Photo credits (CC-licensed imagery used across the site) ----
export const PHOTO_CREDITS = [
  { creator: 'kevin dooley', license: 'CC BY', link: 'https://www.flickr.com/photos/12836528@N00/3902978871', use: 'Home & gate — sunset print' },
  { creator: 'Ben Wolfarth', license: 'CC BY', link: 'https://www.flickr.com/photos/54937521@N02/5976950113', use: 'Camera Fundamentals' },
  { creator: 'MattysFlicks', license: 'CC BY', link: 'https://www.flickr.com/photos/68397968@N07/9478221386', use: 'Exposure Triangle' },
  { creator: 'soelin', license: 'CC BY', link: 'https://www.flickr.com/photos/29953239@N07/6228897384', use: 'Focus & Sharpness' },
  { creator: 'VinothChandar', license: 'CC BY', link: 'https://www.flickr.com/photos/44345361@N06/31940504636', use: 'Composition' },
  { creator: 'Fountain_Head', license: 'CC BY', link: 'https://www.flickr.com/photos/37626043@N00/4323020112', use: 'Understanding Light' },
  { creator: 'John Brighenti', license: 'CC BY', link: 'https://www.flickr.com/photos/94359914@N06/40961283545', use: 'Lenses & Gear' },
  { creator: 'Giuseppe Milo', license: 'CC BY', link: 'https://www.flickr.com/photos/87690240@N03/38743225254', use: 'Genre Playbooks' },
  { creator: 'Rawpixel Ltd', license: 'CC0', link: 'https://www.flickr.com/photos/147875007@N03/32625007620', use: 'Digital Darkroom' },
  { creator: 'Lenny K Photography', license: 'CC BY', link: 'https://www.flickr.com/photos/57527070@N06/16258535340', use: 'Advanced Techniques' },
  { creator: 'shankar s.', license: 'CC BY', link: 'https://www.flickr.com/photos/77742560@N06/12255568833', use: 'Building Your Craft' },
  { creator: 'LoMit', license: 'CC BY', link: 'https://commons.wikimedia.org/w/index.php?curid=154026491', use: 'Field Notes' },
];

// ---- Field Notes: pocket wisdom, one card each ----
export const FIELD_NOTES = [
  { tag: 'Exposure', title: 'Sunny 16', body: 'No meter? On a sunny day: f/16, shutter = 1/ISO (e.g. 1/100 at ISO 100). Cloudy: open to f/8. Photographers shot this way for decades.' },
  { tag: 'Portrait', title: 'The near eye', body: 'Focus on the eye closest to the camera. If it\'s sharp, the portrait reads sharp — no exception at f/1.8.' },
  { tag: 'Composition', title: 'Check the corners', body: 'Before firing, run your eye around the frame edge. Stray branches, bright patches, and exiting lines live in corners.' },
  { tag: 'Light', title: 'Read the shadow edge', body: 'Sharp shadow edge = hard light. Soft gradient = soft light. Once you read shadows, you see light everywhere.' },
  { tag: 'Motion', title: 'Blur is forever', body: 'A noisy sharp photo can be cleaned. A clean blurry photo is a memory. When in doubt, raise ISO and protect shutter speed.' },
  { tag: 'Street', title: 'Stage, then actor', body: 'Find great light on a wall and wait for someone to walk through it. Hunting the scene beats chasing the subject.' },
  { tag: 'Editing', title: 'Whisper, don\'t shout', body: 'If any slider passes ±80, the capture was wrong. Fix less. The best edits are invisible.' },
  { tag: 'Landscape', title: 'Stay after sunset', body: 'The best color often arrives 15 minutes after the sun is gone — right when everyone else packs up.' },
  { tag: 'Gear', title: 'Rent before you buy', body: 'One weekend with a rented lens answers what no review can: whether YOU are that kind of shooter.' },
  { tag: 'Craft', title: 'One sentence test', body: 'Say what the photo is about in one sentence before shooting. No sentence, no photo. Then remove everything not in the sentence.' },
  { tag: 'Flash', title: 'Two exposures in one', body: 'Shutter controls the ambient, flash power controls the subject. Darken the world, light your person.' },
  { tag: 'Night', title: 'The 500 rule', body: 'Longest shutter before stars trail: 500 ÷ focal length. At 24mm that\'s about 20 seconds.' },
];
