export default function Input({type, placeholder, value, onChange}) {
    return (

        <div className="mb-2 flex items-center justify-center w-full ">
            <div className="relative w-full ">
                <input
                    id="username"
                    name="username"
                    type={ type }
                    value={ value }
                    placeholder=""
                    onChange={ onChange }
                    className="w-full border-b border-gray-300 py-1 focus:border-b-2 focus:border-indigo-600 transition-colors focus:outline-none peer bg-inherit"
                />
                <label
                    htmlFor="username"
                    className="absolute -top-4 text-xs left-0 cursor-text peer-focus:text-xs peer-focus:-top-4 transition-all peer-focus:text-indigo-600 peer-placeholder-shown:top-1 peer-placeholder-shown:text-sm"
                >
                    { placeholder }
                </label>
            </div>
        </div>


    )
}