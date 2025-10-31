import { useState, useEffect } from "react";
import { MdAddBox, MdClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const MotivoForm = ({ tipos = [], initialData = {}, onSubmit, onClose }) => {
  const [mostrar, setMostrar] = useState(false);
  const [formData, setFormData] = useState({ nome: "", tipo_id: "", ...initialData });

  useEffect(() => {
    setFormData({ nome: "", tipo_id: tipos[0]?.id || "", ...initialData });
    if (initialData.id) setMostrar(true);
  }, [initialData, tipos]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
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
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white shadow transition"
      >
        <MdAddBox size={20} />
        {initialData.id ? "Editar Motivo" : "Incluir Motivo"}
      </button>

      <AnimatePresence>
        {mostrar && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
            <motion.form
              onSubmit={handleSubmit}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div
                className="relative bg-white p-6 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4 text-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  <MdClose size={24} />
                </button>

                <h2 className="text-xl font-semibold text-green-700">
                  {initialData.id ? "Editar Motivo" : "Novo Motivo de Ocorrência"}
                </h2>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Nome</span>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Tipo</span>
                  <select
                    name="tipo_id"
                    value={formData.tipo_id}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MotivoForm;
