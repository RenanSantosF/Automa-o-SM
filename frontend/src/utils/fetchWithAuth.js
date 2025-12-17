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
    throw { detail: "Sessão expirada. Faça login novamente." };
  }

  if (!response.ok) {
    let errorData;

    try {
      errorData = await response.json(); // 🔥 tenta ler { detail }
    } catch {
      const text = await response.text();
      throw { detail: text || "Erro na requisição." };
    }

    // 🔥 LANÇA O OBJETO ORIGINAL DO BACKEND
    throw errorData;
  }

  return response.json();
};

export default fetchWithAuth;
