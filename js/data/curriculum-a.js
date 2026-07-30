// Modules 01–05: Fundamentals, Exposure, Focus, Composition, Light

export const MODULES_A = [
{
  id: 'fundamentals',
  num: '01',
  title: 'Camera Fundamentals',
  tagline: 'Know your instrument',
  description: 'How a camera actually makes a picture — sensors, lenses, file formats, and the controls that matter. The foundation everything else stands on.',
  lessons: [
    {
      id: 'how-a-camera-sees',
      title: 'How a Camera Sees',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'Every camera, from a 1900s box camera to the phone in your pocket, does the same three things: it <b>gathers light</b> through a lens, <b>controls how much</b> light gets through, and <b>records</b> that light on a sensitive surface. Master photographers aren\'t people with better cameras — they\'re people who understand and control those three steps deliberately.' },
        { type: 'h2', html: 'The path of light' },
        { type: 'olist', items: [
          'Light bounces off your subject and enters the <b>lens</b>, which bends (focuses) it into a sharp image.',
          'The <b>aperture</b> — an adjustable iris inside the lens — controls how wide the opening is.',
          'The <b>shutter</b> opens for a precise slice of time, letting light hit the sensor.',
          'The <b>sensor</b> converts photons into an electrical signal, amplified by the <b>ISO</b> setting.',
          'A processor turns that signal into an image file.'
        ]},
        { type: 'tip', label: 'Pro tip', html: 'When a photo disappoints you, diagnose it along this path: Was it focus (lens)? Brightness or depth (aperture)? Blur (shutter)? Noise (ISO)? Naming the failing stage tells you exactly which dial to change next time.' },
        { type: 'h2', html: 'Sensor size — why it matters' },
        { type: 'p', html: 'A bigger sensor collects more light, which means cleaner images in dim conditions and easier background blur. From small to large: phone sensors → 1-inch → Micro Four Thirds → APS-C → Full frame → Medium format. Bigger isn\'t automatically better — it\'s heavier, pricier, and for well-lit subjects the difference shrinks fast.' },
        { type: 'assignment', html: 'Find your camera (or phone) manual settings. Locate where you control aperture, shutter speed, and ISO. Take one photo changing only each of the three. Don\'t worry about the results — you\'re learning where the levers are.' }
      ]
    },
    {
      id: 'camera-modes',
      title: 'Shooting Modes: Escaping Auto',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'Auto mode makes average decisions for average scenes. Your growth as a photographer is the story of taking those decisions back, one at a time. You don\'t need to jump straight to full Manual — the semi-automatic modes are how professionals actually shoot most of the time.' },
        { type: 'table', head: ['Mode', 'You control', 'Camera controls', 'Use it for'], rows: [
          ['P (Program)', 'ISO, flash, compensation', 'Aperture + shutter', 'Fast snapshots with a safety net'],
          ['A / Av (Aperture priority)', 'Aperture, ISO', 'Shutter speed', 'Portraits, landscapes — anywhere depth of field is the creative choice'],
          ['S / Tv (Shutter priority)', 'Shutter speed, ISO', 'Aperture', 'Sports, wildlife, motion blur effects'],
          ['M (Manual)', 'Everything', 'Nothing (ISO can stay auto)', 'Studio, night, tricky or constant light'],
        ]},
        { type: 'tip', label: 'The pro secret', html: 'Most working photographers live in Aperture Priority with Auto ISO and exposure compensation. That combination gives creative control over depth of field while the camera handles fast-changing light. Manual + Auto ISO is the sports shooter\'s favorite: lock your aperture AND shutter, let ISO float.' },
        { type: 'h2', html: 'Exposure compensation — your steering wheel' },
        { type: 'p', html: 'The <b>+/− dial</b> tells the camera "your idea of correct is too dark/bright — shift it." Snow scenes fool meters into underexposing (dial +1). Dark backgrounds fool them into overexposing (dial −1). This one dial fixes 80% of auto-mode failures.' },
        { type: 'assignment', html: 'Shoot the same scene in P, A, S, and M modes. In A mode, take three shots at your widest, middle, and narrowest aperture and watch what the camera does to shutter speed each time.' }
      ]
    },
    {
      id: 'raw-vs-jpeg',
      title: 'RAW vs JPEG & Files That Last',
      duration: '6 min',
      blocks: [
        { type: 'p', html: 'A <b>JPEG</b> is a finished print: the camera chooses color, contrast, and sharpening, then throws away the leftover data. A <b>RAW</b> file is the undeveloped negative: everything the sensor captured, waiting for you to develop it. RAW files are 3–5× larger and require editing, but they forgive mistakes JPEG can\'t.' },
        { type: 'list', items: [
          '<b>Recover blown skies</b>: RAW often holds 1–2 extra stops of highlight detail.',
          '<b>Fix white balance freely</b>: color temperature is just a slider in RAW, baked-in for JPEG.',
          '<b>Push shadows</b>: brighten dark areas with far less ugly noise.',
          '<b>Non-destructive</b>: your original is never altered; edits are instructions saved alongside.'
        ]},
        { type: 'tip', label: 'Rule of thumb', html: 'Shoot RAW (or RAW+JPEG) the moment you start editing your photos. Until then, JPEG is fine — an unedited RAW looks flatter than a JPEG, not better.' },
        { type: 'h2', html: 'A backup habit that saves careers' },
        { type: 'p', html: 'Adopt the <b>3-2-1 rule</b> early: 3 copies of every image, on 2 different media, 1 offsite (cloud). Import photos the same day you shoot; format cards only after backups are verified. Every photographer has one card-failure horror story — make sure yours has a happy ending.' },
        { type: 'assignment', html: 'Switch your camera to RAW+JPEG. Photograph a bright window from inside a dim room. Later, try to brighten the room in both files — the difference in shadow quality will teach you more than any article.' }
      ]
    },
    {
      id: 'holding-and-handling',
      title: 'Hold Steady: Grip, Stance & Sharpness Habits',
      duration: '5 min',
      blocks: [
        { type: 'p', html: 'More photos are ruined by camera shake than by any technical setting. Sharpness starts with your body, not your lens.' },
        { type: 'list', items: [
          '<b>Grip</b>: right hand on the grip, left palm <b>under</b> the lens (not on top). Elbows tucked into your ribs.',
          '<b>Stance</b>: feet shoulder-width, one slightly ahead. Lean on walls, posts, and tables whenever you can.',
          '<b>Breathing</b>: exhale slowly and squeeze the shutter at the bottom of the breath — like a marksman.',
          '<b>Viewfinder beats screen</b>: pressing the camera to your face adds a third contact point.'
        ]},
        { type: 'h2', html: 'The reciprocal rule' },
        { type: 'p', html: 'Handheld, keep your shutter speed at least <b>1 / focal length</b>: a 50mm lens needs 1/50s or faster; 200mm needs 1/200s. Stabilization (IBIS/IS/VR) buys you 2–4 extra stops, but it can\'t freeze a moving subject — only a fast shutter does that.' },
        { type: 'tip', label: 'Pro tip', html: 'Zoom into your shots at 100% on the back screen to check sharpness before leaving a scene. Discovering blur at home is the worst kind of homework.' },
        { type: 'assignment', html: 'Shoot the same detailed subject (a book spine, a sign) at 1/125s, 1/30s, and 1/8s handheld. Compare at 100%. Find YOUR personal slowest safe shutter speed — everyone\'s hands are different.' }
      ]
    }
  ],
  quiz: [
    { q: 'Which sequence correctly describes the path of light through a camera?', options: ['Sensor → lens → aperture → shutter', 'Lens → aperture → shutter → sensor', 'Aperture → sensor → lens → shutter', 'Shutter → lens → sensor → aperture'], answer: 1, why: 'Light enters the lens, passes the aperture iris inside it, is admitted by the shutter for a slice of time, and lands on the sensor.' },
    { q: 'You\'re shooting portraits and want to control background blur while the camera handles the rest. Best mode?', options: ['Full Manual', 'Shutter priority (S/Tv)', 'Aperture priority (A/Av)', 'Auto'], answer: 2, why: 'Aperture priority gives you direct control of depth of field — the creative variable in portraits — while the camera balances exposure.' },
    { q: 'Your snowy landscape photos keep coming out grey and dark. The fastest fix is:', options: ['Raise ISO', 'Dial exposure compensation to +1', 'Use a slower shutter', 'Switch to JPEG'], answer: 1, why: 'Meters aim for middle grey, so bright snow fools them into underexposing. Positive exposure compensation tells the camera to brighten its idea of "correct."' },
    { q: 'The main advantage of RAW over JPEG is:', options: ['Smaller file sizes', 'Photos look better straight out of camera', 'Far more latitude to recover highlights, shadows and fix color in editing', 'Faster burst shooting'], answer: 2, why: 'RAW keeps all sensor data, so editing can recover detail and shift color in ways JPEG\'s baked-in, compressed data can\'t.' },
    { q: 'Handheld with a 200mm lens (no stabilization), your minimum safe shutter speed is roughly:', options: ['1/20s', '1/60s', '1/200s', '2 seconds'], answer: 2, why: 'The reciprocal rule: shutter speed ≥ 1/focal length. At 200mm that\'s 1/200s or faster.' }
  ]
},

{
  id: 'exposure',
  num: '02',
  title: 'The Exposure Triangle',
  tagline: 'Aperture · Shutter · ISO',
  description: 'The three dials that control every photograph ever taken — and the trade-offs between them. Includes a hands-on exposure simulator.',
  lessons: [
    {
      id: 'aperture',
      title: 'Aperture: Light & Depth of Field',
      duration: '9 min',
      blocks: [
        { type: 'p', html: 'The aperture is an iris of blades inside your lens. Its size is written as an <b>f-number</b>: f/1.8 is a wide opening, f/16 a tiny one. The counter-intuitive part — <b>smaller number = bigger hole = more light</b> — exists because the number is a ratio (focal length ÷ opening diameter).' },
        { type: 'h2', html: 'The two jobs of aperture' },
        { type: 'list', items: [
          '<b>Brightness</b>: each full stop (f/1.4 → f/2 → f/2.8 → f/4 → f/5.6 → f/8 → f/11 → f/16) halves the light.',
          '<b>Depth of field</b>: wide apertures (f/1.4–f/2.8) give a thin slice of focus with melted backgrounds; narrow ones (f/8–f/16) keep front-to-back sharpness.'
        ]},
        { type: 'table', head: ['Aperture', 'Character', 'Classic use'], rows: [
          ['f/1.4 – f/2', 'Dreamy, isolating, thin focus', 'Portraits, low light, detail shots'],
          ['f/2.8 – f/4', 'Subject separation with margin for error', 'Events, food, environmental portraits'],
          ['f/5.6 – f/8', 'The sharpness sweet spot of most lenses', 'Street, travel, groups'],
          ['f/11 – f/16', 'Everything sharp, starburst sun effects', 'Landscapes, architecture'],
        ]},
        { type: 'widget', widget: 'dof' },
        { type: 'tip', label: 'Pro tip', html: 'Depth of field also depends on distance and focal length: get closer or zoom in and the background melts even at f/5.6. Shooting a portrait at f/1.8, focus on the nearest eye — at that aperture even an eyelash can be the whole depth of field.' },
        { type: 'assignment', html: 'Place a subject 2m in front of a busy background. Shoot at f/1.8 (or your widest), f/5.6, and f/16 without moving. Study how the background changes and how the exposure settings compensate.' }
      ]
    },
    {
      id: 'shutter-speed',
      title: 'Shutter Speed: Freezing & Flowing Time',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'Shutter speed is how long your sensor drinks in light — from 1/8000 of a second to minutes. It controls brightness AND how motion is rendered: frozen crisp, or streaked into flow. It\'s the most <i>cinematic</i> of the three controls.' },
        { type: 'table', head: ['Speed', 'What it does', 'Classic use'], rows: [
          ['1/2000 – 1/4000s', 'Freezes anything', 'Birds in flight, sports, splashes'],
          ['1/500 – 1/1000s', 'Freezes fast people', 'Kids, pets, athletes'],
          ['1/125 – 1/250s', 'Safe general-purpose', 'Street, walking subjects, handheld tele'],
          ['1/30 – 1/60s', 'Hints of motion blur', 'Panning shots, atmosphere'],
          ['1/4 – 1s', 'Silky motion (tripod!)', 'Waterfalls, waves, light trails begin'],
          ['5 – 30s', 'Dreamscapes (tripod!)', 'Star fields, car trails, ghost crowds'],
        ]},
        { type: 'h2', html: 'Panning — the pro motion trick' },
        { type: 'p', html: 'Set 1/30–1/60s, follow a moving subject smoothly with your whole torso, and fire mid-swing. The subject stays sharp while the background streaks — instant speed. Expect to throw away ten frames for every keeper; that ratio is normal even for pros.' },
        { type: 'tip', label: 'Pro tip', html: 'Blurry photos indoors? Before blaming your lens, check the shutter speed the camera chose. Indoors light is 100–1000× dimmer than daylight, and Auto often drops to 1/15s. Raise ISO to buy back shutter speed — noise is fixable, blur is not.' },
        { type: 'assignment', html: 'Find running water or passing traffic. Shoot it at 1/1000s, 1/60s, and 1/4s (brace the camera on something solid for the last one). You now own three completely different photographs of the same subject.' }
      ]
    },
    {
      id: 'iso',
      title: 'ISO: Sensitivity & the Price of Noise',
      duration: '6 min',
      blocks: [
        { type: 'p', html: 'ISO amplifies the sensor\'s signal. ISO 100 is the clean base; each doubling (200, 400, 800…) brightens the image one stop and amplifies noise — the gritty speckle in shadows. Modern cameras are astonishing: ISO 3200 today looks better than ISO 800 did a decade ago.' },
        { type: 'h2', html: 'How to think about ISO' },
        { type: 'list', items: [
          '<b>ISO is your last resort, not your first move.</b> Open the aperture and slow the shutter as far as the subject allows — then raise ISO to close the gap.',
          '<b>A noisy sharp photo beats a clean blurry one.</b> Every time. Noise reduction software is excellent; deblurring is science fiction.',
          '<b>Underexposing at low ISO is worse than exposing correctly at high ISO.</b> Brightening shadows in editing amplifies more noise than the higher ISO would have.'
        ]},
        { type: 'tip', label: 'Auto ISO, configured right', html: 'Set Auto ISO with a maximum you trust (e.g. 6400) and a minimum shutter speed (e.g. 1/125s for people). Now the camera raises ISO only when needed, and you shoot without babysitting it.' },
        { type: 'assignment', html: 'In a dim room, shoot the same scene at ISO 100, 800, 3200, and your camera\'s maximum. View at 100%. Decide your personal "quality ceiling" — the ISO you\'ll use without hesitation.' }
      ]
    },
    {
      id: 'triangle-in-practice',
      title: 'The Triangle in Practice',
      duration: '10 min',
      blocks: [
        { type: 'p', html: 'Exposure is a budget: the scene offers a fixed amount of light, and aperture, shutter, and ISO decide how to spend it. Open the aperture one stop and you can double the shutter speed. Raise ISO one stop and you can close the aperture one stop. Every exposure is a <b>negotiation between brightness, depth, motion, and noise</b>.' },
        { type: 'widget', widget: 'exposure' },
        { type: 'h2', html: 'Reading the scene: a decision recipe' },
        { type: 'olist', items: [
          '<b>What matters most creatively?</b> Blurred background → set aperture first. Frozen action → set shutter first.',
          '<b>Set the priority dial</b> to that value.',
          '<b>Balance with the second dial</b> until the meter centers.',
          '<b>Let ISO absorb what\'s left.</b>'
        ]},
        { type: 'recipe', label: 'Starting recipes', html: '<b>Sunny outdoors:</b> f/8 · 1/500 · ISO 100 &nbsp;·&nbsp; <b>Window-lit portrait:</b> f/2 · 1/200 · ISO 400 &nbsp;·&nbsp; <b>Indoor event:</b> f/2.8 · 1/160 · ISO 1600–3200 &nbsp;·&nbsp; <b>Night street:</b> f/1.8 · 1/60 · ISO 3200. Adjust from these, don\'t start from zero.' },
        { type: 'tip', label: 'Pro tip', html: 'Learn full stops by heart in all three scales — they\'re the multiplication tables of photography. Aperture: 1.4, 2, 2.8, 4, 5.6, 8, 11, 16. Shutter: each halving. ISO: each doubling. Soon you\'ll trade stops between dials without thinking.' },
        { type: 'assignment', html: 'Use the simulator above until you can hit correct exposure in under 15 seconds from any starting point. Then do it on your real camera in Manual mode, three rooms of your home, same drill.' }
      ]
    },
    {
      id: 'metering-histogram',
      title: 'Metering & the Histogram',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'Your camera\'s meter measures reflected light and assumes the world averages to middle grey. Usually right, famously wrong for snow (it underexposes) and night scenes (it overexposes). The <b>histogram</b> is the lie detector: a graph of how many pixels sit at each brightness, shadows on the left, highlights on the right.' },
        { type: 'widget', widget: 'histogram' },
        { type: 'h2', html: 'Reading it in two seconds' },
        { type: 'list', items: [
          '<b>Pixels climbing the right wall</b> = blown highlights. Detail there is gone forever. This is the cardinal sin.',
          '<b>Pixels crushed against the left wall</b> = blocked shadows. Bad, but more recoverable in RAW.',
          '<b>There is no "correct shape".</b> A night scene should lean left; a snowscape should lean right. Wrong is only when data falls off a cliff you didn\'t intend.'
        ]},
        { type: 'tip', label: 'Expose to the right (ETTR)', html: 'When shooting RAW with time to spare, push exposure as bright as possible <b>without clipping highlights</b>. Sensors record far more information in bright tones; you\'ll darken in editing and gain cleaner shadows for free.' },
        { type: 'p', html: 'Metering modes matter less than people think: <b>Evaluative/Matrix</b> for almost everything, <b>Spot</b> for tricky cases like a face against a bright window or a stage performer in a spotlight.' },
        { type: 'assignment', html: 'Turn on your camera\'s highlight alert ("blinkies") and histogram review. Photograph a scene with a bright sky and adjust exposure until the sky is as bright as possible without blinking. That skill alone will lift your landscape keeper-rate dramatically.' }
      ]
    }
  ],
  quiz: [
    { q: 'Which setting gives you the SHALLOWEST depth of field?', options: ['f/16', 'f/8', 'f/5.6', 'f/1.8'], answer: 3, why: 'Lower f-numbers mean wider apertures, and wider apertures produce a thinner plane of focus with more background blur.' },
    { q: 'You open your aperture from f/4 to f/2.8 (one stop more light). To keep the same exposure you could:', options: ['Double the ISO', 'Halve the shutter duration (e.g. 1/250 → 1/500)', 'Slow the shutter (e.g. 1/250 → 1/125)', 'Nothing — exposure is unaffected'], answer: 1, why: 'One stop more light from aperture must be balanced by one stop less elsewhere: a shutter twice as fast (or one stop lower ISO).' },
    { q: 'To photograph a waterfall as silky flowing mist you need:', options: ['1/2000s and high ISO', 'A slow shutter (¼s or longer) and a tripod', 'The widest aperture available', 'Spot metering'], answer: 1, why: 'Long exposures blur moving water into silk; a tripod keeps everything else sharp during the long shutter.' },
    { q: 'In dim light, the best-practice order of moves is:', options: ['Raise ISO first, always', 'Open aperture and slow shutter as far as the subject allows, then raise ISO', 'Underexpose at ISO 100 and brighten later', 'Use flash before touching settings'], answer: 1, why: 'Aperture and shutter gather real light without noise cost. ISO covers the remaining gap. Underexposing at low ISO produces worse noise than correct exposure at higher ISO.' },
    { q: 'On the histogram, pixels stacked against the RIGHT edge mean:', options: ['The image is too dark', 'Perfect exposure', 'Blown highlights — unrecoverable detail', 'High ISO noise'], answer: 2, why: 'The right wall is pure white. Data pushed against it has clipped — the detail in those highlights cannot be recovered.' },
    { q: '"Expose to the right" (ETTR) means:', options: ['Compose subjects on the right third', 'Push exposure as bright as possible without clipping highlights, then darken in post', 'Always overexpose by 2 stops', 'Meter off the brightest object'], answer: 1, why: 'Sensors capture the most information in bright tones. Exposing bright (without clipping) and darkening later yields cleaner shadows.' }
  ]
},

{
  id: 'focus',
  num: '03',
  title: 'Focus & Sharpness',
  tagline: 'Tack-sharp where it counts',
  description: 'Autofocus modes, focus placement, hyperfocal thinking, and the habits that separate sharp shooters from lucky ones.',
  lessons: [
    {
      id: 'af-modes',
      title: 'Autofocus Modes Demystified',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'Autofocus systems answer two separate questions: <b>when</b> to focus (drive mode) and <b>where</b> to focus (area mode). Confusing the two is why "my camera won\'t focus" is the most common beginner complaint.' },
        { type: 'table', head: ['Mode', 'Also called', 'Behavior', 'Use for'], rows: [
          ['Single (AF-S)', 'One-Shot', 'Locks focus once when you half-press', 'Still subjects: portraits, landscapes, products'],
          ['Continuous (AF-C)', 'AI Servo', 'Re-focuses constantly while half-pressed', 'Anything moving: kids, sports, pets, street'],
          ['Auto (AF-A)', 'AI Focus', 'Camera guesses between the two', 'Avoid — the guess fails at the worst moments'],
        ]},
        { type: 'h2', html: 'Area modes: who chooses the point' },
        { type: 'list', items: [
          '<b>Single point</b> — you place one precise point. Maximum control, slower to operate.',
          '<b>Zone / group</b> — a cluster of points tracks within a region. The action-shooter workhorse.',
          '<b>Wide/auto + subject detection</b> — modern eye-AF finds faces and eyes anywhere in frame. For people and animals it\'s genuinely reliable; use it.',
        ]},
        { type: 'tip', label: 'Pro setup', html: '<b>Back-button focus</b>: move AF from the shutter button to the AF-ON button on the back. Thumb focuses, finger fires — you can lock focus, recompose, and shoot bursts independently. Every sports and wildlife pro shoots this way. It feels weird for two days and indispensable forever after.' },
        { type: 'assignment', html: 'Set AF-C + tracking and photograph someone walking toward you, firing every second. Check how many frames keep the eyes sharp. Then repeat with AF-S and see why moving subjects need continuous focus.' }
      ]
    },
    {
      id: 'where-to-focus',
      title: 'Where to Focus (It\'s Always the Eye)',
      duration: '6 min',
      blocks: [
        { type: 'p', html: 'Viewers of a photograph look at eyes first, always — human, animal, even sculpture. If the eyes are sharp, the whole photo reads as sharp; if they\'re soft, nothing else can save it. For any subject with eyes: <b>focus on the nearest eye</b>.' },
        { type: 'h2', html: 'Subjects without eyes' },
        { type: 'list', items: [
          '<b>Landscapes</b>: focus roughly one-third into the scene, or on the key foreground object at f/8–f/11.',
          '<b>Food & products</b>: the nearest edge of the hero element.',
          '<b>Flowers & macro</b>: the part nearest the lens that matters — depth of field is millimeters.',
          '<b>Street</b>: pre-focus at a chosen distance and let subjects walk into the zone (zone focusing).'
        ]},
        { type: 'tip', label: 'Focus-recompose caution', html: 'Locking focus then swinging the camera works at f/5.6+, but at f/1.8 the swing itself rotates the focal plane off your subject\'s eye. At wide apertures, move the AF point instead of the camera.' },
        { type: 'p', html: '<b>Hyperfocal distance</b> — the landscape shooter\'s trick: focused at the hyperfocal distance for your aperture and focal length, everything from half that distance to infinity is acceptably sharp. In practice at 24mm f/11: focus about 2m in, get roughly 1m-to-infinity sharpness. Apps like PhotoPills compute it exactly.' },
        { type: 'assignment', html: 'Shoot a portrait at your widest aperture, deliberately focusing on: the near eye, the far eye, the nose tip. Compare at 100%. You\'ll never be casual about eye focus again.' }
      ]
    },
    {
      id: 'sharpness-troubleshooting',
      title: 'Why Your Photos Aren\'t Sharp: A Diagnosis Chart',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'Soft photos have exactly five causes. Learn to tell them apart at 100% zoom and you can fix any of them.' },
        { type: 'table', head: ['Symptom at 100%', 'Cause', 'Fix'], rows: [
          ['Whole frame smeared in one direction', 'Camera shake', 'Faster shutter, stabilization, brace or tripod'],
          ['Subject blurred, background fine', 'Subject motion', 'Faster shutter (1/500+ for action), AF-C'],
          ['Something is sharp — just not your subject', 'Missed focus', 'Better AF point placement, eye-AF, don\'t focus-recompose wide open'],
          ['Nearest features sharp, rest melts fast', 'Too-shallow depth of field', 'Stop down (higher f-number), step back'],
          ['Uniform softness, low contrast everywhere', 'Lens limits / diffraction / dirty glass', 'Shoot at f/5.6–f/8 sweet spot, clean the lens, avoid f/22'],
        ]},
        { type: 'tip', label: 'Pro tip', html: 'Diffraction: beyond ~f/11 (APS-C) or ~f/16 (full frame), physics itself softens the image as light waves interfere at the tiny opening. "Stop down for sharpness" is only true until it isn\'t.' },
        { type: 'h2', html: 'The sharpness stack, in order of impact' },
        { type: 'olist', items: [
          'Adequate shutter speed for subject and focal length',
          'Focus on the right spot',
          'Aperture in the lens\'s sweet spot',
          'Low enough ISO for clean detail',
          'Lens quality — genuinely last on the list'
        ]},
        { type: 'assignment', html: 'Pull up your ten most recent disappointing photos. Zoom to 100% and diagnose each one against the table above. Tally the causes — most people discover one repeat offender responsible for nearly everything.' }
      ]
    }
  ],
  quiz: [
    { q: 'Photographing a running dog, which focus drive mode?', options: ['AF-S (single)', 'AF-C (continuous)', 'Manual focus', 'Whatever Auto picks'], answer: 1, why: 'AF-C continuously re-focuses on the moving subject while you track it. AF-S locks once and the dog leaves the focal plane instantly.' },
    { q: 'In a portrait, the rule is to focus on:', options: ['The tip of the nose', 'The forehead', 'The nearest eye', 'The center of the chest'], answer: 2, why: 'Viewers judge sharpness by the eyes. The nearest eye is the anchor point of any portrait.' },
    { q: 'At 100% the whole frame is smeared in one direction. The cause is:', options: ['Missed focus', 'Subject motion', 'Camera shake', 'High ISO'], answer: 2, why: 'Uniform directional smear means the camera itself moved during exposure. Faster shutter or better bracing fixes it.' },
    { q: 'Focus-and-recompose becomes risky when:', options: ['Using a tripod', 'Shooting at wide apertures like f/1.8', 'Shooting landscapes at f/11', 'Using back-button focus'], answer: 1, why: 'At f/1.8 depth of field is so thin that rotating the camera moves the focal plane off the subject. Move the AF point instead.' },
    { q: 'Stopping down to f/22 "for maximum sharpness" actually:', options: ['Gives the sharpest possible image', 'Softens the image through diffraction', 'Only affects exposure', 'Increases noise'], answer: 1, why: 'Past ~f/11–f/16, diffraction — light interfering at the tiny aperture — visibly softens fine detail. Most lenses peak at f/5.6–f/8.' }
  ]
},

{
  id: 'composition',
  num: '04',
  title: 'Composition',
  tagline: 'Where things go in the frame',
  description: 'The visual grammar of strong photographs: thirds, lines, frames, balance, and knowing when to break every rule on purpose.',
  lessons: [
    {
      id: 'rule-of-thirds',
      title: 'Rule of Thirds & Beyond',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'Divide the frame into a 3×3 grid. Placing subjects on the lines — and key details on the four intersections — creates instant tension and balance that dead-center placement rarely achieves. It works because it forces a relationship between subject and space.' },
        { type: 'widget', widget: 'composition' },
        { type: 'list', items: [
          '<b>Horizons</b> go on the top or bottom third line — never through the middle (unless shooting a reflection, where symmetry IS the point).',
          '<b>Eyes</b> in portraits sit on or near the top-third line.',
          '<b>Moving subjects</b> get space to move into: a cyclist entering from the left sits on the left third, facing the open right side.'
        ]},
        { type: 'tip', label: 'When to break it', html: 'Center composition is powerful for symmetry, confrontation, and minimalism — a face staring straight down the lens, a lone tree in fog. The rule of thirds is a default, not a law. Break it on purpose, never by accident.' },
        { type: 'p', html: 'Related tools: the <b>golden ratio</b> (a slightly tighter spiral of interest), and <b>leading room</b> — the psychological space a gaze or motion needs. Turn on your camera\'s grid overlay today; within a month you won\'t need it.' },
        { type: 'assignment', html: 'Shoot ten photos of the same subject: five centered, five on thirds intersections. Review side by side. Notice which frames feel static and which feel alive — and when centered actually wins.' }
      ]
    },
    {
      id: 'lines-shapes',
      title: 'Leading Lines, Shapes & Visual Flow',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'A viewer\'s eye enters your photograph and travels through it. Composition is choreographing that journey. <b>Leading lines</b> — roads, rails, fences, shadows, rivers, an outstretched arm — are the strongest steering tool you have.' },
        { type: 'list', items: [
          '<b>Diagonals</b> feel dynamic and energetic; horizontals feel calm; verticals feel strong and formal.',
          '<b>Converging lines</b> (a road vanishing to a point) create depth on a flat image — stand IN the road (safely) rather than beside it.',
          '<b>Curves</b> (S-curves in rivers, winding paths) slow the eye\'s journey pleasurably.',
          '<b>Triangles</b> stabilize: three faces in a group portrait, mountain peaks, a leaning ladder.'
        ]},
        { type: 'h2', html: 'Watch the exits' },
        { type: 'p', html: 'Lines that lead OUT of the frame drag attention with them. Check your corners before firing: a bright patch, a stray branch, a road exiting frame-edge — each is a leak in the composition. Pros scan the frame edge as reflexively as the subject.' },
        { type: 'tip', label: 'Pro tip', html: 'Squint at your scene (or half-close your eyes at the LCD). Detail vanishes, leaving only masses of light and dark — the skeleton of the composition. If the skeleton is weak, no amount of detail saves it.' },
        { type: 'assignment', html: 'Spend 30 minutes photographing ONLY lines: no subjects, no faces. Roads, railings, shadows, cables. You\'re training your eye to see the frame\'s skeleton before its skin.' }
      ]
    },
    {
      id: 'framing-layers',
      title: 'Framing, Layers & Depth',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'A photograph is a flat rectangle pretending to be a world. Depth is the illusion that sells it, and you build depth in <b>layers</b>: foreground, midground, background — each with something to say.' },
        { type: 'list', items: [
          '<b>Frame within a frame</b>: shoot through doorways, windows, arches, branches. The inner frame directs the eye and adds instant depth.',
          '<b>Foreground anchors</b>: rocks, flowers, or a shoulder in the near field give the eye a stepping stone into the scene. Landscape shooters get LOW to find them.',
          '<b>Atmospheric layers</b>: haze, fog, and telephoto compression stack mountains into receding tonal planes.',
          '<b>Overlap</b>: when objects overlap, the brain reads depth order automatically.'
        ]},
        { type: 'tip', label: 'Pro tip', html: 'Before shooting a wide scene, ask: "What is my foreground?" If the answer is "nothing," walk until there is one. The difference between a snapshot of a view and a photograph OF a place is usually two meters of walking and one knee on the ground.' },
        { type: 'assignment', html: 'Make five photographs that each contain a deliberate foreground, midground, and background element. At least two must be shot through something (a window, leaves, a fence).' }
      ]
    },
    {
      id: 'simplify-subtract',
      title: 'Simplify: The Art of Subtraction',
      duration: '6 min',
      blocks: [
        { type: 'p', html: 'Amateurs add; masters subtract. The most common compositional failure is not misplacing the subject — it\'s including six things that aren\'t the subject. A photograph is finished not when there is nothing left to add, but nothing left to take away.' },
        { type: 'h2', html: 'Five ways to subtract' },
        { type: 'olist', items: [
          '<b>Step closer.</b> The single best composition tip in existence. Fill the frame.',
          '<b>Open the aperture</b> — melt distractions into blur.',
          '<b>Change angle</b> — two steps left can swap a cluttered background for a clean wall or open sky.',
          '<b>Shoot low or high</b> — the ground and the sky are the world\'s largest plain backgrounds.',
          '<b>Wait</b> — let the crowd clear, the car pass, the pigeon land.'
        ]},
        { type: 'p', html: '<b>Negative space</b> — deliberate emptiness — isn\'t wasted space. A small subject against a vast sky says something a tight crop can\'t: scale, solitude, silence. Emptiness is a compositional material; use it like one.' },
        { type: 'tip', label: 'The one-sentence test', html: 'Before pressing the shutter, say what the photo is about in one sentence. If you can\'t, you don\'t have a photo yet. If you can, remove everything in the frame that isn\'t in the sentence.' },
        { type: 'assignment', html: 'Photograph one subject ten times, each frame simpler than the last. By frame ten you should be close, low or high, with a clean background and one clear statement. Keep frame one and frame ten side by side as proof of the principle.' }
      ]
    }
  ],
  quiz: [
    { q: 'Where should a horizon usually sit in the frame?', options: ['Dead center, always', 'On the top or bottom third line', 'As high as possible', 'It doesn\'t matter'], answer: 1, why: 'A centered horizon splits the image into two equal halves that fight each other. The thirds lines let you prioritize sky or land — except for reflections, where symmetry is the point.' },
    { q: 'A cyclist rides into your frame from the left. Best placement?', options: ['Far right, facing the edge', 'On the left third, with open space to ride into', 'Dead center', 'Bottom edge'], answer: 1, why: 'Moving subjects need "leading room" — space in front of their motion. Facing the frame edge feels cramped and about to collide.' },
    { q: 'Leading lines that exit the frame corners tend to:', options: ['Add professional polish', 'Drag the viewer\'s attention out of the photograph', 'Create symmetry', 'Have no effect'], answer: 1, why: 'The eye follows lines. Lines that lead out of the frame lead attention out with them — check your edges and corners before shooting.' },
    { q: 'The strongest single move to simplify a cluttered composition:', options: ['Add a filter', 'Step closer and fill the frame with the subject', 'Raise the ISO', 'Use a slower shutter'], answer: 1, why: '"If your pictures aren\'t good enough, you\'re not close enough" — Robert Capa. Filling the frame removes distractions by pure geometry.' },
    { q: '"Frame within a frame" means:', options: ['Adding a border in editing', 'Shooting through doorways, windows, or branches to enclose the subject', 'Printing and framing your work', 'Using the camera\'s grid overlay'], answer: 1, why: 'An interior frame — arch, window, foliage — directs the eye to the subject and adds a layer of depth.' }
  ]
},

{
  id: 'light',
  num: '05',
  title: 'Understanding Light',
  tagline: 'The raw material',
  description: 'Photography means "drawing with light." Quality, direction, and color of light — and how to find or shape the good stuff.',
  lessons: [
    {
      id: 'quality-of-light',
      title: 'Hard vs Soft: The Quality of Light',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'The single most important property of light is its <b>size relative to the subject</b>. Big light sources wrap around subjects and produce soft, gradual shadows. Small sources carve hard, sharp-edged shadows. The sun is enormous but so far away it acts small — until clouds turn the whole sky into one giant softbox.' },
        { type: 'table', head: ['Light', 'Quality', 'Feels like', 'Best for'], rows: [
          ['Noon sun, bare flash', 'Hard', 'Drama, grit, heat, contrast', 'Graphic street, harsh editorial, shadows-as-subject'],
          ['Overcast sky', 'Very soft', 'Calm, gentle, even', 'Portraits, flowers, colors (they saturate!)'],
          ['North-facing window', 'Soft, directional', 'Painterly, classic', 'The oldest portrait light in art history'],
          ['Golden hour sun', 'Medium, warm, low', 'Nostalgia, warmth, glow', 'Almost everything — the cliché is earned'],
        ]},
        { type: 'tip', label: 'Pro tip', html: 'Shadow edges tell you everything. Look at the shadow of your own hand: razor-sharp edge = hard light; soft gradient = soft light. Reading shadows becomes automatic, and then you\'ll see light itself everywhere you go.' },
        { type: 'p', html: 'Neither is "better." Soft light flatters and forgives; hard light sculpts and dramatizes. What matters is <b>choosing</b> — the failure mode is not noticing which one you\'re in.' },
        { type: 'assignment', html: 'Photograph the same person (or object) in noon sun, open shade, and by a window indoors. Same pose, same framing. Label the shadow edges hard/soft. This trio teaches quality of light faster than a year of casual shooting.' }
      ]
    },
    {
      id: 'direction-of-light',
      title: 'Direction: Where Light Comes From',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'Move light around a subject (or the subject around light) and the same face becomes five different photographs. Direction is the sculptor\'s chisel.' },
        { type: 'list', items: [
          '<b>Front light</b> (sun behind you): even, safe, flat. Colors pop but faces lose dimension. Passport light.',
          '<b>Side light</b> (90°): maximum texture and drama. Every wrinkle, grain, and ridge stands up. The landscape photographer\'s favorite — it\'s why they shoot at dawn/dusk when light rakes sideways.',
          '<b>Backlight</b> (sun facing you): rim-lit hair, glowing leaves, silhouettes. Expose for the subject (face brightens, sky blows out) or for the sky (subject becomes silhouette). Both are valid — decide.',
          '<b>Top light</b> (noon): raccoon-eye shadows on faces. Rescue it by finding open shade or turning the face up toward the sky.',
          '<b>45° front-side</b>: the classic portrait angle — shape without harshness. Look for the small triangle of light on the shadow-side cheek (Rembrandt lighting).'
        ]},
        { type: 'tip', label: 'Pro tip', html: 'Backlight + a slight underexposure + shooting into the sun with the subject blocking it = the glowing "golden halo" portrait look. Add a reflector (or a white wall, or a friend\'s white T-shirt) to bounce light back into the face.' },
        { type: 'assignment', html: 'Place a subject near a window. Walk a full circle around them, shooting every 45°. Eight frames, eight moods, one light. This exercise is the whole lesson in miniature.' }
      ]
    },
    {
      id: 'color-wb',
      title: 'Color of Light & White Balance',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'Light has color, measured in Kelvin: candlelight ~1900K (amber), tungsten bulbs ~2700K, sunrise ~3500K, midday sun ~5500K, overcast ~6500K, open shade ~7500K (blue). Your eyes auto-correct; your camera needs to be told — that\'s <b>white balance</b>.' },
        { type: 'list', items: [
          '<b>Auto WB</b> is genuinely good now, and in RAW white balance is freely adjustable later — so AWB + RAW is a sane default.',
          '<b>Presets</b> (Daylight, Cloudy, Shade, Tungsten) are useful for consistency across a series.',
          '<b>Creative WB</b>: "Cloudy" warms golden hour further; deliberately cool WB turns twilight cinematic blue. White balance is an artistic control disguised as a technical one.'
        ]},
        { type: 'h2', html: 'Mixed light — the real-world trap' },
        { type: 'p', html: 'A room lit by orange tungsten bulbs AND blue window light cannot be fully corrected — fixing one poisons the other. Solutions: turn off the bulbs, wait for dusk, embrace the mix as mood, or go black &amp; white. Recognizing mixed light before shooting saves hours of editing frustration.' },
        { type: 'tip', label: 'Pro tip', html: 'Blue hour — the 20–30 minutes after sunset — mixes deep blue ambient sky with warm artificial lights: the most cinematic free light that exists. City skylines, portraits by shop windows, car lights. Set a phone reminder for it this week.' },
        { type: 'assignment', html: 'Shoot one scene at every WB preset your camera offers. Then shoot a portrait during blue hour next to any artificial light source. Notice the blue/amber contrast — you\'ll start seeing that palette in every film you watch.' }
      ]
    },
    {
      id: 'golden-hour-planning',
      title: 'Chasing Light: Golden Hour & Planning',
      duration: '6 min',
      blocks: [
        { type: 'p', html: 'Professional photographers don\'t have better luck with light — they schedule it. The hour after sunrise and before sunset delivers warm, low, directional light that flatters nearly everything. Planning is 80% of landscape and travel photography.' },
        { type: 'olist', items: [
          '<b>Scout in bad light, shoot in good light.</b> Find compositions at noon; return at golden hour.',
          '<b>Arrive 30 minutes early.</b> The best color often happens before sunrise and after sunset, not during.',
          '<b>Know your azimuth</b>: apps (PhotoPills, Sun Surveyor) show exactly where the sun will rise/set on a map, months ahead.',
          '<b>Bad weather = good photos.</b> Storm edges, breaking fog, and post-rain clarity beat blue skies every time. Clear-sky forecasts are the boring ones.'
        ]},
        { type: 'tip', label: 'Pro tip', html: 'Overcast midday is not "bad light" — it\'s a giant softbox. It\'s wonderful for portraits, forests (no dappled hotspots), waterfalls, and saturated color. There\'s no bad light, only mismatched subjects.' },
        { type: 'assignment', html: 'Pick one location within ten minutes of home. Photograph it at sunrise, noon, golden hour, and blue hour in one day. Four visits, one composition, four completely different photographs. This is the assignment students remember years later.' }
      ]
    }
  ],
  quiz: [
    { q: 'What makes light "soft"?', options: ['Low brightness', 'A light source that is large relative to the subject', 'Warm color temperature', 'Using a tripod'], answer: 1, why: 'Softness comes from relative size: big sources (overcast sky, nearby window) wrap light around subjects, producing gradual shadow edges.' },
    { q: 'Which direction of light reveals maximum texture?', options: ['Front light', 'Side light', 'Top light', 'No light'], answer: 1, why: 'Side light rakes across surfaces so every ridge casts a small shadow — which is why landscape photographers love low morning/evening sun.' },
    { q: 'Shooting into the sun with your subject in front of it, you can either expose for the face or for the sky. Exposing for the sky gives you:', options: ['A brighter face', 'A silhouette', 'Less noise', 'Sharper focus'], answer: 1, why: 'Exposing for the bright sky renders the (much darker) subject as a dark shape — a silhouette. Both choices are valid; the point is deciding.' },
    { q: 'Open shade on a sunny day produces light that is:', options: ['Warm/orange', 'Cool/blue', 'Perfectly neutral', 'Green'], answer: 1, why: 'Subjects in shade are lit by blue skylight rather than direct sun, pushing color temperature toward blue (~7000K+). Warm it with WB.' },
    { q: 'The "blue hour" is:', options: ['Any hour it rains', 'The period just after sunset (or before sunrise) mixing blue sky with warm artificial lights', 'Noon on clear days', 'A Lightroom preset'], answer: 1, why: 'That twilight window delivers a cinematic blue ambient + amber artificial light mix — free production value for cities and portraits.' }
  ]
}
];
