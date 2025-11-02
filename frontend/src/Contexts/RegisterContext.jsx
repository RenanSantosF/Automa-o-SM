import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const api = import.meta.env.VITE_API_URL; // se for Vite

  const register = async ({
    username,
    email,
    senha,
    setor,
    usuario_apisul,
    senha_apisul,
    nome,
    transportadora,
    filial,
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${api}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          senha,
          setor,
          usuario_apisul: usuario_apisul || null,
          senha_apisul: senha_apisul || null,
          nome: nome || null,
          transportadora: transportadora || null,
          filial: filial || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao registrar usuário');
      }

      const data = await response.json();
      setUser(data);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return (
    <UserContext.Provider value={{ user, register, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser deve ser usado dentro do UserProvider');
  return context;
}
