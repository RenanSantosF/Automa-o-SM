import React from 'react';
import { FaBeer } from 'react-icons/fa'; // Exemplo de ícone, você pode trocar para o ícone que preferir

const IconButton = ({ icon: Icon, onClick, color, size, tooltip }) => {
  return (
    <button
      onClick={onClick}
      title={tooltip} // <-- mensagem ao passar o mouse
      style={{
        background: 'transparent',
        border: 'none',
        padding: '10px',
        cursor: 'pointer',
      }}
    >
      <Icon color={color || '#16a34a'} size={size || 24} />
    </button>
  );
};

export default IconButton;
