import React, { useRef, useEffect, useState } from 'react';
import { FaPaperPlane, FaPaperclip, FaExternalLinkAlt } from 'react-icons/fa';
import { Stepper } from '../Progresso/Stepper';
import ChatMensagem from './ChatMensagem';
import { toast } from 'react-toastify';
import { formatDate } from './utils';
const api = import.meta.env.VITE_API_URL;
import { ModalReprovacao } from './ModalReprovacao';
import { can } from '../../utils/permissions';


import { MdDateRange, MdAccessTime, MdPerson } from 'react-icons/md';

const ChatBox = ({
  doc,
  userData,
  headers,
  setDocumentoSelecionado,
  fetchDocumentos,
  motivoReprovacao,
  setMotivoReprovacao,
  setModalReprovarAberto,
  modalReprovarAberto,
  autoScroll = false,
}) => {
  const [mensagemEnviada, setMensagemEnviada] = useState(false);
  const [comentario, setComentario] = useState('');
  const fileInputRef = useRef(null);
  const chatRef = useRef(null);

  const itensChat = [...(doc.arquivos || []), ...(doc.comentarios_rel || [])]
    .map((item) => {
      if (item.nome_arquivo) {
        const extensao = item.nome_arquivo.split('.').pop().toLowerCase();
        const ehImagem = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extensao);

        return {
          id: `arq-${item.id}`,
          tipo: 'arquivo',
          nome: item.nome_arquivo,
          criado_em: item.criado_em,
          usuario: item.usuario?.username || 'Usuário desconhecido',
          abrir: () => abrirArquivo(item.id),
          ehImagem,
          idArquivo: item.id, // necessário pra carregar blob
        };
      } else {
        return {
          id: `com-${item.id}`,
          tipo: 'comentario',
          texto: item.texto,
          criado_em: item.criado_em,
          usuario: item.usuario?.username || 'Usuário desconhecido',
        };
      }
    })
    .sort((a, b) => new Date(a.criado_em || 0) - new Date(b.criado_em || 0));

  const abrirArquivo = async (arqId) => {
    try {
      const res = await fetch(`${api}/documentos/${arqId}/visualizar`, { headers });
      if (!res.ok) throw new Error('Erro ao buscar arquivo');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error('Erro ao abrir arquivo');
    }
  };

  const baixarManifesto = async () => {

    try {
      const res = await fetch(`${api}/documentos/${doc.id}/manifesto-baixado`, {
        method: 'POST',
        headers,
      });

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.detail || data?.msg || 'Erro inesperado')
        return
      }

      await enviarComentarioAutom('baixou o manifesto.');
      toast.success('Manifesto marcado como baixado');

      const novosDocs = await fetchDocumentos();
      const atualizado = novosDocs.find((d) => d.id === doc.id);
      if (atualizado) setDocumentoSelecionado(atualizado);
    } catch (err) {
      toast.error('Erro ao marcar manifesto como baixado');
      console.error(err);
    }
  };

  const uploadVersao = async (novoArquivo) => {
    if (!novoArquivo) {
      toast.error('Selecione um arquivo');
      return;
    }

    const formData = new FormData();
    formData.append('file', novoArquivo);

    try {
      const res = await fetch(`${api}/documentos/${doc.id}/upload-versao`, {
        method: 'POST',
        headers: { Authorization: headers.Authorization }, // sem Content-Type
        body: formData,
      });
      const data = await res.json().catch(() => null)


      if (!res.ok) {
        toast.error(data?.detail || data?.msg || 'Erro inesperado')
        return
      }

      toast.success('Documento Enviado');

      // Atualiza documentos e o doc selecionado
      const novosDocs = await fetchDocumentos();
      const docAtualizado = novosDocs.find((d) => d.id === doc.id);
      if (docAtualizado) {
        setDocumentoSelecionado(docAtualizado);
      }
      setMensagemEnviada(true);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar nova versão');
    }
  };

  const enviarComentario = async () => {
    const texto = comentario.trim();
    if (!texto) return;
    try {
      const res = await fetch(`${api}/documentos/${doc.id}/comentario`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.detail || data?.msg || 'Erro inesperado')
        return;
      }

      toast.success('Comentário enviado');
      setComentario('');

      // Marca como visualizado imediatamente após envio
      await fetch(`${api}/documentos/${doc.id}/marcar-visualizados`, {
        method: 'POST',
        headers,
      });

      // Atualiza os documentos e o selecionado
      try {
        const novosDocs = await fetchDocumentos();
        const docAtualizado = novosDocs.find((d) => d.id === doc.id);
        if (docAtualizado) {
          setDocumentoSelecionado(docAtualizado);
        }

        setMensagemEnviada(true);
      } catch (err) {
        console.error('Erro ao atualizar documento após comentário:', err);
      }
    } catch (err) {
      toast.error('Erro ao enviar comentário');
      console.error(err);
    }
  };

const aprovar = async () => {
  try {
    const res = await fetch(`${api}/documentos/${doc.id}/aprovar`, {
      method: 'POST',
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.detail || data?.msg || 'Ação não permitida.');
      return;
    }

    await enviarComentarioAutom('aprovou o documento.');
    toast.success(data?.msg || 'Documento aprovado');

    try {
      await atualizarDocumentoSilencioso();
    } catch (err) {
      console.error('Erro ao atualizar doc após aprovar', err);
    }
  } catch (err) {
    toast.error('Erro de conexão com o servidor');
    console.error(err);
  }
};

const reprovar = async () => {
  const statusValido = ['enviado', 'aprovado', 'reprovado'];
  if (!statusValido.includes(doc.status) || doc.status === 'saldo_liberado') {
    toast.error('Documento não pode ser reprovado nesse status.');
    return;
  }

  const motivo = (motivoReprovacao?.[doc.id] || '').trim();
  if (!motivo) {
    toast.error('Informe o motivo da reprovação.');
    return;
  }

  try {
    const res = await fetch(`${api}/documentos/${doc.id}/reprovar`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comentario: motivo }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.detail || data?.msg || 'Ação não permitida.');
      return;
    }

    await enviarComentarioAutom(`reprovou: ${motivo}`);
    toast.success(data?.msg || 'Documento reprovado');

    setMotivoReprovacao((prev) => ({ ...prev, [doc.id]: '' }));
    setModalReprovarAberto(null);

    try {
      const novosDocs = await fetchDocumentos();
      const atualizado = novosDocs.find((d) => d.id === doc.id);
      if (atualizado) setDocumentoSelecionado(atualizado);
    } catch (err) {
      console.error('Erro ao atualizar documento após reprovação:', err);
    }
  } catch (err) {
    toast.error('Erro de conexão com o servidor');
    console.error(err);
  }
};


  const liberarSaldo = async () => {

    try {
      const res = await fetch(`${api}/documentos/${doc.id}/saldo-liberado`, {
        method: 'POST',
        headers,
      });

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.detail || data?.msg || 'Erro inesperado')
        return
      }

      await enviarComentarioAutom('liberou saldo.');
      toast.success('Saldo liberado');

      try {
        const novosDocs = await fetchDocumentos();
        const atualizado = novosDocs.find((d) => d.id === doc.id);
        if (atualizado) setDocumentoSelecionado(atualizado);
      } catch (err) {
        console.error('Erro ao atualizar documento após liberar saldo:', err);
      }
    } catch (err) {
      toast.error('Erro ao liberar saldo');
      console.error(err);
    }
  };

  const solicitarAprovacao = async () => {


    try {
      const res = await fetch(`${api}/documentos/${doc.id}/solicitar-aprovacao`, {
        method: 'POST',
        headers,
      });

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.detail || data?.msg || 'Erro inesperado')
        return
      }

      toast.success('Solicitação de aprovação enviada');

      await enviarComentarioAutom('solicitou aprovação novamente.');

      try {
        const novosDocs = await fetchDocumentos();
        const atualizado = novosDocs.find((d) => d.id === doc.id);
        if (atualizado) setDocumentoSelecionado(atualizado);
      } catch (err) {
        console.error('Erro ao atualizar documento após solicitar aprovação:', err);
      }
    } catch (err) {
      toast.error('Erro ao solicitar aprovação');
      console.error(err);
    }
  };

  // Comentário automático ao final das ações
  const enviarComentarioAutom = async (texto) => {
    await fetch(`${api}/documentos/${doc.id}/comentario`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: `Usuário ${userData.username} ${texto}` }),
    });
  };

  const atualizarDocumentoSilencioso = async () => {
    const novosDocs = await fetchDocumentos();
    const atualizado = novosDocs.find((d) => d.id === doc.id);
    if (atualizado) {
      setDocumentoSelecionado(atualizado);
    }
  };


  function formatDateBr(dataStr) {
    const [year, month, day] = dataStr.split('-');
    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    if (autoScroll && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [autoScroll, doc?.comentarios_rel?.length, doc?.arquivos?.length]);

  useEffect(() => {
    if (!doc?.comentarios_rel || !userData?.id) return;

    const timer = setTimeout(() => {
      const comentariosNaoLidos = doc.comentarios_rel.some(
        (coment) =>
          coment.usuario_id !== userData.id && !(coment.visualizado_por || []).includes(userData.id)
      );

      if (!comentariosNaoLidos) return;

      fetch(`${api}/documentos/${doc.id}/marcar-visualizados`, {
        method: 'POST',
        headers,
      })
        .then((res) => {
          if (!res.ok) throw new Error('Erro ao marcar como lido');
          const comentariosAtualizados = doc.comentarios_rel.map((c) =>
            c.usuario_id !== userData.id && !(c.visualizado_por || []).includes(userData.id)
              ? { ...c, visualizado_por: [...(c.visualizado_por || []), userData.id] }
              : c
          );

          setDocumentoSelecionado({ ...doc, comentarios_rel: comentariosAtualizados });
        })
        .catch((err) => {
          console.error('Erro ao marcar comentários como visualizados:', err);
        });
    }, 3000); // 3000 milissegundos = 3 segundos

    return () => clearTimeout(timer); // cancela se o efeito reiniciar
  }, [doc?.id, doc?.comentarios_rel]);

  useEffect(() => {
    if (mensagemEnviada && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
      setMensagemEnviada(false); // reseta a flag
    }
  }, [mensagemEnviada]);

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Cabeçalho */}
        <div className="border-b p-4 space-y-2">
          <h2 className="text-lg font-semibold text-gray-700">
            {doc.nome} | CTe {doc.placa}
          </h2>

          <p className="text-sm text-gray-500">Cliente: {doc.cliente}</p>

          {doc.data_do_malote && (
            <div className="flex items-center text-sm text-gray-500 gap-2">
              <MdDateRange size={16} />
              <span>Data do Malote: {formatDateBr(doc.data_do_malote)}</span>
            </div>
          )}

          {doc.criado_em && (
            <div className="flex items-center text-sm text-gray-500 gap-2">
              <MdAccessTime size={16} />
              <span>Criado em: {formatDate(doc.criado_em)}</span>
            </div>
          )}

          {doc.usuario?.username && (
            <div className="flex items-center text-sm text-gray-500 gap-2">
              <MdPerson size={16} />
              <span>Criado por: {doc.usuario.username}</span>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <div className="pb-2">
              {doc.manifesto_baixado ? (
                <span className="inline-block bg-green-200/60 text-green-800 text-[12px] font-semibold px-2 py-[2px] rounded-md tracking-wide">
                  ✔ Manifesto baixado
                </span>
              ) : (
                <span className="inline-block bg-yellow-200/60 text-yellow-900 text-[12px] font-semibold px-2 py-[2px] rounded-md tracking-wide">
                  ⏳ Manifesto não baixado
                </span>
              )}
            </div>

            <Stepper status={doc.status} />
          </div>
        </div>
{/* Ações */}
<div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-200 bg-white text-sm">

  {/* Solicitar aprovação novamente */}
  {(userData.id === doc.usuario_id ||
    can(userData, 'comprovantes.solicitar_aprovacao_novamente')) &&
    doc.status === 'reprovado' && (
      <button
        onClick={solicitarAprovacao}
        className="cursor-pointer flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 px-3 py-1.5 rounded-md shadow-sm transition"
      >
        <FaPaperPlane size={14} />
        Solicitar Aprovação Novamente
      </button>
    )
  }

  {/* Aprovar */}
  {can(userData, 'comprovantes.aprovar') &&
    ['enviado', 'reprovado'].includes(doc.status) && (
      <button
        onClick={aprovar}
        className="cursor-pointer flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 px-3 py-1.5 rounded-md shadow-sm transition"
      >
        <FaPaperPlane size={14} />
        Aprovar
      </button>
    )
  }

  {/* Reprovar */}
  {can(userData, 'comprovantes.reprovar') &&
    ['enviado', 'aprovado'].includes(doc.status) &&
    doc.status !== 'saldo_liberado' && (
      <button
        onClick={() => setModalReprovarAberto(doc.id)}
        className="cursor-pointer flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 px-3 py-1.5 rounded-md shadow-sm transition"
      >
        <FaPaperclip size={14} />
        Reprovar
      </button>
    )
  }

  {/* Liberar saldo */}
  {can(userData, 'comprovantes.liberar_saldo') &&
    doc.status === 'aprovado' && (
      <button
        onClick={liberarSaldo}
        className="cursor-pointer flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 px-3 py-1.5 rounded-md shadow-sm transition"
      >
        <FaExternalLinkAlt size={14} />
        Liberar Saldo
      </button>
    )
  }

  {/* Baixar manifesto */}
  {can(userData, 'comprovantes.baixar_manifesto') &&
    !doc.manifesto_baixado && (
      <button
        onClick={baixarManifesto}
        className="cursor-pointer flex items-center gap-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300 px-3 py-1.5 rounded-md shadow-sm transition"
      >
        <FaExternalLinkAlt size={14} />
        Baixar Manifesto
      </button>
    )
  }

</div>


        {/* Conteúdo principal (mensagens + envio) */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Lista de mensagens - ocupa o espaço restante */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 bg-black/2">
            {itensChat.map((item) => (
              <ChatMensagem key={item.id} item={item} currentUser={userData.username} />
            ))}
          </div>


            <div className="p-4 border-t bg-white border-gray-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Digite uma mensagem..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviarComentario();
                  }
                }}
                className="flex-1 text-black border border-gray-200 h-full w-full px-3 py-2 rounded"
              />
              <button
                onClick={enviarComentario}
                disabled={!comentario.trim()}
                className="p-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
              >
                <FaPaperPlane />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                <FaPaperclip />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                className="cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    uploadVersao(file);
                    // Resetar o valor do input após o upload
                    e.target.value = ''; // <- isto resolve o problema
                  }
                }}
              />
            </div>

        </div>

        {/* Modal de reprovação */}
        {modalReprovarAberto === doc.id && (
          <ModalReprovacao
            modalReprovarAberto={modalReprovarAberto}
            doc={doc}
            motivoReprovacao={motivoReprovacao?.[doc.id] || ''}
            reprovar={reprovar}
            setMotivoReprovacao={(valor) =>
              setMotivoReprovacao((prev) => ({ ...prev, [doc.id]: valor }))
            }
            setModalReprovarAberto={setModalReprovarAberto}
          />
        )}
      </div>
    </>
  );
};

export default ChatBox;

