import { fieldClass } from './Field';
import { Select } from './Select';

export function SelectField({
  label,
  name,
  value,
  onChange,
  error,
  options,
  placeholder,
  id,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  options: { value: string; label: string }[];
  placeholder: string;
  id?: string;
}) {
  const fieldId = id ?? name;
  const errorId = `${fieldId}-error`;
  return (
    <div className="grid gap-1">
      <label htmlFor={fieldId} className="font-semibold">{label}</label>
      <Select
        id={fieldId}
        name={name}
        value={value}
        {...(error ? { 'aria-invalid': true as const, 'aria-describedby': errorId } : {})}
        onChange={(event) => { onChange(event.target.value); }}
        className={fieldClass}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
      {error ? <p id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}
