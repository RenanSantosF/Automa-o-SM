// src/components/Modal/ConfirmModal.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirm(); // tenta executar o callback
    } catch (err) {
      console.error("Erro no ConfirmModal:", err);
      // tenta capturar mensagem da API ou fallback genérico
      const backendMsg =
        err?.response?.data?.detail ||
        err?.message ||
        "Ocorreu um erro inesperado.";
      setErrorMsg(backendMsg);
      return; // impede fechamento automático
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="bg-white text-gray-800 w-full max-w-sm rounded-md shadow-2xl border border-gray-200 p-6"
          >
            {/* Cabeçalho */}
            <h2 className="text-xl font-semibold mb-3 text-gray-900">
              {title}
            </h2>

            {/* Mensagem principal */}
            <p className="text-gray-600 mb-4 leading-relaxed">{message}</p>

            {/* Exibe erro se existir */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 text-red-700 border border-red-300 rounded-md p-2 mb-4 text-sm"
              >
                {errorMsg}
              </motion.div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 mt-2">
              <motion.button
                onClick={onCancel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancelar
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm transition disabled:opacity-50"
              >
                {loading ? "Processando..." : "Confirmar"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
