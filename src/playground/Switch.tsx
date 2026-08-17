interface SwitchProps {
  /** Names the control for assistive tech; the caller supplies the visible text. */
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Switch({ label, checked, onChange }: SwitchProps) {
  return (
    <label className="control control--switch">
      <span className="control__hidden-label">{label}</span>
      <input
        type="checkbox"
        className="switch__input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span className="switch__value">{checked ? 'true' : 'false'}</span>
    </label>
  )
}
