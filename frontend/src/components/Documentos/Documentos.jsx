import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './SideBar';
import ChatBox from './ChatBox';
import UploadForm from './UploadForm';
import Filtros from './Filtros';
import { useLogin } from '../../Contexts/LoginContext';
import { toast } from 'react-toastify';

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

      const novosArquivos = (doc.arquivos || []).filter((arquivo) => {
  const criadoEm = new Date(arquivo.criado_em);
  const segundos = (agora - criadoEm) / 1000;
  return (
    arquivo.usuario_id !== userData.id && // só notifica arquivos enviados por outros
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
        setAutoScrollChat(false);
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

      // Só ativa o botão depois de 10s desconectado
      if (delayTentativaTimeout.current) clearTimeout(delayTentativaTimeout.current);
      delayTentativaTimeout.current = setTimeout(() => {
        setWsTentouConectar(true);
      }, 10000); // 10 segundos

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
      await fetch(`${api}/documentos/${doc.id}/marcar-visualizados`, {
        method: 'POST',
        headers,
      });

      // ✅ Atualiza o doc manualmente marcando todas as mensagens como visualizadas
      const docAtualizado = {
        ...doc,
        comentarios_rel: doc.comentarios_rel.map((coment) => ({
          ...coment,
          visualizado_por: [...(coment.visualizado_por || []), userData.id],
        })),
      };

      setDocumentoSelecionado(docAtualizado);

      // ✅ Atualiza também na lista lateral (documentos[])
      setDocumentos((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? docAtualizado : d)));

      setAutoScrollChat(true);
    } catch (err) {
      console.error('Erro ao marcar como visualizado', err);
    }
  };

  const documentosFiltrados =
    userData.setor === 'outros'
      ? documentos.filter((doc) => doc.usuario_id === userData.id)
      : documentos;

  return (
    <div className="flex h-[calc(100vh-20px)]  bg-white rounded-md overflow-hidden border">
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
        {!wsConectado && wsTentouConectar && (
          <div className="px-4 mt-2 pb-2 flex justify-start">
            <button
              onClick={() => {
                if (!reconnectingRef.current) {
                  reconnectingRef.current = true;
                  conectarWebSocket();
                  setTimeout(() => {
                    reconnectingRef.current = false;
                  }, 5000);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-md border border-red-200 shadow-sm transition"
            >
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
              <span>Conexão perdida. Tente novamente</span>
            </button>
          </div>
        )}

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
