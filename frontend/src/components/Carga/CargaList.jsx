import { useState } from "react";
import CargaItem from "./CargaItem";
import DeleteModal from "./DeleteModal";

export default function CargaList({ cargas = [], onEdit, onDelete }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCarga, setSelectedCarga] = useState(null);

  const handleDeleteClick = (carga) => {
    setSelectedCarga(carga);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCarga) onDelete(selectedCarga.id);
    setDeleteModalOpen(false);
    setSelectedCarga(null);
  };

  if (!cargas.length) {
    return <div className="text-gray-400 text-center py-6">Nenhuma carga encontrada.</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-left text-white">
          <thead className="bg-[#333] text-gray-200 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3">Rota</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Observação</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cargas.map((carga) => (
              <CargaItem
                key={carga.id}
                carga={carga}
                onEdit={onEdit}
                onDelete={() => handleDeleteClick(carga)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <DeleteModal
        isOpen={deleteModalOpen}
        itemName={selectedCarga?.origem + " → " + selectedCarga?.destino}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </>
  );
}
