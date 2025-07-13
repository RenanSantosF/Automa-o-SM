import React, { useState, useRef, useEffect } from 'react';
import { formatDate } from './utils';
import { MdCheckCircle, MdCancel, MdSend, MdAttachMoney } from 'react-icons/md';
import { MoreVertical, Trash2 } from 'lucide-react';
import { useLogin } from '../../Contexts/LoginContext';
import { motion, AnimatePresence } from 'framer-motion';

const DocItem = ({ doc, onClick, isActive }) => {
  const { userData } = useLogin();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickFora = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const rawStatus = doc.status || '';
  const status = rawStatus.toLowerCase();

  const formatStatus = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const getStatusBadge = () => {
    switch (status) {
      case 'enviado':
        return {
          label: 'Enviado',
          className: 'bg-blue-100 text-blue-700',
          icon: <MdSend size={16} />,
        };
      case 'aprovado':
        return {
          label: 'Aprovado',
          className: 'bg-green-100 text-green-700',
          icon: <MdCheckCircle size={16} />,
        };
      case 'saldo_liberado':
        return {
          label: 'Saldo Liberado',
          className: 'bg-yellow-100 text-yellow-900',
          icon: <MdAttachMoney size={16} />,
        };
      case 'reprovado':
        return {
          label: 'Reprovado',
          className: 'bg-red-100 text-red-700',
          icon: <MdCancel size={16} />,
        };
      default:
        return {
          label: formatStatus(rawStatus),
          className: 'bg-gray-100 text-gray-600',
          icon: null,
        };
    }
  };

    function formatDateBr(dataStr) {
    const [year, month, day] = dataStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const badge = getStatusBadge();

  const handleDelete = async () => {
    const precisaSenha = ['aprovado', 'saldo_liberado'].includes(status);
    let autorizado = true;

    if (precisaSenha) {
      const senha = prompt('Este documento exige uma senha para ser deletado.\nDigite a senha:');
      if (senha !== '985509') {
        alert('Senha incorreta. A exclusão foi cancelada.');
        autorizado = false;
      }
    }

    if (!autorizado) return;

    const confirmado = window.confirm(`Tem certeza que deseja deletar o documento "${doc.nome}"?`);
    if (!confirmado) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/documentos/${doc.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error();
      alert('Documento deletado com sucesso.');
      window.location.reload(); // ou chame fetchDocumentos() externamente
    } catch (err) {
      alert('Erro ao deletar o documento.');
      console.error(err);
    }
  };

  const naoVisualizadas = (doc.comentarios_rel || []).filter(
    (comentario) => !comentario.visualizado_por?.includes(userData.id)
  ).length;

  const naoVisualizadasArquivos = (doc.arquivos || []).filter(
  (arquivo) => !arquivo.visualizado_por?.includes(userData.id)
).length;

const totalNaoVisualizadas = naoVisualizadas + naoVisualizadasArquivos;

  // Combina arquivos e comentários, ordenados por data
  const itensChat = [...(doc.arquivos || []), ...(doc.comentarios_rel || [])]
    .map((item) => {
      if (item.nome_arquivo) {
        return {
          id: `arq-${item.id}`,
          tipo: 'arquivo',
          texto: '📎 Arquivo enviado',
          criado_em: item.criado_em,
        };
      } else {
        return {
          id: `com-${item.id}`,
          tipo: 'comentario',
          texto: item.texto,
          criado_em: item.criado_em,
        };
      }
    })
    .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));

  return (
    <div
      className={`w-full flex justify-between items-center gap-2 transition relative ${
        isActive ? 'bg-green-50 border-l-4 border-green-500' : 'hover:bg-green-100'
      }`}
    >
      <button
        onClick={onClick}
        className="cursor-pointer flex-1 px-4 py-3 text-left flex flex-col gap-1"
      >
        {/* Cabeçalho: Nome + CTe + Status */}
        <div className="flex justify-between items-center w-full gap-2">
          {/* Texto limitado com tooltip */}
          <div
            className="text-sm  text-gray-600 font-semibold truncate max-w-[300px]"
            title={`${doc.nome} ${
              doc.data_do_malote ? `+ Malote ${formatDateBr(doc.data_do_malote)}` : ''
            } CTe ${doc.placa}`}
          >
            {doc.nome}
            {doc.data_do_malote && (
              <span className="text-gray-600 font-semibold"> + Malote {formatDateBr(doc.data_do_malote)}</span>
            )}
            <span className="text-gray-600 font-semibold" > | CTe {doc.placa}</span>
          </div>

          {/* Status badge sem quebra de linha */}
          <div
            className={`text-[11px] font-medium whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full shadow-sm ${badge.className}`}
          >
            {badge.icon}
            {badge.label}
          </div>
        </div>

        {/* Última mensagem + horário */}
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div
            className="truncate max-w-[80%]"
            title={
              doc.comentarios_rel?.length > 0
                ? doc.comentarios_rel[doc.comentarios_rel.length - 1].texto
                : ''
            }
          >
            {itensChat.length > 0
              ? itensChat[itensChat.length - 1].texto.slice(0, 50) +
                (itensChat[itensChat.length - 1].texto.length > 50 ? '...' : '')
              : 'Sem mensagens'}
          </div>

          <div className="whitespace-nowrap text-gray-400 text-xs">
            {doc.comentarios_rel?.length > 0
              ? new Date(
                  doc.comentarios_rel[doc.comentarios_rel.length - 1].criado_em
                ).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </div>
        </div>
      </button>

      {/* Contador de não visualizadas */}
      {totalNaoVisualizadas  > 0 && (
        <span className=" text-[10px] text-white bg-green-400 rounded-full px-2 py-0.5">
          {totalNaoVisualizadas }
        </span>
      )}

      {/* Menu de ações */}
      <div className="relative pr-3" ref={menuRef}>
        <button
          onClick={() => setMenuAberto((prev) => !prev)}
          className="cursor-pointer p-1 text-gray-600 hover:text-black"
        >
          <MoreVertical size={20} />
        </button>

        <AnimatePresence>
          {menuAberto && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute right-3 top-8 z-20 bg-white border shadow-md rounded-md overflow-hidden w-44"
            >
              <button
                onClick={handleDelete}
                className="cursor-pointer w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 size={16} />
                Deletar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    // <div
    //   className={`w-full flex justify-between items-center gap-2 transition relative ${
    //     isActive ? 'bg-green-50 border-l-4 border-green-500' : 'hover:bg-green-100'
    //   }`}
    // >
    //   <button
    //     onClick={onClick}
    //     className="cursor-pointer flex-1 px-4 py-3 text-left flex flex-col gap-1"
    //   >
    //     <div className="text-sm font-semibold text-gray-700">
    //       {doc.nome} | CTe {doc.placa}
    //     </div>

    //     <div
    //       className={`text-xs inline-flex items-center gap-1 px-2 py-1 rounded-sm w-fit ${badge.className}`}
    //     >
    //       {badge.icon}
    //       {badge.label}
    //     </div>
    //   </button>

    //   {naoVisualizadas > 0 && (
    //     <span className="mr-2 text-xs text-white bg-green-500 rounded-full px-2 py-0.5">
    //       {naoVisualizadas}
    //     </span>
    //   )}

    //   {/* Menu de ações */}
    //   <div className="relative pr-3" ref={menuRef}>
    //     <button
    //       onClick={() => setMenuAberto((prev) => !prev)}
    //       className="cursor-pointer p-1 text-gray-600 hover:text-black"
    //     >
    //       <MoreVertical size={20} />
    //     </button>

    //     <AnimatePresence>
    //       {menuAberto && (
    //         <motion.div
    //           initial={{ opacity: 0, scale: 0.95, y: -5 }}
    //           animate={{ opacity: 1, scale: 1, y: 0 }}
    //           exit={{ opacity: 0, scale: 0.95, y: -5 }}
    //           transition={{ duration: 0.15 }}
    //           className="  absolute right-3 top-8 z-20 bg-white border shadow-md rounded-md overflow-hidden w-44"
    //         >
    //           <button
    //             onClick={handleDelete}
    //             className="cursor-pointer w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
    //           >
    //             <Trash2 size={16} />
    //             Deletar
    //           </button>
    //         </motion.div>
    //       )}
    //     </AnimatePresence>
    //   </div>
    // </div>
  );
};

export default DocItem;
