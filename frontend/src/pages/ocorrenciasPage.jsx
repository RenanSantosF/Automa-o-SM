import { useState } from "react";
import { motion } from "framer-motion";

import { useTipos } from "../Hooks/useTipos";
import { useMotivos } from "../Hooks/useMotivos";
// import { useOcorrencias } from "../Hooks/useOcorrencias"; // 🔴 Desativado temporariamente

import ConfirmModal from "../components/Carga/Modal/Confirmmodal";
import TipoForm from "../components/Ocorrencia/TipoForm";
import MotivoForm from "../components/Ocorrencia/MotivoForm";
// import OcorrenciaForm from "../components/Ocorrencia/OcorrenciaForm";
// import OcorrenciaTable from "../components/Ocorrencia/OcorrenciaTable";

export default function OcorrenciasPage() {
  const { tipos, loading: loadingTipos, error: errorTipos, criarTipo, atualizarTipo, deletarTipo } = useTipos();
  const { motivos, loading: loadingMotivos, error: errorMotivos, criarMotivo, atualizarMotivo, deletarMotivo } = useMotivos();
  // const { ocorrencias, ... } = useOcorrencias(); // 🔴 Desativado

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteCallback, setDeleteCallback] = useState(null);
  const [deleteName, setDeleteName] = useState("");

  const [editingTipo, setEditingTipo] = useState(null);
  const [editingMotivo, setEditingMotivo] = useState(null);

  // Aba ativa
  const [activeTab, setActiveTab] = useState("tipos");

  const handleDelete = (item, callback, name) => {
    setSelectedItem(item);
    setDeleteCallback(() => callback);
    setDeleteName(name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteCallback && selectedItem) await deleteCallback(selectedItem.id);
    setDeleteModalOpen(false);
    setSelectedItem(null);
    setDeleteCallback(null);
  };

  const handleTipoSubmit = async (formData) => {
    try {
      if (editingTipo) {
        await atualizarTipo({ ...editingTipo, ...formData });
        setEditingTipo(null);
      } else {
        await criarTipo(formData);
      }
    } catch (err) {
      console.error("Erro ao salvar tipo:", err);
    }
  };

  const handleMotivoSubmit = async (formData) => {
    try {
      if (editingMotivo) {
        await atualizarMotivo({ ...editingMotivo, ...formData });
        setEditingMotivo(null);
      } else {
        await criarMotivo(formData);
      }
    } catch (err) {
      console.error("Erro ao salvar motivo:", err);
    }
  };

  const tiposArray = Array.isArray(tipos) ? tipos : [];
  const motivosArray = Array.isArray(motivos) ? motivos : [];

  return (
    <div className="h-full bg-gray-900 text-white p-4 rounded-xl shadow-lg flex flex-col gap-6">
      <h1 className="text-2xl font-bold mb-4">⚡ Registro de Ocorrências</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab("tipos")}
          className={`px-4 py-2 rounded-xl ${activeTab === "tipos" ? "bg-blue-600" : "bg-gray-700"}`}
        >
          Tipos
        </button>
        <button
          onClick={() => setActiveTab("motivos")}
          className={`px-4 py-2 rounded-xl ${activeTab === "motivos" ? "bg-blue-600" : "bg-gray-700"}`}
        >
          Motivos
        </button>
      </div>

      {/* Erros */}
      {errorTipos && <div className="bg-red-600 p-2 rounded-md">Erro em Tipos: {errorTipos}</div>}
      {errorMotivos && <div className="bg-red-600 p-2 rounded-md">Erro em Motivos: {errorMotivos}</div>}

      {/* Aba: Tipos */}
      {activeTab === "tipos" && (
        <div className="bg-[#222] p-4 rounded-xl shadow-md flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Tipos de Ocorrência</h2>
          <TipoForm
            onSubmit={handleTipoSubmit}
            initialData={editingTipo || {}}
            onClose={() => setEditingTipo(null)}
          />
          {loadingTipos ? (
            <p>Carregando...</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {tiposArray.map((tipo) => (
                <li key={tipo.id} className="bg-[#333] p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{tipo.nome}</p>
                      <p className="text-sm text-gray-400">{tipo.descricao}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingTipo(tipo)} className="text-blue-400">✏️</button>
                      <button onClick={() => handleDelete(tipo, deletarTipo, tipo.nome)} className="text-red-400">🗑️</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Aba: Motivos */}
      {activeTab === "motivos" && (
        <div className="bg-[#222] p-4 rounded-xl shadow-md flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Motivos de Ocorrência</h2>
          <MotivoForm
            tipos={tiposArray}
            onSubmit={handleMotivoSubmit}
            initialData={editingMotivo || {}}
            onClose={() => setEditingMotivo(null)}
          />
          {loadingMotivos ? (
            <p>Carregando...</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {motivosArray.map((motivo) => {
                const tipo = tiposArray.find((t) => t.id === motivo.tipo_id);
                return (
                  <li key={motivo.id} className="bg-[#333] p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{motivo.nome}</p>
                        <p className="text-sm text-gray-400">
                          Tipo: {tipo ? tipo.nome : "Não encontrado"}
                        </p>
                        <p className="text-sm text-gray-400">
                          Responsabilidade do cliente: {motivo.responsabilidade_cliente ? "Sim" : "Não"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingMotivo(motivo)} className="text-blue-400">✏️</button>
                        <button onClick={() => handleDelete(motivo, deletarMotivo, motivo.nome)} className="text-red-400">🗑️</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Modal de confirmação */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Deletar item"
        message={`Tem certeza que deseja deletar "${deleteName}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
