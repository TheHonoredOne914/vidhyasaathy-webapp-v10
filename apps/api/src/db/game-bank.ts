/** NCERT Class 9 checkpoint bank. Correct choice and explanations stay server-side. */
import { PORTED_GAME_BANK } from './game-bank-port.ts';

const ORIGINAL_GAME_BANK = [
  { id: 'motion', subject: 'Physics', chapter: 'Motion', questions: [
    ['motion.uniform', 'Uniform motion', 'A runner covers equal distances in equal time intervals. This is:', ['Uniform motion', 'Accelerated motion', 'Circular motion', 'Rest'], 'Uniform motion covers equal distances in equal time intervals.'],
    ['motion.speed', 'Speed & Velocity', 'A cyclist covers 120 m in 20 s. What is the average speed?', ['6 m/s', '2400 m/s', '100 m/s', '0.167 m/s'], 'Average speed is total distance divided by total time: 120/20 = 6 m/s.'],
    ['motion.acceleration', 'Acceleration', 'Velocity changes from 2 m/s to 10 m/s in 4 s. Find acceleration.', ['2 m/s²', '3 m/s²', '8 m/s²', '32 m/s²'], 'Acceleration is (10 - 2)/4 = 2 m/s².'],
    ['motion.equations', 'Equations of motion', 'A body starts from rest with acceleration 2 m/s². Its velocity after 3 s is:', ['6 m/s', '9 m/s', '1.5 m/s', '5 m/s'], 'Use v = u + at: 0 + 2 × 3 = 6 m/s.'],
  ] },
  { id: 'newton', subject: 'Physics', chapter: 'Force and Laws of Motion', questions: [
    ['newton.first-law-inertia', 'Inertia', 'A passenger tends to fall forward when a bus suddenly stops because:', ['The body tends to keep moving', 'Gravity acts forward', 'The seat pushes forward', 'Mass becomes zero'], 'Inertia resists a change in the state of motion.'],
    ['newton.second-law-force', 'Force and acceleration', 'What force accelerates a 3 kg object at 2 m/s²?', ['6 N', '1.5 N', '5 N', '0 N'], 'Force = mass × acceleration = 3 × 2 = 6 N.'],
    ['newton.third-law-reaction', 'Action and reaction', 'Action and reaction forces act on:', ['Different objects', 'The same object', 'Only stationary objects', 'Only the lighter object'], 'The forces are equal and opposite but act on different objects.'],
    ['newton.momentum-conservation', 'Momentum', 'A 2 kg body moves at 3 m/s. Its momentum is:', ['6 kg m/s', '1.5 kg m/s', '5 kg m/s', '9 kg m/s'], 'Momentum is mass × velocity = 2 × 3 = 6 kg m/s.'],
  ] },
  { id: 'matter', subject: 'Chemistry', chapter: 'Matter in Our Surroundings', questions: [
    ['matter.particles', 'Particles of matter', 'Dissolving sugar in water suggests that particles of matter:', ['Have spaces between them', 'Have no mass', 'Stop moving in water', 'Disappear permanently'], 'Sugar particles occupy spaces between water particles.'],
    ['matter.diffusion', 'Diffusion', 'Perfume spreads through a room because gas particles:', ['Move continuously and mix', 'Remain fixed', 'Move only downwards', 'Become larger'], 'Particles move randomly and intermix by diffusion.'],
    ['matter.latent-heat', 'Latent heat', 'During melting at the melting point, absorbed heat mainly:', ['Overcomes attraction between particles', 'Raises temperature continuously', 'Creates new particles', 'Decreases particle energy'], 'Latent heat changes the state without changing the temperature.'],
    ['matter.evaporation', 'Evaporation', 'Evaporation cools a liquid because:', ['Higher-energy particles escape', 'Lower-energy particles escape first', 'All particles stop moving', 'Heat is created'], 'Escaping energetic particles lower the average energy of the remaining liquid.'],
  ] },
  { id: 'cell', subject: 'Biology', chapter: 'The Fundamental Unit of Life', questions: [
    ['cell-membrane-selective-permeability', 'Plasma membrane', 'Which structure selectively controls entry and exit of substances?', ['Plasma membrane', 'Cell wall', 'Nucleus', 'Ribosome'], 'The plasma membrane is selectively permeable.'],
    ['diffusion-concentration-gradient', 'Diffusion', 'Carbon dioxide leaves a cell by diffusion when its concentration is:', ['Higher inside than outside', 'Lower inside than outside', 'Equal everywhere', 'Always zero inside'], 'Diffusion is movement from higher to lower concentration.'],
    ['osmosis-hypotonic', 'Osmosis', 'A cell in a dilute solution initially:', ['Takes in water', 'Loses all water', 'Stops all water movement', 'Produces a new cell wall'], 'Water moves into the cell by osmosis from higher water concentration.'],
    ['cell-organelles-functions', 'Mitochondria', 'Which organelle releases energy used to make ATP?', ['Mitochondrion', 'Golgi apparatus', 'Vacuole', 'Cell wall'], 'Mitochondria release energy during cellular respiration.'],
  ] },
  { id: 'float', subject: 'Physics', chapter: 'Gravitation', questions: [
    ['gravitation.free-fall', 'Free fall', 'Ignoring air resistance, objects falling near Earth have:', ['The same acceleration', 'Acceleration proportional to mass', 'Zero acceleration', 'Constant speed from release'], 'Free-fall acceleration is independent of the falling object’s mass.'],
    ['gravitation.mass-weight', 'Mass and weight', 'On the Moon compared with Earth, an object has:', ['The same mass and less weight', 'Less mass and the same weight', 'The same mass and weight', 'No mass'], 'Mass stays constant; weight depends on gravitational acceleration.'],
    ['gravitation.pressure', 'Pressure', 'For the same thrust, pressure increases when contact area:', ['Decreases', 'Increases', 'Stays the same', 'Becomes infinite'], 'Pressure is thrust divided by area.'],
    ['gravitation.archimedes', 'Buoyancy', 'The buoyant force on an immersed object equals:', ['Weight of displaced fluid', 'Mass of the object', 'Volume of the object alone', 'Weight of the container'], 'Archimedes’ principle relates upthrust to the weight of displaced fluid.'],
  ] },
  { id: 'sound', subject: 'Physics', chapter: 'Sound', questions: [
    ['sound.longitudinal', 'Sound propagation', 'In air, sound travels as:', ['Compressions and rarefactions', 'Light waves', 'A flow of air from source to ear', 'Only transverse waves'], 'Air particles vibrate about their positions, producing longitudinal waves.'],
    ['sound.frequency-pitch', 'Pitch', 'A higher-frequency sound has:', ['Higher pitch', 'Lower pitch', 'Always greater loudness', 'Greater speed in the same air'], 'Pitch depends on frequency, not amplitude.'],
    ['sound.amplitude-loudness', 'Loudness', 'Increasing the amplitude of vibration mainly increases:', ['Loudness', 'Pitch', 'Frequency', 'Speed in the same medium'], 'Loudness depends on the amplitude of vibration.'],
    ['sound.echo', 'Echo', 'An echo returns after 0.2 s. At 340 m/s, the reflecting wall is:', ['34 m away', '68 m away', '170 m away', '680 m away'], 'Sound travels to the wall and back: distance = 340 × 0.2 / 2 = 34 m.'],
  ] },
  { id: 'energy', subject: 'Physics', chapter: 'Work and Energy', questions: [
    ['work.force-displacement', 'Work', 'A 5 N force moves an object 2 m along the force. Work done is:', ['10 J', '2.5 J', '7 J', '0 J'], 'Work = force × displacement along the force = 5 × 2 = 10 J.'],
    ['energy.kinetic', 'Kinetic energy', 'If speed doubles while mass stays constant, kinetic energy becomes:', ['Four times as large', 'Twice as large', 'Half as large', 'Unchanged'], 'Kinetic energy = mv²/2, so doubling speed multiplies it by four.'],
    ['energy.potential', 'Potential energy', 'A 2 kg object is raised 3 m. Take g = 10 m/s². Its gain in potential energy is:', ['60 J', '15 J', '6 J', '30 J'], 'Potential energy gain = mgh = 2 × 10 × 3 = 60 J.'],
    ['energy.conservation', 'Conservation of energy', 'As a freely falling object descends without air resistance:', ['Potential energy becomes kinetic energy', 'Total mechanical energy increases', 'Kinetic energy becomes zero', 'Energy is destroyed'], 'Potential energy decreases while kinetic energy increases by the same amount.'],
  ] },
  { id: 'poly', subject: 'Mathematics', chapter: 'Polynomials', questions: [
    ['poly.degree', 'Degree of a polynomial', 'The degree of 5x³ + 2x² - 7 is:', ['3', '5', '2', '0'], 'The highest power with a non-zero coefficient is 3.'],
    ['poly.value', 'Value of a polynomial', 'For p(x) = x² - 3, what is p(2)?', ['1', '-1', '7', '4'], 'Substitute 2: 2² - 3 = 1.'],
    ['poly.zeroes', 'Zero of a polynomial', 'Which number is a zero of p(x) = x - 4?', ['4', '-4', '0', '1'], 'p(4) = 4 - 4 = 0.'],
    ['poly.factor-theorem', 'Factor theorem', 'If p(2) = 0, which expression is a factor of p(x)?', ['x - 2', 'x + 2', '2x', 'x² + 2'], 'By the factor theorem, p(a) = 0 means x - a is a factor.'],
  ] },
  { id: 'graphs', subject: 'Mathematics', chapter: 'Coordinate Geometry', questions: [
    ['graphs.axes', 'Coordinate axes', 'A point on the y-axis always has:', ['x-coordinate zero', 'y-coordinate zero', 'Equal coordinates', 'Both coordinates negative'], 'On the y-axis the horizontal displacement is zero.'],
    ['graphs.quadrants', 'Quadrants', 'The point (-3, 2) lies in:', ['The second quadrant', 'The first quadrant', 'The third quadrant', 'The fourth quadrant'], 'Negative x and positive y identify the second quadrant.'],
    ['graphs.ordered-pairs', 'Ordered pairs', 'In the point (4, -2), the ordinate is:', ['-2', '4', '2', '-4'], 'The ordinate is the second, or y, coordinate.'],
    ['graphs.distance', 'Coordinates on axes', 'The point (0, -5) is:', ['5 units below the origin', '5 units above the origin', '5 units right of the origin', '5 units left of the origin'], 'Its x-coordinate is zero and its y-coordinate is -5.'],
  ] },
] as const;

export const GAME_BANK = [
  ...ORIGINAL_GAME_BANK,
  ...PORTED_GAME_BANK,
  ...(['force-series', 'chotu-motion'] as const).map((id) => {
    const source = ORIGINAL_GAME_BANK.find((bank) => bank.id === (id === 'force-series' ? 'newton' : 'motion'))!;
    return { ...source, id, questions: source.questions.map(([key, ...question]) => [`${id}.${key.split('.').slice(1).join('.')}`, ...question] as const) };
  }),
];
