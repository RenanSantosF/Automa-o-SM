import { Navigate } from 'react-router-dom';
import { useLogin } from '../../Contexts/LoginContext';


const PrivateRoute = ({ children, allowedSetores = [] }) => {
  const { isAuthenticated, userData } = useLogin();
  const setor = userData?.setor?.toLowerCase();

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // Se não tem restrição de setor, libera
  if (allowedSetores.length === 0) {
    return children;
  }

  // Se está no setor permitido, libera
  if (allowedSetores.includes(setor)) {
    return children;
  }

  // 🔒 Bloqueado — redireciona para Comprovantes ou página de erro
  return <Navigate to="/nao-autorizado" />;
};

export default PrivateRoute;
