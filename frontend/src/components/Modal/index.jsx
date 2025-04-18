import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Modal = ({ isOpen, onClose, content }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
    } else {
      const timeout = setTimeout(() => setShowModal(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isOpen && !showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      {/* Fundo escurecido */}
      <div
        className="absolute inset-0 bg-black/4 "
        onClick={onClose}
      />

      {/* Conteúdo do modal com animação */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white rounded-lg p-6 w-3/4 max-h-80 overflow-y-auto custom-scroll"
          >
            <div className=" flex justify-between items-center">
              <h2 className="text-xl font-semibold">Informação</h2>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="mt-4 text-gray-700">
              <p>{content}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Modal;
