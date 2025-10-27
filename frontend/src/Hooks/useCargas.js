// useCargas.js
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
    } finally {
      setLoading(false);
    }
  };

// No useCargas.js, adicione logs para ver a resposta
const addCarga = async (cargaData) => {
  try {
    console.log('Enviando carga:', cargaData);
    const created = await criarCarga(cargaData);
    console.log('Carga criada com resposta:', created);
    
    // Recarregar todas as cargas para incluir as ocorrências
    await fetchCargas();
    return created;
  } catch (error) {
    console.error('Erro ao criar carga:', error);
    throw error;
  }
};

  const updateCarga = async (id, cargaData) => {
    const { ocorrencias, ...dadosCarga } = cargaData;
    const updated = await atualizarCarga(id, dadosCarga);
    
    // As ocorrências são gerenciadas pelo backend automaticamente
    // pois a API já está configurada para lidar com o array de ocorrências
    
    // Recarregar todas as cargas
    await fetchCargas();
    return updated;
  };

  const removeCarga = async (id) => {
    await deletarCarga(id);
    setCargas((prev) => prev.filter((c) => c.id !== id));
  };

  useEffect(() => { 
    fetchCargas(); 
  }, []);

  return { cargas, loading, addCarga, updateCarga, removeCarga, fetchCargas };
}