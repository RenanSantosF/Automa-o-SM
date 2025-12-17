import { useState, useEffect } from "react";
import fetchWithAuth from "../utils/fetchWithAuth";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = import.meta.env.VITE_API_URL;

export const useMotivos = () => {
  const [motivos, setMotivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listarMotivos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth(`${API_URL}/gestor-cargas/motivos`);
      setMotivos(data);
    } catch (err) {
      console.error('Erro ao buscar motivos:', err);
      setError(err.message);
      setMotivos([]);
    } finally {
      setLoading(false);
    }
  };

  const criarMotivo = async (payload) => {
    try {
      const novoMotivo = await fetchWithAuth(`${API_URL}/gestor-cargas/motivos`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMotivos((prev) => [...prev, novoMotivo]);
      return novoMotivo;
    } catch (err) {
      console.error('Erro ao criar motivo:', err);
      throw err;
    }
  };

  const atualizarMotivo = async (motivoData) => {
    try {
      const updated = await fetchWithAuth(`${API_URL}/gestor-cargas/motivos/${motivoData.id}`, {
        method: "PUT",
        body: JSON.stringify(motivoData),
      });
      setMotivos((prev) => prev.map((m) => (m.id === motivoData.id ? updated : m)));
      return updated;
    } catch (err) {
      console.error('Erro ao atualizar motivo:', err);
      throw err;
    }
  };

const deletarMotivo = async (id) => {
  try {
    const result = await fetchWithAuth(
      `${API_URL}/gestor-cargas/motivos/${id}`,
      { method: "DELETE" }
    );

    setMotivos((prev) => prev.filter((m) => m.id !== id));

    toast.success("Motivo deletado com sucesso.");
    return { success: true, data: result };
  } catch (err) {
    console.error('Erro ao deletar motivo:', err);
    toast.error(err?.detail || err?.message || "Erro ao deletar motivo.");

    return { success: false };
  }
};


// useMotivos.js - Corrigir a função listarMotivosPorTipo
const listarMotivosPorTipo = async (tipoId) => {
  try {
    const data = await fetchWithAuth(`${API_URL}/gestor-cargas/motivos?tipo_id=${tipoId}`);
    console.log('Motivos por tipo', tipoId, ':', data); // Para debug
    return data;
  } catch (err) {
    console.error('Erro ao buscar motivos por tipo:', err);
    return [];
  }
};

  useEffect(() => {
    listarMotivos();
  }, []);

  return { motivos, loading, error, criarMotivo, atualizarMotivo, deletarMotivo, listarMotivosPorTipo };
};


