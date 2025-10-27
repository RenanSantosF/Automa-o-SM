// src/components/Modal/ConfirmModal.jsx
import { motion } from "framer-motion";

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-gray-800 p-6 rounded-xl shadow-lg w-80"
      >
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white">
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmModal;
