import { SaveItemSchema, type LearningModule } from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/index.ts';
import { concepts, items } from '../db/schema.ts';

type Topic = { match: RegExp; name: string; idea: string; example: string; explore: string; repair: string; prompt: string; options: string[]; answer: string };
// NCERT Science IX ch. Motion and Mathematics IX ch. Coordinate Geometry.
// Distractors reflect path/start-end confusion, inverted ratios and reversed coordinate order.
const motion: Topic[] = [
  { match: /distance|displacement/i, name: 'Distance and displacement',
    idea: 'Distance is the length of the actual path travelled. Displacement describes the shortest distance from the initial to the final position, with direction.',
    example: 'Walk 3 m east and then 3 m west. The path totals 6 m, but the final position is the starting position, so displacement is 0 m.',
    explore: 'Draw a straight track. Mark a start, move right three spaces and left three spaces. Compare the whole path with the arrow from start to finish.',
    repair: 'A return journey adds to distance. It can cancel displacement because displacement compares only start and finish.',
    prompt: 'A student walks 5 m east and 5 m west to the starting point. What are distance and displacement?',
    options: ['10 m and 0 m', '0 m and 10 m', '5 m and 5 m', '10 m and 10 m'], answer: '10 m and 0 m' },
  { match: /speed|velocity/i, name: 'Speed and velocity',
    idea: 'Average speed is total distance divided by total time. Average velocity is displacement divided by total time and has direction.',
    example: 'A cyclist covers 60 m in 12 s. Average speed = 60 / 12 = 5 m/s. A direction is needed to describe velocity.',
    explore: 'Make a time-distance table: (0 s, 0 m), (2 s, 10 m), (4 s, 20 m). Plot the points and compare equal-time distances.',
    repair: 'Divide distance by time, not time by distance. Use totals across a whole journey rather than averaging speeds without checking the times.',
    prompt: 'A runner travels 100 m in 20 s. What is the average speed?',
    options: ['5 m/s', '0.2 m/s', '2000 m/s', '80 m/s'], answer: '5 m/s' },
  { match: /acceleration/i, name: 'Acceleration',
    idea: 'Acceleration is the change in velocity per unit time: a = (v - u) / t. For uniform acceleration, v = u + at.',
    example: 'Velocity increases from 2 m/s to 10 m/s in 4 s. The change is 8 m/s and acceleration is 8 / 4 = 2 m/s squared.',
    explore: 'Plot velocity against time for (0 s, 2 m/s), (2 s, 6 m/s), (4 s, 10 m/s). Compare the change over each equal interval.',
    repair: 'Acceleration depends on change in velocity, not final velocity alone. Subtract the initial velocity before dividing by time.',
    prompt: 'Velocity changes from 4 m/s to 12 m/s in 4 s. Find acceleration.',
    options: ['2 m/s squared', '3 m/s squared', '8 m/s squared', '32 m/s squared'], answer: '2 m/s squared' },
  { match: /graph|uniform/i, name: 'Motion graphs',
    idea: 'On a distance-time graph, time is on the horizontal axis and distance on the vertical axis. A horizontal segment means no change in distance; a steeper straight segment means greater speed.',
    example: 'Distance readings 0 m, 4 m, 8 m at 0 s, 2 s, 4 s give equal distances in equal intervals. Speed is 4 / 2 = 2 m/s.',
    explore: 'Plot (0, 0), (2, 4), (4, 8). Then compare with (0, 0), (2, 8), (4, 16). Label seconds and metres before comparing slopes.',
    repair: 'The height of a distance-time graph is distance, not speed. Compare change in distance over change in time.',
    prompt: 'What does a horizontal segment on a distance-time graph show?',
    options: ['The object is at rest', 'The object accelerates', 'The object has zero distance from the origin', 'The object moves at increasing speed'], answer: 'The object is at rest' },
  { match: /equation|uniform.*accelerat/i, name: 'Equations of uniformly accelerated motion',
    idea: 'For motion along a straight line with uniform acceleration, v = u + at, s = ut + (1/2)at squared, and v squared - u squared = 2as. Here u is initial velocity, v is final velocity, a is acceleration, t is time, and s is displacement. The area under a velocity-time graph gives displacement.',
    example: 'A bicycle starts from rest and accelerates uniformly at 2 m/s squared for 3 s. With u = 0, displacement s = 0 + (1/2) x 2 x 3 squared = 9 m. Its final velocity is 6 m/s.',
    explore: 'Draw the velocity-time line from (0 s, 0 m/s) to (3 s, 6 m/s). Find the triangular area: (1/2) x 3 x 6 = 9 m. Compare it with the equation result.',
    repair: 'Use these equations only for uniform acceleration. In s = ut + (1/2)at squared, square time before multiplying; final velocity multiplied by time does not give displacement when velocity changes.',
    prompt: 'An object starts from rest with uniform acceleration 2 m/s squared. How far does it move in 3 s?',
    options: ['9 m', '6 m', '18 m', '3 m'], answer: '9 m' },
  { match: /circular/i, name: 'Uniform circular motion',
    idea: 'In uniform circular motion, an object moves along a circular path at constant speed. Its direction changes continuously, so its velocity changes and the motion is accelerated. In one revolution it travels a distance equal to the circumference.',
    example: 'A runner completes one lap of a circular track of circumference 200 m in 40 s at constant speed. Speed is 200 / 40 = 5 m/s. Displacement after the complete lap is zero.',
    explore: 'Draw a circle and mark four equally spaced positions. At each point draw an arrow along the direction of travel. Compare the directions even when each arrow has the same length.',
    repair: 'Constant speed does not always mean constant velocity. Velocity includes direction, which changes along a circular path.',
    prompt: 'An object moves at constant speed around a circle. Which statement is correct?',
    options: ['Its velocity changes because its direction changes', 'Its velocity is constant because its speed is constant', 'It has no acceleration', 'Its distance is zero after one complete lap'], answer: 'Its velocity changes because its direction changes' },
];
const geometry: Topic[] = [
  { match: /axis|axes|cartesian|plane/i, name: 'Cartesian axes',
    idea: 'Two perpendicular number lines form the Cartesian plane. The horizontal line is the x-axis, the vertical line is the y-axis, and their intersection is the origin (0, 0).',
    example: 'For (3, 2), move 3 units right from the origin, then 2 units up. The first number is the x-coordinate or abscissa.',
    explore: 'Draw perpendicular axes, label the origin and mark (3, 2) and (2, 3). Notice that reversing the coordinates changes the point.',
    repair: 'Read the x-coordinate first and the y-coordinate second. Do not swap horizontal and vertical movement.',
    prompt: 'What are the coordinates of the origin?', options: ['(0, 0)', '(1, 1)', '(0, 1)', '(1, 0)'], answer: '(0, 0)' },
  { match: /quadrant|sign/i, name: 'Quadrants',
    idea: 'The axes divide the plane into four quadrants. Coordinate signs are (+, +), (-, +), (-, -), (+, -) in quadrants I, II, III and IV respectively. Points on axes are in no quadrant.',
    example: 'The point (-3, 2) is left of the y-axis and above the x-axis, so it lies in quadrant II.',
    explore: 'Plot (2, 3), (-2, 3), (-2, -3), (2, -3). Compare their signs and positions around the origin.',
    repair: 'A negative x-coordinate means left, not down. A negative y-coordinate means down. Check both signs before choosing a quadrant.',
    prompt: 'In which quadrant does (-4, 3) lie?', options: ['II', 'I', 'III', 'IV'], answer: 'II' },
  { match: /point|coordinate|plot|abscissa|ordinate/i, name: 'Plotting ordered pairs',
    idea: 'A point is located by an ordered pair (x, y). The abscissa x gives horizontal position and the ordinate y gives vertical position. On the y-axis x = 0; on the x-axis y = 0.',
    example: 'For (0, -4), horizontal movement is zero and vertical movement is 4 units down. The point is on the negative y-axis.',
    explore: 'Plot (4, 0), (0, 4), (-4, 0), (0, -4). State which coordinate vanishes on each axis.',
    repair: 'A zero coordinate does not always mean the origin. Both coordinates must be zero for the origin.',
    prompt: 'Where does the point (0, -5) lie?', options: ['On the negative y-axis', 'On the negative x-axis', 'In quadrant III', 'At the origin'], answer: 'On the negative y-axis' },
];
export interface ModuleBank { modules: LearningModule[]; keys: Map<string, { accepted: string[]; repair: string }> }
const kinds = ['concept', 'guided_example', 'explorer', 'practice', 'repair', 'revision'] as const;

export function moduleBank(db: Db, schoolId: string, chapter: { id: string; subjectId: string; title: string }): ModuleBank {
  const rows = db.select().from(concepts).where(and(eq(concepts.schoolId, schoolId), eq(concepts.chapterId, chapter.id))).all()
    .filter((row) => row.sourceClass == null || row.sourceClass >= 9);
  const allItems = db.select().from(items).where(and(eq(items.schoolId, schoolId), eq(items.chapterId, chapter.id))).all();
  const topics = /^motion$/i.test(chapter.title) ? motion : /coordinate geometry|cartesian/i.test(chapter.title) ? geometry : [];
  const keys: ModuleBank['keys'] = new Map();
  const modules: LearningModule[] = [];
  const units: { topic: Topic | undefined; row: typeof concepts.$inferSelect | undefined }[] = topics.length ? topics.map((topic) => ({ topic, row: rows.find((row) => topic.match.test(row.title)) ?? rows[0] }))
    : rows.map((row) => ({ topic: undefined, row }));
  if (!units.length) units.push({ topic: undefined, row: undefined });
  for (const [index, { topic, row }] of units.entries()) {
    const conceptId = row?.id ?? `${chapter.id}:overview`;
    const objective = topic ? `Understand ${topic.name.toLowerCase()}.` : `Explain ${row?.title ?? chapter.title} using the chapter material.`;
    const idea = topic?.idea ?? row?.description ?? `Open the NCERT chapter ${chapter.title}. Read its introduction and identify the main ideas before continuing.`;
    const questions: NonNullable<LearningModule['questions']> = [];
    if (topic) {
      const id = `${chapter.id}:topic:${index}:check`;
      questions.push({ id, prompt: topic.prompt, options: topic.options });
      keys.set(id, { accepted: [topic.answer], repair: topic.repair });
    } else {
      for (const item of allItems.filter((item) => item.conceptId === conceptId).slice(0, 5)) {
        const parsed = SaveItemSchema.safeParse(item.content);
        if (!parsed.success) continue;
        const value = parsed.data;
        if (value.type !== 'mcq' && value.type !== 'short_answer') continue;
        questions.push({ id: item.id, prompt: value.prompt, ...(value.type === 'mcq' ? { options: value.options } : {}) });
        keys.set(item.id, { accepted: value.type === 'mcq' ? [value.answer] : value.acceptedAnswers,
          repair: value.explanation ?? idea });
      }
    }
    const content = {
      concept: idea,
      guided_example: topic?.example ?? `${idea}\nRead a worked example from the chapter. Write the given information, identify the idea used, and justify each step.`,
      explorer: topic?.explore ?? `Use the examples in ${chapter.title}. Change one feature, predict what will happen and check the prediction against the chapter.`,
      practice: 'Try one question at a time. Your answer is checked on the server; use the feedback to choose what to revisit.',
      repair: topic?.repair ?? `Revisit the definition and compare it with your attempt. ${idea}`,
      revision: `Cover your notes. Explain the idea in your own words, then recall one example. Check your explanation against this cue: ${idea}`,
    };
    for (const type of kinds) modules.push({ id: `${chapter.id}:topic:${index}:${type}`, chapterId: chapter.id,
      subjectId: chapter.subjectId, conceptId, type, objective, content: content[type],
      // Learning Mode slide shape ported from dhruv-model's slide-stage: one idea,
      // a short hook, a few grounded bullet lines, then a recall cue.
      ...(type === 'concept' || type === 'guided_example' ? { slides: [{
        id: `${chapter.id}:topic:${index}:${type}:slide`, title: topic?.name ?? row?.title ?? chapter.title,
        kicker: type === 'concept' ? 'Start with one idea' : 'Follow the worked steps',
        bullets: content[type].split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3), note: objective,
      }] } : {}),
      ...(type === 'practice' || type === 'repair' || type === 'revision' ? { questions } : {}) });
  }
  return { modules, keys };
}

export function scoreAnswer(bank: ModuleBank, moduleId: string, questionId: string, answer: string) {
  const module = bank.modules.find((row) => row.id === moduleId);
  const key = bank.keys.get(questionId);
  if (!key || !module?.questions?.some((question) => question.id === questionId)) return null;
  const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
  const notTaught = normalize(answer) === normalize("Haven't learned this yet");
  const correct = !notTaught && key.accepted.some((value) => normalize(value) === normalize(answer));
  return { correct, notTaught, word: notTaught ? 'New' : correct ? 'Mastered' : "Let's fix this",
    feedback: notTaught ? 'This idea is new. Start with the concept and guided example; there is no penalty.'
      : correct ? 'That follows the chapter idea. Try recalling the method once more.' : key.repair,
    repairModuleId: bank.modules.find((row) => row.type === 'repair' && row.id.split(':topic:')[1]?.split(':')[0] === module.id.split(':topic:')[1]?.split(':')[0])?.id };
}
