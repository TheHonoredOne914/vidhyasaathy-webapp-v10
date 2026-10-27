import { useState, type ReactNode } from 'react';
import { Input } from './Input';

export const fieldClass = 'vs-control w-full';

export function Field({
  label,
  name,
  type,
  value,
  onChange,
  error,
  hint,
  autoComplete,
  inputMode = 'text',
  maxLength,
  spellCheck = true,
  autoCapitalize = 'off',
  id,
  placeholder,
  reveal = false,
  icon = null,
  className = '',
}: {
  label: string;
  name: string;
  type: 'text' | 'email' | 'password' | 'date';
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  hint: string | null;
  autoComplete: string;
  inputMode?: 'text' | 'numeric' | 'email';
  maxLength?: number;
  spellCheck?: boolean;
  autoCapitalize?: 'off' | 'characters';
  id?: string;
  placeholder?: string;
  reveal?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  const fieldId = id ?? name;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  const inputType = type === 'password' && reveal && shown ? 'text' : type;
  return (
    <div className={`grid gap-1 ${className}`.trim()}>
      <label htmlFor={fieldId} className="font-semibold">{label}</label>
      {hint ? <p id={hintId} className="text-navy">{hint}</p> : null}
      <div className="field-box">
        {icon ? <span className="field-icon">{icon}</span> : null}
        <Input
          id={fieldId}
          name={name}
          type={inputType}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          spellCheck={spellCheck}
          autoCapitalize={autoCapitalize}
          {...(placeholder ? { placeholder } : {})}
          {...(error ? { 'aria-invalid': true as const } : {})}
          {...(describedBy ? { 'aria-describedby': describedBy } : {})}
          {...(maxLength === undefined ? {} : { maxLength })}
          onChange={(event) => { onChange(event.target.value); }}
          className=""
        />
        {type === 'password' && reveal ? (
          <button type="button" className="reveal-btn" aria-label={shown ? 'Hide characters' : 'Show characters'} onClick={() => { setShown((current) => !current); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        ) : null}
      </div>
      {error ? <p id={errorId} role="alert" className="text-midnight">{error}</p> : null}
    </div>
  );
}
