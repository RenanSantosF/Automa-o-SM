import React, { useState } from 'react';
import { useUser } from '../../Contexts/RegisterContext';
import { FiUser, FiKey, FiServer, FiCheckCircle, FiLoader, FiEye, FiEyeOff } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const setores = ['ocorrencia', 'expedicao', 'outros', "admin"];

export default function RegisterForm() {
  const { register, loading, error: registerError } = useUser();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    senha: '',
    setor: setores[0],
    usuario_apisul: '',
    senha_apisul: '',
  });

  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [mostrarApisul, setMostrarApisul] = useState(false);
  const [senhaApisulVisivel, setSenhaApisulVisivel] = useState(false);
  const [senhaConfirm, setSenhaConfirm] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (senhaConfirm !== '985509') {
      setError('Senha incorreta para criação do usuário.');
      return;
    }

    try {
      await register(form);
      alert('✅ Usuário registrado com sucesso!');
      navigate('/login');
      setForm({
        username: '',
        email: '',
        senha: '',
        setor: setores[0],
        usuario_apisul: '',
        senha_apisul: '',
      });
      setSenhaConfirm('');
    } catch (err) {
      setError(err.message || 'Erro ao registrar usuário.');
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
        className="bg-[#1f1f1f]/90 backdrop-blur-md border border-gray-400 p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5"
      >
        <h2 className="text-2xl font-bold text-center text-green-400 flex items-center justify-center gap-2">
          <FiCheckCircle /> Registrar Novo Usuário
        </h2>

        <div className="flex flex-col">
          <label className="text-sm text-gray-300 mb-1 flex gap-1">
            <FiUser /> Usuário *
          </label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            placeholder="Ex: joao"
            className="bg-[#2b2b2b] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
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
            <FiKey /> Senha *
          </label>
          <input
            type={senhaVisivel ? 'text' : 'password'}
            name="senha"
            value={form.senha}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className="bg-[#2b2b2b] border border-gray-600 rounded-lg px-3 py-2 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <button
            type="button"
            onClick={() => setSenhaVisivel(!senhaVisivel)}
            className="absolute right-3 top-9 text-gray-400"
          >
            {senhaVisivel ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-300 mb-1 flex gap-1">
            <FiServer /> Setor *
          </label>
          <select
            name="setor"
            value={form.setor}
            onChange={handleChange}
            required
            className="bg-[#2b2b2b] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {setores.map((setor) => (
              <option key={setor} value={setor}>
                {setor.charAt(0).toUpperCase() + setor.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setMostrarApisul(!mostrarApisul)}
          className="text-sm text-green-400 hover:underline"
        >
          {mostrarApisul ? 'Esconder Apisul' : 'Utiliza Apisul?'}
        </button>

        <div className='overflow-hidden'>



        <AnimatePresence>
          {mostrarApisul && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
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
              <div className="flex flex-col relative">
                <label className="text-sm text-gray-300 mb-1 flex gap-1">
                  <FiKey /> Senha Apisul
                </label>
                <input
                  type={senhaApisulVisivel ? 'text' : 'password'}
                  name="senha_apisul"
                  value={form.senha_apisul}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="bg-[#2b2b2b] border border-gray-600 rounded-lg px-3 py-2 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <button
                  type="button"
                  onClick={() => setSenhaApisulVisivel(!senhaApisulVisivel)}
                  className="absolute right-3 top-9 text-gray-400"
                >
                  {senhaApisulVisivel ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
                </div>



        <AnimatePresence>
          <motion.div
            key="senhaConfirm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col overflow-hidden"
          >
            <label className="text-sm text-gray-300 mb-1 flex gap-1">
              <FiKey /> Informe a senha de administrador *
            </label>
            <input
              type="password"
              name="senhaConfirm"
              value={senhaConfirm}
              onChange={(e) => setSenhaConfirm(e.target.value)}
              placeholder="••••••••"
              className="bg-[#2b2b2b] border border-red-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              autoFocus
              required
            />
          </motion.div>
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          className={`cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl ${loading ? 'bg-green-800 cursor-wait' : 'bg-green-600 hover:bg-green-700 transition-all'} text-white font-medium`}
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin" /> Registrando...
            </>
          ) : (
            <>
              <FiCheckCircle /> Registrar
            </>
          )}
        </button>

        {(error || registerError) && (
          <p className="text-red-500 text-center text-sm border border-red-500 p-2 rounded-lg bg-red-500/10">
            {error || registerError}
          </p>
        )}
      </form>
    </motion.div>
  );
}
