import fetchWithAuth from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;

export const listarCargas = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchWithAuth(`${API_URL}/gestor-cargas/cargas?${query}`);
};

export const criarCarga = async (payload) => {
  return fetchWithAuth(`${API_URL}/gestor-cargas/cargas`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const atualizarCarga = async (id, payload) => {
  return fetchWithAuth(`${API_URL}/gestor-cargas/cargas/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const deletarCarga = async (id) => {
  return fetchWithAuth(`${API_URL}/gestor-cargas/cargas/${id}`, { method: "DELETE" });
};
