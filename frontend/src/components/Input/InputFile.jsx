export default function InputFile({ onChange, className }) {
  return (
    <input
      type="file"
      onChange={onChange}
      className={`border rounded p-2 text-gray-800 ${className || ''}`}
    />
  );
}
