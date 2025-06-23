import { useState, useEffect } from 'react';
import NovaSM from '../components/Nova_smp/Index';
import ListaSM from '../components/Lista_smp/Index';
import Loader from '../components/loarder/Loader';
import { useLogin } from '../Contexts/LoginContext';
import { MdAddBox, MdClose } from 'react-icons/md';
import { motion } from 'framer-motion';
import { FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { HiKey } from 'react-icons/hi';

const api = import.meta.env.VITE_API_URL;

const SolicitacaoMonitoramento = () => {
  const tituloAnimacao = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaKey, setListaKey] = useState(0);
  const [execucoes, setExecucoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userData } = useLogin();

  const [showPassword, setShowPassword] = useState(false);

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
      setError('Erro ao buscar execuções.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecucoes();
  }, []);

  return (
    <div className="p-1 relative max-w-full">
      {/* Informações do usuário Apisul no topo direito */}
      <div className="absolute top-4 right-4 bg-[#1f1f1f]/80 border border-green-700 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm">
        <p className="flex items-center gap-2 text-sm text-gray-300">
          <FiUser className="text-green-400" />
          <span className="font-medium text-white">Usuário Apisul:</span>
          <span>{userData?.usuario_apisul || '--'}</span>
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
          <HiKey className="text-green-400" />
          <span className="font-medium text-white">Senha Apisul:</span>
          <span>{showPassword ? userData?.senha_apisul || '--' : '••••••••'}</span>
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

      {/* Botão abrir/fechar formulário */}
      <button
        disabled={!userData.usuario_apisul}
        onClick={() => setMostrarFormulario(!mostrarFormulario)}
        className={`cursor-pointer flex items-center gap-2 px-4 py-2 mb-4 border 
          ${
            !userData.usuario_apisul
              ? 'bg-gray-400 cursor-not-allowed border-gray-400'
              : 'bg-green-600 hover:bg-green-700 border-green-700'
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
        {mostrarFormulario ? 'Fechar' : 'Nova'}
      </button>

      {/* Formulário */}
      {mostrarFormulario && (
        <NovaSM onUploadSuccess={handleUploadSuccess} onClose={() => setMostrarFormulario(false)} />
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
