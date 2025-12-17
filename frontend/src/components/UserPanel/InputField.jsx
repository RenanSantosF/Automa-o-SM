export default function InputField({
  label,
  value,
  onChange,
  type = 'text',
  className = '',
}) {
  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <div className={`relative ${className}`}>
      <label
        className={`absolute left-3 transition-all text-xs pointer-events-none
          ${
            hasValue
              ? '-top-2 bg-[#1c1c1c] px-1 text-green-400'
              : 'top-1/2 -translate-y-1/2 text-gray-400'
          }`}
      >
        {label}
      </label>

      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        className="
          w-full bg-[#111]
          border border-gray-600 rounded-md
          px-3 py-2.5
          text-sm
          focus:outline-none focus:border-green-500
        "
      />
    </div>
  );
}
