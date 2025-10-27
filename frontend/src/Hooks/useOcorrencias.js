import { useState, useEffect } from "react";
import fetchWithAuth from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;

export const useOcorrencias = () => {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listarOcorrencias = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth(`${API_URL}/gestor-cargas/ocorrencias`);
      setOcorrencias(data);
    } catch (err) {
      console.error('Erro ao buscar ocorrências:', err);
      setError(err.message);
      setOcorrencias([]);
    } finally {
      setLoading(false);
    }
  };

  const criarOcorrencia = async (payload) => {
    try {
      const nova = await fetchWithAuth(`${API_URL}/gestor-cargas/ocorrencias`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setOcorrencias((prev) => [...prev, nova]);
      return nova;
    } catch (err) {
      console.error('Erro ao criar ocorrência:', err);
      throw err;
    }
  };

  const atualizarOcorrencia = async (ocorrenciaData) => {
    try {
      const updated = await fetchWithAuth(`${API_URL}/gestor-cargas/ocorrencias/${ocorrenciaData.id}`, {
        method: "PUT",
        body: JSON.stringify(ocorrenciaData),
      });
      setOcorrencias((prev) => prev.map((o) => (o.id === ocorrenciaData.id ? updated : o)));
      return updated;
    } catch (err) {
      console.error('Erro ao atualizar ocorrência:', err);
      throw err;
    }
  };

  const deletarOcorrencia = async (id) => {
    try {
      await fetchWithAuth(`${API_URL}/gestor-cargas/ocorrencias/${id}`, { method: "DELETE" });
      setOcorrencias((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error('Erro ao deletar ocorrência:', err);
      throw err;
    }
  };

  useEffect(() => {
    listarOcorrencias();
  }, []);

  return { ocorrencias, loading, error, criarOcorrencia, atualizarOcorrencia, deletarOcorrencia };
};