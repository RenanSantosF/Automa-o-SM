import { useState, useEffect } from 'react';
import Sidebar from './SideBar';
import ChatBox from './ChatBox';
import UploadForm from './UploadForm';
import Filtros from './Filtros';
import { useLogin } from '../../Contexts/LoginContext';
import { toast } from 'react-toastify';

const LIMIT = 20;
const api = import.meta.env.VITE_API_URL;

const Documentos = () => {
  const { userData, isAuthenticated } = useLogin();
  const [documentos, setDocumentos] = useState([]);
  const [documentoSelecionado, setDocumentoSelecionado] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [autoScrollChat, setAutoScrollChat] = useState(false);

  const [filtros, setFiltros] = useState({
    usuario: '',
    status: '',
    cte: '',
    nome: '',
    cliente: '',
    dataMaloteInicial: '',
    dataMaloteFinal: '',
    dataInicial: '',
    dataFinal: '',
  });

  const [modalReprovarAberto, setModalReprovarAberto] = useState(null);
  const [motivoReprovacao, setMotivoReprovacao] = useState({});

  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchDocumentosCompletos = async () => {
    const totalLimit = paginaAtual * LIMIT;
    return await fetchDocumentos(1, 'merge', false, totalLimit);
  };

  const fetchDocumentos = async (
    pagina = 1,
    modo = 'merge',
    isAutoUpdate = false,
    limitOverride = null
  ) => {
    if (!isAutoUpdate && manualLoading) return;
    if (!isAutoUpdate) setManualLoading(true);

    const params = new URLSearchParams();
    // Object.entries(filtros).forEach(([key, val]) => {
    //   if (val) params.append(key === 'dataMalote' ? 'data_malote' : key, val);
    // });
    if (filtros.nome) params.append('nome', filtros.nome);
    if (filtros.usuario) params.append('usuario', filtros.usuario);
    if (filtros.status) params.append('status', filtros.status);
    if (filtros.cte) params.append('cte', filtros.cte);
    if (filtros.cliente) params.append('cliente', filtros.cliente);

    // Data do malote como um único dia
    if (filtros.dataMaloteInicial) {
      params.append('data_malote_inicial', filtros.dataMaloteInicial);
    }
    if (filtros.dataMaloteFinal) {
      params.append('data_malote_final', filtros.dataMaloteFinal);
    }

    if (filtros.dataInicial) params.append('data_inicial', filtros.dataInicial);
    if (filtros.dataFinal) params.append('data_final', filtros.dataFinal);

    params.append('skip', ((pagina - 1) * LIMIT).toString());
    params.append('limit', (limitOverride || LIMIT).toString());

    try {
      const res = await fetch(`${api}/documentos/todos?${params}`, { headers });
      if (!res.ok) throw new Error('Erro ao buscar documentos');
      const data = await res.json();

      setDocumentos((prev) => {
        const map = new Map(prev.map((d) => [d.id, d]));
        data.forEach((doc) => map.set(doc.id, doc));
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.criado_em) - new Date(a.criado_em)
        );
      });

      if (!isAutoUpdate) {
        setHasMore(data.length === LIMIT);
      }
      return data;
    } catch (err) {
      if (!isAutoUpdate) toast.error('Erro ao carregar documentos');
      console.error(err);
    } finally {
      if (!isAutoUpdate) setManualLoading(false);
    }
  };

  useEffect(() => {
    setDocumentos([]);
    fetchDocumentos(1);
  }, [filtros]);

  // 🔁 Atualização automática a cada 15s sem sobrescrever ou duplicar
  useEffect(() => {
    const intervalo = setInterval(async () => {
      const totalLimit = paginaAtual * LIMIT;
      const atualizados = await fetchDocumentos(1, 'merge', true, totalLimit);

      if (documentoSelecionado && atualizados) {
        const atualizado = atualizados.find((d) => d.id === documentoSelecionado.id);
        if (atualizado) {
          setDocumentoSelecionado(atualizado);
          setAutoScrollChat(false); // 🚫 Desliga scroll automático
        }
      }
    }, 15000); // 7 segundos

    return () => clearInterval(intervalo);
  }, [documentoSelecionado?.id, paginaAtual, filtros]);

  const carregarMais = () => {
    if (!loading && hasMore) {
      const proximaPagina = paginaAtual + 1;
      setPaginaAtual(proximaPagina);
      fetchDocumentos(proximaPagina);
    }
  };

  const selecionarDocumento = (doc) => {
    setDocumentoSelecionado(doc);
    setAutoScrollChat(true);
  };

  const documentosFiltrados =
    userData.setor === 'outros'
      ? documentos.filter((doc) => doc.usuario_id === userData.id)
      : documentos;

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-md overflow-hidden border">
      {/* Sidebar (Lista) */}
      <div className="w-[510px] bg-gray-100 border-r flex flex-col">
        {/* Topo fixo: Upload + Filtros */}
        <div className="sticky top-0 z-10 bg-gray-100  border-b space-y-4">
          <UploadForm
            isAuthenticated={isAuthenticated}
            fetchDocumentos={() => fetchDocumentos(1)}
          />
          <Filtros filtros={filtros} setFiltros={setFiltros} />
        </div>

        {/* Lista scrollável */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex w-full pt-2 justify-center ">
            <span className="text-gray-500 font-medium ">Conversas</span>
          </div>

          <Sidebar
            documentos={documentosFiltrados}
            onSelecionar={selecionarDocumento}
            documentoSelecionado={documentoSelecionado}
          />

          {hasMore && (
            <div className="p-4 text-center">
              <button
                onClick={carregarMais}
                className="mx-auto mt-4 flex items-center justify-center gap-2 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                </svg>
                Carregar mais
              </button>
            </div>
          )}
          {!hasMore && documentos.length > 0 && (
            <div className="p-4 text-center text-gray-400">Nada encontrado.</div>
          )}
        </div>
      </div>

      {/* ChatBox (Conversa) */}
      <div className="flex-1 overflow-y-auto bg-white">
        {documentoSelecionado ? (
          <ChatBox
            doc={documentoSelecionado}
            userData={userData}
            headers={headers}
            setDocumentoSelecionado={setDocumentoSelecionado}
            fetchDocumentos={fetchDocumentosCompletos}
            motivoReprovacao={motivoReprovacao}
            setMotivoReprovacao={setMotivoReprovacao}
            setModalReprovarAberto={setModalReprovarAberto}
            modalReprovarAberto={modalReprovarAberto}
            autoScroll={autoScrollChat}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-xl">
            Selecione um documento para visualizar a conversa.
          </div>
        )}
      </div>
    </div>
  );
};

export default Documentos;
