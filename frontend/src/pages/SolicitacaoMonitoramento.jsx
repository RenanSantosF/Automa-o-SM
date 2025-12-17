
import { useState, useEffect, useRef, useCallback } from "react";
import NovaSM from "../components/Nova_smp/Index";
import ListaSM from "../components/Lista_smp/Index";
import Loader from "../components/loarder/Loader";
import { useLogin } from "../Contexts/LoginContext";
import { MdAddBox, MdClose } from "react-icons/md";
import { motion } from "framer-motion";
import { FiUser, FiEye, FiEyeOff } from "react-icons/fi";
import { HiKey } from "react-icons/hi";

const api = import.meta.env.VITE_API_URL;

const SolicitacaoMonitoramento = () => {
  const tituloAnimacao = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaKey, setListaKey] = useState(0);
  const [execucoes, setExecucoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userData } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  // ---- WebSocket references ----
  const socketSMRef = useRef(null);
  const reconnectingRef = useRef(false);
// ------------------------------------------------------------
// 🚀 Buscar execucoes
// ------------------------------------------------------------
const fetchExecucoes = async () => {
  setLoading(true);
  setError(null);

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Usuário não autenticado.");
      setExecucoes([]);
      return;
    }

    const res = await fetch(`${api}/execucoes/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.detail || "Erro ao buscar execuções.");
      setExecucoes([]);
      return;
    }

    setExecucoes(data);
  } catch (err) {
    console.error("Erro fetchExecucoes:", err);
    setError("Erro ao buscar execuções.");
    setExecucoes([]);
  } finally {
    setLoading(false);
  }
};



  const handleUploadSuccess = () => {
    setListaKey((prev) => prev + 1);
    fetchExecucoes();
  };

  // ------------------------------------------------------------
  // 🔔 Conexão WebSocket com reconexão segura
  // ------------------------------------------------------------
  const conectarWS_SM = useCallback(() => {
    if (socketSMRef.current) return; // ❗ Impede múltiplas conexões

    const token = localStorage.getItem("token");

    const wsURL =
      import.meta.env.VITE_API_URL.replace(/^http/, "ws") +
      `/ws/notificacoes?token=${token}`;

    console.log("📡 Conectando WS:", wsURL);

    const socket = new WebSocket(wsURL);
    socketSMRef.current = socket;

    socket.onopen = () => {
      console.log("🟢 WebSocket SMP conectado");

      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    };

    socket.onmessage = (event) => {
      let data;

      try {
        data = JSON.parse(event.data);
      } catch {
        console.warn("Mensagem WS inválida:", event.data);
        return;
      }

      // Apenas processa os 3 tipos
      if (!["sucesso", "erro", "reprocessamento"].includes(data.tipo)) {
        return;
      }

      const titulo =
        data.tipo === "sucesso"
          ? "SMP criada com sucesso"
          : data.tipo === "erro"
          ? "Erro ao criar SMP"
          : "Reprocessamento iniciado";

      const messageId = `${data.tipo}-${data.mensagem}`;

      // ---- Toasts se aba estiver ativa ----
      if (document.visibilityState === "visible") {
        import("react-toastify").then(({ toast }) => {
          toast.dismiss(messageId); // Evita duplicação
          toast[data.tipo === "erro" ? "error" : "success"](data.mensagem, {
            toastId: messageId,
            autoClose: 5000,
          });
        });
      }

      // ---- Notification se aba estiver inativa ----
      else if (Notification.permission === "granted") {
        try {
          new Notification(titulo, {
            body: data.mensagem,
          });
        } catch (err) {
          console.error("Falha ao exibir notificação:", err);
        }
      }

      // Atualiza lista APENAS para sucesso/erro
      if (data.tipo !== "reprocessamento") {
        handleUploadSuccess();
      }
    };

    socket.onerror = (err) => {
      console.error("❌ WS SMP erro:", err);
      socket.close();
    };

    socket.onclose = () => {
      console.warn("🔌 WS SMP desconectado");

      if (!reconnectingRef.current) {
        reconnectingRef.current = true;

        setTimeout(() => {
          reconnectingRef.current = false;

          // reconectar apenas se estiver fechado
          if (!socketSMRef.current || socketSMRef.current.readyState === WebSocket.CLOSED) {
            socketSMRef.current = null;
            conectarWS_SM();
          }
        }, 4000);
      }
    };
  }, []);

  // ------------------------------------------------------------
  // 🔄 Carregar execucoes + conectar WS uma única vez
  // ------------------------------------------------------------
  useEffect(() => {
    conectarWS_SM();
    fetchExecucoes();

    return () => {
      socketSMRef.current?.close();
      socketSMRef.current = null;
    };
  }, []);

  return (
    <div className="p-1 relative max-w-full">
      {/* Informações do usuário Apisul no topo */}
      <div className="absolute top-4 right-4 bg-[#1f1f1f]/80 border border-green-700 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm">
        <p className="flex items-center gap-2 text-sm text-gray-300">
          <FiUser className="text-green-400" />
          <span className="font-medium text-white">Usuário Apisul:</span>
          <span>{userData?.usuario_apisul || "--"}</span>
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
          <HiKey className="text-green-400" />
          <span className="font-medium text-white">Senha Apisul:</span>
          <span>{showPassword ? userData?.senha_apisul || "--" : "••••••••"}</span>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="text-green-400 hover:text-green-500"
          >
            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
      </div>

      {/* Título */}
      <motion.h1
        className="text-xl font-semibold text-white text-center mb-4 select-none tracking-wide"
        initial="hidden"
        animate="visible"
        variants={tituloAnimacao}
      >
        Solicitação de Monitoramento
      </motion.h1>

      {/* Botão abrir/fechar */}
      <button
        disabled={!userData.usuario_apisul}
        onClick={() => setMostrarFormulario(!mostrarFormulario)}
        className={`cursor-pointer flex items-center gap-2 px-4 py-2 mb-4 border 
          ${
            !userData.usuario_apisul
              ? "bg-gray-400 cursor-not-allowed border-gray-400"
              : "bg-green-600 hover:bg-green-700 border-green-700"
          } 
          text-white rounded-md transition duration-300`}
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: mostrarFormulario ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {mostrarFormulario ? <MdClose size={20} /> : <MdAddBox size={20} />}
        </motion.div>
        {mostrarFormulario ? "Fechar" : "Nova"}
      </button>

      {/* Formulário */}
      {mostrarFormulario && (
        <NovaSM
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setMostrarFormulario(false)}
        />
      )}

      {/* Lista */}
      <div className="mt-4 text-center">
        {loading && <Loader />}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && execucoes.length === 0 && (
          <p className="text-white">Nenhuma execução encontrada.</p>
        )}
        {!loading && !error && execucoes.length > 0 && (
          <ListaSM key={listaKey} execucoes={execucoes} />
        )}
      </div>
    </div>
  );
};

export default SolicitacaoMonitoramento;
