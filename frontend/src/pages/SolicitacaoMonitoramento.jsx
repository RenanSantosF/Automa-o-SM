import { useState, useEffect } from "react";
import NovaSM from "../components/Nova_smp/Index";
import ListaSM from "../components/Lista_smp/Index";
import Loader from "../components/loarder/Loader";
import { useLogin } from "../Contexts/LoginContext";

const api = import.meta.env.VITE_API_URL;

const SolicitacaoMonitoramento = () => {
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
      <button
        disabled={!userData.usuario}
        onClick={() => setMostrarFormulario(!mostrarFormulario)}
        className={`mb-4 px-6 py-2 text-sm ${
          !userData.usuario
            ? "bg-gray-400"
            : "bg-green-600 hover:bg-green-700"
        } text-white rounded`}
      >
        {mostrarFormulario ? "Fechar SMP" : "Nova SMP"}
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
