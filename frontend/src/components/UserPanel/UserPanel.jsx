import React, { useEffect, useState } from 'react';
import { FiUsers, FiTrash2, FiEdit, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const api = import.meta.env.VITE_API_URL;
const setores = ['ocorrencia', 'expedicao', 'outros', 'admin'];

export default function UsersPanel() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [novoSetor, setNovoSetor] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  async function fetchUsuarios() {
    setLoading(true);
    setError('');
    setMsg('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${api}/usuarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Erro ao carregar usuários');

      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      toast.error('Erro ao carregar usuários');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deletarUsuario(id) {
    const confirm = window.confirm('Tem certeza que deseja deletar este usuário?');
    if (!confirm) return;

    setError('');
    setMsg('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${api}/usuarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Erro ao deletar usuário');
      }

      setMsg('Usuário deletado com sucesso!');
      toast.success('Usuário deletado com sucesso!');
      fetchUsuarios();
    } catch (err) {
      setError(err.message);
      toast.error('Erro ao deletar usuário!');
    }
  }

  async function atualizarSetor(id) {
    setError('');
    setMsg('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${api}/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ setor: novoSetor }),
      });

      if (!res.ok) {
        const text = await res.text();
        toast.error('Erro ao atualizar setor!');
        throw new Error(text || 'Erro ao atualizar setor');
      }

      setMsg('Setor atualizado com sucesso!');
      toast.success('Setor atualizado com sucesso!');
      setEditando(null);
      fetchUsuarios();
    } catch (err) {
      toast.error('Erro ao atualizar setor!');
      setError(err.message);
    }
  }

const usuariosFiltrados = usuarios.filter((u) => {
  const username = u.username || '';
  const email = u.email || '';
  return (
    username.toLowerCase().includes(filtro.toLowerCase()) ||
    email.toLowerCase().includes(filtro.toLowerCase())
  );
});


  return (
    <motion.div
      className="min-h-screen bg-[#222] text-white p-4 sm:p-8 max-w-3xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-3xl font-bold text-green-400 mb-6 flex items-center gap-2">
        <FiUsers /> Painel de Usuários
      </h1>

      <input
        type="text"
        placeholder="Filtrar por nome ou email..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full mb-6 px-4 py-2 rounded-lg bg-[#1c1c1c] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {loading && (
        <p className="flex items-center gap-2 text-green-400 animate-pulse">
          <FiLoader className="animate-spin" /> Carregando usuários...
        </p>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 flex items-center gap-2">
          <FiAlertTriangle /> {error}
        </div>
      )}

      {msg && (
        <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-4">
          {msg}
        </div>
      )}

      <div className="grid gap-4">
        {usuariosFiltrados.map((user) => (
          <div
            key={user.id}
            className="bg-[#1c1c1c] border border-gray-600 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <p className="text-lg font-semibold text-green-300">{user.username}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
              <p className="text-sm text-gray-500">
                Setor: <strong>{user.setor}</strong>
              </p>
            </div>

            <div className="flex gap-3 items-center">
              {editando === user.id && (
                <>
                  <select
                    value={novoSetor}
                    onChange={(e) => setNovoSetor(e.target.value)}
                    className="bg-[#2b2b2b] border border-gray-500 rounded-md px-2 py-1 text-sm text-white"
                  >
                    {setores.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => atualizarSetor(user.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md text-sm"
                  >
                    Confirmar
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setEditando(user.id);
                  setNovoSetor(user.setor);
                  setError('');
                  setMsg('');
                }}
                className="text-yellow-400 hover:text-yellow-500"
              >
                <FiEdit />
              </button>

              <button
                onClick={() => deletarUsuario(user.id)}
                className="text-red-500 hover:text-red-600"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
