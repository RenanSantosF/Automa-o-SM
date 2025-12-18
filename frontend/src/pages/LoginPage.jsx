import { Navigate } from 'react-router-dom';
import { useLogin } from '../Contexts/LoginContext';
import LoginModal from '../components/LoginModal/LoginModal';

export default function LoginPage() {
  const { isAuthenticated } = useLogin();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginModal />;
}
