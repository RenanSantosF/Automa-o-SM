// api/gestorCargas.js
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;

export const listarCargas = async () => {
  const response = await fetchWithAuth(`${API_URL}/gestor-cargas/cargas`);
  return response;
};

export const criarCarga = async (cargaData) => {
  const response = await fetchWithAuth(`${API_URL}/gestor-cargas/cargas`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cargaData),
  });
  return response;
};

export const atualizarCarga = async (id, cargaData) => {
  const response = await fetchWithAuth(`${API_URL}/gestor-cargas/cargas/${id}`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cargaData),
  });
  return response;
};

export const deletarCarga = async (id) => {
  const response = await fetchWithAuth(`${API_URL}/gestor-cargas/cargas/${id}`, {
    method: "DELETE",
  });
  return response;
};