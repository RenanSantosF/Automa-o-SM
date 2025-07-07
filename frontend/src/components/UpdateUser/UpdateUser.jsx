import React, { useState, useEffect } from 'react';
import {
  FiUser,
  FiKey,
  FiServer,
  FiCheckCircle,
  FiLoader,
  FiEye,
  FiEyeOff,
  FiShield
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../Contexts/LoginContext';
const setores = ['ocorrencia', 'expedicao', 'outros'];
const api = import.meta.env.VITE_API_URL;

export default function UpdateUser() {
  const { logout } = useLogin();
  const [form, setForm] = useState({
    username: '',
    email: '',
    senha: '',
    setor: setores[0],
    usuario_apisul: '',
    senha_apisul: '',
  });

  const [setorInicial, setSetorInicial] = useState('');
  const [senhaConfirmSetor, setSenhaConfirmSetor] = useState('');
  const [mostrarApisul, setMostrarApisul] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Usuário não autenticado');
        return;
      }

      try {
        const res = await fetch(`${api}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Falha ao buscar dados do usuário');
        }

        const data = await res.json();
        setForm({
          username: data.username,
          email: data.email || '',
          senha: '',
          setor: data.setor || setores[0],
          usuario_apisul: data.usuario_apisul || '',
          senha_apisul: '',
        });
        setSetorInicial(data.setor || setores[0]);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'setor') {
      setSenhaConfirmSetor('');
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (form.setor !== setorInicial) {
      if (senhaConfirmSetor !== '985509') {
        setError('Senha incorreta para alteração do setor.');
        setLoading(false);
        return;
      }
    }

    const payload = {};
    if (form.email !== '') payload.email = form.email;
    if (form.senha) payload.senha = form.senha;
    if (form.setor !== setorInicial) payload.setor = form.setor;
    if (mostrarApisul && form.usuario_apisul) payload.usuario_apisul = form.usuario_apisul;
    if (mostrarApisul && form.senha_apisul) payload.senha_apisul = form.senha_apisul;

    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Usuário não autenticado');

      const res = await fetch(`${api}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Erro ao atualizar usuário');
      }

      setSuccessMessage('✅ Usuário atualizado com sucesso!');
      setSetorInicial(form.setor);
      setSenhaConfirmSetor('');

      setTimeout(() => {
        logout();
        localStorage.removeItem('token');
        navigate('/login');
      }, 2000);

      setForm((prev) => ({ ...prev, senha: '', senha_apisul: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center min-h-screen bg-[#333]"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#1f1f1f]/90 backdrop-blur-md border border-green-700/40 p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5"
      >
        <h2 className="text-2xl font-bold text-center text-green-400 flex items-center justify-center gap-2">
          <FiCheckCircle /> Atualizar Usuário
        </h2>

        <div className="flex flex-col">
          <label className="text-sm text-gray-300 mb-1 flex gap-1">
            <FiUser /> Usuário
          </label>
          <input
            type="text"
            name="username"
            value={form.username}
            readOnly
            className="bg-[#2b2b2b] border border-gray-600 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-300 mb-1 flex gap-1">
            <FiUser /> Email *
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="exemplo@dominio.com"
            className="bg-[#2b2b2b] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div className="flex flex-col relative">
          <label className="text-sm text-gray-300 mb-1 flex gap-1">
            <FiKey /> Nova Senha
          </label>
          <input
            type={mostrarSenha ? 'text' : 'password'}
            name="senha"
            value={form.senha}
            onChange={handleChange}
            placeholder="••••••••"
            className="bg-[#2b2b2b] border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <span
            className="absolute right-3 top-[38px] text-gray-400 cursor-pointer"
            onClick={() => setMostrarSenha(!mostrarSenha)}
          >
            {mostrarSenha ? <FiEyeOff /> : <FiEye />}
          </span>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-300 mb-1 flex gap-1">
            <FiServer /> Setor
          </label>
          <select
            name="setor"
            value={form.setor}
            onChange={handleChange}
            className="bg-[#2b2b2b] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {setores.map((setor) => (
              <option key={setor} value={setor}>
                {setor.charAt(0).toUpperCase() + setor.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <AnimatePresence>
          {form.setor !== setorInicial && (
            <motion.div
              key="senhaConfirmSetor"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col overflow-hidden"
            >
              <label className="text-sm text-gray-300 mb-1 flex gap-1">
                <FiShield /> Confirmar senha para mudar o setor
              </label>
              <input
                type="password"
                name="senhaConfirmSetor"
                value={senhaConfirmSetor}
                onChange={(e) => setSenhaConfirmSetor(e.target.value)}
                placeholder="••••••••"
                className="bg-[#2b2b2b] border border-red-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                required
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setMostrarApisul(!mostrarApisul)}
          className="text-sm text-green-400 underline"
        >
          {mostrarApisul ? 'Ocultar campos Apisul' : 'Utiliza Apisul?'}
        </button>

        <div className='overflow-hidden'>

        
        <AnimatePresence>
          {mostrarApisul && (
            <motion.div
              key="apisul-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1 flex gap-1">
                  <FiUser /> Usuário Apisul
                </label>
                <input
                  type="text"
                  name="usuario_apisul"
                  value={form.usuario_apisul}
                  onChange={handleChange}
                  placeholder="login.apisul"
                  className="bg-[#2b2b2b] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1 flex gap-1">
                  <FiKey /> Senha Apisul
                </label>
                <input
                  type="password"
                  name="senha_apisul"
                  value={form.senha_apisul}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="bg-[#2b2b2b] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        <button
          type="submit"
          disabled={loading}
          className={`cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl 
            ${loading ? 'bg-green-800 cursor-wait' : 'bg-green-600 hover:bg-green-700 transition-all'} 
            text-white font-medium`}
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin" /> Atualizando...
            </>
          ) : (
            <>
              <FiCheckCircle /> Atualizar
            </>
          )}
        </button>

        {successMessage && (
          <p className="text-green-500 text-center text-sm border border-green-500 p-2 rounded-lg bg-green-500/10">
            {successMessage}
          </p>
        )}
        {error && (
          <p className="text-red-500 text-center text-sm border border-red-500 p-2 rounded-lg bg-red-500/10">
            {error}
          </p>
        )}
      </form>
    </motion.div>
  );
}
