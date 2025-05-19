import { useState, useEffect } from 'react';
import NovaSM from './components/Nova_smp/Index';
import ListaSM from './components/Lista_smp/Index';
import { useLogin } from './Contexts/LoginContext';
import LoginModal from './components/LoginModal/LoginModal';
import Loader from './components/loarder/Loader';
import { IoLogOutOutline } from "react-icons/io5";

const api = import.meta.env.VITE_API_URL;

function App() {
  const [listaKey, setListaKey] = useState(0);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [execucoes, setExecucoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isAuthenticated, setIsAuthenticated, userData } = useLogin();

  const handleUploadSuccess = () => {
    setListaKey(prev => prev + 1); // força remontagem da ListaSM
  };
  const fetchExecucoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${api}/execucoes/`);
      if (!response.ok) {
        throw new Error(`Erro na resposta da API: ${response.statusText}`);
      }
      const data = await response.json();
      setExecucoes(data);
    } catch (error) {
      console.error('Erro ao buscar execucoes:', error);
      setError('Erro ao buscar execuções. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecucoes();
  }, []);

  return (
    <>
      {!isAuthenticated && <LoginModal />}
      {isAuthenticated && (
        <div className="py-16 px-2 w-full font-poppins">
          <div className='flex px-2 justify-between'>
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className={`cursor-pointer mb-3 px-6 py text-sm bg-green-600 text-white rounded-sm hover:bg-green-700 transition duration-200`}
            >
              {mostrarFormulario ? 'Fechar SMP' : 'Nova SMP'}
            </button>

            <div className='items-center flex flex-col'>
              <span className='text-white'>{userData.usuario}</span>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="items-center gap-1 flex cursor-pointer mb-3 px-2 py-1 text-xs bg-green-200 text-gray-900 rounded-sm hover:bg-green-300 transition duration-200"
              >
                Sair
                <IoLogOutOutline/>
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${mostrarFormulario ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            {mostrarFormulario && <NovaSM onUploadSuccess={handleUploadSuccess} onClose={() => setMostrarFormulario(false)} />}
          </div>

          <div className='min-h-64 flex-1 justify-center items-center flex overflow-auto'>
            {loading && <Loader />}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && execucoes.length === 0 && (
              <p className="text-white">Nenhuma execução encontrada no banco.</p>
            )}
            {!loading && !error && execucoes.length > 0 && (
              <ListaSM key={listaKey} execucoes={execucoes} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
