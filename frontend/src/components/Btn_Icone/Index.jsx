import React from 'react';
import { FaBeer } from 'react-icons/fa'; // Exemplo de ícone, você pode trocar para o ícone que preferir

const IconButton = ({ icon: Icon, onClick }) => {
  return (
    <button onClick={onClick} style={{ background: 'transparent', border: 'none', padding: '10px', cursor: 'pointer' }}>
      <Icon color="#4f46e5" size={24} /> {/* Tamanho do ícone pode ser ajustado */}
    </button>
  );
};

export default IconButton;
