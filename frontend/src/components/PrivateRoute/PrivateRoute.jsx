// components/PrivateRoute/PrivateRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useLogin } from '../../Contexts/LoginContext';

const PrivateRoute = ({ children, allowedSetores = [] }) => {
  const { isAuthenticated, userData } = useLogin();
  const location = useLocation();

  // Não autenticado -> volta pra raiz/login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Normaliza e checa campos essenciais do perfil
  const nome = userData?.nome?.toString().trim();
  const email = userData?.email?.toString().trim();
  const transportadora = userData?.transportadora?.toString().trim();
  const filial = userData?.filial?.toString().trim();

  const cadastroIncompleto = !(nome && email && transportadora && filial);

  // Se cadastro incompleto e NÃO estivermos na página de update -> redireciona pra /updateusuario
  if (cadastroIncompleto && location.pathname !== '/updateusuario') {
    return <Navigate to="/updateusuario" replace />;
  }

  // Se estamos na página de atualização, permitir (evita loop)
  if (location.pathname === '/updateusuario') {
    return children;
  }

  // Se não há restrição de setor, libera
  if (!allowedSetores || allowedSetores.length === 0) {
    return children;
  }

  // Verifica se o setor do usuário está na lista permitida
  const setorUsuario = userData?.setor?.toString().toLowerCase() || '';
  const allowed = allowedSetores.map((s) => s.toString().toLowerCase());
  if (allowed.includes(setorUsuario)) {
    return children;
  }

  // Caso contrário, não autorizado
  return <Navigate to="/nao-autorizado" replace />;
};

export default PrivateRoute;
