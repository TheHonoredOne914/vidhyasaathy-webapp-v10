import { and, eq } from 'drizzle-orm';
import { SaveItemSchema } from '@vidhyasaathy/contracts';
import { NOT_TAUGHT } from '@vidhyasaathy/core/learning';
import type { Db } from './index.ts';
import { chapters, classes, concepts, conceptPrereqs, items, notes, subjects } from './schema.ts';

type Prerequisite = readonly [string, string, readonly [string, string, string], string, number, string];
const MATHS: readonly Prerequisite[] = [
  ['Fractions', 'Which fraction equals 0.5?', ['1/2', '1/5', '5/1'], '0.5 is five tenths, or one half.', 7, 'Fractions and Decimals'],
  ['Integers', 'What is -3 + 5?', ['2', '-8', '8'], 'Start at -3 and move five places right to reach 2.', 7, 'Integers'],
  ['Exponents', 'What is 2³?', ['8', '6', '9'], '2³ means 2 × 2 × 2 = 8.', 7, 'Exponents and Powers'],
  ['Simple equations', 'If x + 3 = 7, what is x?', ['4', '10', '3'], 'Subtract 3 from both sides: x = 4.', 7, 'Simple Equations'],
  ['Substitution', 'What is 2x when x = 3?', ['6', '5', '23'], '2x means 2 multiplied by x: 2 × 3 = 6.', 7, 'Algebraic Expressions'],
];
const GEOMETRY: readonly Prerequisite[] = [
  ['Radius', 'A line segment from a circle’s centre to its boundary is a:', ['Radius', 'Chord not through the centre', 'Tangent'], 'A radius joins the centre to a point on the circle.', 6, 'Understanding Elementary Shapes'],
  ['Right angles', 'A right angle measures:', ['90°', '180°', '45°'], 'A quarter turn is a right angle, measuring 90°.', 6, 'Understanding Elementary Shapes'],
  ['Triangle angles', 'Two angles of a triangle are 60° and 50°. The third is:', ['70°', '110°', '180°'], 'Triangle angles sum to 180°: 180 - 60 - 50 = 70°.', 7, 'The Triangle and its Properties'],
  ['Symmetry', 'Folding a circle along a diameter produces:', ['Two matching halves', 'Two unequal parts', 'A triangle'], 'A diameter is a line of symmetry of a circle.', 6, 'Symmetry'],
  ['Angles on a line', 'Angles forming a straight line add up to:', ['180°', '90°', '360°'], 'A straight angle measures 180°.', 7, 'Lines and Angles'],
];
const MOTION: readonly Prerequisite[] = [
  ['Speed', 'A car covers 20 m in 5 s. Its speed is:', ['4 m/s', '100 m/s', '15 m/s'], 'Speed is distance divided by time: 20/5 = 4 m/s.', 7, 'Motion and Time'],
  ['Time units', 'The SI unit of time is:', ['Second', 'Hour', 'Minute'], 'The SI unit of time is the second.', 7, 'Motion and Time'],
  ['Uniform speed', 'Equal distances in equal time intervals indicate:', ['Uniform speed', 'Increasing speed', 'No motion'], 'Uniform motion covers equal distances in equal intervals.', 7, 'Motion and Time'],
  ['Ratios', 'The ratio of 6 m to 3 m is:', ['2 : 1', '1 : 2', '3 : 1'], 'Divide both parts by 3 to get 2 : 1.', 7, 'Comparing Quantities'],
  ['Reading graphs', 'On a distance-time graph, a horizontal line means:', ['The object is at rest', 'The object is speeding up', 'The object moves at constant non-zero speed'], 'Distance does not change as time passes, so the object is at rest.', 7, 'Motion and Time'],
];
const FORCE: readonly Prerequisite[] = [
  ['Push and pull', 'A push or pull on an object is a:', ['Force', 'Speed', 'Time'], 'A force is a push or a pull.', 8, 'Force and Pressure'],
  ['Force effects', 'A force can change an object’s:', ['Speed, direction or shape', 'Mass in every case', 'Material in every case'], 'A force can change motion or deform an object.', 8, 'Force and Pressure'],
  ['Pressure', 'The same force acts on a smaller area. Pressure:', ['Increases', 'Decreases', 'Must stay the same'], 'Pressure is force per unit area.', 8, 'Force and Pressure'],
  ['Friction', 'Friction usually opposes:', ['Relative motion between surfaces', 'Only gravity', 'Only light'], 'Friction opposes the relative motion or tendency of relative motion of surfaces in contact.', 8, 'Friction'],
  MOTION[0]!,
];
const SOUND: readonly Prerequisite[] = [
  ['Vibration', 'Sound is produced by:', ['Vibrating objects', 'Only hot objects', 'Only transparent objects'], 'A vibrating object produces sound.', 8, 'Sound'],
  ['Medium', 'Sound can travel through:', ['Solids, liquids and gases', 'Vacuum only', 'Air only'], 'Sound needs a material medium, which may be solid, liquid or gas.', 8, 'Sound'],
  ['Pitch', 'Faster vibrations usually produce a:', ['Higher pitch', 'Lower pitch', 'Lower speed of sound in the same air'], 'Pitch depends on the frequency of vibration.', 8, 'Sound'],
  ['Amplitude', 'Larger amplitude of vibration generally makes a sound:', ['Louder', 'Higher in pitch', 'Faster in the same air'], 'Loudness depends on amplitude.', 8, 'Sound'],
  ['Voice', 'The human voice is produced mainly by vibrating:', ['Vocal cords', 'Teeth', 'Lips alone'], 'Air from the lungs makes vocal cords vibrate.', 8, 'Sound'],
];
const LIGHT: readonly Prerequisite[] = [
  ['Reflection', 'Seeing your face in a mirror is due to:', ['Reflection', 'Evaporation', 'Magnetism'], 'A mirror reflects light to your eyes.', 8, 'Light'],
  ['Light path', 'In a uniform transparent medium, light travels in:', ['Straight lines', 'Circles only', 'Random zigzags only'], 'Light travels in straight lines in a uniform medium.', 7, 'Light'],
  ['Normal', 'The normal to a mirror is:', ['Perpendicular to the mirror', 'Along the mirror', 'Parallel to every ray'], 'The normal is at right angles to the reflecting surface.', 8, 'Light'],
  ['Reflection angles', 'At a mirror, the angle of incidence equals the:', ['Angle of reflection', 'Angle between mirror and normal', 'Angle of a full turn'], 'The angles of incidence and reflection are equal.', 8, 'Light'],
  ['Seeing objects', 'We see a book when light from it:', ['Enters our eyes', 'Leaves our eyes', 'Stops at the cover'], 'Light reflected by the book enters the eyes.', 8, 'Light'],
];
const CHEMISTRY: readonly Prerequisite[] = [
  ['Material properties', 'Which material dissolves in water?', ['Common salt', 'Sand', 'Chalk powder'], 'Common salt dissolves to form a solution.', 6, 'Sorting Materials into Groups'],
  ['States', 'Which has a fixed shape and fixed volume?', ['A solid', 'A gas', 'A liquid'], 'Solids have a fixed shape and volume.', 6, 'Sorting Materials into Groups'],
  ['Separation', 'Sand can be separated from water by:', ['Filtration', 'Magnetising the water', 'Melting the sand'], 'A filter retains insoluble sand.', 6, 'Separation of Substances'],
  ['Changes', 'Melting ice is a:', ['Physical change', 'Chemical change producing a new substance', 'Change of element'], 'Ice becomes liquid water without forming a new substance.', 7, 'Physical and Chemical Changes'],
  ['Conduction', 'Metals generally conduct:', ['Heat and electricity', 'Neither heat nor electricity', 'Only light'], 'Metals are generally good conductors of heat and electricity.', 8, 'Materials: Metals and Non-Metals'],
];
const BIOLOGY: readonly Prerequisite[] = [
  ['Cells', 'The basic structural unit of living organisms is the:', ['Cell', 'Organ only', 'Whole body only'], 'Living organisms are made of cells.', 8, 'Cell — Structure and Functions'],
  ['Nucleus', 'Which part of a cell controls many cell activities?', ['Nucleus', 'Cell wall only', 'Vacuole only'], 'The nucleus controls cell activities.', 8, 'Cell — Structure and Functions'],
  ['Chloroplasts', 'Green plant cells contain chlorophyll in:', ['Chloroplasts', 'The nucleus', 'The cell wall'], 'Chloroplasts contain the green pigment chlorophyll.', 8, 'Cell — Structure and Functions'],
  ['Plant transport', 'Roots mainly absorb:', ['Water and minerals', 'Prepared food from soil', 'Only oxygen'], 'Roots absorb water and dissolved minerals.', 7, 'Transportation in Animals and Plants'],
  ['Unicellular life', 'An organism made of one cell is called:', ['Unicellular', 'Multicellular', 'Non-living'], 'A unicellular organism carries out life processes within one cell.', 8, 'Cell — Structure and Functions'],
];
const CIVICS: readonly Prerequisite[] = [
  ['Constitution', 'The Constitution lays down:', ['The basic rules of a country', 'Only weather predictions', 'Only market prices'], 'A constitution defines the basic principles and rules of a country.', 8, 'The Indian Constitution'],
  ['Parliament', 'Members of the Lok Sabha are chosen mainly through:', ['Elections', 'Inheritance', 'Appointment by the army'], 'Citizens elect representatives to the Lok Sabha.', 8, 'Why Do We Need a Parliament?'],
  ['Equality', 'Equality before the law means:', ['The same law applies to all', 'Wealth gives special exemption', 'Officials are above the law'], 'Everyone is equal before the law.', 8, 'Understanding Laws'],
  ['Secularism', 'Indian secularism protects the freedom to:', ['Practise different religions', 'Force everyone into one religion', 'Exclude citizens by religion'], 'The state protects religious freedom and equal treatment.', 8, 'Understanding Secularism'],
  ['Public facilities', 'Safe drinking water is an example of a:', ['Public facility', 'Private luxury only', 'Military rank'], 'Public facilities meet essential needs of the community.', 8, 'Public Facilities'],
];
const ENGLISH: readonly Prerequisite[] = [
  ['Personification', 'In The Ant and the Cricket, the cricket speaks to the ant. Speaking gives the animals:', ['Human qualities', 'A scientific classification', 'A measurement'], 'Giving human qualities to animals is personification.', 8, 'Honeydew: The Ant and the Cricket'],
  ['Poem and speaker', 'The voice speaking in a poem is its:', ['Speaker', 'Publisher', 'Printer'], 'The speaker is the voice expressing the poem’s thoughts.', 8, 'Honeydew: Poetry'],
  ['Repetition', 'Using a word several times can:', ['Emphasise an idea', 'Remove all meaning', 'Always change the author'], 'Repetition draws attention to an idea or feeling.', 8, 'Honeydew: Poetry'],
  ['Imagery', 'Words describing sights and sounds help a reader:', ['Imagine a scene', 'Calculate an angle', 'Identify a chemical'], 'Sensory descriptions create imagery.', 8, 'Honeydew: Poetry'],
  ['Theme', 'The theme of a poem is its:', ['Central idea', 'Number of pages', 'Font size'], 'A theme is the central idea explored in a poem.', 8, 'Honeydew: Poetry'],
];

/** Add only prior-class checks, preserving any already-authored prerequisite bank. */
export function seedGameDiagnostics(db: Db, schoolId: string, timestamp: number) {
  const grade = db.select().from(classes).where(and(eq(classes.schoolId, schoolId), eq(classes.name, '9'))).get();
  if (!grade) return;
  const subjectRows = db.select().from(subjects).where(and(eq(subjects.schoolId, schoolId), eq(subjects.classId, grade.id))).all();
  for (const chapter of db.select().from(chapters).where(eq(chapters.schoolId, schoolId)).all()) {
    const subject = subjectRows.find((row) => row.id === chapter.subjectId);
    if (!subject) continue;
    const targets = db.select().from(concepts).where(eq(concepts.chapterId, chapter.id)).all().filter((row) => row.sourceClass == null || row.sourceClass >= 9);
    if (!targets.length) continue;
    const edges = db.select().from(conceptPrereqs).where(eq(conceptPrereqs.schoolId, schoolId)).all();
    const linked = new Set(edges.filter((edge) => targets.some((target) => target.id === edge.conceptId)).map((edge) => edge.prereqId));
    const existing = db.select().from(items).where(eq(items.schoolId, schoolId)).all().filter((row) => row.content.role === 'diagnostic' && linked.has(row.conceptId));
    if (existing.length >= 5) continue;
    const bank = chapter.title === 'Motion' ? MOTION : chapter.title === 'Sound' ? SOUND : chapter.title.startsWith('Light') ? LIGHT
      : chapter.title === 'Circles' ? GEOMETRY : subject.name === 'Mathematics' ? MATHS : subject.name === 'Physics' ? FORCE
      : subject.name === 'Chemistry' ? CHEMISTRY : subject.name === 'Biology' ? BIOLOGY : subject.name === 'Civics' ? CIVICS : subject.name === 'English' ? ENGLISH : null;
    if (!bank) continue;
    for (const [position, [title, prompt, options, explanation, sourceClass, sourceChapter]] of bank.entries()) {
      const conceptId = `game-prereq:${chapter.id}:${position}`;
      const noteId = `${conceptId}:note`;
      db.insert(concepts).values({ id: conceptId, schoolId, chapterId: chapter.id, title: `Class ${sourceClass}: ${title}`, description: explanation, sourceClass }).onConflictDoNothing().run();
      for (const target of targets) db.insert(conceptPrereqs).values({ schoolId, conceptId: target.id, prereqId: conceptId }).onConflictDoNothing().run();
      db.insert(notes).values({ id: noteId, schoolId, chapterId: chapter.id, title: `Before we start: ${title}`, body: explanation, status: 'published', releaseAt: timestamp - 1, updatedAt: timestamp }).onConflictDoNothing().run();
      db.insert(items).values({ id: `${conceptId}:item`, schoolId, chapterId: chapter.id, conceptId, sessionId: null, position,
        content: SaveItemSchema.parse({ type: 'mcq', conceptId, difficulty: 1, role: 'diagnostic', prompt, options: [...options, NOT_TAUGHT], answer: options[0], explanation,
          sourceRef: { noteId, locator: `NCERT Class ${sourceClass}: ${sourceChapter}` } }) }).onConflictDoNothing().run();
    }
  }
}
