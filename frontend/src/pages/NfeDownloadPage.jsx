import { useState } from 'react';
import { motion } from 'framer-motion';
import NfePorChave from '../components/NfePorChave/NfePorChave';
import NfePorXML from '../components/NfePorXML/NfePorXML';
import { FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

export default function NfeDownloadPage() {
  const [modo, setModo] = useState('chave'); // "chave" ou "cte"

  return (
    <div className="p-6 md:p-8 lg:p-12 text-white max-w-5xl mx-auto flex flex-col items-center mt-8">
      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-bold mb-6 text-center text-amber-50 tracking-wide"
      >
        Gerenciar NFes
      </motion.h1>

      {/* Subtítulo / badge info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-3 mb-10 text-gray-300 text-sm md:text-base"
      >
        <FiInfo className="text-green-400 mt-0.5" />
        Use esta ferramenta para baixar NFes por chave ou importar XMLs de CTe. 

      </motion.div>

      {/* Botões de modo */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full justify-center">
        <motion.button
          onClick={() => setModo('chave')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`flex-1 px-7 py-3 font-semibold transition-all duration-300 border-2 border-transparent hover:border-green-500 shadow-md cursor-pointer ${
            modo === 'chave'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          style={{ borderRadius: '8px 2px 8px 2px' }} // menos arredondado, mais corporativo
        >
          Baixar NFes por chave
        </motion.button>

        <motion.button
          onClick={() => setModo('cte')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`flex-1 px-7 py-3 font-semibold transition-all duration-300 border-2 border-transparent hover:border-green-500 shadow-md cursor-pointer ${
            modo === 'cte'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          style={{ borderRadius: '8px 2px 8px 2px' }}
        >
          Importar NFes de XML de CTe
        </motion.button>
      </div>

      {/* Conteúdo principal */}
      <motion.div
        key={modo} // anima troca de conteúdo
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full bg-[#1e1e1e] p-6 md:p-8 rounded-xl shadow-2xl border border-gray-700 cursor-default"
      >
        {modo === 'chave' && <NfePorChave />}
        {modo === 'cte' && <NfePorXML />}
      </motion.div>

      {/* Rodapé profissional */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-gray-400 text-sm mt-6 text-center italic"
      >
        <span className="text-gray-500">⚡ Dica:</span> Cole suas chaves ou importe os XMLs de CTe. Todas as operações são seguras e auditáveis.
      </motion.p>
    </div>
  );
}
