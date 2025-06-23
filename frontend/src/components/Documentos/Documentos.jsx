import React, { useEffect, useState, useRef } from 'react';
import { useLogin } from '../../Contexts/LoginContext';
import { buttonStyles, formatDate } from './utils';
import { FiTrash2 } from 'react-icons/fi';
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

const LIMIT = 50;

const Documentos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroUsuario, setFiltroUsuario] = useState(searchParams.get('usuario') || '');
  const [filtroStatus, setFiltroStatus] = useState(searchParams.get('status') || '');
  const [filtroCte, setFiltroCte] = useState(searchParams.get('cte') || '');
  const [filtroNome, setFiltroNome] = useState(searchParams.get('nome') || '');
  const [filtroPlaca, setFiltroPlaca] = useState(searchParams.get('placa') || ''); // Continua sendo "placa" no URL e no estado

  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');

    // Documentos e paginação
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const chatRefs = useRef({});
  const { userData, isAuthenticated } = useLogin();
  const fileInputRefs = useRef({});
  const [documentos, setDocumentos] = useState([]);
  const [file, setFile] = useState(null);
  const [nome, setNome] = useState('');

const [docParaExcluir, setDocParaExcluir] = useState(null);
const [senhaExclusao, setSenhaExclusao] = useState('');

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



const fetchDocumentos = async (reset = false) => {
  if (loading) return;
  setLoading(true);

  const params = new URLSearchParams();
  if (filtroUsuario) params.append('usuario', filtroUsuario);
  if (filtroStatus) params.append('status', filtroStatus);
  if (filtroCte) params.append('cte', filtroCte);
  if (filtroNome) params.append('nome', filtroNome);
  if (dataInicial) params.append('data_inicial', dataInicial);
  if (dataFinal) params.append('data_final', dataFinal);
  params.append('skip', reset ? '0' : skip.toString());
  params.append('limit', LIMIT.toString());

  try {
    const res = await fetch(`${api}/documentos/todos?${params.toString()}`, { headers });
    if (!res.ok) throw new Error('Erro ao buscar documentos');
    const data = await res.json();

    if (reset) {
      setDocumentos(data);
      setSkip(data.length);
    } else {
      setDocumentos((prev) => {
        const novosDocumentos = juntarSemDuplicatas(prev, data);
        return novosDocumentos;
      });
      setSkip((prev) => prev + data.length);
    }

    setHasMore(data.length === LIMIT);
  } catch {
    toast.error('Erro ao carregar documentos');
  } finally {
    setLoading(false);
  }
};

const abrirModalDelete = (doc) => {
  setDocParaDeletar(doc);
  setSenhaAdm('');
  setModalDeleteAberto(true);
};

const confirmarDelete = async () => {
  if (senhaAdm !== '985509') {
    toast.error('Senha incorreta');
    return;
  }
  if (!docParaDeletar) return;

  try {
    const res = await fetch(`${api}/documentos/${docParaDeletar.id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Erro ao deletar documento');
    toast.success('Documento deletado com sucesso');
    setModalDeleteAberto(false);
    setDocParaDeletar(null);
    fetchDocumentos(true);
  } catch {
    toast.error('Falha ao deletar documento');
  }
};


const confirmarExclusao = async () => {
  const precisaSenha = ['aprovado', 'saldo_liberado'].includes(docParaExcluir.status);

  if (precisaSenha && senhaExclusao !== '985509') {
    toast.error('Senha incorreta');
    return;
  }

  try {
    const res = await fetch(`${api}/documentos/${docParaExcluir.id}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) throw new Error('Erro ao deletar');

    toast.success('Documento deletado');
    setDocParaExcluir(null);
    setSenhaExclusao('');
    fetchDocumentos(true);
  } catch {
    toast.error('Erro ao deletar');
  }
};


  // Ao alterar filtros, resetar lista e buscar do zero
  useEffect(() => {
    setSkip(0);
    fetchDocumentos(true);
  }, [filtroUsuario, filtroStatus, filtroCte, filtroNome, dataInicial, dataFinal]);

  // Função para carregar mais, pode ser chamada ao scroll ou botão
  const carregarMais = () => {
    if (loading || !hasMore) return;
    fetchDocumentos(false);
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

// const handleSubmitUpload = async (e) => {
//   e.preventDefault();

//   if (!file || !nome.trim() || !placa.trim()) {
//     toast.error("Preencha todos os campos e selecione um arquivo.");
//     return;
//   }

//   const token = localStorage.getItem("token"); // exemplo, adapte ao seu caso

//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("nome", nome);
//   formData.append("placa", placa);

//   try {
//     const response = await fetch(`${api}/documentos/upload`, {
//       method: "POST",
//       body: formData,
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) throw new Error("Erro ao enviar documento");

//     toast.success("Documento enviado com sucesso!");
//     setNome("");
//     setPlaca("");
//     setFile(null);
//     setMostrarFormularioUpload(false);
//     fetchDocumentos();
//   } catch (error) {
//     toast.error(error.message || "Erro ao enviar documento");
//   }
// };


const handleSubmitUpload = async (e) => {
  e.preventDefault();

  if (!file || !nome.trim() || !placa.trim()) {
    toast.error("Preencha todos os campos e selecione um arquivo.");
    return;
  }

  setLoadingUpload(true);

  const token = localStorage.getItem("token"); // adapte se necessário

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
  } finally {
    setLoadingUpload(false);
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
  const isExpedicaoOuOcorrencia =
    userData.setor === 'expedicao' || userData.setor === 'ocorrencia';

  if (isExpedicaoOuOcorrencia) {
    return true;
  } else {
    return doc.usuario_id === userData.id;
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
  if (filtroCte) params.cte = filtroCte;
  if (filtroNome) params.nome = filtroNome;

  setSearchParams(params);
}, [filtroUsuario, filtroStatus, filtroCte, filtroNome]);



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


  

  useEffect(() => {
  if (!isAuthenticated) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";

  // 🔥 Defina aqui o backend dependendo do ambiente
const backendHost =
  window.location.hostname === "localhost"
    ? "localhost:8000"
    : "servidor.vps-kinghost.net:8000"; // coloca a porta correta aqui

  const wsUrl = `${protocol}://${backendHost}/api/documentos/ws/documentos?token=${encodeURIComponent(token)}`;

  const ws = new WebSocket(wsUrl);

  console.log("Conectando ao WebSocket:", wsUrl);

  // Intervalo para manter a conexão ativa
  let pingInterval;

  ws.onopen = () => {
    console.log("WebSocket conectado ✅");
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 30000);
  };

  ws.onmessage = (event) => {
    console.log("📩 Mensagem WebSocket:", event.data);
    fetchDocumentos();
  };

  ws.onerror = (error) => {
    console.error("❌ WebSocket erro:", error);
  };

  ws.onclose = (event) => {
    console.log("🔌 WebSocket desconectado", event.reason);
    clearInterval(pingInterval);
  };

  return () => {
    ws.close();
    clearInterval(pingInterval);
  };
}, [isAuthenticated]);

function juntarSemDuplicatas(arrayAntigo, arrayNovo) {
  const map = new Map();
  arrayAntigo.forEach(doc => map.set(doc.id, doc));
  arrayNovo.forEach(doc => map.set(doc.id, doc)); // sobrescreve se existir
  return Array.from(map.values());
}

const [loadingUpload, setLoadingUpload] = useState(false);




useEffect(() => {
  const ids = documentos.map((doc) => doc.id);
  const idsUnicos = [...new Set(ids)];
  if (ids.length !== idsUnicos.length) {
    console.warn('Tem documentos duplicados no estado:', documentos);
  }
}, [documentos]);

useEffect(() => {
  const intervalo = setInterval(() => {
    fetchDocumentos(true);
  }, 2000); // ou 3000 ms, como preferir

  return () => clearInterval(intervalo);
}, [filtroUsuario, filtroStatus, filtroCte, filtroNome, dataInicial, dataFinal]);



  return (
<div className="text-gray-800 max-w-6xl mx-auto p-6">
  {/* Botão Mostrar/Esconder Upload */}
  <button
    disabled={!isAuthenticated}
    onClick={() => setMostrarFormularioUpload(!mostrarFormularioUpload)}
    className={`cursor-pointer flex items-center gap-2 px-4 py-2 mb-4 border 
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
          placeholder="Nº CTe"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
        />
      </div>
      <InputFile onChange={(e) => setFile(e.target.files[0])} />
      {/* <button
        type="submit"
        className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-3 justify-center max-w-xs mx-auto"
      >
        <FaUpload size={18} /> Enviar Documento
      </button> */}

      <button
  type="submit"
  disabled={loadingUpload}
  className={`bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-3 justify-center max-w-xs mx-auto
    ${loadingUpload ? "opacity-70 cursor-not-allowed" : ""}
  `}
>
  {loadingUpload ? (
    <>
      <svg
        className="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      Enviando...
    </>
  ) : (
    <>
      <FaUpload size={18} /> Enviar Documento
    </>
  )}
</button>

    </form>
  )}



<div className="rounded-xl p-4 mb-6">
  <h2 className="text-lg font-semibold mb-4 text-white">Filtros</h2>

  <div className="flex flex-col sm:flex-row flex-wrap gap-4">


    <input
      className="border border-gray-500 bg-transparent rounded px-4 py-2 w-full sm:w-auto text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      placeholder="Nome do condutor"
      value={filtroNome}
      onChange={(e) => setFiltroNome(e.target.value)}
    />
        <input
      className="border border-gray-500 bg-transparent rounded px-4 py-2 w-full sm:w-auto text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      placeholder="Nº do CTE"
      value={filtroCte}
      onChange={(e) => setFiltroCte(e.target.value)}
    />
        <input
      className="border border-gray-500 bg-transparent rounded px-4 py-2 w-full sm:w-auto text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      placeholder="Usuário responsável"
      value={filtroUsuario}
      onChange={(e) => setFiltroUsuario(e.target.value)}
    />
    <input
      type="date"
      className="border border-gray-500 bg-transparent rounded px-4 py-2 w-full sm:w-auto text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      value={dataInicial}
      onChange={(e) => setDataInicial(e.target.value)}
    />
    <input
      type="date"
      className="border border-gray-500 bg-transparent rounded px-4 py-2 w-full sm:w-auto text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      value={dataFinal}
      onChange={(e) => setDataFinal(e.target.value)}
    />
    <select
      className="border border-gray-500 bg-transparent rounded px-4 py-2 w-full sm:w-auto text-white focus:outline-none focus:ring-2 focus:ring-green-500"
      value={filtroStatus}
      onChange={(e) => setFiltroStatus(e.target.value)}
    >
      <option value="" className="text-black">Todos os status</option>
      <option value="enviado" className="text-black">Enviado</option>
      <option value="aprovado" className="text-black">Aprovado</option>
      <option value="reprovado" className="text-black">Reprovado</option>
      <option value="saldo_liberado" className="text-black">Saldo Liberado</option>
    </select>

    <button
      onClick={() => {
        setFiltroUsuario('');
        setFiltroCte('');
        setFiltroNome('');
        setDataInicial('');
        setDataFinal('');
        setFiltroStatus('');
        setSearchParams({});
      }}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition border border-red-700"
    >
      Limpar Filtros
    </button>
  </div>
</div>



{!loading && documentos.length === 0 && (
  <div className="mt-6 p-4  text-center  text-white">
    Nenhum documento encontrado com os filtros atuais.
  </div>
)}


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
        key={`doc-${doc.id}`}
        className="bg-white rounded-sm shadow-md p-6 mb-8 border border-gray-200 hover:shadow-lg transition flex flex-col"
      >
        {/* Cabeçalho Documento */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div>
            <div className='flex mb-4 gap-4 items-center'>

            
<button
  onClick={() => {
    setDocParaExcluir(doc);
    setSenhaExclusao('');
  }}
  className="text-red-600 hover:text-red-800 p-2 rounded-md border border-red-600 hover:bg-red-100 transition flex items-center gap-1"
  title="Excluir documento"
>
  <FiTrash2 size={18} /> {/* Ícone bonito de lixeira */}
</button>



            <h3 className="text-xl font-semibold text-gray-600">
              {doc.nome} | <span className="text-gray-600">{doc.placa}</span>
            </h3>
            </div>
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

{docParaExcluir && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
      <h2 className="text-xl font-bold text-red-700 mb-4">Excluir Documento</h2>
      <p className="text-gray-700 mb-4">
        Tem certeza que deseja excluir o documento{' '}
        <strong>{docParaExcluir.nome} - {docParaExcluir.placa}</strong>?
      </p>

      {['aprovado', 'saldo_liberado'].includes(docParaExcluir.status) && (
        <input
          type="password"
          placeholder="Digite a senha de administrador"
          value={senhaExclusao}
          onChange={(e) => setSenhaExclusao(e.target.value)}
          className="w-full border px-4 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      )}

      <div className="flex justify-end gap-4">
        <button
          onClick={() => {
            setDocParaExcluir(null);
            setSenhaExclusao('');
          }}
          className="px-4 py-2 rounded-md border border-gray-400 hover:bg-gray-100"
        >
          Cancelar
        </button>

        <button
          onClick={confirmarExclusao}
          className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
        >
          Confirmar Exclusão
        </button>
      </div>
    </div>
  </div>
)}



      </div>
    );
  })}
</div>

  );
};

export default Documentos;



