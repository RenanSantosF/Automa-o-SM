import UploadCtes from "../components/UploadCTe/UploadCtes";
import ListaNfe from "../components/ListaNfe/ListaNfe";
import { motion } from "framer-motion";

const ImportacaoNFE = () => {
  const tituloAnimacao = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };
  return (
    <div className="p-6">
          {/* Título menor, discreto e animado */}
    <motion.h1
      className="text-xl font-semibold text-white text-center mb-4 select-none tracking-wide"
      initial="hidden"
      animate="visible"
      variants={tituloAnimacao}
    >
      Importação de NFes
    </motion.h1>
      <UploadCtes />
      <ListaNfe />
    </div>
  );
};

export default ImportacaoNFE;
