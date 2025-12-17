import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useLogin } from '../../Contexts/LoginContext';
import { canAny, canAll } from '../../utils/permissions';

const PrivateRoute = ({
  children,
  allowedSetores = [],     // continua existindo (admin)
  permissions = [],        // NOVO: permissões exigidas
  requireAll = false       // NOVO: todas ou apenas uma
}) => {
  const { isAuthenticated, userData } = useLogin();
  const location = useLocation();

  // 🔒 Não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 🔎 Validação de cadastro
  const nome = userData?.nome?.toString().trim();
  const email = userData?.email?.toString().trim();
  const transportadora = userData?.transportadora?.toString().trim();
  const filial = userData?.filial?.toString().trim();

  const cadastroIncompleto = !(nome && email && transportadora && filial);

  // 🔁 Força atualização de cadastro
  if (cadastroIncompleto && location.pathname !== '/updateusuario') {
    return <Navigate to="/updateusuario" replace />;
  }

  // 🔓 Sempre permitir updateusuario (evita loop)
  if (location.pathname === '/updateusuario') {
    return children;
  }

  // 🛡️ REGRA 1 — Por SETOR (ex: admin)
  if (allowedSetores.length > 0) {
    const setorUsuario = userData?.setor?.toString().toLowerCase() || '';
    const allowed = allowedSetores.map(s => s.toString().toLowerCase());

    if (!allowed.includes(setorUsuario)) {
      return <Navigate to="/nao-autorizado" replace />;
    }

    return children;
  }

  // 🛡️ REGRA 2 — Por PERMISSÃO
  if (permissions.length > 0) {
    const autorizado = requireAll
      ? canAll(userData, permissions)
      : canAny(userData, permissions);

    if (!autorizado) {
      return <Navigate to="/nao-autorizado" replace />;
    }
  }

  // 🔓 Liberado
  return children;
};

export default PrivateRoute;
