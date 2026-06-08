interface FormRowProps {
  children: React.ReactNode
  columns?: number
  gap?: number
}

export function FormRow({ children, columns = 2, gap = 12 }: FormRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        marginBottom: 16
      }}
    >
      {children}
    </div>
  )
}

interface FormFieldProps {
  label: string
  children: React.ReactNode
  required?: boolean
}

export function FormField({ label, children, required }: FormFieldProps) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: '#374151',
          marginBottom: 6
        }}
      >
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '9px 12px',
        border: '1.5px solid #e5e7eb',
        borderRadius: 8,
        fontSize: 13,
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
        outline: 'none',
        ...props.style
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#7c3aed'
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#e5e7eb'
        props.onBlur?.(e)
      }}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select(props: SelectProps) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        padding: '9px 12px',
        border: '1.5px solid #e5e7eb',
        borderRadius: 8,
        fontSize: 13,
        fontFamily: 'inherit',
        background: 'white',
        cursor: 'pointer',
        outline: 'none',
        boxSizing: 'border-box',
        ...props.style
      }}
    />
  )
}
