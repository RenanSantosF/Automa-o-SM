import { createContext, useContext, useState, useEffect } from 'react';

const api = import.meta.env.VITE_API_URL;
const LoginContext = createContext();

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  const currentTime = Date.now() / 1000; // segundos
  return decoded.exp < currentTime;
}

export function LoginProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  // Verifica se o token é válido e carrega os dados do usuário na primeira montagem
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      fetch(`${api}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Token inválido');
          return res.json();
        })
        .then((data) => {
          setUserData(data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          logout();
        });
    } else {
      logout();
    }
  }, []);

  // const login = async (usuario, senha) => {
  //   try {
  //     const response = await fetch(`${api}/login`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //       body: new URLSearchParams({ username: usuario, password: senha }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Usuário ou senha inválidos');
  //     }

  //     const data = await response.json();
  //     localStorage.setItem('token', data.access_token);

  //     // ✅ Após login, faz fetch em /me para pegar os dados completos
  //     const res = await fetch(`${api}/me`, {
  //       headers: {
  //         Authorization: `Bearer ${data.access_token}`,
  //       },
  //     });

  //     if (!res.ok) {
  //       throw new Error('Erro ao buscar dados do usuário');
  //     }

  //     const userInfo = await res.json();

  //     setUserData(userInfo);
  //     setIsAuthenticated(true);
  //   } catch (error) {
  //     console.error(error);
  //     setIsAuthenticated(false);
  //     setUserData(null);
  //     throw error;
  //   }
  // };



  const login = async (usuario, senha) => {
  try {
    const response = await fetch(`${api}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: usuario, password: senha }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 400) {
        throw new Error('Usuário ou senha inválidos');
      } else {
        throw new Error('Erro ao conectar com o servidor');
      }
    }

    const data = await response.json();
    localStorage.setItem('token', data.access_token);

    // Busca dados do usuário
    const res = await fetch(`${api}/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });

    if (!res.ok) throw new Error('Erro ao buscar dados do usuário');

    const userInfo = await res.json();
    setUserData(userInfo);
    setIsAuthenticated(true);
  } catch (err) {
    if (err instanceof TypeError) {
      // Geralmente "Failed to fetch" indica problema de conexão
      throw new Error('Erro de conexão');
    }
    throw err;
  }
};



  const logout = () => {
    localStorage.removeItem('token');
    setUserData(null);
    setIsAuthenticated(false);
  };

  return (
    <LoginContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        userData,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
}

export function useLogin() {
  const context = useContext(LoginContext);
  if (!context) throw new Error('useLogin deve ser usado dentro de um LoginProvider');
  return context;
}
