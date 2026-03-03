interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  id?: string
}

export default function Toggle({ checked, onChange, label, disabled, id }: ToggleProps) {
  const inputId = id ?? `toggle-${Math.random().toString(36).slice(2)}`
  return (
    <label
      htmlFor={inputId}
      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
    >
      <span className="admin-toggle">
        <input
          type="checkbox"
          id={inputId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="admin-toggle-slider" />
      </span>
      {label && (
        <span style={{ fontSize: 14, color: 'var(--admin-text)', fontWeight: 500 }}>{label}</span>
      )}
    </label>
  )
}
