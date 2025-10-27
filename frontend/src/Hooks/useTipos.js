import { useState, useEffect } from "react";
import fetchWithAuth from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;
console.log(API_URL)
export const useTipos = () => {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

const listarTipos = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await fetchWithAuth(`${API_URL}/gestor-cargas/tipos`);
    console.log('Tipos retornados:', data); // ← Adicione esta linha
    setTipos(data);
  } catch (err) {
    console.error('Erro ao buscar tipos:', err);
    setError(err.message);
    setTipos([]);
  } finally {
    setLoading(false);
  }
};

  const criarTipo = async (payload) => {
    try {
      const novoTipo = await fetchWithAuth(`${API_URL}/gestor-cargas/tipos`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTipos((prev) => [...prev, novoTipo]);
      return novoTipo;
    } catch (err) {
      console.error('Erro ao criar tipo:', err);
      throw err;
    }
  };

  const atualizarTipo = async (tipoData) => {
    try {
      const updated = await fetchWithAuth(`${API_URL}/gestor-cargas/tipos/${tipoData.id}`, {
        method: "PUT",
        body: JSON.stringify(tipoData),
      });
      setTipos((prev) => prev.map((t) => (t.id === tipoData.id ? updated : t)));
      return updated;
    } catch (err) {
      console.error('Erro ao atualizar tipo:', err);
      throw err;
    }
  };

  const deletarTipo = async (id) => {
    try {
      await fetchWithAuth(`${API_URL}/gestor-cargas/tipos/${id}`, { method: "DELETE" });
      setTipos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Erro ao deletar tipo:', err);
      throw err;
    }
  };

  useEffect(() => {
    listarTipos();
  }, []);

  return { tipos, loading, error, criarTipo, atualizarTipo, deletarTipo };
};