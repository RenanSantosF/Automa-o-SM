import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

export const ModalReprovacao = ({
  modalReprovarAberto,
  motivoReprovacao,
  setMotivoReprovacao,
  setModalReprovarAberto,
  reprovar,
  setComentarios,
  doc,
}) => {
  return (
    <AnimatePresence>
      {modalReprovarAberto === doc.id && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2">
              <FaTimes /> Motivo da Reprovação
            </h3>
            <textarea
  autoFocus
  rows={4}
  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-red-500 focus:ring focus:ring-red-100 resize-none"
  placeholder="Informe o motivo da reprovação"
  value={motivoReprovacao}
  onChange={(e) => setMotivoReprovacao(e.target.value)}
/>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMotivoReprovacao('');
                  setModalReprovarAberto(null);
                  setComentarios((prev) => ({ ...prev, [doc.id]: '' }));
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => reprovar(doc)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
              >
                Confirmar Reprovação
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
