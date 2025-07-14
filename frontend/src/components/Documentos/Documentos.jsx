import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './SideBar';
import ChatBox from './ChatBox';
import UploadForm from './UploadForm';
import Filtros from './Filtros';
import { useLogin } from '../../Contexts/LoginContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const LIMIT = 20;
const api = import.meta.env.VITE_API_URL;

const Documentos = () => {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission !== 'granted') {
          console.log('Permissão de notificação foi negada.');
        }
      });
    }
  }, []);
  const documentosNotificados = useRef(new Set());
  const arquivosNotificados = useRef(new Set());
  const { userData, isAuthenticated } = useLogin();
  const [documentos, setDocumentos] = useState([]);
  const [documentoSelecionado, setDocumentoSelecionado] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [autoScrollChat, setAutoScrollChat] = useState(false);
  const comentariosNotificados = useRef(new Set());
  const [wsConectado, setWsConectado] = useState(true); // <- começa como falso
  const reconnectingRef = useRef(false);
  const delayTentativaTimeout = useRef(null);
  const socketRef = useRef(null);
  const [wsTentouConectar, setWsTentouConectar] = useState(false);
  const [reconnectLoading, setReconnectLoading] = useState(false);
  const [mobileView, setMobileView] = useState(window.innerWidth < 1050);
  const [modoMobile, setModoMobile] = useState('lista'); // 'lista' ou 'chat'

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

  const verificarNotificacoes = (docList) => {
    const agora = new Date();

    docList.forEach((doc) => {

          // 🚫 Ignora notificações se for do setor "outros" e não criou o documento
    if (userData.setor === 'outros' && doc.usuario_id !== userData.id) {
      return;
    }
      const novosArquivos = (doc.arquivos || []).filter((arquivo) => {
        const criadoEm = new Date(arquivo.criado_em);
        console.log('Verificando arquivo para notificação:', arquivo);
        const segundos = (agora - criadoEm) / 1000;
        return (
          arquivo.usuario?.id !== userData.id && // só notifica arquivos enviados por outros
          !arquivosNotificados.current.has(arquivo.id) &&
          segundos < 100
        );
      });

      for (const arquivo of novosArquivos) {
        console.log('🔔 Notificando arquivo:', arquivo.id, arquivo.nome_arquivo);
        if (Notification.permission === 'granted') {
          const notification = new Notification(`📎 Novo arquivo enviado`, {
            body: arquivo.nome_arquivo || 'Arquivo novo enviado',
            icon: '/icone-mensagem.png',
            tag: `arquivo-${arquivo.id}`,
          });
          notification.onclick = () => {
            localStorage.setItem('documentoParaAbrir', doc.id);
            window.focus();
          };
        }
        arquivosNotificados.current.add(arquivo.id);
      }

      // 🔔 Notificar novos COMENTÁRIOS
      const novosComentarios = (doc.comentarios_rel || []).filter((coment) => {
        const criadoEm = new Date(coment.criado_em);
        const segundos = (agora - criadoEm) / 1000;
        return (
          coment.usuario_id !== userData.id &&
          !comentariosNotificados.current.has(coment.id) &&
          segundos < 100
        );
      });

      for (const coment of novosComentarios) {
        console.log('🔔 Notificando comentário:', coment.id, coment.texto);
        if (Notification.permission === 'granted') {
          const notification = new Notification(
            `📨 Nova mensagem de ${coment.usuario?.username || 'Usuário'}`,
            {
              body: coment.texto || 'Comentário novo.',
              icon: '/icone-mensagem.png',
              tag: `comentario-${coment.id}`,
            }
          );

          notification.onclick = () => {
            localStorage.setItem('documentoParaAbrir', doc.id);
            window.focus();
          };
        }

        comentariosNotificados.current.add(coment.id);
      }

      // 🔔 Notificar NOVOS DOCUMENTOS
      const criadoEm = new Date(doc.criado_em);
      const segundos = (agora - criadoEm) / 1000;

      if (
        doc.usuario_id !== userData.id &&
        !documentosNotificados.current.has(doc.id) &&
        segundos < 100
      ) {
        documentosNotificados.current.add(doc.id);

        if (Notification.permission === 'granted') {
          const notification = new Notification(`📄 Novo documento: ${doc.nome}`, {
            body: `Enviado por ${doc.usuario?.username || 'usuário'}`,
            icon: '/icone-mensagem.png',
            tag: `documento-${doc.id}`,
          });

          notification.onclick = () => {
            localStorage.setItem('documentoParaAbrir', doc.id);
            window.focus();
          };
        }
      }

      // Se for o documento aberto, atualiza ele
      // if (documentoSelecionado?.id === doc.id) {
      //   setDocumentoSelecionado(doc);
      //   setAutoScrollChat(false);
      // }
      if (documentoSelecionadoRef.current?.id === doc.id) {
        setDocumentoSelecionado(doc);
        setAutoScrollChat(true);
      }
    });
  };

  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchDocumentosCompletos = async () => {
    const totalLimit = paginaAtual * LIMIT;
    return await fetchDocumentos(1, 'merge', false, totalLimit);
  };

  const documentoSelecionadoRef = useRef(null);

  useEffect(() => {
    documentoSelecionadoRef.current = documentoSelecionado;
  }, [documentoSelecionado]);

  const fetchDocumentos = async (
    pagina = 1,
    modo = 'merge',
    isAutoUpdate = false,
    limitOverride = null
  ) => {
    if (!isAutoUpdate && manualLoading) return;
    if (!isAutoUpdate) setManualLoading(true);

    const params = new URLSearchParams();
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
          (a, b) =>
            new Date(b.atualizado_em || b.criado_em) - new Date(a.atualizado_em || a.criado_em)
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
    // fetchDocumentos(1);
    fetchDocumentos(1).then((docs) => {
      const idParaAbrir = localStorage.getItem('documentoParaAbrir');
      if (idParaAbrir) {
        const doc = docs.find((d) => String(d.id) === idParaAbrir);
        if (doc) selecionarDocumento(doc);
        localStorage.removeItem('documentoParaAbrir');
      }
    });
  }, [filtros]);

  const conectarWebSocket = useCallback(() => {
    const socket = new WebSocket(
      `${api.replace(/^http/, 'ws')}/documentos/ws/documentos?token=${localStorage.getItem(
        'token'
      )}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket conectado');
      setWsConectado(true);
      setWsTentouConectar(false); // oculta botão
      if (delayTentativaTimeout.current) {
        clearTimeout(delayTentativaTimeout.current);
        delayTentativaTimeout.current = null;
      }
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.tipo === 'documentos_atualizados') {
          console.log('📡 Atualização recebida via WebSocket');
          const atualizados = await fetchDocumentosCompletos();
          if (atualizados) {
            verificarNotificacoes(atualizados);
          }
        }
      } catch (err) {
        console.error('Erro ao processar mensagem WebSocket:', err);
      }
    };

    socket.onclose = () => {
      console.warn('🔌 WebSocket desconectado');
      setWsConectado(false);
      setWsTentouConectar(true);

      if (!reconnectingRef.current) {
        reconnectingRef.current = true;
        setTimeout(() => {
          reconnectingRef.current = false;
          conectarWebSocket();
        }, 5000);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ Erro no WebSocket:', error);
      socket.close();
    };
  });

  useEffect(() => {
    conectarWebSocket();

    return () => {
      socketRef.current?.close();
      if (delayTentativaTimeout.current) clearTimeout(delayTentativaTimeout.current);
    };
  }, []);

  const carregarMais = () => {
    if (!loading && hasMore) {
      const proximaPagina = paginaAtual + 1;
      setPaginaAtual(proximaPagina);
      fetchDocumentos(proximaPagina);
    }
  };

  useEffect(() => {
    const idParaAbrir = localStorage.getItem('documentoParaAbrir');
    if (idParaAbrir && documentos.length > 0) {
      const doc = documentos.find((d) => String(d.id) === idParaAbrir);
      if (doc) {
        selecionarDocumento(doc);
        localStorage.removeItem('documentoParaAbrir');
      } else {
        // Caso ainda não esteja na lista, tenta carregar mais páginas até encontrar
        if (hasMore) {
          carregarMais();
        }
      }
    }
  }, [documentos]);

  const selecionarDocumento = async (doc) => {
    try {
      // Chama backend para marcar visualizado
      await fetch(`${api}/documentos/${doc.id}/marcar-visualizados`, {
        method: 'POST',
        headers,
      });

      // Atualiza localmente o doc incluindo userData.id em visualizado_por nos comentários e arquivos
      const adicionarUsuarioSeNaoTem = (arr = []) =>
        arr.map((item) => {
          const visualizados = item.visualizado_por || [];
          if (!visualizados.includes(userData.id)) {
            return { ...item, visualizado_por: [...visualizados, userData.id] };
          }
          return item;
        });

      const docAtualizado = {
        ...doc,
        comentarios_rel: adicionarUsuarioSeNaoTem(doc.comentarios_rel),
        arquivos: adicionarUsuarioSeNaoTem(doc.arquivos),
      };

      setDocumentoSelecionado(docAtualizado);

      // Atualiza também o documento na lista lateral
      setDocumentos((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? docAtualizado : d)));

      setAutoScrollChat(true);

      if (mobileView) {
        setModoMobile('chat');
      }
    } catch (err) {
      console.error('Erro ao marcar como visualizado', err);
      toast.error('Erro ao marcar documento como visualizado.');
    }
  };

  const voltarParaLista = () => {
    setModoMobile('lista');
    setDocumentoSelecionado(null);
  };

  // Atualiza mobileView ao redimensionar janela
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1050;
      setMobileView(isMobile);
      if (!isMobile) {
        setModoMobile('lista'); // sempre mostrar lista+chat lado a lado em tela grande
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const documentosFiltrados =
    userData.setor === 'outros'
      ? documentos.filter((doc) => doc.usuario_id === userData.id)
      : documentos;

return (
  <div className="flex h-[calc(100dvh-20px)] bg-white rounded-md overflow-hidden border">
    {/* Sidebar / Lista */}
    {(!mobileView || modoMobile === 'lista') && (
      <div
        className={`bg-gray-100 border-r flex flex-col ${mobileView ? 'w-full' : 'w-[510px]'}`}
      >
        {/* Topo fixo: Upload + Filtros */}
        <div className="sticky top-0 z-10 bg-gray-100 border-b space-y-4">
          <UploadForm
            isAuthenticated={isAuthenticated}
            fetchDocumentos={() => fetchDocumentos(1)}
          />
          <Filtros filtros={filtros} setFiltros={setFiltros} />
        </div>

        {!wsConectado && wsTentouConectar && (
          <div className="px-4 mt-2 pb-2 flex justify-start">
            <button
              onClick={async () => {
                if (!reconnectingRef.current) {
                  reconnectingRef.current = true;
                  setReconnectLoading(true);
                  try {
                    conectarWebSocket();
                    toast.success('Tentando reconectar...');
                    setTimeout(() => {
                      if (!socketRef.current || socketRef.current.readyState !== 1) {
                        toast.error('Falha na reconexão');
                      }
                    }, 3000);
                  } catch (err) {
                    toast.error('Erro ao reconectar');
                    console.error(err);
                  } finally {
                    setReconnectLoading(false);
                    setTimeout(() => {
                      reconnectingRef.current = false;
                    }, 5000);
                  }
                }
              }}
              disabled={reconnectLoading}
              className={`flex items-center gap-2 px-4 py-2 ${
                reconnectLoading ? 'bg-red-100 cursor-not-allowed' : 'bg-red-50 hover:bg-red-100'
              } text-red-600 text-sm rounded-md border border-red-200 shadow-sm transition`}
            >
              {reconnectLoading ? (
                <svg
                  className="animate-spin h-4 w-4 text-red-600"
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
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 5.636l-1.414 1.414A9 9 0 106.05 17.95l1.414-1.414"
                  />
                </svg>
              )}
              <span>
                {reconnectLoading ? 'Reconectando...' : 'Conexão perdida. Tente novamente'}
              </span>
            </button>
          </div>
        )}

        {/* Lista scrollável */}
        <div
          className={`flex-1 ${
            mobileView && modoMobile === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          <div className="flex w-full pt-2 justify-center ">
            <span className="text-gray-500 font-medium ">Conversas</span>
          </div>

          <Sidebar
            documentos={documentosFiltrados}
            onSelecionar={(doc) => {
              selecionarDocumento(doc);
              if (mobileView) setModoMobile('chat');
            }}
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
    )}

    {/* AnimatePresence envolvendo só o chatbox para animação */}
    <AnimatePresence initial={false} mode="wait">
      {(!mobileView || modoMobile === 'chat') && (
        <motion.div
          key="chatbox"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`flex-1 bg-white relative overflow-hidden`}
        >
          {/* Botão fechar mobile */}
          {mobileView && modoMobile === 'chat' && (
            <button
              onClick={() => {
                setModoMobile('lista');
                setDocumentoSelecionado(null);
              }}
              className="absolute top-4 right-4 z-10 flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition"
              aria-label="Fechar chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Fechar
            </button>
          )}

          {/* Conteúdo do chat ou mensagem */}
          {documentoSelecionado ? (
            <div className={`flex flex-col ${mobileView ? 'h-[calc(100dvh-64px)]' : 'h-full'}`}>
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
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xl">
              Selecione um documento para visualizar a conversa.
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

};

export default Documentos;
