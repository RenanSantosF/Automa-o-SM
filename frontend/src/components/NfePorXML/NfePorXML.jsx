import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
const api = import.meta.env.VITE_API_URL;

export default function NfePorXML() {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ultimoZip, setUltimoZip] = useState(null);

  const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, 'text/xml');
    const nodes = xml.getElementsByTagName('chave');
    const chaves = [];
    for (let i = 0; i < nodes.length; i++) chaves.push(nodes[i].textContent.replace(/\D/g, ''));
    return chaves;
  };

  const handleArquivos = (e) => setArquivos([...e.target.files]);

  const handleImportar = async () => {
    if (!arquivos.length) return toast.error('Selecione ao menos um arquivo XML');

    try {
      setLoading(true);
      const todasChaves = [];

      for (let file of arquivos) {
        const text = await file.text();
        todasChaves.push(...parseXML(text));
      }

      if (!todasChaves.length) return toast.error('Nenhuma chave encontrada nos XMLs');

      const res = await axios.post(`${api}/nfe/download`, todasChaves, { responseType: 'blob' });
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
    } catch {
      toast.error('Erro ao processar XMLs');
    } finally {
      setLoading(false);
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

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <input
        type="file"
        multiple
        accept=".xml"
        onChange={handleArquivos}
        disabled={loading}
        className="text-white w-full file:bg-gray-700 file:text-white file:px-4 file:py-2 file:rounded-md file:border-0 file:cursor-pointer hover:file:bg-green-600 transition-all"
      />
      <motion.button
        onClick={handleImportar}
        disabled={loading || !arquivos.length}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`px-6 py-3 rounded-md font-semibold shadow-md cursor-pointer transition-all duration-300 ${
          loading || !arquivos.length ? 'bg-gray-600 cursor-not-allowed text-gray-300' : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
        style={{ borderRadius: '6px 2px 6px 2px' }}
      >
        {loading ? 'Processando...' : 'Importar NFes'}
      </motion.button>

      {ultimoZip && (
        <motion.button
          onClick={handleBaixarUltimo}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-6 py-3 rounded-md font-semibold bg-green-500 hover:bg-green-600 shadow-md cursor-pointer transition-all"
          style={{ borderRadius: '6px 2px 6px 2px' }}
        >
          Baixar novamente
        </motion.button>
      )}
    </div>
  );
}
