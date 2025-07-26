import React, { useState, useRef, useEffect } from 'react';
import { formatDate } from './utils';
import { MdCheckCircle, MdCancel, MdSend, MdAttachMoney } from 'react-icons/md';
import { MoreVertical, Trash2 } from 'lucide-react';
import { useLogin } from '../../Contexts/LoginContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const DocItem = ({ doc, onClick, isActive }) => {
  const { userData } = useLogin();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  // Estado para detectar tela desktop
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (userData.setor !== 'admin') {
      toast.error('Apenas administradores podem deletar documentos.');
      return;
    }

    setModalAberto(true); // abre o modal
  };

  const confirmarDelete = async () => {
    setConfirmando(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/documentos/${doc.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error();

      toast.success('Documento deletado com sucesso!');
      setModalAberto(false);
      // Aguarda animação de saída antes do reload
      setTimeout(() => {
        window.location.reload();
      }, 300); // tempo da animação em ms
    } catch (err) {
      toast.error('Erro ao deletar documento.');
      console.error(err);
    } finally {
      setConfirmando(false);
    }
  };

  // const handleDelete = async () => {
  //   const precisaSenha = ['aprovado', 'saldo_liberado'].includes(status);
  //   let autorizado = true;

  //   if (precisaSenha) {
  //     const senha = prompt('Este documento exige uma senha para ser deletado.\nDigite a senha:');
  //     if (senha !== '985509') {
  //       alert('Senha incorreta. A exclusão foi cancelada.');
  //       autorizado = false;
  //     }
  //   }

  //   if (!autorizado) return;

  //   const confirmado = window.confirm(`Tem certeza que deseja deletar o documento "${doc.nome}"?`);
  //   if (!confirmado) return;

  //   try {
  //     const res = await fetch(`${import.meta.env.VITE_API_URL}/documentos/${doc.id}`, {
  //       method: 'DELETE',
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem('token')}`,
  //       },
  //     });

  //     if (!res.ok) throw new Error();
  //     alert('Documento deletado com sucesso.');
  //     window.location.reload(); // ou chame fetchDocumentos() externamente
  //   } catch (err) {
  //     alert('Erro ao deletar o documento.');
  //     console.error(err);
  //   }
  // };

  const naoVisualizadas = (doc.comentarios_rel || []).filter(
    (comentario) =>
      comentario.usuario?.id !== userData.id && // Ignora se foi enviado por você
      !comentario.visualizado_por?.includes(userData.id)
  ).length;

  const naoVisualizadasArquivos = (doc.arquivos || []).filter(
    (arquivo) =>
      arquivo.usuario?.id !== userData.id && // Ignora se foi enviado por você
      !arquivo.visualizado_por?.includes(userData.id)
  ).length;

  const totalNaoVisualizadas = naoVisualizadas + naoVisualizadasArquivos;

  // Combina arquivos e comentários, ordenados por data
  const itensChat = [...(doc.arquivos || []), ...(doc.comentarios_rel || [])]
    .map((item) => {
      const nomeUsuario = item.usuario?.username || 'Usuário';

      if (item.nome_arquivo) {
        return {
          id: `arq-${item.id}`,
          tipo: 'arquivo',
          texto: '📎 Arquivo enviado',
          criado_em: item.criado_em,
          autor: nomeUsuario,
        };
      } else {
        return {
          id: `com-${item.id}`,
          tipo: 'comentario',
          texto: item.texto,
          criado_em: item.criado_em,
          autor: nomeUsuario,
        };
      }
    })

    .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));

  return (
    <div
      className={`w-full flex justify-between items-center gap-2 transition relative rounded-md ${
        isActive ? 'bg-black/7 border-l-4' : 'bg-white hover:bg-gray-100'
      }`}
    >
      <button
        onClick={onClick}
        className="cursor-pointer flex-grow flex-shrink basis-0 min-w-0 px-4 py-3 text-left flex flex-col gap-1"
      >
        {/* Cabeçalho: Nome + CTe + Status */}
        <div className="flex flex-wrap sm:flex-nowrap items-center w-full gap-2">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-4 gap-y-1 w-full items-center">
            {/* Coluna 1: Nome + Malote + CTe */}
            <div className="text-sm text-gray-600 font-semibold truncate max-w-[65ch]">
              {isDesktop
                ? doc.nome.length > 60
                  ? doc.nome.slice(0, 60) + '...'
                  : doc.nome
                : doc.nome}

              {doc.data_do_malote && (
                <span className="text-gray-600 font-semibold">
                  {' '}
                  + Malote {formatDateBr(doc.data_do_malote)}
                </span>
              )}
              <span className="text-gray-600 font-semibold"> | CTe {doc.placa}</span>
            </div>

            {/* Coluna 2: Status + ícone */}
            <div className="flex items-center gap-2 justify-start md:justify-end">
              <div
                className={`text-[11px] font-medium whitespace-nowrap inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full shadow-sm ${badge.className}`}
              >
                {badge.icon}
                {badge.label}
              </div>

              {doc.manifesto_baixado ? (
                <FaDownload size={12} className="text-green-500" title="Manifesto baixado" />
              ) : (
                <FaDownload size={12} className="text-yellow-500" title="Manifesto pendente" />
              )}
            </div>
          </div>
        </div>

        {/* Última mensagem + horário */}
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div
            className="truncate max-w-[80%] min-w-0"
            title={
              doc.comentarios_rel?.length > 0
                ? doc.comentarios_rel[doc.comentarios_rel.length - 1].texto
                : ''
            }
          >
            {itensChat.length > 0 ? (
              <span>
                <strong className="text-gray-700">{itensChat[itensChat.length - 1].autor}:</strong>{' '}
                {itensChat[itensChat.length - 1].texto.slice(0, 50)}
                {itensChat[itensChat.length - 1].texto.length > 50 ? '...' : ''}
              </span>
            ) : (
              'Sem mensagens'
            )}
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
      {totalNaoVisualizadas > 0 && (
        <span className="text-[10px] text-white bg-green-400 rounded-full px-2 py-0.5 whitespace-nowrap">
          {totalNaoVisualizadas}
        </span>
      )}

      {/* Menu de ações */}
      <div className="relative pr-3 flex-shrink-0" ref={menuRef}>
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

      <AnimatePresence>
        {modalAberto && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Confirmar exclusão</h2>
              <p className="text-sm text-gray-600 mb-6">
                Tem certeza que deseja deletar o documento <strong>{doc.nome}</strong>?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                  onClick={() => setModalAberto(false)}
                  disabled={confirmando}
                >
                  Cancelar
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  onClick={confirmarDelete}
                  disabled={confirmando}
                >
                  {confirmando ? 'Deletando...' : 'Deletar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocItem;
