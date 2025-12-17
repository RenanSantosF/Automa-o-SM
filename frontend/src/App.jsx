import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLogin } from './Contexts/LoginContext';
import { useEffect, useState } from 'react';

import LoginModal from './components/LoginModal/LoginModal';
import Header from './components/Header/Header';

import SolicitacaoMonitoramento from './pages/SolicitacaoMonitoramento';
import OcorrenciasPage from './pages/ocorrenciasPage';
import CargasPage from './pages/CargasPage';
import Comprovantes from './pages/Comprovantes';
import KnowledgePage from './pages/knowledgePage';
import NfeDownloadPage from './pages/NfeDownloadPage';

import RegistroUsuario from './pages/Registro';
import AtualizaUsuario from './pages/AtualizaUsuario';
import PainelUsuarios from './pages/PainelUsuarios';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NaoAutorizado from './pages/NaoAutorizado';

import PrivateRoute from './components/PrivateRoute/PrivateRoute';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { isAuthenticated } = useLogin();

  // 🔑 estado REAL da sidebar
  const [isOpen, setIsOpen] = useState(true);

  // 🔔 Permissão de notificações
  useEffect(() => {
    const pedirPermissao = () => {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      window.removeEventListener('click', pedirPermissao);
    };

    window.addEventListener('click', pedirPermissao);
  }, []);

  return (
    <>
      <Router>
        {/* HEADER ÚNICO */}
        {isAuthenticated && (
          <Header isOpen={isOpen} setIsOpen={setIsOpen} />
        )}

        {/* CONTEÚDO — EMPURRADO PELO HEADER */}
        <div
          className={`
            transition-all duration-300
            ${
              isAuthenticated
                ? isOpen
                  ? 'ml-[260px]'
                  : 'ml-[78px]'
                : 'ml-0'
            }
            min-h-screen bg-[#333]
          `}
        >
          <Routes>
            {/* 🔓 PÚBLICAS */}
            <Route path="/registro" element={<RegistroUsuario />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* 🔒 PRIVADAS */}
            {isAuthenticated ? (
              <>
                <Route
                  path="/"
                  element={
                    <PrivateRoute permissions={['execucoes.acessar_pagina']}>
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
                    <PrivateRoute permissions={['comprovantes.acessar_pagina']}>
                      <Comprovantes />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/cargas"
                  element={
                    <PrivateRoute permissions={['cargas.acessar_pagina']}>
                      <CargasPage />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/ocorrencias"
                  element={
                    <PrivateRoute permissions={['ocorrencias.tipos.acessar_pagina', 'ocorrencias.motivos.acessar_pagina']}>
                      <OcorrenciasPage />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/knowledge"
                  element={
                    <PrivateRoute permissions={['base_de_conhecimento.acessar_pagina']}>
                      <KnowledgePage />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/nfe-download"
                  element={
                    <PrivateRoute permissions={['baixar_nfes.acessar_pagina']}>
                      <NfeDownloadPage />
                    </PrivateRoute>
                  }
                />

                {/* 🛡️ ADMIN */}
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
              <Route path="*" element={<LoginModal />} />
            )}
          </Routes>
        </div>
      </Router>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
    </>
  );
}

export default App;
