import React from "react";

const AdicionarCampoBtn = ({ onClick, label = "Adicionar campo", disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 mb-3 mx-2 py-2 text-sm rounded-md transition duration-200
        ${disabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-300 text-white hover:bg-green-400'}`}
    >
      {label}
    </button>
  );
};

export default AdicionarCampoBtn;
