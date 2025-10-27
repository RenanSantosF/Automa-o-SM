import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useLogin } from '../Contexts/LoginContext';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-quill-new/dist/quill.snow.css';
import { FiEdit2, FiTrash2, FiPlusCircle, FiX } from 'react-icons/fi';


import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import ImageResize from 'quill-image-resize';
Quill.register('modules/imageResize', ImageResize);


// 🔹 Modal claro com fundo escurecido translúcido
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white/95 text-gray-800 rounded-lg shadow-2xl w-[95%] sm:w-[80%] md:w-[70%] lg:max-w-[60%] xl:max-w-[50%] max-h-[95vh] flex flex-col border border-gray-300 overflow-hidden"
        >
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-3 z-50 text-gray-500 hover:text-gray-700 cursor-pointer transition bg-white shadow-sm   rounded-full p-1 "
          >
            <FiX size={22} />
          </button>

          {/* Conteúdo principal */}
          <div className="relative flex-1 overflow-y-auto z-10">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function KnowledgePage() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('tutorial');
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const quillRef = useRef();

  const { userData } = useLogin();

  const setor = userData?.setor?.toLowerCase(); // garante minúscula e evita undefined

  const token = localStorage.getItem('token');
  // const setor = localStorage.getItem('setor');

  const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/knowledge`,
    headers: { Authorization: `Bearer ${token}` },
  });

  // 🔹 Buscar registros com limite/paginação
  const fetchEntries = async (newOffset = 0) => {
    try {
      const res = await api.get('/', {
        params: { q: search, limit: 50, offset: newOffset },
      });
      if (newOffset === 0) setEntries(res.data);
      else setEntries((prev) => [...prev, ...res.data]);
      setHasMore(res.data.length === 50);
      setOffset(newOffset);
    } catch {
      alert('Erro ao carregar registros.');
    }
  };

  useEffect(() => {
    fetchEntries(0);
  }, [search]);

  // 🔹 Upload imagem
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await api.post('/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', res.data.url);
        } catch {
          alert('Erro ao enviar imagem.');
        }
      }
    };
  }, []);


const modules = {
  toolbar: {
    container: [
      [{ font: [] }],
      [{ header: [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'clean'],
    ],
    handlers: { image: imageHandler }, // seu handler de upload
  },
  imageResize: {
    parchment: Quill.import('parchment'),
    modules: ['Resize', 'DisplaySize', 'Toolbar'], // módulos que deseja habilitar
  },
};



  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'color',
    'background',
    'list',
    'align',
    'link',
    'image',
  ];

  // 🔹 Salvar / editar
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Preencha o título e o conteúdo.');
      return;
    }
    try {
      if (editingId) await api.put(`/${editingId}`, { title, type, content });
      else await api.post('/', { title, type, content });

      setTitle('');
      setContent('');
      setEditingId(null);
      setFormModalOpen(false);
      fetchEntries(0);
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao salvar.');
    }
  };

  // 🔹 Deletar
  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      await api.delete(`/${id}`);
      fetchEntries(0);
      setViewModalOpen(false);
    } catch {
      alert('Erro ao deletar.');
    }
  };

  const canEdit = setor === 'admin' || setor === 'expedicao';

  return (
    <div className="text-gray-800 p-6 bg-gray-100 min-h-screen">
      {/* 🔹 Cabeçalho */}
      <motion.h1
        className="text-3xl font-bold mb-6 text-center text-green-600"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        📗 Base de Conhecimento
      </motion.h1>

      {/* 🔹 Novo registro */}
      {canEdit && (
        <div className="flex justify-start mb-4">
          <button
            onClick={() => {
              setTitle('');
              setContent('');
              setEditingId(null);
              setFormModalOpen(true);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-sm hover:bg-green-700 cursor-pointer transition"
          >
            <FiPlusCircle /> Novo Registro
          </button>
        </div>
      )}

      {/* 🔹 Busca */}
      <input
        placeholder="🔍 Buscar pelo título ou por algum conteúdo do texto..."
        className="bg-white-50 text-gray-800 w-full p-2 mb-6 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 🔹 Lista */}
      <div className="bg-white rounded-md divide-y divide-gray-200 border border-gray-300">
        {entries.map((e) => (
          <motion.div
            key={e.id}
            whileHover={{ scale: 1.01 }}
            className="p-4 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => {
              setViewEntry(e);
              setViewModalOpen(true);
            }}
          >
            <h2 className="font-semibold text-gray-800">{e.title}</h2>
            <p className="text-xs text-gray-500">
              {e.type === 'tutorial' ? '📘 Tutorial' : '🧩 Solução de Erro'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              🕒{' '}
              {new Date(new Date(e.created_at).getTime() - 3 * 60 * 60 * 1000).toLocaleString(
                'pt-BR'
              )}
            </p>
          </motion.div>
        ))}
      </div>

      {/* 🔹 Botão carregar mais */}
      {hasMore && (
        <button
          onClick={() => fetchEntries(offset + 50)}
          className="mt-3 w-full py-2 text-center bg-white border border-gray-300 hover:bg-gray-50 rounded-md cursor-pointer transition"
        >
          Carregar mais
        </button>
      )}
      {/* 🔹 Modal formulário */}
      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)}>
        <div className="flex flex-col h-[95vh]">
          {/* Cabeçalho */}
          <div className="flex justify-between items-center p-4 border-b border-gray-300 sticky top-0 bg-white/90 z-10">
            <h2 className="text-xl font-semibold text-green-600">
              {editingId ? '✏️ Editar Documento' : '📝 Novo Documento'}
            </h2>
          </div>

          {/* Campos de título e tipo */}
          <div className="gap-3 flex flex-col px-4 my-2">
            <input
              placeholder="Título"
              className="bg-white border border-gray-300 text-gray-800 w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              className="bg-white border border-gray-300 text-gray-800 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="tutorial">📘 Tutorial</option>
              <option value="solution">🧩 Solução de Erro</option>
            </select>
          </div>

          {/* Editor rolável ocupa espaço restante */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
            <ReactQuill
              ref={quillRef}
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              theme="snow"
              className="flex-1 h-full"
              style={{
                backgroundColor: 'white',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                display: 'flex',
                flexDirection: 'column',
              }}
            />
            <style jsx global>{`
              .ql-container {
                flex: 1 !important;
                height: auto !important;
              }
              .ql-editor {
                min-height: 15rem;
                flex-grow: 1;
              }
            `}</style>
          </div>

          {/* Rodapé fixo */}
          <div className="p-4 border-t flex justify-end border-gray-300 sticky bottom-0 bg-white/90 z-10">
            <button
              onClick={handleSubmit}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-sm text-sm font-medium text-white cursor-pointer"
            >
              {editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 🔹 Modal de visualização */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        {viewEntry && (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-300 sticky top-0 bg-white/90 z-10">
              <div>
                <h2 className="text-lg font-semibold text-green-600">{viewEntry.title}</h2>
                <p className="text-xs text-gray-500 mb-3">
                  {viewEntry.type === 'tutorial' ? '📘 Tutorial' : '🧩 Solução de Erro'}
                  <br />
                  🕒 {new Date(viewEntry.created_at).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="flex gap-3 mr-10">
                {canEdit && (
                  <>
                    <button
                      onClick={() => {
                        setTitle(viewEntry.title);
                        setType(viewEntry.type);
                        setContent(viewEntry.content);
                        setEditingId(viewEntry.id);
                        setFormModalOpen(true);
                        setViewModalOpen(false);
                      }}
                      className="text-yellow-600 hover:text-yellow-500 cursor-pointer"
                    >
                      <FiEdit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(viewEntry.id)}
                      className="text-red-600 hover:text-red-500 cursor-pointer"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </>
                )}
                {/* <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <FiX size={22} />
                </button> */}
              </div>
            </div>

            <div className="p-4 space-y-3 bg-white overflow-y-auto rounded-b-md">
              <div
                className="ql-editor break-words text-gray-800"
                dangerouslySetInnerHTML={{ __html: viewEntry.content }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
