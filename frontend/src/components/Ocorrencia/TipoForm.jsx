import { useState, useEffect } from "react";
import { MdAddBox, MdClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const TipoForm = ({ initialData = {}, onSubmit, onClose }) => {
  const [mostrar, setMostrar] = useState(false);
  const [formData, setFormData] = useState({ nome: "", descricao: "", ...initialData });

  useEffect(() => {
    setFormData({ nome: "", descricao: "", ...initialData });
    if (initialData.id) {
      setMostrar(true);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData); // espera o backend
      setMostrar(false);        // fecha só depois do sucesso
      setFormData({ nome: "", descricao: "" });
    } catch (err) {
      console.error("Erro ao salvar tipo:", err);
    }
  };

  const handleClose = () => {
    setMostrar(false);
    setFormData({ nome: "", descricao: "" });
    onClose?.();
  };

  return (
    <div className="relative z-10">
      <button
        onClick={() => setMostrar(true)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white transition"
      >
        <MdAddBox size={20} />
        {initialData.id ? "Editar Tipo" : "Incluir Tipo"}
      </button>

      <AnimatePresence>
        {mostrar && (
          <>
            {/* Fundo escuro */}
            <motion.div
              className="fixed inset-0 bg-black/70 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
            {/* Modal */}
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
                {/* Botão fechar */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-300 hover:text-white"
                >
                  <MdClose size={26} />
                </button>

                <h2 className="text-xl font-bold mb-2">
                  {initialData.id ? "Editar Tipo" : "Novo Tipo de Ocorrência"}
                </h2>

                {/* Campo Nome */}
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

                {/* Campo Descrição */}
                <label className="flex flex-col">
                  Descrição:
                  <input
                    type="text"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    className="mt-1 p-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </label>

                {/* Botões */}
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

export default TipoForm;
