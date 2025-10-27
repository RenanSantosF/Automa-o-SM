import { useState, useEffect } from "react";
import { MdAddBox, MdClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const MotivoForm = ({ tipos = [], initialData = {}, onSubmit, onClose }) => {
  const [mostrar, setMostrar] = useState(false);
  const [formData, setFormData] = useState({ nome: "", tipo_id: "", ...initialData });

  useEffect(() => {
    setFormData({ nome: "", tipo_id: tipos[0]?.id || "", ...initialData });
    // Abre o modal automaticamente se houver initialData (edição)
    if (initialData.id) {
      setMostrar(true);
    }
  }, [initialData, tipos]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setMostrar(false);
    setFormData({ nome: "", tipo_id: "" });
    onClose?.();
  };

  return (
    <div className="relative z-10">
      <button
        onClick={() => setMostrar(true)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white transition"
      >
        <MdAddBox size={20} />
        {initialData.id ? "Editar Motivo" : "Incluir Motivo"}
      </button>

      <AnimatePresence>
        {mostrar && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <form
                onSubmit={handleSubmit}
                className="relative bg-[#333] p-6 rounded-2xl shadow-lg w-full max-w-md flex flex-col gap-4 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-300 hover:text-white"
                >
                  <MdClose size={26} />
                </button>

                <h2 className="text-xl font-bold mb-2">
                  {initialData.id ? "Editar Motivo" : "Novo Motivo de Ocorrência"}
                </h2>

                <label className="flex flex-col">
                  Nome:
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="mt-1 p-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </label>

                <label className="flex flex-col">
                  Tipo:
                  <select
                    name="tipo_id"
                    value={formData.tipo_id}
                    onChange={handleChange}
                    className="mt-1 p-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Selecione um tipo</option>
                    {tipos.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 transition"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MotivoForm;