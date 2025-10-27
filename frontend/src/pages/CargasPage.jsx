// CargasPage.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { MdAddBox } from "react-icons/md";

import { useCargas } from "../Hooks/useCargas";
import { useTipos } from "../Hooks/useTipos";
import { useMotivos } from "../Hooks/useMotivos";
import CargaList from "../components/Carga/CargaList";
import CargaForm from "../components/Carga/CargaForm";

export default function CargasPage() {
  const { cargas, loading, addCarga, updateCarga, removeCarga } = useCargas();
  const { tipos, loading: loadingTipos } = useTipos();
  const { motivos, loading: loadingMotivos, listarMotivosPorTipo } = useMotivos(); // Adicione listarMotivosPorTipo
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCarga, setSelectedCarga] = useState(null);

  const handleEdit = (carga) => {
    setSelectedCarga(carga);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedCarga(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedCarga(null);
  };

// CargasPage.jsx
const handleSubmit = async (formData) => {
  console.log('Dados enviados:', formData);
  
  try {
    if (selectedCarga) {
      await updateCarga(selectedCarga.id, formData);
    } else {
      await addCarga(formData);
    }
    handleClose();
  } catch (error) {
    console.error('Erro ao salvar carga:', error);
    
    // Mostrar mensagem de erro mais específica
    if (error.response?.data?.detail) {
      alert(`Erro ao salvar carga: ${error.response.data.detail}`);
    } else {
      alert('Erro ao salvar carga. Verifique o console para mais detalhes.');
    }
  }
};

  // Combine os loadings
  const isLoading = loading || loadingTipos || loadingMotivos;

  return (
    <div className="h-full bg-gray-900 text-white p-4 rounded-xl shadow-lg flex flex-col">
      <h1 className="text-2xl font-bold mb-4">📦 Gestor de Cargas</h1>
      <div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white mb-4"
        >
          <MdAddBox size={20} /> Incluir Carga
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">Carregando...</div>
      ) : (
        <motion.div layout className="flex-1 overflow-y-auto mt-4">
          <CargaList cargas={cargas} onEdit={handleEdit} onDelete={removeCarga} />
        </motion.div>
      )}

      {modalOpen && (
        <CargaForm 
          initialData={selectedCarga} 
          onSubmit={handleSubmit} // ← Agora passa apenas formData
          onClose={handleClose}
          tipos={tipos}
          motivos={motivos}
          listarMotivosPorTipo={listarMotivosPorTipo} // ← Passe a função
        />
      )}
    </div>
  );
}