export default function SelectField({
  label,
  value,
  onChange,
  options = [],
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

      <select
        value={value || ''}
        onChange={onChange}
        className="
          w-full bg-[#111]
          border border-gray-600 rounded-md
          px-3 py-2.5
          text-sm
          focus:outline-none focus:border-green-500
        "
      >
        <option value=""></option>

        {options.map((opt) => {
          const valueOpt = typeof opt === 'string' ? opt : opt.value;
          const labelOpt = typeof opt === 'string' ? opt : opt.label;

          return (
            <option key={valueOpt} value={valueOpt}>
              {labelOpt}
            </option>
          );
        })}
      </select>
    </div>
  );
}
