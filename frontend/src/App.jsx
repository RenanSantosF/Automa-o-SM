// import { useState, useEffect } from 'react';
// import NovaSM from './components/Nova_smp/Index';
// import ListaSM from './components/Lista_smp/Index';
// import { LoginProvider, useLogin } from './Contexts/LoginContext';
// import LoginModal from './components/LoginModal/LoginModal';

// function App() {
//   const [mostrarFormulario, setMostrarFormulario] = useState(false);
//   const [execucoes, setExecucoes] = useState([]);
//   const { isAuthenticated } = useLogin();

//   const fetchExecucoes = async () => {
//     try {
//       const response = await fetch('http://localhost:8000/execucoes/');
//       const data = await response.json();
//       setExecucoes(data);
//     } catch (error) {
//       console.error('Erro ao buscar execucoes:', error);
//     }
//   };

//   useEffect(() => {
//     fetchExecucoes();
//   }, []);

//   return (
//     <LoginProvider>
//         {!isAuthenticated && <LoginModal />}
//       <div className="p-16 w-full font-poppins">
//         <button
//           onClick={() => setMostrarFormulario(!mostrarFormulario)}
//           className="cursor-pointer mb-3 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
//         >
//           {mostrarFormulario ? 'Fechar SMP' : 'Nova SMP'}
//         </button>

//         <div
//           className={`overflow-hidden transition-all duration-500 ease-out ${
//             mostrarFormulario ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'
//           }`}
//         >
//           {mostrarFormulario && <NovaSM onUploadSuccess={fetchExecucoes} onClose={() => setMostrarFormulario(false)}/>}
//         </div>

//         <ListaSM execucoes={execucoes} />
//       </div>
//     </LoginProvider>
//   );
// }

// export default App;


import { useState, useEffect } from 'react';
import NovaSM from './components/Nova_smp/Index';
import ListaSM from './components/Lista_smp/Index';
import { LoginProvider, useLogin } from './Contexts/LoginContext';
import LoginModal from './components/LoginModal/LoginModal';

function App() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [execucoes, setExecucoes] = useState([]);
  const { isAuthenticated } = useLogin();

  const fetchExecucoes = async () => {
    try {
      const response = await fetch('http://localhost:8000/execucoes/');
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
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="cursor-pointer mb-3 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
          >
            {mostrarFormulario ? 'Fechar SMP' : 'Nova SMP'}
          </button>

          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${mostrarFormulario ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            {mostrarFormulario && <NovaSM onUploadSuccess={fetchExecucoes} onClose={() => setMostrarFormulario(false)} />}
          </div>

          <ListaSM execucoes={execucoes} />
        </div>
      )}

    </>
  );
}

export default App;
