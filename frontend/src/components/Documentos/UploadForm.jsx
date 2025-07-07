import React, { useState } from 'react';
import Input from '../Input/Input';
import InputFile from '../Input/InputFile';
import { toast } from 'react-toastify';
import { MdAddBox, MdClose } from 'react-icons/md';
import { FaUpload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const api = import.meta.env.VITE_API_URL;

const UploadForm = ({ isAuthenticated, fetchDocumentos }) => {
  const [mostrar, setMostrar] = useState(false);
  const [nome, setNome] = useState('');
  const [placa, setPlaca] = useState('');
  const [cliente, setCliente] = useState('');
  const [data, setData] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();

    if (!nome || !placa || !cliente || !data || !file) {
      toast.error('Preencha todos os campos');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('nome', nome);
    formData.append('placa', placa);
    formData.append('cliente', cliente);
    formData.append('data_do_malote', data);

    setLoading(true);

    try {
      const res = await fetch(`${api}/documentos/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error();
      toast.success('Documento enviado');
      setNome('');
      setPlaca('');
      setCliente('');
      setData('');
      setFile(null);
      setMostrar(false);
      fetchDocumentos();
    } catch {
      toast.error('Erro ao enviar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 px-4 pt-6 text-black">
      {/* Botão */}
      <button
        disabled={!isAuthenticated}
        onClick={() => setMostrar(!mostrar)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white ${
          isAuthenticated ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        <motion.div animate={{ rotate: mostrar ? 90 : 0 }} transition={{ duration: 0.3 }}>
          {mostrar ? <MdClose size={20} /> : <MdAddBox size={20} />}
        </motion.div>
        {mostrar ? 'Ocultar Envio' : 'Enviar Comprovante'}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {mostrar && (
          <>
            {/* Fundo escurecido */}
            <motion.div
              className="fixed inset-0 bg-black/80 bg-opacity-40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMostrar(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <form
                onSubmit={enviar}
                className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-md flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Botão de Fechar */}
                <button
                  type="button"
                  onClick={() => setMostrar(false)}
                  className="cursor-pointer absolute top-4 right-4 text-gray-500 hover:text-black"
                >
                  <MdClose size={26} />
                </button>

                <h2 className="text-xl font-bold mb-2">Enviar Documento</h2>

                <Input
                  placeholder="Nome do condutor"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <Input placeholder="CTe" value={placa} onChange={(e) => setPlaca(e.target.value)} />
                <Input
                  placeholder="Cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                />
                <Input
                  placeholder="Data de envio do Malote"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="border p-2 rounded"
                />
                <InputFile onChange={(e) => setFile(e.target.files[0])} />

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 justify-center"
                >
                  {loading ? (
                    'Enviando...'
                  ) : (
                    <>
                      <FaUpload size={18} /> Enviar Documento
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadForm;
