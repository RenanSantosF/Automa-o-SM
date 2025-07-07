import React from 'react';
import DocItem from "./DocItem.jsx"


const Sidebar = ({ documentos, onSelecionar, documentoSelecionado }) => {
  return (
    <div className="divide-y divide-gray-200">
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
