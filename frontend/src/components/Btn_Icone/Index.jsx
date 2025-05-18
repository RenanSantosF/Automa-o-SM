import React from 'react';
import { FaBeer } from 'react-icons/fa'; // Exemplo de ícone, você pode trocar para o ícone que preferir

const IconButton = ({ icon: Icon, onClick, color, size }) => {
  return (
    <button onClick={onClick} style={{ background: 'transparent', border: 'none', padding: '10px', cursor: 'pointer' }}>
      <Icon color={color || "#16a34a"} size={size || 24} /> {/* Tamanho do ícone pode ser ajustado */}
    </button>
  );
};

export default IconButton;
