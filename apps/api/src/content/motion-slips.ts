type Family = 'concept_gap' | 'careless' | 'method' | 'guess';
type Slip = { errorType: Family; explanation: string; fix: string };

const gap = (explanation: string, fix: string): Slip => ({ errorType: 'concept_gap', explanation, fix });
const method = (explanation: string, fix: string): Slip => ({ errorType: 'method', explanation, fix });

/** One misconception and one-line fix for every wrong option in the Class 9 Motion practice bank. */
export const MOTION_SLIPS: Record<number, Record<string, Slip>> = {
  1001: {
    '0 and 400 m': gap('This swaps the two measures. The path is the distance, and the start-to-finish change is the displacement.', 'One full round has distance 400 m and displacement 0.'),
    '400 m and 400 m': gap('Distance and displacement are equal only when the motion is straight and does not turn back.', 'A closed round still has a path, but the displacement is zero.'),
    '0 and 0': gap('Finishing at the start does not erase the path the runner took.', 'Count the 400 m track as distance. Displacement is the only zero.'),
  },
  1002: {
    'includes a direction': gap('Direction belongs to displacement and velocity, not to distance.', 'Distance has a size only, so it is a scalar.'),
    'can be negative': gap('A minus sign is a direction. Distance never points backwards.', 'Keep distance positive. Use a sign only for displacement.'),
    'is the same as velocity': gap('Velocity is a rate and it has a direction. Distance is a length.', 'Distance is how much path was covered, not how fast.'),
  },
  1003: {
    '7 m': method('Adding 4 m and 3 m gives the path length, which is the distance.', 'Displacement is the straight line: √(4² + 3²) = 5 m.'),
    '1 m': method('Subtracting the two legs is not a displacement.', 'Use Pythagoras on the 3 m and 4 m legs. The straight line is 5 m.'),
    '12 m': method('Multiplying the two legs does not make a length along the ground.', 'The straight-line displacement is the hypotenuse, 5 m.'),
  },
  1004: {
    'only positive': gap('Displacement has a direction, so the sign can be plus or minus.', 'It is positive, negative, or zero when the finish is the start.'),
    'only zero': gap('Zero displacement happens only when the start and the finish are the same point.', 'A one-way trip has a displacement that is not zero.'),
    'always greater than distance': gap('The straight line cannot be longer than the path that was walked.', 'Distance is longer than displacement, or the two are equal.'),
  },
  1005: {
    '140 m': method('3.5 rounds of a 40 m boundary is the distance, 140 m.', 'Displacement is the diagonal of the square, 10√2 m, about 14.1 m.'),
    '0': gap('Displacement is zero only after a whole number of rounds.', '3.5 rounds ends at the opposite corner, so the displacement is not zero.'),
    '10 m': method('10 m is one side of the field, not the straight line to the opposite corner.', 'The opposite corner is the diagonal, about 14.1 m.'),
  },
  1006: {
    'No, they are always equal': gap('They are equal only for motion in one straight direction without turning back.', 'Any path that returns to the start has distance and zero displacement.'),
    'Only if its speed is zero': gap('Zero speed means the object is not moving, so the distance is also zero.', 'The object can move the whole way and still finish where it started.'),
    'Only on a perfectly straight road': gap('A curve that closes, and a straight out-and-back, both give zero displacement.', 'Look at the start and the finish, not at how straight the road is.'),
  },
  1007: {
    'Both are zero': gap('The bus travelled a road, so the distance is not zero.', 'Distance is the path. Displacement is zero because the bus came home.'),
    'Displacement is larger than distance': gap('A straight-line change cannot be longer than the path.', 'On a return trip the displacement is the smaller one: it is zero.'),
    'Distance is zero and displacement is not': gap('This swaps the two measures.', 'The path is the distance. Coming back makes the displacement zero.'),
  },
  1101: {
    'displacement divided by time': gap('Displacement divided by time is velocity.', 'Speed uses distance divided by time, with no direction.'),
    'mass multiplied by velocity': gap('Mass times velocity is momentum, not speed.', 'Speed is a distance divided by a time.'),
    'time divided by distance': method('That fraction is upside down.', 'Put distance on top and time underneath.'),
  },
  1102: {
    'km/h': method('km/h is a unit people use, but it is not the SI unit.', 'The SI unit of speed is m/s.'),
    'm/s²': gap('m/s² is the SI unit of acceleration.', 'Speed is m/s. The square belongs to acceleration.'),
    's/m': method('Seconds over metres turns the unit upside down.', 'Put metres on top and seconds underneath.'),
  },
  1103: {
    '200 km/h': method('100 multiplied by 2 is 200. Speed does not multiply those two numbers.', 'Divide 100 km by 2 h. The average speed is 50 km/h.'),
    '102 km/h': method('Adding the distance and the time does not give a speed.', 'Divide the distance by the time.'),
    '2 km/h': method('2 h is the time taken, not the speed.', 'Divide 100 km by 2 h.'),
  },
  1104: {
    'is always a larger number': gap('Velocity is not just a bigger speed. It is speed with a direction.', 'On a curved path the speed can stay large while the displacement stays small.'),
    'has no unit': gap('Velocity uses the same unit as speed, and it also names a direction.', 'The unit is still m/s.'),
    'is a scalar': gap('Speed is the scalar. A scalar has no direction.', 'Velocity is the vector, because the direction is part of it.'),
  },
  1105: {
    'constant, because the speed is constant': gap('A steady speed on a curve is not a steady velocity.', 'Velocity changes whenever the direction changes.'),
    'zero': gap('The body is moving, so the speed is not zero.', 'The speed stays constant. The direction is the part that changes.'),
    'equal to its acceleration': gap('Acceleration tells how the velocity changes. It is not the velocity itself.', 'Name the changing direction as a changing velocity.'),
  },
  1106: {
    'equal to its average speed': gap('Average speed uses distance, which is not zero on a return trip.', 'Average velocity uses displacement. A return makes that zero.'),
    'always 10 m/s': method('There is no fixed speed for a return trip.', 'Divide the displacement by the time. The displacement is zero.'),
    'equal to the distance': gap('Distance is a length. Velocity is a length divided by a time.', 'Average velocity is displacement divided by time, and the displacement is zero.'),
  },
  1107: {
    '400 km/h': method('400 km is the distance from the two odometer readings. It still has to be divided by the time.', '400 km / 8 h = 50 km/h.'),
    '2400 km/h': method('2400 km is the final reading, not the distance travelled.', 'Subtract the start reading first: 2400 − 2000 = 400 km, then divide by 8 h.'),
    '8 km/h': method('8 h is the time, not the speed.', 'Divide the 400 km travelled by 8 h.'),
  },
  1108: {
    '10 km/h': method('10 km is the distance. The time is a quarter of an hour, not one hour.', '15 minutes is 0.25 h. 10 / 0.25 = 40 km/h.'),
    '150 km/h': method('Multiplying 10 by 15 mixes kilometres with minutes.', 'Divide 10 km by 0.25 h.'),
    '0.67 km/h': method('Dividing 10 by 15 treats 15 minutes as 15 hours.', 'Change 15 minutes into 0.25 h, then divide.'),
  },
  1201: {
    'distance only': gap('Distance has no direction. Acceleration is about how velocity changes.', 'Velocity is the quantity that changes with time.'),
    'mass': gap('Mass does not appear in the meaning of acceleration.', 'Acceleration is the rate of change of velocity.'),
    'time': gap('Time is what you divide by. It is not the quantity that is changing.', 'The changing quantity is velocity.'),
  },
  1202: {
    'm/s': gap('m/s is the unit of speed and velocity.', 'Acceleration is a change of velocity each second, so the unit is m/s².'),
    'km/h': gap('km/h is a unit of speed, not of acceleration.', 'The SI unit is m/s².'),
    's²/m': method('That unit is upside down.', 'Put metres on top and seconds squared underneath.'),
  },
  1203: {
    'object must be at rest': gap('An object can be moving and still be slowing down.', 'Rest means the velocity is zero. Negative acceleration means the velocity is decreasing.'),
    'distance is zero': gap('Distance does not become zero just because the object slows down.', 'Look at the velocity. If it is falling, the acceleration is negative.'),
    'speed has no direction': gap('That sentence describes speed, not the sign of acceleration.', 'The negative sign means the velocity is decreasing.'),
  },
  1204: {
    's = ut + ½at²': gap('That is the second equation. It finds a distance when the time is known.', 'The first equation is v = u + at.'),
    'v² = u² + 2as': gap('That is the third equation. It hides the time.', 'The first equation relates velocity and time: v = u + at.'),
    'F = ma': gap('F = ma is a force law. It is not one of the three equations of motion.', 'The equation of motion asked for here is v = u + at.'),
  },
  1205: {
    '4 m/s²': method('(80 − 60) / 5 keeps the speeds in km/h and drops the minus sign.', 'Change both speeds to m/s, then a = (v − u) / t is about −1.11 m/s².'),
    '-4 m/s²': method('(60 − 80) / 5 = −4 only while the speeds stay in km/h.', 'Convert 80 km/h and 60 km/h into m/s before dividing by 5 s.'),
    '1.11 m/s²': method('The size is right, but the bus is slowing down.', 'Keep the minus sign: about −1.11 m/s².'),
  },
  1206: {
    '4 m/s²': method('40 / 10 treats 40 km/h as metres per second and 10 minutes as 10 seconds.', '40 km/h is about 11.1 m/s and 10 minutes is 600 s, so a is about 0.0185 m/s².'),
    '0.67 m/s²': method('40 / 60 still mixes km/h with minutes.', 'Convert to m/s and seconds first, then divide.'),
    '0': gap('The train did speed up, from rest to 40 km/h.', 'a = v / t after both quantities are in m/s and s.'),
  },
  1207: {
    '25 m': method('25 m is only the ut part, 5 m/s × 5 s.', 'Add ½at² as well: 25 + 12.5 = 37.5 m.'),
    '135 m': method('This treats 18 km/h and 36 km/h as if they were already m/s.', '18 km/h is 5 m/s and 36 km/h is 10 m/s, so a = 1 m/s² and s = 37.5 m.'),
    '7.5 m': method('This uses a piece of the formula and drops the rest.', 's = ut + ½at² = 5×5 + ½×1×25 = 37.5 m.'),
  },
  1208: {
    'zero': gap('Zero at the top is the velocity for an instant, not the acceleration.', 'Gravity is still about 9.8 m/s² downward.'),
    'upward': gap('The stone was thrown upward, but gravity does not reverse.', 'The acceleration stays downward for the whole flight.'),
    'equal to its speed': gap('The speed is zero for an instant. The acceleration is not copying that speed.', 'Keep the acceleration at about 9.8 m/s² downward.'),
  },
  1401: {
    '60 m/s': method('60 m is the distance on the graph. It has not been divided by the time.', 'Speed is the slope: 60 m / 10 s = 6 m/s.'),
    '10 m/s': method('10 s is the time read from the axis, not the slope.', 'Divide the rise, 60 m, by the run, 10 s.'),
    '600 m/s': method('Multiplying 60 by 10 is not a slope.', 'Divide 60 m by 10 s.'),
  },
  1402: {
    '8 m': method('8 m/s is the height of the line, not the area under it.', 'Distance is the rectangle: 8 m/s × 5 s = 40 m.'),
    '13 m': method('Adding 8 and 5 mixes a speed with a time.', 'Multiply 8 m/s by 5 s.'),
    '1.6 m': method('Dividing 8 by 5 gives a rate of change, not a distance.', 'The area under this flat line is 8 × 5 = 40 m.'),
  },
  1403: {
    'speed': gap('Speed is the slope of a distance-time graph.', 'On a velocity-time graph the slope is acceleration.'),
    'distance': gap('Distance is the area under a velocity-time graph, not the slope.', 'Read the slope as acceleration.'),
    'the time only': gap('Time is the horizontal axis. The slope is a change divided by time.', 'The slope is acceleration.'),
  },
  1404: {
    '36 m/s': method('36 is v². The question asks for the speed, v.', 'v² = 0 + 2×2×9 = 36, so v = 6 m/s.'),
    '18 m/s': method('2 × 9 leaves out the factor of 2 in 2as and skips the square root.', 'v² = 2as = 36, so v = 6 m/s.'),
    '4.5 m/s': method('9 / 2 is not the equation.', 'Use v² = u² + 2as with u = 0, then take the square root.'),
  },
  1405: {
    '12 m': method('4 × 3 is at, which is not the distance when the start speed is zero.', 's = ½at² = ½×4×9 = 18 m.'),
    '36 m': method('4 × 9 is at² without the half.', 'Halve at²: ½ × 4 × 9 = 18 m.'),
    '6 m': method('This keeps only a fragment of ½at².', 's = ut + ½at² = 0 + ½×4×3² = 18 m.'),
  },
  1406: {
    'speed and velocity are both constant': gap('The speed is constant, but the direction keeps changing, so the velocity is not constant.', 'Uniform circular motion has steady speed and changing velocity.'),
    'the acceleration is zero': gap('A changing direction means the velocity is changing, so there is an acceleration.', 'The acceleration points toward the centre.'),
    'the displacement equals the circumference': gap('The circumference is the distance along the circle.', 'After one full turn the displacement is zero, because the start and the finish match.'),
  },
};
