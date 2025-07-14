import React from 'react';
import DocItem from "./DocItem.jsx"


const Sidebar = ({ documentos, onSelecionar, documentoSelecionado }) => {
  return (
    <div className="divide-y  divide-white gap-[2px] flex p-2 flex-col">
      {documentos.map((doc) => (
        <DocItem
          key={doc.id}
          doc={doc}
          onClick={() => onSelecionar(doc)}
          isActive={documentoSelecionado?.id === doc.id}
        />
      ))}
    </div>
  );
};

export default Sidebar;
