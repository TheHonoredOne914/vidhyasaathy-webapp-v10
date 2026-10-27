# Arena game API

Arena stages receive a shared `ArenaApi`:

- `setStats({ label, value })` sets the second footer stat, for example `setStats({ label: 'Correct gates', value: '3' })`.
- `reportResult(correct)` records the action result, increments the streak when `correct` is true, and resets it to zero otherwise.
- `registerPrimary(onCheck)` registers the stage action run by the level's primary button.
