// import { useState, useEffect } from 'react';
// import NovaSM from './components/Nova_smp/Index';
// import ListaSM from './components/Lista_smp/Index';
// import { useLogin } from './Contexts/LoginContext';
// import LoginModal from './components/LoginModal/LoginModal';
// import Loader from './components/loarder/Loader';
// import { IoLogOutOutline } from "react-icons/io5";
// import UploadCtes from './components/UploadCTe/UploadCtes';
// import ListaNfe from './components/ListaNfe/ListaNfe';

// const api = import.meta.env.VITE_API_URL;

// function App() {
//   const [abaAtiva, setAbaAtiva] = useState('SMP');
//   const [listaKey, setListaKey] = useState(0);
//   const [mostrarFormulario, setMostrarFormulario] = useState(false);
//   const [execucoes, setExecucoes] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const { isAuthenticated, setIsAuthenticated, userData } = useLogin();

//   const handleUploadSuccess = () => {
//     setListaKey(prev => prev + 1); // força remontagem da ListaSM
//   };
//   const fetchExecucoes = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(`${api}/execucoes/`);
//       if (!response.ok) {
//         throw new Error(`Erro na resposta da API: ${response.statusText}`);
//       }
//       const data = await response.json();
//       setExecucoes(data);
//     } catch (error) {
//       console.error('Erro ao buscar execucoes:', error);
//       setError('Erro ao buscar execuções. Tente novamente.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchExecucoes();
//   }, []);

//   return (
//     <>
//       {!isAuthenticated && <LoginModal />}
//       {isAuthenticated && (


//         <div className="py-8 px-2 w-full font-poppins">

//           {/* Botões de navegação entre abas */}
//           <div className="w-full justify-center mb-8 flex space-x-4">
//             <button
//               onClick={() => setAbaAtiva('SMP')}
//               className={`px-4 py-2 rounded-sm text-sm font-medium ${
//                 abaAtiva === 'SMP' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//               }`}
//             >
//               Solicitação de monitoramento
//             </button>
//             <button
//               onClick={() => setAbaAtiva('NFE')}
//               className={`px-4 py-2 rounded-sm text-sm font-medium ${
//                 abaAtiva === 'NFE' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//               }`}
//             >
//               Importação NFE
//             </button>
//           </div>

//           {abaAtiva === "SMP" &&(
//             <div>
//               <div className='flex px-2 justify-between'>
//                 <button
//                 disabled={!userData.usuario}
//                   onClick={() => setMostrarFormulario(!mostrarFormulario)}
//                   className={`cursor-pointer mb-3 px-6 py-2 text-sm ${!userData.usuario ? "bg-gray-400 " : "bg-green-600 hover:bg-green-700"}  text-white rounded-sm  transition duration-200`}
//                 >
//                   {mostrarFormulario ? 'Fechar SMP' : 'Nova SMP'}
//                 </button>



//                 <div className='items-center flex flex-col'>
//                   <span className='text-white'>{userData.usuario}</span>
//                   <button
//                     onClick={() => setIsAuthenticated(false)}
//                     className="items-center gap-1 flex cursor-pointer mb-3 px-2 py-1 text-xs bg-green-200 text-gray-900 rounded-sm hover:bg-green-300 transition duration-200"
//                   >
//                     {userData.usuario ? 'Sair' : 'Entrar'}
//                     <IoLogOutOutline />
//                   </button>
//                 </div>
//               </div>

//               <div
//                 className={`overflow-hidden transition-all duration-500 ease-out ${mostrarFormulario ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}
//               >
//                 {abaAtiva === "SMP" && mostrarFormulario && <NovaSM onUploadSuccess={handleUploadSuccess} onClose={() => setMostrarFormulario(false)} />}
//               </div>

//               <div className='min-h-64 flex-1 justify-center items-center flex overflow-auto'>
//                 {loading && <Loader />}
//                 {error && <p className="text-red-500">{error}</p>}
//                 {!loading && !error && execucoes.length === 0 && (
//                   <p className="text-white">Nenhuma execução encontrada no banco.</p>
//                 )}
//                 {abaAtiva === "SMP" && !loading && !error && execucoes.length > 0 && (
//                   <ListaSM key={listaKey} execucoes={execucoes} />
//                 )}
//               </div>
//           </div>
//           )}

//           {abaAtiva === "NFE" && (
//             <>
//               <UploadCtes />
//               <ListaNfe />
//             </>
//           )}
//         </div>
//       )}
//     </>
//   );
// }

// export default App;


import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useLogin } from "./Contexts/LoginContext";
import LoginModal from "./components/LoginModal/LoginModal";
import Header from "./components/Header/Header";
import SolicitacaoMonitoramento from "./pages/SolicitacaoMonitoramento";
import ImportacaoNFE from "./pages/ImportacaoNFE";

function App() {
  const { isAuthenticated } = useLogin();

  if (!isAuthenticated) return <LoginModal />;

  return (
    <Router>
      <Header />
      <div className="py-6 px-4">
        <Routes>
          <Route path="/" element={<SolicitacaoMonitoramento />} />
          <Route path="/nfe" element={<ImportacaoNFE />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
