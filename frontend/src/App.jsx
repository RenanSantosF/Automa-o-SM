
import { useState, useEffect } from 'react';
import NovaSM from './components/Nova_smp/Index';
import ListaSM from './components/Lista_smp/Index';
import { useLogin } from './Contexts/LoginContext';
import LoginModal from './components/LoginModal/LoginModal';
import { IoLogOutOutline } from "react-icons/io5";
const api = import.meta.env.VITE_API_URL;


function App() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [execucoes, setExecucoes] = useState([]);
  const { isAuthenticated, setIsAuthenticated, userData } = useLogin();

  const fetchExecucoes = async () => {
    try {
      const response = await fetch(`${api}/execucoes/`);
      const data = await response.json();
      setExecucoes(data);
    } catch (error) {
      console.error('Erro ao buscar execucoes:', error);
    }
  };

  useEffect(() => {
    fetchExecucoes();
  }, []);

  return (
    <>
    
      {!isAuthenticated && <LoginModal />}
      {isAuthenticated && (
        <div className="p-16 w-full font-poppins">
          <div className='flex justify-between'>
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className={`cursor-pointer mb-3 px-6 py text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200`}
            >
              {mostrarFormulario ? 'Fechar SMP' : 'Nova SMP'}
            </button>

            <div className='items-center flex flex-col'>
              <span className='text-white'>{userData.usuario}</span>
              <button
                onClick={() => setIsAuthenticated(!isAuthenticated)}

                className=" items-center gap-1 flex cursor-pointer mb-3 px-2 py-1 text-xs bg-green-200 text-gray-900 rounded-md hover:bg-green-300 transition duration-200"
              >
                Sair
                <IoLogOutOutline/>
              </button>

            </div>


          </div>
          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${mostrarFormulario ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            {mostrarFormulario && <NovaSM onUploadSuccess={fetchExecucoes} onClose={() => setMostrarFormulario(false)} />}
          </div>
          <div className='flex-1 overflow-auto'>
            <ListaSM execucoes={execucoes} />
          </div>
          
        </div>
      )}

    </>
  );
}

export default App;
