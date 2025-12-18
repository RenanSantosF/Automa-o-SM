import { useState, useEffect } from "react";
import { listarCargas, criarCarga, atualizarCarga, deletarCarga } from "../api/gestorCargas.js";

export function useCargas() {
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCargas = async () => {
    setLoading(true);
    try {
      const data = await listarCargas();
      setCargas(data);
    } catch (err) {
      console.error("Erro ao listar cargas:", err);
    } finally {
      setLoading(false);
    }
  };

  const addCarga = async (cargaData) => {
    if (!cargaData) {
      console.error("addCarga chamado com dados nulos ou indefinidos");
      return;
    }
    try {
      const created = await criarCarga(cargaData);
      await fetchCargas();
      return created;
    } catch (error) {
      console.error("Erro ao criar carga:", error);
      throw error;
    }
  };

  const updateCarga = async (id, cargaData) => {
    if (!cargaData) return;
    try {
      const updated = await atualizarCarga(id, cargaData);
      await fetchCargas();
      return updated;
    } catch (err) {
      console.error("Erro ao atualizar carga:", err);
      throw err;
    }
  };

  const removeCarga = async (id) => {
    try {
      await deletarCarga(id);
      setCargas((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Erro ao deletar carga:", err);
    }
  };

  useEffect(() => { fetchCargas(); }, []);

  return { cargas, loading, addCarga, updateCarga, removeCarga, fetchCargas };
}
