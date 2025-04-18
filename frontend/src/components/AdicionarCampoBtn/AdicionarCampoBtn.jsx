import React from "react";

const AdicionarCampoBtn = ({ onClick, label = "Adicionar campo" }) => {
  return (
    <button
      onClick={onClick}
      className="m-1 cursor-pointer px-2 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-600 transition"
    >
      {label}
    </button>
  );
};

export default AdicionarCampoBtn;
