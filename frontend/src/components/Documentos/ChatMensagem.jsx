import { useEffect, useState } from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { formatDate } from './utils';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const api = import.meta.env.VITE_API_URL;

const ChatMensagem = ({ item, currentUser }) => {
  const isMe = item.usuario === currentUser;
  const [imagemUrl, setImagemUrl] = useState(null);

  useEffect(() => {
    if (item.tipo === 'arquivo' && item.ehImagem) {
      fetch(`${api}/documentos/${item.idArquivo}/visualizar`, {
        headers: item.headers,
      })
        .then((res) => res.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setImagemUrl(url);
        })
        .catch(() => setImagemUrl(null));
    }
  }, [item]);

  return (
    <div className={`mb-4 px-2 ${isMe ? 'text-right' : 'text-left'}`}>
      <div
        className={`inline-flex flex-col items-start px-3 py-2 rounded-lg whitespace-pre-wrap max-w-xs sm:max-w-md ${
          isMe ? 'bg-green-100 text-black' : 'bg-gray-200 text-gray-800'
        }`}
        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
      >
        {item.tipo === 'arquivo' ? (
          item.ehImagem && imagemUrl ? (
            <Zoom>
              <img
                src={imagemUrl}
                alt={item.nome}
                className="rounded cursor-zoom-in"
                style={{
                  maxWidth: '100%',
                  maxHeight: '280px',
                  objectFit: 'contain',
                }}
              />
            </Zoom>
          ) : (
            <button
              onClick={item.abrir}
              className="underline font-semibold hover:opacity-80 flex items-center gap-1"
            >
              {item.nome} <FaExternalLinkAlt size={12} />
            </button>
          )
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
