import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useLogin } from './Contexts/LoginContext';
import { useEffect, useState } from 'react';

import LoginModal from './components/LoginModal/LoginModal';
import Header from './components/Header/Header';
import HeaderMobile from './components/Header/HeaderMobile';
import OcorrenciasPage from './pages/ocorrenciasPage';
import SolicitacaoMonitoramento from './pages/SolicitacaoMonitoramento';

import RegistroUsuario from './pages/Registro';
import AtualizaUsuario from './pages/AtualizaUsuario';
import Comprovantes from './pages/Comprovantes';
import NaoAutorizado from './pages/NaoAutorizado';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import PainelUsuarios from './pages/PainelUsuarios';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CargasPage from './pages/CargasPage';
import KnowledgePage from './pages/knowledgePage';
import NfeDownloadPage from './pages/NfeDownloadPage';

function App() {
  const { isAuthenticated } = useLogin();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


useEffect(() => {
  const pedirPermissao = () => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    window.removeEventListener("click", pedirPermissao);
  };

  window.addEventListener("click", pedirPermissao);
}, []);



  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1050);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Router>
        {isAuthenticated && (
          <>{isMobile ? <HeaderMobile /> : <Header isOpen={isOpen} setIsOpen={setIsOpen} />}</>
        )}

        <div
          className={`
            transition-all duration-300
            ${
              isAuthenticated
                ? isMobile
                  ? 'mt-16 ml-0' /* Espaço para header fixo no topo no mobile */
                  : isOpen
                  ? 'ml-[260px]'
                  : 'ml-[80px]'
                : 'ml-0'
            }
            py-2 px-2 min-h-screen bg-[#333]
          `}
        >
          <Routes>
            {/* 🔓 Pública */}
            <Route path="/registro" element={<RegistroUsuario />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* 🔒 Privadas */}
            {isAuthenticated ? (
              <>
                <Route
                  path="/"
                  element={
                    <PrivateRoute allowedSetores={['expedicao', 'admin']}>
                      <SolicitacaoMonitoramento />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/updateusuario"
                  element={
                    <PrivateRoute>
                      <AtualizaUsuario />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/comprovantes"
                  element={
                    <PrivateRoute>
                      <Comprovantes />
                    </PrivateRoute>
                  }
                />
                {/* Cargas com subsessões */}
                <Route
                  path="/cargas"
                  element={
                    <PrivateRoute>
                      <CargasPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/ocorrencias"
                  element={
                    <PrivateRoute>
                      <OcorrenciasPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/knowledge"
                  element={
                    <PrivateRoute>
                      <KnowledgePage />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/nfe-download"
                  element={
                    <PrivateRoute>
                      <NfeDownloadPage />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/painel-usuarios"
                  element={
                    <PrivateRoute allowedSetores={['admin']}>
                      <PainelUsuarios />
                    </PrivateRoute>
                  }
                />
                <Route path="/nao-autorizado" element={<NaoAutorizado />} />
                <Route path="*" element={<Navigate to="/comprovantes" />} />
              </>
            ) : (
              <>
                <Route path="*" element={<LoginModal />} />
              </>
            )}
          </Routes>
        </div>
      </Router>

      <ToastContainer
        position="top-right"
        autoClose={3000} // desaparece após 3 segundos
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default App;
