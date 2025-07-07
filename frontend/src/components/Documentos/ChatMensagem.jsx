import React from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { formatDate } from './utils';

const ChatMensagem = ({ item, currentUser }) => {
  const isMe = item.usuario === currentUser;
  return (
    <div className={`mb-4 ${isMe ? 'text-right' : 'text-left'}`}>
      <div
        className={`inline-block px-4 py-2 rounded-lg break-words whitespace-pre-wrap overflow-hidden max-w-full ${
          isMe ? 'bg-green-100 text-black' : 'bg-gray-200 text-gray-800'
        }`}
      >
        {item.tipo === 'arquivo' ? (
          <button
            onClick={item.abrir}
            className="underline font-semibold hover:opacity-80 flex items-center gap-1"
          >
            {item.nome} <FaExternalLinkAlt size={12} />
          </button>
        ) : (
          <span>{item.texto}</span>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {isMe ? formatDate(item.criado_em) : `${item.usuario} • ${formatDate(item.criado_em)}`}
      </div>
    </div>
  );
};

export default ChatMensagem;
