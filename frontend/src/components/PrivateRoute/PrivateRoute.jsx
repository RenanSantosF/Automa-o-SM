import { Navigate, useLocation } from 'react-router-dom';
import { useLogin } from '../../Contexts/LoginContext';
import { canAny, canAll } from '../../utils/permissions';

export default function PrivateRoute({
  children,
  allowedSetores = [],
  permissions = [],
  requireAll = false
}) {
  const { isAuthenticated, userData } = useLogin();
  const location = useLocation();

  /* =======================
     1️⃣ NÃO AUTENTICADO
  ======================= */
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /* =======================
     2️⃣ LIBERA UPDATEUSUARIO
     (evita loop)
  ======================= */
  if (location.pathname === '/updateusuario') {
    return children;
  }

  /* =======================
     3️⃣ VALIDA CADASTRO
  ======================= */
  const isFilled = (v) =>
    typeof v === 'string' && v.trim().length > 0;

  const cadastroIncompleto = !(
    isFilled(userData?.nome) &&
    isFilled(userData?.email) &&
    isFilled(userData?.transportadora) &&
    isFilled(userData?.filial)
  );

  if (cadastroIncompleto) {
    return <Navigate to="/updateusuario" replace />;
  }

  /* =======================
     4️⃣ VALIDA SETOR
  ======================= */
  if (allowedSetores.length > 0) {
    const setorUsuario = userData?.setor?.toLowerCase?.() || '';
    const setoresPermitidos = allowedSetores.map(s =>
      s.toLowerCase()
    );

    if (!setoresPermitidos.includes(setorUsuario)) {
      return <Navigate to="/nao-autorizado" replace />;
    }
  }

  /* =======================
     5️⃣ VALIDA PERMISSÕES
  ======================= */
  if (permissions.length > 0) {
    const autorizado = requireAll
      ? canAll(userData, permissions)
      : canAny(userData, permissions);

    if (!autorizado) {
      return <Navigate to="/nao-autorizado" replace />;
    }
  }

  /* =======================
     6️⃣ ACESSO LIBERADO
  ======================= */
  return children;
}
