import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLogin } from './Contexts/LoginContext';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Header from './components/Header/Header';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';

import LoginPage from './pages/LoginPage';
import RegistroUsuario from './pages/Registro';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NaoAutorizado from './pages/NaoAutorizado';

import SolicitacaoMonitoramento from './pages/SolicitacaoMonitoramento';
import OcorrenciasPage from './pages/ocorrenciasPage';
import CargasPage from './pages/CargasPage';
import Comprovantes from './pages/Comprovantes';
import KnowledgePage from './pages/knowledgePage';
import NfeDownloadPage from './pages/NfeDownloadPage';
import PainelUsuarios from './pages/PainelUsuarios';
import AtualizaUsuario from './pages/AtualizaUsuario';

import { ToastContainer } from 'react-toastify';

function App() {
  const { isAuthenticated } = useLogin();
  const [isOpen, setIsOpen] = useState(true);

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
        {isAuthenticated && <Header isOpen={isOpen} setIsOpen={setIsOpen} />}

        <div
          className={`
            transition-all duration-300
            ${isAuthenticated ? (isOpen ? 'ml-[260px]' : 'ml-[78px]') : 'ml-0'}
            min-h-screen bg-[#333]
          `}
        >
          <Routes>
            {/* 🔓 PÚBLICAS */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroUsuario />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* 🔒 PRIVADAS */}

            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />

            <Route
              path="/monitoramento"
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
                <PrivateRoute
                  permissions={[
                    'ocorrencias.tipos.acessar_pagina',
                    'ocorrencias.motivos.acessar_pagina',
                  ]}
                >
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

            <Route
              path="/painel-usuarios"
              element={
                <PrivateRoute allowedSetores={['admin']}>
                  <PainelUsuarios />
                </PrivateRoute>
              }
            />

            <Route path="/nao-autorizado" element={<NaoAutorizado />} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
