import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoAlertOutline } from "react-icons/io5";

const AlertaGNRE = ({ isOpen, onClose }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
    } else {
      // Removendo timeout para fechar instantâneo
      setShowModal(false);
    }
  }, [isOpen]);

  if (!isOpen && !showModal) return null;

  console.log("modal ativado");

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      {/* Fundo escurecido */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Conteúdo do modal com animação só para abrir */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            // Removi exit para fechar instantâneo
            transition={{ duration: 0.3 }}
            className="relative flex-col bg-white rounded-lg p-6 w-full max-w-lg shadow-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <IoAlertOutline className="w-6 h-6" />
                Atenção necessária
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="text-gray-800 text-sm leading-relaxed space-y-2">
              <p>
                O conhecimento de transporte que você está importando{" "}
                <b>
                  possivelmente requer o pagamento da GNRE (Guia Nacional de
                  Recolhimento de Tributos Estaduais)
                </b>
                .
              </p>
              <p>
                Verifique os dados do remetente e destinatário, bem como o estado
                de origem e destino para confirmar se a guia deve ser gerada
                antes da circulação da mercadoria.
              </p>
              <p className="text-red-600 font-semibold">
                O não pagamento pode gerar multas ou retenção da carga!
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlertaGNRE;
