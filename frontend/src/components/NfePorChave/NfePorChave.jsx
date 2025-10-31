

import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
const api = import.meta.env.VITE_API_URL;

export default function NfePorChave() {
  const [chaves, setChaves] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [concluido, setConcluido] = useState(false);
  const [ultimoZip, setUltimoZip] = useState(null);

  const sanitizeChaves = (text) =>
    text.split('\n').map((linha) => linha.replace(/\D/g, '')).join('\n');

  const handleDownload = async () => {
    const lista = sanitizeChaves(chaves).split('\n').map((c) => c.trim()).filter(Boolean);
    if (!lista.length) return toast.error('Cole ao menos uma chave!');

    try {
      setLoading(true);
      // setProgress('Iniciando processamento...');

      const res = await axios.post(`${api}/nfe/download`, lista, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      setUltimoZip(blob);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'notas_fiscais.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Download concluído!');
      setConcluido(true);
    } catch {
      toast.error('Erro ao baixar NFes!');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleBaixarUltimo = () => {
    if (!ultimoZip) return;
    const url = window.URL.createObjectURL(ultimoZip);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'notas_fiscais.zip');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleNovaConsulta = () => {
    setChaves('');
    setConcluido(false);
    setProgress('');
    setUltimoZip(null);
  };

  return (
    <>
      {!concluido ? (
        <>
          <textarea
            className="w-full h-60 p-4 rounded-md bg-[#222] border border-gray-700 focus:ring-2 focus:ring-green-400 focus:outline-none text-white placeholder-gray-400 transition-all"
            placeholder="Cole aqui as chaves de acesso, uma por linha"
            value={chaves}
            onChange={(e) => setChaves(e.target.value)}
            disabled={loading}
          />
          <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3 items-center">
            <motion.button
              onClick={handleDownload}
              disabled={loading || chaves.trim() === ''}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 px-6 py-3 font-semibold transition-all duration-300 shadow-md cursor-pointer ${
                loading ? 'bg-gray-600 cursor-not-allowed text-gray-300' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              style={{ borderRadius: '6px 2px 6px 2px' }}
            >
              {loading ? 'Processando...' : 'Baixar NFes'}
            </motion.button>
            {loading && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-400 mt-2 sm:mt-0"
              >
                {progress}
              </motion.span>
            )}
          </div>
        </>
      ) : (
        <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center w-full">
          <motion.button
            onClick={handleNovaConsulta}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 px-6 py-3 font-semibold bg-green-500 hover:bg-green-600 text-white shadow-md cursor-pointer transition-all"
            style={{ borderRadius: '6px 2px 6px 2px' }}
          >
            Nova consulta
          </motion.button>
          <motion.button
            onClick={handleBaixarUltimo}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 px-6 py-3 font-semibold bg-green-600 hover:bg-green-700 text-white shadow-md cursor-pointer transition-all"
            style={{ borderRadius: '6px 2px 6px 2px' }}
          >
            Baixar novamente
          </motion.button>
        </div>
      )}
    </>
  );
}
