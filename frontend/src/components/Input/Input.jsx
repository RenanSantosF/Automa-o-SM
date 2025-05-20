export default function Input({ type, placeholder, value, onChange }) {
    return (
        <div className="mb-2 flex items-center justify-center w-full">
            <div className="relative w-full">
                <input
                    id="username"
                    name="username"
                    type={type}
                    value={value}
                    placeholder=" "
                    onChange={onChange}
                    className="z-10 w-full border-b border-gray-300 py-1 focus:border-b-2 focus:border-green-600 transition-colors focus:outline-none peer bg-inherit"
                />
                <label
                    htmlFor="username"
                    className="pointer-events-none absolute -top-4 left-0 text-xs transition-all peer-placeholder-shown:top-1 peer-placeholder-shown:text-sm peer-focus:text-xs peer-focus:-top-4 peer-focus:text-green-600"
                >
                    {placeholder}
                </label>
            </div>
        </div>
    );
}
