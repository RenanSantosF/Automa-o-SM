// src/utils/fetchWithAuth.js
const getToken = () => localStorage.getItem("token");

const fetchWithAuth = async (url, options = {}) => {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth:expired"));
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Erro na requisição");
  }

  return response.json();
};

export default fetchWithAuth;
