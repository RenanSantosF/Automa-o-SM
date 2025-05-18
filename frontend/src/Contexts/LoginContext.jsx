import { createContext, useContext, useState, useEffect } from 'react';

const LoginContext = createContext();

export function LoginProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUserData(parsedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (usuario, senha) => {
    const data = { usuario, senha };
    localStorage.setItem('userData', JSON.stringify(data));
    setUserData(data);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('userData');
    setUserData(null);
    setIsAuthenticated(false);
  };

  return (
    <LoginContext.Provider value={{ isAuthenticated, setIsAuthenticated, login, logout, userData }}>
      {children}
    </LoginContext.Provider>
  );
}

export function useLogin() {
  const context = useContext(LoginContext);
  if (context === undefined) {
    throw new Error('useLogin deve ser usado dentro de um LoginProvider');
  }
  return context;
}
