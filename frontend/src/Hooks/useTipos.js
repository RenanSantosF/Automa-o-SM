import { useState, useEffect } from "react";
import fetchWithAuth from "../utils/fetchWithAuth";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const novoTipo = await fetchWithAuth(
      `${API_URL}/gestor-cargas/tipos`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    setTipos((prev) => [...prev, novoTipo]);

    toast.success("Tipo de ocorrência criado com sucesso.");
    return true;
  } catch (err) {
    console.error("Erro ao criar tipo:", err);
    toast.error(
      err?.detail || err?.message || "Erro ao criar um novo tipo de ocorrência!"
    );
    return false;
  }
};


const atualizarTipo = async (tipoData) => {
  try {
    const updated = await fetchWithAuth(
      `${API_URL}/gestor-cargas/tipos/${tipoData.id}`,
      {
        method: "PUT",
        body: JSON.stringify(tipoData),
      }
    );

    setTipos((prev) =>
      prev.map((t) => (t.id === tipoData.id ? updated : t))
    );

    toast.success("Tipo de ocorrência atualizado com sucesso.");

    return { success: true, data: updated };
  } catch (err) {
    console.log(err);
    toast.error(err?.detail || err?.message || "Erro ao atualizar tipo.");

    return { success: false }; // 🔥 NÃO lança erro
  }
};


const deletarTipo = async (id) => {
  try {
    const res = await fetchWithAuth(
      `${API_URL}/gestor-cargas/tipos/${id}`,
      { method: "DELETE" }
    );

    // se o backend retornar algo (mensagem, objeto, etc)
    setTipos((prev) => prev.filter((t) => t.id !== id));

    toast.success("Tipo de ocorrência deletado com sucesso.");

    return { success: true, data: res };
  } catch (err) {
    console.error("Erro ao deletar tipo:", err);

    toast.error(
      err?.detail ||
      err?.message ||
      "Erro ao deletar tipo."
    );

    return { success: false };
  }
};


  useEffect(() => {
    listarTipos();
  }, []);

  return { tipos, loading, error, criarTipo, atualizarTipo, deletarTipo };
};