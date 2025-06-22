import React, { useEffect, useState, useRef } from 'react';
import { useLogin } from '../../Contexts/LoginContext';
import { buttonStyles, formatDate } from './utils';

import {
  FaCheck,
  FaTimes,
  FaUpload,
  FaMoneyBill,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaPaperPlane,
  FaPaperclip,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Input from '../Input/Input';
import InputFile from '../Input/InputFile';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAddBox, MdClose } from 'react-icons/md';
import { Stepper } from '../Progresso/Stepper';
import { ModalReprovacao } from './ModalReprovacao';
import { useSearchParams } from 'react-router-dom';

const api = import.meta.env.VITE_API_URL;

const Documentos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroUsuario, setFiltroUsuario] = useState(searchParams.get('usuario') || '');
  const [filtroStatus, setFiltroStatus] = useState(searchParams.get('status') || '');
  const [filtroPlaca, setFiltroPlaca] = useState(searchParams.get('placa') || '');
  const chatRefs = useRef({});
  const { userData, isAuthenticated } = useLogin();
  const fileInputRefs = useRef({});
  const [documentos, setDocumentos] = useState([]);
  const [file, setFile] = useState(null);
  const [nome, setNome] = useState('');

  const [placa, setPlaca] = useState('');
  const [comentarios, setComentarios] = useState({}); // texto por doc
  const [mostrarAtividades, setMostrarAtividades] = useState({});
  const [modalReprovarAberto, setModalReprovarAberto] = useState(null);
  // const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [motivoReprovacao, setMotivoReprovacao] = useState({});
  const [mostrarFormularioUpload, setMostrarFormularioUpload] = useState(false);
  const fileInputRef = useRef(null);
  const fetchDocs = () => fetchDocumentos({ api, headers, toast, setDocumentos });

  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };


  const fetchDocumentos = async () => {
    try {
      const res = await fetch(`${api}/documentos/todos`, { headers });
      if (!res.ok) throw new Error('Erro ao buscar documentos');
      const data = await res.json();

      const ordenados = data.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));

      setDocumentos(ordenados);
    } catch {
      toast.error('Erro ao carregar documentos');
    }
  };

  // Função para adicionar comentário no backend e atualizar a lista local
  const adicionarComentarioStatus = async (docId, texto) => {
    try {
      const res = await fetch(`${api}/documentos/${docId}/comentario`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      if (!res.ok) throw new Error();
      // Atualiza lista após comentário
      fetchDocumentos();
    } catch {
      toast.error('Erro ao adicionar comentário');
    }
  };

  // Função enviar comentário via campo texto (botão enviar)
  const enviarComentario = async (docId) => {
    const texto = (comentarios[docId] || '').trim();
    if (!texto) return;
    try {
      await adicionarComentarioStatus(docId, texto);
      setComentarios((c) => ({ ...c, [docId]: '' }));
      toast.success('Comentário enviado');
    } catch {
      toast.error('Erro ao enviar comentário');
    }
  };

  const juntarArquivosComentarios = (arquivos, comentarios) => {
    const arrArquivos = arquivos.map((arq) => ({
      id: `arq-${arq.id}`,
      tipo: 'arquivo',
      nome: arq.nome_arquivo,
      criado_em: arq.criado_em,
      dataFormatada: formatDate(arq.criado_em),
      abrir: () => abrirArquivo(arq.id),
      usuario: arq.usuario?.username || 'Usuário desconhecido', // aqui usa o usuário real
    }));

    const arrComentarios = comentarios.map((c) => ({
      id: `com-${c.id}`,
      tipo: 'comentario',
      texto: c.texto,
      usuario: c.usuario?.username || 'Usuário desconhecido',
      criado_em: c.criado_em,
      dataFormatada: formatDate(c.criado_em),
    }));

    return [...arrArquivos, ...arrComentarios].sort(
      (a, b) => new Date(a.criado_em) - new Date(b.criado_em)
    );
  };

  const uploadVersao = async (docId, novoArquivo) => {
    if (!novoArquivo) {
      toast.error('Selecione um arquivo');
      return;
    }
    const formData = new FormData();
    formData.append('file', novoArquivo);
    try {
      const res = await fetch(`${api}/documentos/${docId}/upload-versao`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) throw new Error('Erro no upload da nova versão');
      toast.success('Nova versão enviada');
      fetchDocumentos();
    } catch {
      toast.error('Erro ao enviar nova versão');
    }
  };

  // Aprovar adiciona comentário de registro da ação
  const aprovar = async (doc) => {
    if (doc.status !== 'enviado') {
      toast.error("Só é possível aprovar documentos com status 'enviado'.");
      return;
    }
    if (userData.setor !== 'ocorrencia') {
      toast.error('Aprovação só permitida para setor Ocorrência.');
      return;
    }
    try {
      const res = await fetch(`${api}/documentos/${doc.id}/aprovar`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error('Erro ao aprovar');
      await adicionarComentarioStatus(doc.id, `Usuário ${userData.username} aprovou o documento.`);
      toast.success('Documento aprovado');
      fetchDocumentos();
    } catch {
      toast.error('Erro ao aprovar documento');
    }
  };

const reprovar = async (doc) => {
  const validStatuses = ['enviado', 'aprovado', 'reprovado'];

  if (!validStatuses.includes(doc.status)) {
    toast.error('Documento não está em status permitido para reprovação.');
    return;
  }

  if (doc.status === 'saldo_liberado') {
    toast.error('Não é possível reprovar documento com saldo liberado.');
    return;
  }

  if (userData.setor !== 'ocorrencia') {
    toast.error('Reprovação só permitida para setor Ocorrência.');
    return;
  }

  const motivo = (motivoReprovacao[doc.id] || '').trim();

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

    if (!res.ok) throw new Error('Erro ao reprovar');

    await adicionarComentarioStatus(
      doc.id,
      `Usuário ${userData.username} reprovou: ${motivo}`
    );

    toast.success('Documento reprovado');

    // Limpa o motivo e fecha o modal
    setMotivoReprovacao((prev) => ({ ...prev, [doc.id]: '' }));
    setModalReprovarAberto(null);

    fetchDocumentos();
  } catch {
    toast.error('Erro ao reprovar documento');
  }
};


  const liberarSaldo = async (doc) => {
    if (doc.status !== 'aprovado') {
      toast.error('Só é possível liberar saldo para documentos aprovados.');
      return;
    }
    if (userData.setor !== 'expedicao') {
      toast.error('Liberação de saldo só permitida para setor Expedição.');
      return;
    }
    try {
      const res = await fetch(`${api}/documentos/${doc.id}/saldo-liberado`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error('Erro ao liberar saldo');
      await adicionarComentarioStatus(doc.id, `Usuário ${userData.username} liberou saldo.`);
      toast.success('Saldo liberado com sucesso');
      fetchDocumentos();
    } catch {
      toast.error('Erro ao liberar saldo');
    }
  };

const handleSubmitUpload = async (e) => {
  e.preventDefault();

  if (!file || !nome.trim() || !placa.trim()) {
    toast.error("Preencha todos os campos e selecione um arquivo.");
    return;
  }

  const token = localStorage.getItem("token"); // exemplo, adapte ao seu caso

  const formData = new FormData();
  formData.append("file", file);
  formData.append("nome", nome);
  formData.append("placa", placa);

  try {
    const response = await fetch(`${api}/documentos/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Erro ao enviar documento");

    toast.success("Documento enviado com sucesso!");
    setNome("");
    setPlaca("");
    setFile(null);
    setMostrarFormularioUpload(false);
    fetchDocumentos();
  } catch (error) {
    toast.error(error.message || "Erro ao enviar documento");
  }
};



  const abrirArquivo = async (arqId) => {
    try {
      const res = await fetch(`${api}/documentos/${arqId}/visualizar`, { headers });
      if (!res.ok) throw new Error('Erro ao buscar arquivo');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error('Falha ao abrir arquivo');
    }
  };

  const documentosFiltrados = documentos.filter((doc) => {
    const usuario = doc.usuario?.username?.toLowerCase() || '';
    const placa = doc.placa?.toLowerCase() || '';
    const status = doc.status?.toLowerCase() || '';

    const passaNosFiltros =
      (filtroUsuario === '' || usuario.includes(filtroUsuario.toLowerCase())) &&
      (filtroPlaca === '' || placa.includes(filtroPlaca.toLowerCase())) &&
      (filtroStatus === '' || status === filtroStatus);

    const isExpedicaoOuOcorrencia =
      userData.setor === 'expedicao' || userData.setor === 'ocorrencia';

    // Se for expedição ou ocorrência, vê todos
    // Caso contrário, vê só os que ele mesmo enviou
    if (isExpedicaoOuOcorrencia) {
      return passaNosFiltros;
    } else {
      return doc.usuario_id === userData.id && passaNosFiltros;
    }
  });

  const solicitarAprovacao = async (doc) => {
  try {
    const res = await fetch(`${api}/documentos/${doc.id}/solicitar-aprovacao`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Erro ao solicitar aprovação');
    toast.success('Solicitação de aprovação enviada');
    fetchDocumentos();
  } catch {
    toast.error('Erro ao solicitar aprovação');
  }
};

useEffect(() => {
  const params = {};

  if (filtroUsuario) params.usuario = filtroUsuario;
  if (filtroStatus) params.status = filtroStatus;
  if (filtroPlaca) params.placa = filtroPlaca;

  setSearchParams(params);
}, [filtroUsuario, filtroStatus, filtroPlaca]);


  useEffect(() => {
    Object.entries(mostrarAtividades).forEach(([docId, isVisible]) => {
      if (isVisible && chatRefs.current[docId]) {
        const div = chatRefs.current[docId];
        div.scrollTop = div.scrollHeight;
      }
    });
  }, [mostrarAtividades, documentos]);

  useEffect(() => {
    console.log(userData);
    fetchDocumentos({ api, headers, toast, setDocumentos });
  }, []);

  return (
<div className="text-gray-800 max-w-6xl mx-auto p-6">
  {/* Botão Mostrar/Esconder Upload */}
  <button
    disabled={!isAuthenticated}
    onClick={() => setMostrarFormularioUpload(!mostrarFormularioUpload)}
    className={`flex items-center gap-2 px-4 py-2 mb-4 border 
      ${
        !isAuthenticated
          ? 'bg-gray-400 cursor-not-allowed border-gray-400'
          : 'bg-green-600 hover:bg-green-700 border-green-700'
      } 
      text-white rounded-md transition duration-300`}
  >
    <motion.div
      initial={{ rotate: 0 }}
      animate={{ rotate: mostrarFormularioUpload ? 180 : 0 }}
      transition={{ duration: 0.3 }}
    >
      {mostrarFormularioUpload ? <MdClose size={20} /> : <MdAddBox size={20} />}
    </motion.div>
    {mostrarFormularioUpload ? 'Ocultar Envio' : 'Enviar Comprovante'}
  </button>

  {/* Upload de Documento */}
  {mostrarFormularioUpload && (
    <form
      onSubmit={handleSubmitUpload}
      className="bg-white rounded-xl shadow-lg p-6 mb-12 flex flex-col gap-5"
    >
      <h2 className="text-3xl font-extrabold text-green-700">Enviar Documento</h2>
      <div className="flex flex-col sm:flex-row gap-5">
        <Input
          type="text"
          placeholder="Nome do condutor"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Placa"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
        />
      </div>
      <InputFile onChange={(e) => setFile(e.target.files[0])} />
      <button
        type="submit"
        className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-3 justify-center max-w-xs mx-auto"
      >
        <FaUpload size={18} /> Enviar Documento
      </button>
    </form>
  )}

  {/* Filtros */}
  <div className="text-white flex flex-col sm:flex-row gap-4 mb-6">
    <Input
      placeholder="Filtrar por usuário"
      value={filtroUsuario}
      onChange={(e) => setFiltroUsuario(e.target.value)}
    />
    <Input
      placeholder="Filtrar por placa"
      value={filtroPlaca}
      onChange={(e) => setFiltroPlaca(e.target.value)}
    />
    <select
      value={filtroStatus}
      onChange={(e) => setFiltroStatus(e.target.value)}
      className="border bg-white text-black border-gray-300 rounded px-3 focus:outline-none focus:border-green-500"
    >
      <option value="">Todos os status</option>
      <option value="enviado">Enviado</option>
      <option value="aprovado">Aprovado</option>
      <option value="reprovado">Reprovado</option>
      <option value="saldo_liberado">Saldo Liberado</option>
    </select>
    <button
      onClick={() => {
        setFiltroUsuario('');
        setFiltroStatus('');
        setFiltroPlaca('');
        setSearchParams({});
      }}
      className="px-4 py-2 rounded bg-gray-200 text-black hover:bg-gray-300 transition"
    >
      Limpar Filtros
    </button>
  </div>

  {/* Lista de Documentos */}
  {documentosFiltrados.map((doc) => {
    const isAprovado = doc.status === 'aprovado';
    const isLiberado = doc.status === 'saldo_liberado';
    const atividadesVisiveis = !!mostrarAtividades[doc.id];

    const podeAprovar = userData.setor === 'ocorrencia' && doc.status === 'enviado';
    const podeReprovar =
      userData.setor === 'ocorrencia' &&
      ['enviado', 'aprovado', 'reprovado'].includes(doc.status) &&
      !isLiberado;
    const podeLiberarSaldo = userData.setor === 'expedicao' && isAprovado;

    const podeComentar = userData.setor === 'ocorrencia' || userData.id === doc.usuario_id;

    const itensChat = juntarArquivosComentarios(doc.arquivos, doc.comentarios_rel);

    return (
      <div
        key={doc.id}
        className="bg-white rounded-sm shadow-md p-6 mb-8 border border-gray-200 hover:shadow-lg transition flex flex-col"
      >
        {/* Cabeçalho Documento */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-600">
              {doc.nome} — <span className="text-gray-600">{doc.placa}</span>
            </h3>
            <div className="flex flex-col mt-1 text-sm text-gray-500 gap-1">
              <Stepper status={doc.status} />
              <span className="font-medium text-gray-700">
                Enviado por: {doc.usuario?.username || 'Usuário desconhecido'}
              </span>
              <span>{formatDate(doc.criado_em)}</span>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 flex-wrap">
            {podeAprovar && (
              <button
                onClick={() => aprovar(doc)}
                className={`${buttonStyles.base} ${buttonStyles.green}`}
              >
                <FaCheck size={14} /> Aprovar
              </button>
            )}
            {podeReprovar && (
              <button
                onClick={() => setModalReprovarAberto(doc.id)}
                className={`${buttonStyles.base} ${buttonStyles.red}`}
              >
                <FaTimes size={14} /> Reprovar
              </button>
            )}
            {podeLiberarSaldo && (
              <button
                onClick={() => liberarSaldo(doc)}
                className={`${buttonStyles.base} ${buttonStyles.yellow}`}
              >
                <FaMoneyBill size={14} /> Liberar saldo
              </button>
            )}
            {doc.status === 'reprovado' && doc.usuario_id === userData.id && (
              <button
                onClick={() => solicitarAprovacao(doc)}
                className={`${buttonStyles.base} ${buttonStyles.blue}`}
              >
                <FaPaperPlane size={14} /> Solicitar aprovação novamente
              </button>
            )}
            <button
              onClick={() =>
                setMostrarAtividades((prev) => ({ ...prev, [doc.id]: !prev[doc.id] }))
              }
              className="cursor-pointer p-2 rounded-full text-green-700 hover:bg-green-100 hover:text-green-900 transition"
            >
              {atividadesVisiveis ? <FaChevronUp size={20} /> : <FaChevronDown size={20} />}
            </button>
          </div>
        </div>

        {/* Chat e Histórico */}
        {atividadesVisiveis && (
          <div>
            <p className="mt-6 font-semibold text-center text-gray-700 mb-1">Conversa</p>
            <p className="mt-2 text-end text-sm text-gray-500 mb-1">Não atualiza em tempo real. Recarregue a página!</p>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[url('/Fundo-WhatsApp.jpg')] rounded-sm p-6 chat-scroll"
            >
              <ul
                ref={(el) => (chatRefs.current[doc.id] = el)}
                className="flex flex-col gap-4 max-h-96 overflow-y-auto px-2"
              >
                {itensChat.map((item) => {
                  const isMeuItem = item.usuario === userData.username;
                  return (
                    <li
                      key={item.id}
                      className={`flex flex-col max-w-xl ${
                        isMeuItem ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl shadow-sm ${
                          isMeuItem
                            ? 'bg-[#d9fdd3] text-black rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
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
                      <div className="text-xs mt-1 text-gray-700">
                        {!isMeuItem ? (
                          <p>
                            {item.usuario} — {item.dataFormatada}
                          </p>
                        ) : (
                          <p>{item.dataFormatada}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        )}

        {/* Campo Comentário e Upload Nova Versão */}
        {podeComentar && atividadesVisiveis && (
          <div className="mt-4 p-4 rounded-4xl flex items-center gap-2">
            <input
              type="text"
              placeholder="Digite um comentário..."
              value={comentarios[doc.id] || ''}
              onChange={(e) => setComentarios((c) => ({ ...c, [doc.id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviarComentario(doc.id);
                }
              }}
              className="flex-grow rounded-lg border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-100 px-4 py-2"
            />
            <button
              onClick={() => enviarComentario(doc.id)}
              disabled={!comentarios[doc.id]?.trim()}
              className="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPaperPlane size={18} />
            </button>

            {doc.usuario_id === userData.id && (
              <>
                <button
                  onClick={() => fileInputRefs.current[doc.id]?.click()}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
                  title="Anexar nova versão"
                  type="button"
                >
                  <FaPaperclip size={18} />
                </button>
                <input
                  type="file"
                  ref={(el) => (fileInputRefs.current[doc.id] = el)}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) uploadVersao(doc.id, e.target.files[0]);
                    e.target.value = null;
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Modal de Reprovação */}
        <ModalReprovacao
  modalReprovarAberto={modalReprovarAberto}
  doc={doc}
  motivoReprovacao={motivoReprovacao[doc.id] || ''}
  reprovar={() => reprovar(doc)}
  setMotivoReprovacao={(valor) =>
    setMotivoReprovacao((prev) => ({ ...prev, [doc.id]: valor }))
  }
  setModalReprovarAberto={setModalReprovarAberto}
/>

      </div>
    );
  })}
</div>

  );
};

export default Documentos;



