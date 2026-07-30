// Modules 06–10: Lenses & Gear, Genres, Editing, Advanced Techniques, The Craft

export const MODULES_B = [
{
  id: 'lenses-gear',
  num: '06',
  title: 'Lenses & Gear',
  tagline: 'Tools, not trophies',
  description: 'Focal lengths and what they do to space, primes vs zooms, and the short list of accessories that actually earn their bag space.',
  lessons: [
    {
      id: 'focal-length',
      title: 'Focal Length: How Lenses See Space',
      duration: '9 min',
      blocks: [
        { type: 'p', html: 'Focal length isn\'t just "how zoomed in" — it changes the <b>geometry of space</b>. Wide lenses exaggerate distance and depth; telephotos compress it, stacking planes together. Same scene, different lens, different reality.' },
        { type: 'table', head: ['Focal length (full frame)', 'Sees like', 'Space feels', 'Classic use'], rows: [
          ['14–24mm ultra-wide', 'Wider than your vision', 'Stretched, dramatic, near things loom huge', 'Landscapes, architecture, astro, tight interiors'],
          ['35mm', 'Relaxed attention', 'Natural with context', 'Street, documentary, environmental portraits'],
          ['50mm', 'Roughly human gaze', 'Neutral, honest', 'Everything — the classic first prime'],
          ['85–105mm', 'Focused attention', 'Gently compressed, flattering', 'Portraits — the flattering compression range'],
          ['200–600mm', 'Binoculars', 'Stacked, flattened, intimate-from-afar', 'Wildlife, sports, mountain layers, moon'],
        ]},
        { type: 'h2', html: 'Perspective is about your feet' },
        { type: 'p', html: 'Strictly, perspective depends on <b>where you stand</b>, not the lens — the lens just crops. But because a telephoto lets you stand far away and a wide lens forces you close, the choice of lens effectively chooses your perspective. Portraits at 24mm from arm\'s length distort noses; at 85mm from three meters, faces flatten flatteringly. Move your feet first, zoom second.' },
        { type: 'tip', label: 'Crop factor', html: 'On APS-C cameras multiply by ~1.5 (a 35mm lens frames like ~50mm); on Micro Four Thirds, by 2. When lessons say "50mm look," find the equivalent for your sensor.' },
        { type: 'assignment', html: 'The "zoom with your feet" study: photograph a friend filling the same amount of frame at your widest and longest focal lengths (you\'ll have to physically move). Compare their face and the background — same person, two different worlds.' }
      ]
    },
    {
      id: 'primes-zooms',
      title: 'Primes vs Zooms & Your Next Lens',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'A <b>zoom</b> covers many focal lengths; a <b>prime</b> is fixed at one but is usually smaller, sharper, cheaper, and 1–3 stops brighter. The kit zoom that came with your camera is genuinely fine — the question is only ever what to add, and when.' },
        { type: 'list', items: [
          '<b>The classic first prime: a 50mm f/1.8</b> ("nifty fifty"). Inexpensive on every system, and its f/1.8 aperture unlocks low light and creamy backgrounds your kit zoom physically cannot produce.',
          '<b>Constraints teach.</b> A month shooting only one prime forces you to move, crouch, and see — the fastest composition boot camp available at any price.',
          '<b>Zooms win when moving is impossible</b>: events, weddings, wildlife, sidelines. A 24–70mm f/2.8 is the working pro\'s Swiss Army knife for a reason.'
        ]},
        { type: 'h2', html: 'Buy lenses by problem, not by lust' },
        { type: 'p', html: '"My photos are too dark indoors" → fast prime. "I can\'t get close to the birds" → telephoto. "The whole room won\'t fit" → ultra-wide. If you can\'t name the problem a lens solves, you don\'t need it yet — lenses hold value, but the best gear investment under $100 is always a class, a book, or a trip.' },
        { type: 'tip', label: 'Pro tip', html: 'Rent before you buy anything over $500. One weekend with a rented 70–200mm teaches you whether YOU are a telephoto shooter — an answer no review can give you.' },
        { type: 'assignment', html: 'Tape your zoom at one focal length (or use a prime) for one full week. Choose 35mm-equivalent or 50mm-equivalent. Log what you missed and what you found — most people find more than they miss.' }
      ]
    },
    {
      id: 'essential-accessories',
      title: 'Accessories That Earn Their Keep',
      duration: '6 min',
      blocks: [
        { type: 'p', html: 'The accessories industry runs on beginner anxiety. Here\'s the short list that working photographers actually use, in order of impact:' },
        { type: 'olist', items: [
          '<b>A real tripod</b> — unlocks long exposure, night, sharp landscapes, self-portraits. Buy one decent (aluminum, ball head) instead of two flimsy ones.',
          '<b>Spare batteries & cards</b> — the least glamorous items ever to save a shoot. Two spares each, minimum.',
          '<b>A blower & microfiber cloths</b> — dust on the sensor/lens costs hours in editing. Blow first, then wipe.',
          '<b>Circular polarizer (CPL)</b> — the one filter editing can\'t replicate: cuts reflections off water/glass/leaves, deepens skies. Rotate it while watching the effect.',
          '<b>ND filters</b> — sunglasses for your lens; enable slow shutters in daylight (silky waterfalls, emptied streets).',
          '<b>A comfortable strap or small bag</b> — the best camera is the one that\'s with you; comfort decides whether it is.'
        ]},
        { type: 'tip', label: 'Skip (for now)', html: 'UV "protection" filters on cheap glass (a lens hood protects better and improves contrast), gimbals, drone-envy, and any gadget promising sharpness. Sharpness lives in Module 03, not in a shop.' },
        { type: 'assignment', html: 'Audit your bag: everything you haven\'t used in three months comes out. Photograph one outing with camera + one lens + polarizer only. Lightness changes what you notice.' }
      ]
    }
  ],
  quiz: [
    { q: 'Which lens compresses space, stacking background and subject closer together?', options: ['14mm ultra-wide', '35mm', '50mm', '200mm telephoto'], answer: 3, why: 'Long focal lengths (shot from farther away) flatten perspective — distant mountains loom behind subjects, planes stack together.' },
    { q: 'The classic, affordable first prime lens most photographers recommend is:', options: ['85mm f/1.2', '50mm f/1.8', '24–70mm f/2.8', '600mm f/4'], answer: 1, why: 'The "nifty fifty" is cheap on every system, sharp, and its f/1.8 aperture unlocks low light and background blur kit zooms can\'t reach.' },
    { q: 'Which filter effect CANNOT be recreated in editing?', options: ['Warming the color', 'Adding vignette', 'A polarizer cutting reflections from water and glass', 'Increasing contrast'], answer: 2, why: 'A polarizer physically blocks reflected polarized light before capture. Once a reflection is recorded over the detail beneath it, no slider can remove it.' },
    { q: 'Shooting a portrait extremely close with an ultra-wide lens will:', options: ['Flatter the face', 'Distort features — noses loom large', 'Compress the background', 'Change nothing'], answer: 1, why: 'Close camera distance exaggerates near features. Portraits flatter at 85mm-ish focal lengths from a few meters back.' },
    { q: 'An ND (neutral density) filter is used to:', options: ['Add color casts', 'Cut light so you can use slow shutter speeds in daylight', 'Increase sharpness', 'Protect the lens from dust'], answer: 1, why: 'ND filters are sunglasses for the lens — enabling ¼s waterfalls or 30s emptied streets under full sun.' }
  ]
},

{
  id: 'genres',
  num: '07',
  title: 'Genre Playbooks',
  tagline: 'Portrait · Landscape · Street · More',
  description: 'Field-tested recipes for the major genres: settings, light, and the one thing that matters most in each.',
  lessons: [
    {
      id: 'portraits',
      title: 'Portraits: People at Their Best',
      duration: '9 min',
      blocks: [
        { type: 'p', html: 'A portrait succeeds on <b>connection first, light second, settings third</b>. Nobody ever loved a portrait because it was taken at f/1.4 — they love how it makes the person look and feel.' },
        { type: 'recipe', label: 'Base recipe', html: 'Aperture priority · f/1.8–f/2.8 · minimum shutter 1/200s · Auto ISO · eye-AF on · 50–105mm equivalent · soft directional light (window, open shade, golden hour).' },
        { type: 'h2', html: 'Direction beats perfection' },
        { type: 'list', items: [
          '<b>Talk the whole time.</b> Silence behind a camera reads as judgment. Give tiny tasks: "look at the light… now back at me… think of the worst joke you know."',
          '<b>Chin out and slightly down</b> defines the jawline. Body angled 30–45° from camera, face back toward lens.',
          '<b>Shoot eye level or a touch above.</b> Below eye level flatters almost no one (it\'s a nostril study).',
          '<b>Catchlights</b>: position the subject so the light source reflects in their eyes — it\'s the difference between alive and mannequin.',
          '<b>Take three of everything.</b> Blinks and micro-expressions; the third frame relaxes.'
        ]},
        { type: 'tip', label: 'Pro tip', html: 'The window-light portrait is the highest quality-to-effort ratio in photography: subject at 45° to a big window, white wall or reflector on the shadow side, background three meters behind them, f/2. Rembrandt would recognize this light — it\'s his.' },
        { type: 'assignment', html: 'Make three portraits of the same person: window light indoors, open shade outside, and backlit at golden hour. Deliver them their favorite — portrait photography runs on generosity.' }
      ]
    },
    {
      id: 'landscape',
      title: 'Landscape: Patience & Planes',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'Landscape photography is 70% planning, 20% waiting, 10% shooting. The camera settings are the easy part — being somewhere extraordinary when the light turns extraordinary is the craft.' },
        { type: 'recipe', label: 'Base recipe', html: 'Aperture priority or Manual · f/8–f/11 · ISO 100 · tripod (shutter can then be anything) · focus one-third into the scene · polarizer on · shoot RAW · golden/blue hour.' },
        { type: 'list', items: [
          '<b>Foreground, midground, background.</b> The eternal checklist. Get low; find the rock, the flowers, the leading stream.',
          '<b>Bracket when contrast is extreme</b>: three frames at −2/0/+2 EV protects sunrise skies for later blending.',
          '<b>Check the edges</b> — a landscape frame\'s corners collect stray branches like lint.',
          '<b>Stay after sunset.</b> The best ten minutes are usually after everyone else has left.'
        ]},
        { type: 'tip', label: 'Pro tip', html: 'Wind blurring your foreground flowers during a long exposure? Take one fast-shutter frame for the flowers and one slow frame for the water/sky, and blend in editing. Half of the famous landscapes you admire are two exposures being honest together.' },
        { type: 'assignment', html: 'Plan one sunrise shoot end-to-end: location scouted the day before, azimuth checked, composition chosen, alarm set 90 minutes before sunrise. The alarm is the assignment.' }
      ]
    },
    {
      id: 'street-travel',
      title: 'Street & Travel: The Decisive Moment',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'Street photography is hunting for the split second when geometry, light, and human gesture align — what Cartier-Bresson called <b>the decisive moment</b>. It trains anticipation, courage, and speed like nothing else.' },
        { type: 'recipe', label: 'Base recipe', html: 'Aperture priority · f/5.6–f/8 (depth covers focus errors) · minimum shutter 1/250s · Auto ISO to 6400 · 35mm equivalent · small camera, no lens hood, blend in.' },
        { type: 'list', items: [
          '<b>Find the stage, wait for the actor.</b> Great light on a wall + interesting shadows = stand there until someone walks through it.',
          '<b>Shoot from the hip sparingly, ask sometimes, smile always.</b> A nod and a smile defuses nearly every situation; deleting a frame on request costs nothing.',
          '<b>Work the scene</b>: don\'t take one frame and flee. The second and eighth frames are usually better than the first.',
          '<b>Know your local law</b> — public-space photography rules differ by country; travel with awareness and respect.'
        ]},
        { type: 'tip', label: 'Zone focus — the classic', html: 'Manual focus at 3m, f/8: everything from ~2m to ~6m is sharp. No AF delay, camera at chest height, you\'re invisible and instant. This is how the classic street shooters worked.' },
        { type: 'assignment', html: 'One hour, one street corner, fifty frames minimum. Choose your three best. Then the harder edit: choose ONE. Street teaches editing as much as shooting.' }
      ]
    },
    {
      id: 'macro-wildlife-night',
      title: 'Macro, Wildlife & Night Sky',
      duration: '9 min',
      blocks: [
        { type: 'h2', html: 'Macro: the world at 1:1' },
        { type: 'p', html: 'Close up, depth of field collapses to millimeters. Shoot at f/8–f/16, use bursts (your body sways in and out of focus), and prefer overcast light or a diffused flash. No macro lens? Extension tubes are cheap and excellent. Parallel film-plane to subject = more of it sharp.' },
        { type: 'h2', html: 'Wildlife: ethics then optics' },
        { type: 'recipe', label: 'Recipe', html: 'Shutter priority or Manual+AutoISO · 1/1000s+ for action, 1/500s perched · AF-C tracking, eye-AF animal mode · longest lens you have · golden hours (animals agree with photographers about schedules).' },
        { type: 'p', html: 'The subject\'s welfare outranks the shot — always. Distance, silence, no baiting, no nest disturbance. Learn one species\' habits deeply; the photographs follow. Get low to eye level: a duck photographed from your knees beats one from your feet, every time.' },
        { type: 'h2', html: 'Night & stars' },
        { type: 'recipe', label: 'Milky Way starter', html: 'Manual · widest lens, widest aperture · shutter = 500 ÷ focal length seconds (the "500 rule", e.g. 20s at 24mm) · ISO 3200 · manual focus on a bright star at 10× live view · tripod + 2s timer · moonless night, away from city glow.' },
        { type: 'tip', label: 'Pro tip', html: 'Light-pollution maps and moon-phase calendars matter more than gear. A phone on a $30 tripod under a truly dark sky beats a $4000 kit downtown.' },
        { type: 'assignment', html: 'Pick ONE of the three (macro / wildlife / night) and complete its recipe this week. Specialization for a week beats sampling for a month.' }
      ]
    }
  ],
  quiz: [
    { q: 'The classic flattering setup for a window-light portrait places the subject:', options: ['Facing directly into the window', 'At about 45° to the window with a reflector on the shadow side', 'With the window directly behind them', 'As far from the window as possible'], answer: 1, why: '45° gives shape (light and shadow modeling the face); the reflector keeps the shadow side alive. It\'s the painter\'s light.' },
    { q: 'For sweeping landscapes, the standard aperture range is:', options: ['f/1.4–f/2', 'f/2.8–f/4', 'f/8–f/11', 'Always f/22'], answer: 2, why: 'f/8–f/11 gives deep focus while staying inside the lens\'s sharpness sweet spot; f/22 invites diffraction softness.' },
    { q: 'Zone focusing in street photography means:', options: ['Using the fastest autofocus', 'Pre-setting manual focus and aperture so a distance range is sharp, then shooting instantly', 'Focusing only in city zones', 'Cropping later'], answer: 1, why: 'Pre-focused at ~3m and f/8, everything ~2–6m is sharp — no AF lag, no missed moments.' },
    { q: 'The "500 rule" for stars (500 ÷ focal length) tells you:', options: ['The maximum ISO to use', 'The longest shutter before stars trail into streaks', 'The number of shots to stack', 'The best f-stop'], answer: 1, why: 'The Earth rotates; past that shutter duration stars smear into trails. At 24mm: 500÷24 ≈ 20 seconds.' },
    { q: 'In wildlife photography, the non-negotiable rule is:', options: ['Always use bait for better poses', 'The animal\'s welfare outranks any photograph', 'Shoot from standing height', 'Use flash on nocturnal animals'], answer: 1, why: 'Ethics first: distance, no baiting, no nest disturbance. No frame is worth stressing the subject.' }
  ]
},

{
  id: 'editing',
  num: '08',
  title: 'The Digital Darkroom',
  tagline: 'Editing & post-processing',
  description: 'Developing your RAW files: a professional workflow, the core adjustments in order, color grading, retouching ethics, and export settings. Includes a hands-on editing desk.',
  lessons: [
    {
      id: 'editing-philosophy',
      title: 'Workflow: From Card to Keeper',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'Editing is two different jobs people confuse: <b>culling</b> (choosing) and <b>developing</b> (adjusting). Do them separately. Great photographers are ruthless cullers — of 300 frames, perhaps 10 deserve development and 3 deserve showing.' },
        { type: 'olist', items: [
          '<b>Import & back up</b> the same day. Add keywords/location while you remember.',
          '<b>Cull fast, twice.</b> Pass 1: flag anything with a pulse (1 second per photo, gut only). Pass 2: among flags, star the best of each scene. Never develop first — editing a reject wastes your best hours.',
          '<b>Develop the starred few</b> (next lessons).',
          '<b>Export, share, archive.</b>'
        ]},
        { type: 'h2', html: 'Choosing software' },
        { type: 'table', head: ['Tool', 'Type', 'Notes'], rows: [
          ['Lightroom Classic / CC', 'Catalog + RAW editor', 'The industry default; this course\'s slider names follow it'],
          ['Capture One', 'Catalog + RAW editor', 'Pro alternative, superb color tools'],
          ['Darktable / RawTherapee', 'Free & open source', 'Genuinely capable; ideal to start free'],
          ['Snapseed / Lightroom Mobile', 'Phone', 'Real editing on phone shots — the same principles apply'],
        ]},
        { type: 'tip', label: 'Pro tip', html: 'Every serious tool is non-destructive: your RAW file is never altered; edits are recipes stored alongside. Experiment fearlessly — "reset" is always one click away.' },
        { type: 'assignment', html: 'Take your last shoot and cull it with the two-pass method. Count: total frames → flagged → starred. If more than 10% survive to stars, cull again. Selectivity is a skill.' }
      ]
    },
    {
      id: 'core-adjustments',
      title: 'The Core Adjustments, In Order',
      duration: '10 min',
      blocks: [
        { type: 'p', html: 'Nearly every photo develops well with the same short sequence. Work top-down; each step affects the ones after it.' },
        { type: 'olist', items: [
          '<b>Crop & straighten</b> — geometry first; a tilted horizon poisons everything else. Recompose, remove edge clutter.',
          '<b>White balance</b> — set the mood\'s temperature before judging any color.',
          '<b>Exposure</b> — overall brightness. Get the midtones right and ignore the extremes for now.',
          '<b>Highlights down / Shadows up</b> — recover the sky, open the darks. The RAW magic happens here (gently — see the tip).',
          '<b>Whites & Blacks</b> — set the true endpoints so the image has contrast anchor points.',
          '<b>Contrast / Curve</b> — a gentle S-curve adds life.',
          '<b>Presence</b> — Texture/Clarity for grit (or negative for glow), Vibrance before Saturation (it protects skin).',
          '<b>Sharpen & denoise</b> — last, and at 100% zoom only.'
        ]},
        { type: 'widget', widget: 'editing' },
        { type: 'tip', label: 'The −100/+100 trap', html: 'Highlights −100 + Shadows +100 produces the flat, glowing "HDR corpse" look that screams amateur. If you need ±80 or more, the capture exposure was wrong — fix less, reshoot smarter. Edits should whisper.' },
        { type: 'assignment', html: 'Take one RAW photo and run the eight steps in order, writing down each value you chose. Then reset and try to reach the same result in half the slider distance. Restraint is the second lesson.' }
      ]
    },
    {
      id: 'color-grading',
      title: 'Color: Correction vs Grading',
      duration: '8 min',
      blocks: [
        { type: 'p', html: '<b>Correction</b> makes color accurate. <b>Grading</b> makes it expressive — the teal-orange cinema look, faded film pastels, moody desaturation. Correct first, grade second, and know which one you\'re doing.' },
        { type: 'h2', html: 'The HSL panel — your color mixer' },
        { type: 'list', items: [
          '<b>Hue</b>: shift a color\'s identity (yellow-greens → richer green foliage).',
          '<b>Saturation</b>: intensity per color (tame that screaming orange cone in the corner).',
          '<b>Luminance</b>: brightness per color — the secret weapon. Skies: blue luminance down = deeper drama. Skin: orange luminance up = gentle glow.'
        ]},
        { type: 'h2', html: 'Classic grades to learn by copying' },
        { type: 'list', items: [
          '<b>Teal & orange</b>: shadows toward teal, skin stays warm — blockbuster contrast of complementary colors.',
          '<b>Faded film</b>: lift the curve\'s black point slightly, mute saturation, add grain.',
          '<b>Clean & bright</b>: neutral WB, lifted shadows, vibrance +15 — the timeless editorial look.',
          '<b>Black & white</b>: not "desaturate" — use the B&W mixer to control how each color translates to grey (darken blues = dramatic skies).'
        ]},
        { type: 'tip', label: 'Pro tip', html: 'Grade with a reference image open beside yours — a film still or photographer you admire. Matching a target trains your eye 10× faster than sliding at random. And check your edit the next morning; night-you always over-saturates.' },
        { type: 'assignment', html: 'Take one photo and produce three versions: corrected-neutral, teal-orange, and black & white via the mixer. Export all three — feeling how far one RAW can travel is the point.' }
      ]
    },
    {
      id: 'retouching-export',
      title: 'Local Edits, Retouching & Export',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'Global sliders develop the photo; <b>local adjustments</b> direct the viewer. Masks (linear/radial gradients, AI subject/sky selection, brushes) let you edit the sky separately from the land, the face separately from the room.' },
        { type: 'list', items: [
          '<b>Darken corners & edges, brighten the subject</b> — a subtle custom vignette nobody detects but everybody feels. The eye goes where the light is.',
          '<b>Sky mask</b>: −exposure, +texture; <b>subject mask</b>: +exposure ⅓ stop. Two masks fix 80% of flat photos.',
          '<b>Healing tool</b>: sensor dust spots, stray litter, the exit sign. Sweep at 100% before export.',
          '<b>Retouching people</b>: remove temporary things (blemish, stray hair), keep permanent ones (scars, freckles, character) unless asked. That line keeps portraits honest and subjects happy.'
        ]},
        { type: 'h2', html: 'Export settings that just work' },
        { type: 'table', head: ['Destination', 'Format', 'Size', 'Notes'], rows: [
          ['Instagram / web', 'JPEG, sRGB', '2048px long edge, quality 80–90', 'sRGB always for screens — other profiles shift color'],
          ['Client / full quality', 'JPEG quality 100', 'Full resolution', 'Or TIFF if they\'ll re-edit'],
          ['Print', 'JPEG/TIFF, 300 DPI', 'Print size × 300', 'Ask the lab for their color profile'],
          ['Archive', 'Keep the RAW + edit catalog', '—', 'Future software will develop it better than today\'s'],
        ]},
        { type: 'tip', label: 'Pro tip', html: 'Sharpen for output as the final export step (most exporters have "sharpen for screen/print") — never judge sharpening while zoomed out.' },
        { type: 'assignment', html: 'Take a finished edit and add exactly three local adjustments: a sky gradient, a subject lift, and a corner burn. Export web-size and full-size, and compare them on your phone.' }
      ]
    }
  ],
  quiz: [
    { q: 'The professional order of work is:', options: ['Develop every frame, then choose', 'Cull first, develop only the starred few', 'Export first', 'Sharpen first, crop last'], answer: 1, why: 'Editing rejects wastes your best hours. Choose ruthlessly in two fast passes, then develop only survivors.' },
    { q: 'Which adjustment should come FIRST?', options: ['Sharpening', 'Saturation', 'Crop & straighten', 'Vignette'], answer: 2, why: 'Geometry first — a tilted horizon or bad crop distorts every judgment you make afterward.' },
    { q: 'Highlights −100 and Shadows +100 typically produces:', options: ['A professional HDR look', 'A flat, unnatural image that signals over-editing', 'Perfect skin tones', 'More resolution'], answer: 1, why: 'Extreme recovery flattens tonal relationships into the glowing "HDR corpse" look. Big recovery needs usually mean the capture exposure was wrong.' },
    { q: 'To darken a blue sky without touching the rest of the image, the cleanest tool is:', options: ['Global exposure down', 'Blue LUMINANCE down in the HSL panel (or a sky mask)', 'Contrast up', 'White balance to tungsten'], answer: 1, why: 'HSL luminance targets one color\'s brightness only — the classic deep-sky move. A sky mask works too.' },
    { q: 'Exporting for the web/Instagram, use:', options: ['TIFF in AdobeRGB', 'JPEG in sRGB, ~2048px long edge', 'RAW files directly', 'PNG at full resolution'], answer: 1, why: 'sRGB is the universal screen profile (others shift color on the web); ~2048px JPEG at 80–90 quality is sharp and fast.' },
    { q: 'A good black & white conversion comes from:', options: ['The Saturation slider at −100', 'The B&W mixer, controlling how each color maps to grey', 'Lowering vibrance only', 'The blur tool'], answer: 1, why: 'The mixer lets you darken blues (dramatic skies) or lighten oranges (luminous skin) — desaturating alone throws that control away.' }
  ]
},

{
  id: 'advanced',
  num: '09',
  title: 'Advanced Techniques',
  tagline: 'Expanding the toolkit',
  description: 'Long exposure, flash without fear, HDR and panoramas, and focus stacking — the techniques that unlock photographs single frames can\'t make.',
  lessons: [
    {
      id: 'long-exposure',
      title: 'Long Exposure: Painting with Time',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'Long exposure records duration itself: water turns to silk, clouds streak into brushstrokes, crowds evaporate, headlights become rivers of light. Requirements: a tripod, a way to fire without touching the camera (2s timer or remote), and patience.' },
        { type: 'recipe', label: 'Recipes', html: '<b>Waterfall silk:</b> ¼–2s, f/11, ISO 100, polarizer. <b>Car light trails:</b> 10–30s, f/8–f/11, blue hour. <b>Ghost crowds:</b> 30s+ with strong ND — walkers vanish. <b>Star trails:</b> stack many 30s frames. <b>Ocean mist:</b> 30–120s with 10-stop ND.' },
        { type: 'list', items: [
          '<b>Compose and focus FIRST, then add the dark ND filter</b> (AF can\'t see through 10 stops).',
          '<b>Cover the viewfinder</b> on DSLRs during very long exposures — light leaks in backwards.',
          '<b>Watch the histogram, not the LCD</b> — night LCDs lie brightly.',
          '<b>Something must stay still.</b> Silk water needs sharp rocks; streaked clouds need solid buildings. Motion reads only against stillness.'
        ]},
        { type: 'tip', label: 'Pro tip', html: 'No ND filter? Shoot at dusk when light is already low, stop down to f/16, ISO 50 if available. Or stack: take 10 consecutive shots and average them in software — same silky effect, no filter.' },
        { type: 'assignment', html: 'One evening, two shots: a ¼-second waterfall/fountain frame and a 20-second traffic-trail frame from a bridge or overpass. Both need the tripod. Feel how different 0.25s and 20s worlds are.' }
      ]
    },
    {
      id: 'flash-basics',
      title: 'Flash Without Fear',
      duration: '9 min',
      blocks: [
        { type: 'p', html: 'Flash terrifies beginners because on-camera direct flash looks terrible — flat, harsh, red-eyed. The fix isn\'t avoiding flash; it\'s moving or softening it. One off-camera flash is a portable sun you control.' },
        { type: 'h2', html: 'The mental model' },
        { type: 'p', html: 'A flash photo is <b>two exposures in one frame</b>: ambient light (controlled by shutter/ISO/aperture) and flash light (controlled by flash power/aperture/distance — shutter doesn\'t affect it within sync speed). Darken the ambient with shutter, light the subject with flash — that\'s how pros shoot sunset portraits with crisp faces.' },
        { type: 'olist', items: [
          '<b>Bounce it</b>: swivel the flash head at a white ceiling or wall — the surface becomes a huge soft source. Instant 10× improvement.',
          '<b>Get it off camera</b>: a $30 trigger + light stand at 45° = studio portraiture anywhere.',
          '<b>Soften it</b>: umbrella or softbox — remember, big source = soft light.',
          '<b>Balance it</b>: start at 1/8 power and adjust. Flash should be seasoning, rarely the whole meal.'
        ]},
        { type: 'tip', label: 'Sync speed', html: 'Cameras sync with flash only up to ~1/200–1/250s. Faster shutters show a black band (the shutter curtain caught mid-travel). Need faster in bright sun? That\'s what High-Speed Sync (HSS) mode is for.' },
        { type: 'assignment', html: 'In a dim room, shoot: (1) direct on-camera flash, (2) bounced off the ceiling, (3) bounced off a side wall. Same subject. Frame 1 is why people hate flash; frames 2–3 are why pros love it.' }
      ]
    },
    {
      id: 'hdr-pano-stacking',
      title: 'HDR, Panoramas & Focus Stacking',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'Some scenes exceed what one frame can hold — too much contrast, too much width, too much depth. The answer is the same trick three ways: <b>shoot multiple frames, merge in software</b>.' },
        { type: 'h2', html: 'HDR — more dynamic range' },
        { type: 'p', html: 'Bracket 3–5 frames at −2/0/+2 EV (change SHUTTER, not aperture — aperture shifts depth of field between frames). Merge to HDR in your editor, then develop the merged file like a normal RAW. Aim for "natural with detail everywhere," not the radioactive HDR of 2010. Interiors with windows are the classic use case.' },
        { type: 'h2', html: 'Panoramas — more width & resolution' },
        { type: 'p', html: 'Shoot vertical frames, overlapping 30–50%, sweeping level. Lock exposure, WB, and focus to manual so frames match. Merge produces enormous files — a phone-lens pano can print wall-size. Bonus trick: a 2-row pano at 85mm creates the exotic "Brenizer" shallow-depth wide view.' },
        { type: 'h2', html: 'Focus stacking — more depth' },
        { type: 'p', html: 'Macro and tabletop scenes can\'t get everything sharp at any aperture. Shoot a series stepping focus from nearest to farthest (many cameras automate "focus bracketing"), then merge. Ten frames at f/5.6 out-sharpen one frame at f/22 — no diffraction.' },
        { type: 'tip', label: 'Shared rule', html: 'All three techniques demand consistent frames: tripod (or careful handhold), manual exposure, manual WB, no zoom changes mid-sequence. The merge software forgives geometry, never exposure jumps.' },
        { type: 'assignment', html: 'Shoot one bracketed HDR of a room with a bright window, and one 5-frame vertical panorama of a landscape. Merge both. You\'ve just doubled what your camera can capture.' }
      ]
    }
  ],
  quiz: [
    { q: 'For silky waterfall shots, which is essential?', options: ['High ISO', 'A tripod (and a slow shutter)', 'Flash', 'An 85mm lens'], answer: 1, why: 'Slow shutters (¼s+) blur the water; the tripod keeps everything else tack sharp during the exposure.' },
    { q: 'With a 10-stop ND filter, you should focus:', options: ['Through the filter with AF', 'Before attaching the filter, then switch to manual', 'It doesn\'t matter', 'Only at f/22'], answer: 1, why: 'AF can\'t see through 10 stops of darkness. Compose, focus, lock to MF, then mount the filter.' },
    { q: 'The biggest single improvement to on-camera flash indoors is:', options: ['Maximum power', 'Pointing it straight at the subject', 'Bouncing it off the ceiling or a wall', 'A faster shutter'], answer: 2, why: 'Bouncing turns the ceiling into a huge soft source — big source, soft light. Direct flash stays small and harsh.' },
    { q: 'When bracketing for HDR you should vary:', options: ['Aperture', 'Shutter speed', 'Focal length', 'White balance'], answer: 1, why: 'Changing aperture would shift depth of field between frames and break the merge. Shutter changes only brightness.' },
    { q: 'Focus stacking exists because:', options: ['Autofocus is unreliable', 'At close distances no aperture holds everything sharp — and f/22 suffers diffraction', 'RAW files are too large', 'Tripods are expensive'], answer: 1, why: 'Macro depth of field is millimeters. Merging a series of focus steps at a sharp mid-aperture beats one diffraction-softened f/22 frame.' }
  ]
},

{
  id: 'craft',
  num: '10',
  title: 'Building Your Craft',
  tagline: 'From skills to voice',
  description: 'Deliberate practice, self-critique, projects, and sharing your work — the path from competent to distinctive.',
  lessons: [
    {
      id: 'deliberate-practice',
      title: 'Practice Like a Professional',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'Ten thousand casual snapshots teach less than one hundred deliberate frames. Deliberate practice means: a specific goal, immediate review, and repetition at the edge of your ability.' },
        { type: 'list', items: [
          '<b>One-constraint outings</b>: one lens, one color, only shadows, only strangers, no chimping (no screen review until home). Constraints build muscles.',
          '<b>Copy masters shamelessly</b> — as practice. Recreate a photo you love: its light, its geometry. Copying to learn is how every painter trained for five centuries.',
          '<b>The 36-frame roll</b>: one outing, exactly 36 exposures allowed, like film. Watch how careful you become by frame 30.',
          '<b>Review with a delay</b>: cull tomorrow, not tonight. Distance improves judgment.'
        ]},
        { type: 'tip', label: 'Pro tip', html: 'Keep a "misses journal": one line per failed photo about WHY it failed (late, wrong shutter, boring light…). Ten entries reveal your personal pattern — and your next month\'s curriculum.' },
        { type: 'assignment', html: 'This week: one 36-frame outing with one focal length, subject of your choice. Cull the next day to 3 keepers. Write one sentence per keeper on why it works.' }
      ]
    },
    {
      id: 'critique-your-work',
      title: 'Critiquing Your Own Work',
      duration: '7 min',
      blocks: [
        { type: 'p', html: 'You improve at the speed you can see your own flaws. Self-critique isn\'t self-cruelty — it\'s a structured second look. Use the same five questions professionals\' editors ask:' },
        { type: 'olist', items: [
          '<b>What is this photo about?</b> (One sentence. No sentence, no photo.)',
          '<b>Where does my eye go first — and is that the subject?</b> Bright spots and sharp edges steal attention.',
          '<b>What would I remove?</b> Edges and corners first.',
          '<b>Is the light doing work, or just present?</b>',
          '<b>Would I stop scrolling for this if it weren\'t mine?</b> The brutal one.'
        ]},
        { type: 'p', html: 'Seek outside critique too — but curate it. "Nice shot!" teaches nothing; one thoughtful photographer beats a hundred likes. Ask specifically: "What would you crop? What\'s the weakest element?" Specific questions get usable answers.' },
        { type: 'tip', label: 'Pro tip', html: 'Print your best work — even small, even at a drugstore lab. Photos behave differently on paper: flaws show, strengths deepen, and the work becomes real. Every serious photographer prints.' },
        { type: 'assignment', html: 'Run your five best photos of the month through the five questions in writing. Then ask one photographer you respect the two specific questions above about your single favorite.' }
      ]
    },
    {
      id: 'projects-portfolio',
      title: 'Projects, Portfolio & Sharing',
      duration: '8 min',
      blocks: [
        { type: 'p', html: 'Single good photos are lottery tickets; <b>projects</b> are compound interest. A project — one theme, explored deeply over weeks or months — teaches consistency, editing, and voice in a way random excellence can\'t.' },
        { type: 'list', items: [
          '<b>Starter projects</b>: 100 strangers · one street for a year · every door on your block · family dinner every Sunday · one tree through four seasons · the same commute 30 ways.',
          '<b>Portfolio = your 10–15 best, that belong together.</b> Curate ruthlessly; sequence deliberately (open strong, close stronger). A portfolio of 12 beats a gallery of 200 — viewers remember your worst photo, not your best.',
          '<b>Share on a schedule, not on impulse</b>: consistency builds an audience and a habit. But shoot for the project, not the algorithm — engagement metrics are a terrible art teacher.',
          '<b>Join something</b>: a local photo walk, a critique group, a monthly challenge. Photography grows faster in company.'
        ]},
        { type: 'h2', html: 'Your voice is a byproduct' },
        { type: 'p', html: 'Style isn\'t chosen from a menu — it precipitates out of hundreds of honest choices: what you point at, what light you wait for, what you delete. Follow what you can\'t stop photographing. That obsession, refined by everything in this course, IS your voice.' },
        { type: 'tip', label: 'The graduation rule', html: 'When someone can recognize your photograph without seeing your name — you\'ve arrived somewhere no gear can take you. Now the real work starts: staying curious.' },
        { type: 'assignment', html: 'Choose a project from the starter list (or invent one) and commit to it for 30 days. Define it in one sentence, shoot twice a week minimum, and build a 12-image edit at the end. This is your final assignment — and your first real body of work.' }
      ]
    }
  ],
  quiz: [
    { q: 'Deliberate practice differs from casual shooting because it has:', options: ['More expensive gear', 'A specific goal, review, and repetition at the edge of ability', 'More photos taken', 'Better weather'], answer: 1, why: 'Volume alone plateaus. Targeted constraints + honest review + repetition is how skill actually compounds.' },
    { q: 'The first question of self-critique is:', options: ['Is it sharp?', 'What is this photo about — in one sentence?', 'What preset fits?', 'How many likes will it get?'], answer: 1, why: 'Intent precedes technique. If a photo has no statement, no amount of sharpness or grading rescues it.' },
    { q: 'A strong portfolio is:', options: ['Every good photo you\'ve taken', '10–15 ruthlessly curated images that belong together', 'At least 200 images', 'Only your newest work'], answer: 1, why: 'Viewers judge you by your weakest inclusion. Small, coherent, sequenced — that\'s what professionals show.' },
    { q: 'Long-term photo projects matter because they:', options: ['Guarantee viral posts', 'Build consistency, editing skill, and personal voice', 'Require no planning', 'Replace the need for technique'], answer: 1, why: 'A theme explored deeply teaches what single lucky frames can\'t — and bodies of work are what galleries, clients, and history remember.' },
    { q: 'Personal style comes from:', options: ['Choosing a preset early and sticking to it', 'Hundreds of honest choices about what you shoot, wait for, and delete', 'Buying distinctive gear', 'Copying one photographer exactly, forever'], answer: 1, why: 'Voice precipitates out of accumulated choices and obsessions. Copying is for practice; the sum of your choices becomes recognizably yours.' }
  ]
}
];
