// import { useState } from "react";
// import { motion } from "framer-motion";
// import { useTipos } from "../Hooks/useTipos";
// import { useMotivos } from "../Hooks/useMotivos";
// import ConfirmModal from "../components/Carga/Modal/Confirmmodal";
// import TipoForm from "../components/Ocorrencia/TipoForm";
// import MotivoForm from "../components/Ocorrencia/MotivoForm";

// export default function OcorrenciasPage() {
//   const { tipos, loading: loadingTipos, error: errorTipos, criarTipo, atualizarTipo, deletarTipo } = useTipos();
//   const { motivos, loading: loadingMotivos, error: errorMotivos, criarMotivo, atualizarMotivo, deletarMotivo } = useMotivos();

//   const [deleteModalOpen, setDeleteModalOpen] = useState(false);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [deleteCallback, setDeleteCallback] = useState(null);
//   const [deleteName, setDeleteName] = useState("");

//   const [editingTipo, setEditingTipo] = useState(null);
//   const [editingMotivo, setEditingMotivo] = useState(null);
//   const [activeTab, setActiveTab] = useState("tipos");

//   const handleDelete = (item, callback, name) => {
//     setSelectedItem(item);
//     setDeleteCallback(() => callback);
//     setDeleteName(name);
//     setDeleteModalOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (deleteCallback && selectedItem) await deleteCallback(selectedItem.id);
//     setDeleteModalOpen(false);
//     setSelectedItem(null);
//     setDeleteCallback(null);
//   };

//   const handleTipoSubmit = async (formData) => {
//     try {
//       if (editingTipo) {
//         await atualizarTipo({ ...editingTipo, ...formData });
//         setEditingTipo(null);
//       } else {
//         await criarTipo(formData);
//       }
//     } catch (err) {
//       console.error("Erro ao salvar tipo:", err);
//     }
//   };

//   const handleMotivoSubmit = async (formData) => {
//     try {
//       if (editingMotivo) {
//         await atualizarMotivo({ ...editingMotivo, ...formData });
//         setEditingMotivo(null);
//       } else {
//         await criarMotivo(formData);
//       }
//     } catch (err) {
//       console.error("Erro ao salvar motivo:", err);
//     }
//   };

//   const tiposArray = Array.isArray(tipos) ? tipos : [];
//   const motivosArray = Array.isArray(motivos) ? motivos : [];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-gray-800 p-6 rounded-xl shadow-sm flex flex-col gap-6">
//       <motion.h1 
//         className="text-3xl font-bold text-green-700"
//         initial={{ opacity: 0, y: -10 }}
//         animate={{ opacity: 1, y: 0 }}
//       >
//         ⚡ Cadastro de Ocorrências
//       </motion.h1>

//       {/* Tabs */}
//       <div className="flex gap-3 mb-4">
//         {["tipos", "motivos"].map((tab) => (
//           <motion.button
//             key={tab}
//             onClick={() => setActiveTab(tab)}
//             whileHover={{ scale: 1.03 }}
//             whileTap={{ scale: 0.98 }}
//             className={`px-5 py-2 rounded-full font-medium shadow-sm transition-all duration-300 ${
//               activeTab === tab
//                 ? "bg-green-600 text-white shadow-md"
//                 : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
//             }`}
//           >
//             {tab === "tipos" ? "Tipos" : "Motivos"}
//           </motion.button>
//         ))}
//       </div>

//       {/* Erros */}
//       {errorTipos && <div className="bg-red-100 text-red-700 p-3 rounded-md">Erro em Tipos: {errorTipos}</div>}
//       {errorMotivos && <div className="bg-red-100 text-red-700 p-3 rounded-md">Erro em Motivos: {errorMotivos}</div>}

//       {/* Tipos */}
//       {activeTab === "tipos" && (
//         <motion.div
//           className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 flex flex-col gap-3"
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//         >
//           <h2 className="text-xl font-semibold text-green-700">Tipos de Ocorrência</h2>
//           <TipoForm onSubmit={handleTipoSubmit} initialData={editingTipo || {}} onClose={() => setEditingTipo(null)} />

//           {loadingTipos ? (
//             <p className="text-gray-500 mt-2">Carregando...</p>
//           ) : (
//             <ul className="mt-3 space-y-2">
//               {tiposArray.map((tipo) => (
//                 <li
//                   key={tipo.id}
//                   className="bg-gray-50 border border-gray-200 hover:border-green-300 transition p-3 rounded-lg shadow-sm flex justify-between items-center"
//                 >
//                   <div>
//                     <p className="font-semibold text-gray-800">{tipo.nome}</p>
//                     <p className="text-sm text-gray-500">{tipo.descricao}</p>
//                   </div>
//                   <div className="flex gap-2">
//                     <button onClick={() => setEditingTipo(tipo)} className="text-green-600 hover:text-green-700">✏️</button>
//                     <button onClick={() => handleDelete(tipo, deletarTipo, tipo.nome)} className="text-red-500 hover:text-red-600">🗑️</button>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </motion.div>
//       )}

//       {/* Motivos */}
//       {activeTab === "motivos" && (
//         <motion.div
//           className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 flex flex-col gap-3"
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//         >
//           <h2 className="text-xl font-semibold text-green-700">Motivos de Ocorrência</h2>
//           <MotivoForm
//             tipos={tiposArray}
//             onSubmit={handleMotivoSubmit}
//             initialData={editingMotivo || {}}
//             onClose={() => setEditingMotivo(null)}
//           />
//           {loadingMotivos ? (
//             <p className="text-gray-500 mt-2">Carregando...</p>
//           ) : (
//             <ul className="mt-3 space-y-2">
//               {motivosArray.map((motivo) => {
//                 const tipo = tiposArray.find((t) => t.id === motivo.tipo_id);
//                 return (
//                   <li
//                     key={motivo.id}
//                     className="bg-gray-50 border border-gray-200 hover:border-green-300 transition p-3 rounded-lg shadow-sm flex justify-between items-center"
//                   >
//                     <div>
//                       <p className="font-semibold text-gray-800">{motivo.nome}</p>
//                       <p className="text-sm text-gray-500">Tipo: {tipo ? tipo.nome : "Não encontrado"}</p>
//                       <p className="text-sm text-gray-500">
//                         Responsabilidade do cliente:{" "}
//                         <span className="font-medium text-gray-700">
//                           {motivo.responsabilidade_cliente ? "Sim" : "Não"}
//                         </span>
//                       </p>
//                     </div>
//                     <div className="flex gap-2">
//                       <button onClick={() => setEditingMotivo(motivo)} className="text-green-600 hover:text-green-700">✏️</button>
//                       <button onClick={() => handleDelete(motivo, deletarMotivo, motivo.nome)} className="text-red-500 hover:text-red-600">🗑️</button>
//                     </div>
//                   </li>
//                 );
//               })}
//             </ul>
//           )}
//         </motion.div>
//       )}

//       <ConfirmModal
//         isOpen={deleteModalOpen}
//         title="Deletar item"
//         message={`Tem certeza que deseja deletar "${deleteName}"?`}
//         onConfirm={confirmDelete}
//         onCancel={() => setDeleteModalOpen(false)}
//       />
//     </div>
//   );
// }



import { useState } from "react";
import { motion } from "framer-motion";
import { useTipos } from "../Hooks/useTipos";
import { useMotivos } from "../Hooks/useMotivos";
import ConfirmModal from "../components/Carga/Modal/Confirmmodal";
import TipoForm from "../components/Ocorrencia/TipoForm";
import MotivoForm from "../components/Ocorrencia/MotivoForm";

export default function OcorrenciasPage() {
  const {
    tipos,
    loading: loadingTipos,
    error: errorTipos,
    criarTipo,
    atualizarTipo,
    deletarTipo,
  } = useTipos();

  const {
    motivos,
    loading: loadingMotivos,
    error: errorMotivos,
    criarMotivo,
    atualizarMotivo,
    deletarMotivo,
  } = useMotivos();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteCallback, setDeleteCallback] = useState(null);
  const [deleteName, setDeleteName] = useState("");

  const [editingTipo, setEditingTipo] = useState(null);
  const [editingMotivo, setEditingMotivo] = useState(null);
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
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 text-gray-900 p-8 flex flex-col gap-8">
      {/* Título principal */}
      <motion.h1
        className="text-3xl font-bold text-gray-900 border-b border-gray-300 pb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Cadastro de Ocorrências
      </motion.h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-300 pb-1">
        {["tipos", "motivos"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 font-medium transition-all border-b-2 ${
              activeTab === tab
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-600 hover:text-green-600"
            }`}
          >
            {tab === "tipos" ? "Tipos" : "Motivos"}
          </button>
        ))}
      </div>

      {/* Erros */}
      {errorTipos && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md">
          Erro em Tipos: {errorTipos}
        </div>
      )}
      {errorMotivos && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md">
          Erro em Motivos: {errorMotivos}
        </div>
      )}

      {/* Tipos */}
      {activeTab === "tipos" && (
        <motion.div
          className="bg-white border border-gray-200 rounded-md shadow-sm p-6 flex flex-col gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold text-gray-800">
            Tipos de Ocorrência
          </h2>
          <TipoForm
            onSubmit={handleTipoSubmit}
            initialData={editingTipo || {}}
            onClose={() => setEditingTipo(null)}
          />

          {loadingTipos ? (
            <p className="text-gray-500 mt-2">Carregando...</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {tiposArray.map((tipo) => (
                <li
                  key={tipo.id}
                  className="bg-gray-50 border border-gray-200 hover:border-green-400 transition p-4 rounded-md flex justify-between items-center shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{tipo.nome}</p>
                    <p className="text-sm text-gray-600">{tipo.descricao}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTipo(tipo)}
                      className="px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(tipo, deletarTipo, tipo.nome)}
                      className="px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}

      {/* Motivos */}
      {activeTab === "motivos" && (
        <motion.div
          className="bg-white border border-gray-200 rounded-md shadow-sm p-6 flex flex-col gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold text-gray-800">
            Motivos de Ocorrência
          </h2>
          <MotivoForm
            tipos={tiposArray}
            onSubmit={handleMotivoSubmit}
            initialData={editingMotivo || {}}
            onClose={() => setEditingMotivo(null)}
          />
          {loadingMotivos ? (
            <p className="text-gray-500 mt-2">Carregando...</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {motivosArray.map((motivo) => {
                const tipo = tiposArray.find((t) => t.id === motivo.tipo_id);
                return (
                  <li
                    key={motivo.id}
                    className="bg-gray-50 border border-gray-200 hover:border-green-400 transition p-4 rounded-md flex justify-between items-center shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {motivo.nome}
                      </p>
                      <p className="text-sm text-gray-600">
                        Tipo: {tipo ? tipo.nome : "Não encontrado"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Responsabilidade do cliente:{" "}
                        <span className="font-medium text-gray-800">
                          {motivo.responsabilidade_cliente ? "Sim" : "Não"}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMotivo(motivo)}
                        className="px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(motivo, deletarMotivo, motivo.nome)
                        }
                        className="px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition"
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      )}

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
