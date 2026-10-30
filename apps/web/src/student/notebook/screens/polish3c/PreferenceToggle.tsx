export function PreferenceToggle({ on, label, disabled, onChange }: {
  on: boolean; label: string; disabled?: boolean; onChange: (value: boolean) => void;
}) {
  return <button type="button" className={`nb-toggle${on ? ' is-on' : ''}`} role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => { onChange(!on); }} />;
}
