// Libraries
import { Check, Eye, EyeOff, LockKeyhole, X } from 'lucide-react'
import { useMemo, useState } from 'react'

// Shared password input and strength feedback
export default function PasswordField({ label = 'Password', value, onChange, placeholder = '••••••••', required = true }) {
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(false)
  // Password rules used by the live meter
  const rules = useMemo(() => [
    { label: 'At least 8 characters', passed: value.length >= 8 },
    { label: 'Contains a letter', passed: /[A-Za-z]/.test(value) },
    { label: 'Contains a number', passed: /\d/.test(value) },
    { label: 'Uses uppercase and lowercase letters', passed: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { label: 'Contains a special character (@ $ ! % * ? &) — required', passed: /[@$!%*?&]/.test(value) },
    { label: '12+ characters (recommended)', passed: value.length >= 12, optional: true },
  ], [value])
  const passedCount = rules.filter((rule) => rule.passed).length
  const isStrong = rules.every((rule) => rule.passed)
  const strengthLabel = !value
    ? 'Start typing'
    : isStrong
      ? 'Strong'
      : passedCount <= 2
        ? 'Weak'
        : passedCount <= 4
          ? 'Fair'
          : 'Good'

  return (
    <div className="field">
      <label>{label}</label>
      <div className="input-wrap">
        <LockKeyhole size={17} />
        <input
          className="has-icon has-eye"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(Boolean(value))}
          placeholder={placeholder}
          required={required}
          aria-describedby={`${label.replace(/\s+/g, '-').toLowerCase()}-strength`}
        />
        <button className="eye" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <div className={`password-strength strength-${strengthLabel.toLowerCase().replace(' ', '-')}`} id={`${label.replace(/\s+/g, '-').toLowerCase()}-strength`}>
        <div className="password-strength-heading">
          <div className="password-meter" aria-hidden="true">
            {rules.map((rule) => <span className={rule.passed ? 'passed' : ''} key={rule.label} />)}
          </div>
          <strong>{strengthLabel}</strong>
        </div>
        {(active || value) && (
          <ul className="password-rules" aria-live="polite">
            {rules.map((rule) => (
              <li className={rule.passed ? 'passed' : rule.optional ? 'recommended' : 'missing'} key={rule.label}>
                {rule.passed ? <Check size={13} /> : <X size={13} />}
                <span>{rule.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
