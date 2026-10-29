const CHOICES = [
  { value: 'sure', label: 'Sure' },
  { value: 'unsure', label: 'Unsure' },
  { value: 'guess', label: 'Guess' },
] as const;

export type ConfidenceChoice = (typeof CHOICES)[number]['value'];

export function ConfidenceChips({ name, value, onChange }: { name: string; value: string; onChange: (value: ConfidenceChoice) => void }) {
  return (
    <fieldset className="confidence-row">
      <legend>How sure are you?</legend>
      {CHOICES.map((choice) => (
        <label key={choice.value} className="confidence-chip">
          <input type="radio" name={name} value={choice.value} checked={value === choice.value} onChange={() => { onChange(choice.value); }} />
          {choice.label}
        </label>
      ))}
    </fieldset>
  );
}
