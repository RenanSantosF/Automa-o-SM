import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
};

const Modal = ({ isOpen, onClose, content }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Fundo escuro com animação */}
          <motion.div
            className="absolute inset-0 bg-black/4"
            variants={backdropVariants}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            transition={{ duration: 0.3 }}
            className="relative z-10 bg-white rounded-lg p-6 w-[95%] sm:w-3/4  max-h-[90vh] overflow-y-auto "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Informação</h2>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 max-w-full text-gray-700">
              <div className="mt-4 break-words overflow-x-auto">
                {typeof content === 'string' ? (
                  <p className="text-sm whitespace-normal">{content}</p>
                ) : (
                  <div className="text-sm whitespace-normal">{content}</div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
