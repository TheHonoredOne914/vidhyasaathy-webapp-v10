import fs from 'node:fs';
for (const [p, fn] of [
  ['apps/web/src/ui/Field.tsx', (s) => s.replace("type: 'text' | 'email' | 'password' | 'date'", "type: 'text' | 'email' | 'password' | 'date' | 'tel'")],
  ['apps/web/src/setup/RosterForm.tsx', (s) => s.replace('type="tel"', 'type="text"')],
]) {
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  fs.writeFileSync(p, after);
  console.log(p, before === after ? 'unchanged' : 'updated');
}
