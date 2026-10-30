import { and, eq } from 'drizzle-orm';
import { ConceptLessonSchema, SaveItemSchema, type ConceptLesson, type SaveItem } from '@vidhyasaathy/contracts';
import type { Db } from '../db/index.ts';
import { conceptLessons, conceptPrereqs, concepts, items } from '../db/schema.ts';

const uid = (n: number) => `d7000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const slider = (title: string, axis: 'distance-time' | 'velocity-time', u: number, v: number, t: number, a: number) =>
  ({ kind: 'slider_graph' as const, title, axis, u, v, t, a });
const mover = (title: string, vehicle: 'car' | 'ball' | 'auto-rickshaw', distance: number, time: number, speed: number) =>
  ({ kind: 'moving_object' as const, title, vehicle, distance, time, speed });

function lesson(input: ConceptLesson) {
  return ConceptLessonSchema.parse(input);
}

const UNIFORM = lesson({
  bridge: {
    prereqTitle: 'Motion and Time',
    link: 'Class 7 already treated speed as distance divided by time.',
    repair: 'For three minutes, watch one example. A bus that covers 10 m in every second is in uniform motion. A bus that covers 10 m, then 4 m, then 15 m in the next seconds is in non-uniform motion.',
  },
  notes: {
    simple: 'Uniform motion (समान गति) means equal distances in equal times. Non-uniform motion (असमान गति) means those distances are not equal. A bus that keeps stopping is in non-uniform motion.',
    standard: 'An object is in uniform motion when it covers equal distances in equal intervals of time. When those distances are unequal, the motion is non-uniform. NCERT Class 9 uses a bus on a busy road as the non-uniform case.',
    stretch: 'Uniform motion along a straight line is constant velocity. A curved path, or a steady average speed made of speeding up and slowing down, is still non-uniform.',
  },
  steps: [
    {
      body: 'Equal distances in equal times is the test. The path can be a road, a track, or a table.',
      checkpoint: {
        id: uid(1501), prompt: 'A scooter covers 5 m in each second. Its motion is',
        options: ['uniform', 'non-uniform', 'at rest'], answer: 'uniform',
        explanation: 'The same distance in each second is uniform motion.',
      },
    },
    {
      body: 'If the distances in those equal times change, the motion is non-uniform, even on a straight road.',
      checkpoint: {
        id: uid(1502), prompt: 'A bus covers 8 m, then 3 m, then 11 m in three successive seconds. Its motion is',
        options: ['non-uniform', 'uniform', 'at rest'], answer: 'non-uniform',
        explanation: 'The distances in equal times are not equal, so the motion is non-uniform.',
      },
    },
  ],
  worked: {
    prompt: 'A car covers 20 m, 20 m and 20 m in three successive seconds.',
    hinted: ['Compare the distances first.', 'Each second has the same 20 m.'],
    unhinted: 'Name the motion in one word.',
  },
  faded: {
    itemId: uid(1503), prompt: 'A cyclist covers 8 m, 12 m and 7 m in three successive seconds. Name the motion.',
    hint: 'Ask whether the distances in equal times match.', answers: ['non-uniform', 'non uniform'],
  },
  misconceptions: [
    { slip: 'A straight road always means uniform motion.', fix: 'The road can be straight while the speed still changes. Check the distances, not the shape of the road.' },
    { slip: 'Stopping at a signal is rest for the whole trip.', fix: 'Rest is only the time the bus is still. The trip as a whole is non-uniform motion.' },
  ],
  explainBack: {
    itemId: uid(1504), ownWords: 'In your own words, how is non-uniform motion different from uniform motion?',
    gap: 'Equal distances in equal times is called ____ motion.', gapAnswers: ['uniform'],
  },
  summary: {
    lines: ['Uniform motion covers equal distances in equal intervals of time.', 'Non-uniform motion covers unequal distances in equal intervals of time.'],
    formulas: ['For uniform motion, speed = distance / time'],
  },
  flashcards: [
    { id: uid(1505), front: 'Uniform motion', back: 'Equal distances in equal times.' },
    { id: uid(1506), front: 'Non-uniform motion', back: 'Unequal distances in equal times.' },
    { id: uid(1507), front: 'समान गति', back: 'Uniform motion.' },
    { id: uid(1508), front: 'A bus in traffic', back: 'Usually non-uniform, because it slows and stops.' },
  ],
  blocks: [
    mover('An auto-rickshaw in uniform motion', 'auto-rickshaw', 12, 4, 3),
    { kind: 'predict_reveal', title: 'Before you calculate', prompt: 'The auto-rickshaw covers 3 m in every second. What kind of motion is that?', choices: ['Uniform motion', 'Non-uniform motion'], reveal: 'Equal distances in equal times, so this is uniform motion.' },
  ],
});

const SPEED = lesson({
  bridge: {
    prereqTitle: 'Units and ratios',
    link: 'Class 7 compared quantities of the same kind, and changed km/h into m/s.',
    repair: 'For three minutes: speed = distance / time. 20 m in 5 s is 4 m/s. Velocity is that rate with a direction. 1 km/h = 5/18 m/s.',
  },
  notes: {
    simple: 'Speed (चाल) is distance divided by time. Velocity (वेग) is speed with a direction. The SI unit of both is m/s. A return trip can have a speed and still have zero average velocity.',
    standard: 'Speed is the distance covered per unit time. Average speed is total distance divided by total time. Velocity is displacement per unit time, so it has a direction. Average velocity is zero when the displacement is zero.',
    stretch: 'A body moving in a circle at steady speed has changing velocity, because the direction changes. Average speed uses the path. Average velocity uses only the straight line from start to finish.',
  },
  steps: [
    {
      body: 'Speed does not point. It is the size of the rate: how much path per second.',
      checkpoint: {
        id: uid(1511), prompt: 'Speed is',
        options: ['distance / time', 'displacement / time', 'mass x velocity'], answer: 'distance / time',
        explanation: 'Speed uses distance. Displacement per time is velocity.',
      },
    },
    {
      body: 'Velocity keeps the direction. If the direction changes, the velocity has changed even when the speed has not.',
      checkpoint: {
        id: uid(1512), prompt: 'A car returns home by the same road. Its average velocity for the trip is',
        options: ['zero', 'equal to its average speed', 'the distance'], answer: 'zero',
        explanation: 'Displacement is zero on a return to the start, so average velocity is zero. Average speed is not.',
      },
    },
  ],
  worked: {
    prompt: 'A car travels 100 km in 2 h.',
    hinted: ['Average speed uses total distance and total time.', '100 / 2 = 50.'],
    unhinted: 'State the average speed with its unit.',
  },
  faded: {
    itemId: uid(1513), prompt: 'A scooter covers 10 km in 15 minutes. What is its average speed in km/h?',
    hint: '15 minutes is 0.25 h. Divide 10 by 0.25.', answers: ['40 km/h', '40'],
  },
  misconceptions: [
    { slip: 'Speed and velocity are the same word.', fix: 'Velocity has direction. Speed does not.' },
    { slip: 'Average velocity equals average speed whenever the object moves.', fix: 'They match only for straight motion that does not reverse. A round trip has speed, and zero average velocity.' },
  ],
  explainBack: {
    itemId: uid(1514), ownWords: 'Explain the difference between speed and velocity in your own words.',
    gap: 'Velocity is speed together with a ____.', gapAnswers: ['direction'],
  },
  summary: {
    lines: ['Speed = distance / time and has no direction.', 'Velocity = displacement / time and includes direction.', 'The SI unit is m/s. Multiply km/h by 5/18 to get m/s.'],
    formulas: ['speed = distance / time', 'velocity = displacement / time', '1 km/h = 5/18 m/s'],
  },
  flashcards: [
    { id: uid(1515), front: 'Speed', back: 'Distance divided by time. No direction.' },
    { id: uid(1516), front: 'Velocity', back: 'Displacement divided by time, with direction.' },
    { id: uid(1517), front: 'चाल', back: 'Speed.' },
    { id: uid(1518), front: 'Average velocity on a return trip', back: 'Zero, because displacement is zero.' },
  ],
  blocks: [
    mover('A car covering 100 km in 2 h', 'car', 100, 2, 50),
    {
      kind: 'drag_label', title: 'Speed or velocity?', prompt: 'Match each word to what it divides by time.',
      labels: [{ id: 'speed', text: 'Speed' }, { id: 'velocity', text: 'Velocity' }],
      targets: [{ id: 'path', text: 'Distance' }, { id: 'directed', text: 'Displacement' }],
      pairs: [{ labelId: 'speed', targetId: 'path' }, { labelId: 'velocity', targetId: 'directed' }],
      fix: 'Speed uses the path. Velocity uses the straight-line displacement and keeps the direction.',
    },
  ],
});

const ACCEL = lesson({
  bridge: {
    prereqTitle: 'Units and ratios',
    link: 'A change of speed only makes sense after the units match.',
    repair: 'For three minutes: acceleration = (v - u) / t. Convert km/h to m/s before you divide by seconds. Negative acceleration means the velocity is decreasing.',
  },
  notes: {
    simple: 'Acceleration (त्वरण) is how quickly velocity changes. The SI unit is m/s². Slowing down is negative acceleration (मंदन). A stone at the top of its path still has acceleration, because gravity has not switched off.',
    standard: 'Acceleration is the rate of change of velocity with time. For uniform acceleration, v = u + at. A negative value means the velocity is decreasing. The first equation of motion is v = u + at.',
    stretch: 'At the highest point of a vertical throw the velocity is zero for an instant and the acceleration is still about 9.8 m/s² downward. Zero velocity is not zero acceleration.',
  },
  steps: [
    {
      body: 'Acceleration tells the change in velocity each second, not the distance by itself.',
      checkpoint: {
        id: uid(1521), prompt: 'Acceleration is the rate of change of',
        options: ['velocity', 'distance only', 'mass'], answer: 'velocity',
        explanation: 'Acceleration is about velocity changing with time.',
      },
    },
    {
      body: 'The sign matters. Negative acceleration means the velocity is getting smaller in the chosen direction.',
      checkpoint: {
        id: uid(1522), prompt: 'Negative acceleration means the',
        options: ['velocity is decreasing', 'object must be at rest', 'distance is zero'], answer: 'velocity is decreasing',
        explanation: 'The object can still be moving. Negative acceleration means it is slowing in that direction.',
      },
    },
  ],
  worked: {
    prompt: 'A car starts from rest and reaches 10 m/s in 5 s.',
    hinted: ['u = 0, v = 10, t = 5.', 'a = (v - u) / t = 2 m/s².', 's = ut + ½at² = 25 m.'],
    unhinted: 'Find a and the distance without looking back.',
  },
  faded: {
    itemId: uid(1523), prompt: 'A bike speeds uniformly from 5 m/s to 15 m/s in 5 s. What is its acceleration in m/s²?',
    hint: 'a = (v - u) / t.', answers: ['2', '2 m/s²', '2 m/s2'],
  },
  misconceptions: [
    { slip: 'Negative acceleration means the object is at rest.', fix: 'Rest means velocity is zero. Negative acceleration means the velocity is decreasing.' },
    { slip: 'A stone at the top of its throw has no acceleration.', fix: 'The velocity is zero for an instant. Gravity still accelerates the stone downward.' },
  ],
  explainBack: {
    itemId: uid(1524), ownWords: 'Say what acceleration measures, in your own words.',
    gap: 'The first equation of motion is v = u + ____.', gapAnswers: ['at'],
  },
  summary: {
    lines: ['Acceleration is the rate of change of velocity.', 'SI unit: m/s².', 'Negative acceleration means the velocity is decreasing.'],
    formulas: ['a = (v - u) / t', 'v = u + at', 's = ut + ½at²'],
  },
  flashcards: [
    { id: uid(1525), front: 'Acceleration', back: 'Rate of change of velocity.' },
    { id: uid(1526), front: 'SI unit of acceleration', back: 'm/s²' },
    { id: uid(1527), front: 'त्वरण', back: 'Acceleration.' },
    { id: uid(1528), front: 'v = u + at', back: 'First equation of uniformly accelerated motion.' },
  ],
  blocks: [
    slider('Velocity against time', 'velocity-time', 0, 10, 5, 2),
    {
      kind: 'worked_problem', title: 'From rest to 10 m/s', prompt: 'A car starts from rest and reaches 10 m/s in 5 s. Find a and s.',
      u: 0, v: 10, t: 5, a: 2, s: 25,
      steps: [
        { text: 'The car starts from rest, so u = 0.', quantity: 'u', value: 0 },
        { text: 'a = (10 - 0) / 5 = 2 m/s².', quantity: 'a', value: 2 },
        { text: 's = ut + ½at² = 25 m.', quantity: 's', value: 25 },
      ],
    },
  ],
});

const DISTANCE_GRAPH = lesson({
  bridge: {
    prereqTitle: 'Reading graphs',
    link: 'Class 7 already read the slope of a distance-time graph as speed.',
    repair: 'For three minutes: a horizontal distance-time line is rest. A straight sloping line is uniform speed. A curve means the speed is changing.',
  },
  notes: {
    simple: 'On a distance-time graph (दूरी-समय ग्राफ), time goes along the x-axis and distance along the y-axis. A straight slope means uniform speed (समान चाल). A flat line means the object is at rest.',
    standard: 'The slope of a distance-time graph is speed. A straight line through the origin is uniform speed. A horizontal line is rest. A curve is non-uniform speed.',
    stretch: 'A steeper straight line is a higher uniform speed. The slope is distance / time, not acceleration. Acceleration is read from a velocity-time graph.',
  },
  steps: [
    {
      body: 'Read the axes first. Distance is vertical. Time is horizontal.',
      checkpoint: {
        id: uid(1531), prompt: 'The slope of a distance-time graph gives',
        options: ['speed', 'acceleration', 'only the time'], answer: 'speed',
        explanation: 'Slope = distance / time = speed.',
      },
    },
    {
      body: 'A horizontal line means the distance is not changing.',
      checkpoint: {
        id: uid(1532), prompt: 'A horizontal distance-time graph means the object',
        options: ['is at rest', 'moves at uniform speed', 'is speeding up'], answer: 'is at rest',
        explanation: 'Distance stays the same, so the object is at rest. Uniform speed is a sloping straight line.',
      },
    },
  ],
  worked: {
    prompt: 'A distance-time graph is a straight line through the origin.',
    hinted: ['A straight line means equal distances in equal times.', 'Through the origin, distance is zero when time is zero.'],
    unhinted: 'Name the motion.',
  },
  faded: {
    itemId: uid(1533), prompt: 'What does a curved distance-time graph tell you about the speed?',
    hint: 'A curve means the slope is changing.', answers: ['changing', 'the speed is changing', 'non-uniform'],
  },
  misconceptions: [
    { slip: 'A horizontal distance-time line is uniform speed.', fix: 'Horizontal means rest. Uniform speed slopes in a straight line.' },
    { slip: 'The slope of a distance-time graph is acceleration.', fix: 'That slope is speed. Acceleration is the slope of a velocity-time graph.' },
  ],
  explainBack: {
    itemId: uid(1534), ownWords: 'Explain what the slope of a distance-time graph tells you.',
    gap: 'A straight distance-time graph means ____ speed.', gapAnswers: ['uniform'],
  },
  summary: {
    lines: ['Distance-time slope = speed.', 'Straight line: uniform speed. Horizontal line: rest. Curve: changing speed.'],
    formulas: ['speed = slope of the distance-time graph'],
  },
  flashcards: [
    { id: uid(1535), front: 'Distance-time slope', back: 'Speed.' },
    { id: uid(1536), front: 'Horizontal distance-time line', back: 'The object is at rest.' },
    { id: uid(1537), front: 'दूरी-समय ग्राफ', back: 'Distance-time graph.' },
    { id: uid(1538), front: 'Curved distance-time graph', back: 'The speed is changing.' },
  ],
  blocks: [
    slider('Uniform speed on a distance-time graph', 'distance-time', 4, 4, 5, 0),
    mover('A ball rolling 8 m in 2 s', 'ball', 8, 2, 4),
  ],
});

const VELOCITY_GRAPH = lesson({
  bridge: {
    prereqTitle: 'Reading graphs',
    link: 'The distance-time slope was speed. This graph changes what the slope means.',
    repair: 'For three minutes: on a velocity-time graph the slope is acceleration. The area under the graph is the displacement. A line sloping up is speeding up.',
  },
  notes: {
    simple: 'On a velocity-time graph (वेग-समय ग्राफ), the slope is acceleration (त्वरण). A line going up means speeding up. A line going down means slowing down. The area under the line is the displacement.',
    standard: 'The slope of a velocity-time graph is acceleration. A straight line means uniform acceleration. The area under a velocity-time graph equals the displacement.',
    stretch: 'A horizontal velocity-time line is zero acceleration and constant velocity, not rest, unless the velocity itself is zero. The sign of the slope is the sign of the acceleration.',
  },
  steps: [
    {
      body: 'Do not reuse the distance-time rule here. The slope has a new meaning.',
      checkpoint: {
        id: uid(1541), prompt: 'The slope of a velocity-time graph gives',
        options: ['acceleration', 'speed only', 'the time only'], answer: 'acceleration',
        explanation: 'Slope = change in velocity / time = acceleration.',
      },
    },
    {
      body: 'The area between the line and the time axis is the displacement for that interval.',
      checkpoint: {
        id: uid(1542), prompt: 'The area under a velocity-time graph gives the',
        options: ['displacement', 'acceleration', 'mass'], answer: 'displacement',
        explanation: 'Velocity times time has the size of a displacement. The area is that product.',
      },
    },
  ],
  worked: {
    prompt: 'A velocity-time graph rises in a straight line from 0 to 12 m/s in 6 s.',
    hinted: ['a = (v - u) / t.', '(12 - 0) / 6 = 2 m/s².'],
    unhinted: 'State the acceleration.',
  },
  faded: {
    itemId: uid(1543), prompt: 'A velocity-time line falls in a straight line. What is the sign of the acceleration?',
    hint: 'A falling line means velocity is decreasing.', answers: ['negative', 'negative acceleration'],
  },
  misconceptions: [
    { slip: 'The slope of every motion graph is speed.', fix: 'Distance-time slope is speed. Velocity-time slope is acceleration.' },
    { slip: 'A horizontal velocity-time line always means rest.', fix: 'It means constant velocity. Rest is the special case where that velocity is zero.' },
  ],
  explainBack: {
    itemId: uid(1544), ownWords: 'Say what the slope and the area of a velocity-time graph each tell you.',
    gap: 'The area under a velocity-time graph is the ____.', gapAnswers: ['displacement'],
  },
  summary: {
    lines: ['Velocity-time slope = acceleration.', 'Area under a velocity-time graph = displacement.', 'A rising straight line is uniform acceleration.'],
    formulas: ['a = slope of the velocity-time graph', 'displacement = area under the velocity-time graph'],
  },
  flashcards: [
    { id: uid(1545), front: 'Velocity-time slope', back: 'Acceleration.' },
    { id: uid(1546), front: 'Area under a velocity-time graph', back: 'Displacement.' },
    { id: uid(1547), front: 'वेग-समय ग्राफ', back: 'Velocity-time graph.' },
    { id: uid(1548), front: 'Horizontal velocity-time line', back: 'Constant velocity, so acceleration is zero.' },
  ],
  blocks: [
    slider('Speeding up on a velocity-time graph', 'velocity-time', 0, 12, 6, 2),
    {
      kind: 'predict_reveal', title: 'Before you read the slope',
      prompt: 'The line on a velocity-time graph slopes upward in a straight line. The acceleration is',
      choices: ['uniform and positive', 'zero', 'the speed itself'],
      reveal: 'A straight rising line means uniform positive acceleration. The slope is constant.',
    },
  ],
});

const PAGES: { title: string; id: string | null; description: string; prereqs: string[]; lesson: ConceptLesson }[] = [
  { title: 'Uniform and non-uniform motion', id: uid(210), description: 'Class 9: uniform motion covers equal distances in equal times. Non-uniform motion does not.', prereqs: ['Motion and Time'], lesson: UNIFORM },
  { title: 'Speed & Velocity', id: null, description: 'Class 9 Physics: Speed & Velocity.', prereqs: ['Units and ratios', 'Motion and Time'], lesson: SPEED },
  { title: 'Acceleration', id: null, description: 'Class 9 Physics: Acceleration.', prereqs: ['Units and ratios'], lesson: ACCEL },
  { title: 'Distance-time graphs', id: uid(211), description: 'Class 9: the slope of a distance-time graph is the speed.', prereqs: ['Reading graphs'], lesson: DISTANCE_GRAPH },
  { title: 'Velocity-time graphs', id: uid(212), description: 'Class 9: the slope of a velocity-time graph is the acceleration, and the area is the displacement.', prereqs: ['Reading graphs'], lesson: VELOCITY_GRAPH },
];

export function ensureMotionLessons(db: Db, schoolId: string, chapterId: string, now: number) {
  const byTitle = new Map(db.select().from(concepts).where(and(eq(concepts.schoolId, schoolId), eq(concepts.chapterId, chapterId))).all().map((row) => [row.title, row.id]));
  let position = 900;
  for (const page of PAGES) {
    let conceptId = byTitle.get(page.title) ?? null;
    if (!conceptId && page.id) {
      db.insert(concepts).values({ id: page.id, schoolId, chapterId, title: page.title, description: page.description, sourceClass: null }).run();
      conceptId = page.id;
      byTitle.set(page.title, conceptId);
    }
    if (!conceptId) continue;
    for (const prereqTitle of page.prereqs) {
      const prereqId = byTitle.get(prereqTitle);
      if (!prereqId) continue;
      const exists = db.select().from(conceptPrereqs).where(and(eq(conceptPrereqs.conceptId, conceptId), eq(conceptPrereqs.prereqId, prereqId))).get();
      if (!exists) db.insert(conceptPrereqs).values({ schoolId, conceptId, prereqId }).run();
    }
    const scored: { id: string; content: SaveItem }[] = [
      ...page.lesson.steps.map((step) => ({
        id: step.checkpoint.id,
        content: {
          type: 'mcq' as const, conceptId, prompt: step.checkpoint.prompt, options: step.checkpoint.options,
          answer: step.checkpoint.answer, difficulty: 1, sourceRef: null, explanation: step.checkpoint.explanation, role: 'check' as const,
        },
      })),
      {
        id: page.lesson.faded.itemId,
        content: {
          type: 'short_answer' as const, conceptId, prompt: page.lesson.faded.prompt, difficulty: 2, sourceRef: null,
          acceptedAnswers: page.lesson.faded.answers, explanation: page.lesson.faded.hint, role: 'check' as const,
        },
      },
      {
        id: page.lesson.explainBack.itemId,
        content: {
          type: 'short_answer' as const, conceptId, prompt: page.lesson.explainBack.gap, difficulty: 2, sourceRef: null,
          acceptedAnswers: page.lesson.explainBack.gapAnswers, role: 'check' as const,
        },
      },
      ...page.lesson.flashcards.map((card) => ({
        id: card.id,
        content: {
          type: 'flashcard' as const, conceptId, prompt: card.front, difficulty: 1, sourceRef: null,
          answer: card.back, role: 'check' as const,
        },
      })),
    ];
    for (const row of scored) {
      const content = SaveItemSchema.parse(row.content);
      const saved = { id: row.id, schoolId, chapterId, sessionId: null, conceptId, position, content };
      position += 1;
      if (db.select().from(items).where(eq(items.id, row.id)).get()) {
        db.update(items).set({ content, conceptId }).where(eq(items.id, row.id)).run();
      } else {
        db.insert(items).values(saved).run();
      }
    }
    db.insert(conceptLessons).values({ conceptId, schoolId, body: page.lesson, updatedAt: now }).onConflictDoUpdate({
      target: conceptLessons.conceptId, set: { body: page.lesson, schoolId, updatedAt: now },
    }).run();
  }
}
