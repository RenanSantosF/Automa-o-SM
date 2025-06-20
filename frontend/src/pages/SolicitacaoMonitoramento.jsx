import { useState, useEffect } from "react";
import NovaSM from "../components/Nova_smp/Index";
import ListaSM from "../components/Lista_smp/Index";
import Loader from "../components/loarder/Loader";
import { useLogin } from "../Contexts/LoginContext";
import { MdAddBox, MdClose } from "react-icons/md"
import { motion } from "framer-motion";

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

  const handleUploadSuccess = () => {
    setListaKey((prev) => prev + 1);
    fetchExecucoes();
  };

  const fetchExecucoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${api}/execucoes/`);
      if (!response.ok) throw new Error(`Erro: ${response.statusText}`);
      const data = await response.json();
      setExecucoes(data);
    } catch (error) {
      setError("Erro ao buscar execuções.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecucoes();
  }, []);

  return (
    <div className="p-6">

    {/* Título menor, discreto e animado */}
    <motion.h1
      className="text-xl font-semibold text-white text-center mb-4 select-none tracking-wide"
      initial="hidden"
      animate="visible"
      variants={tituloAnimacao}
    >
      Solicitação de Monitoramento
    </motion.h1>
      <button
        disabled={!userData.usuario}
        onClick={() => setMostrarFormulario(!mostrarFormulario)}
        className={`flex items-center gap-2 px-4 py-2 mb-4 border 
          ${!userData.usuario
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

      {mostrarFormulario && (
        <NovaSM
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setMostrarFormulario(false)}
        />
      )}

      <div className="mt-4">
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
