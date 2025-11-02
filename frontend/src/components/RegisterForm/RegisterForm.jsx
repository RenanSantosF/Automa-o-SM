import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../Contexts/RegisterContext';
import {
  FiUser,
  FiKey,
  FiServer,
  FiCheckCircle,
  FiLoader,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const setores = ['ocorrencia', 'expedicao', 'outros', 'admin'];

export default function RegisterForm() {
  const { register, loading: loadingContext, error: registerError } = useUser();
  const navigate = useNavigate();
  const mounted = useRef(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    senha: '',
    setor: setores[0],
    usuario_apisul: '',
    senha_apisul: '',
    nome: '',
    transportadora: '',
    filial: '',
  });

  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [mostrarApisul, setMostrarApisul] = useState(false);
  const [senhaApisulVisivel, setSenhaApisulVisivel] = useState(false);
  const [senhaConfirm, setSenhaConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  // derived states
  const requiredFields = ['username', 'email', 'senha', 'nome', 'transportadora', 'filial'];
  const isFormComplete = requiredFields.every((f) => (form[f] ?? '').toString().trim().length > 0);
  const isDirty = Object.values(form).some((v) => v && v.toString().trim() !== '');

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // block navigation (close/refresh/back) if user started filling and form is incomplete
  useEffect(() => {
    const shouldBlock = isDirty && !isFormComplete;

    const handleBeforeUnload = (e) => {
      if (shouldBlock) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handlePopState = (e) => {
      if (shouldBlock) {
        // keep user on page and notify
        window.history.pushState(null, '', window.location.href);
        alert('Complete todos os campos obrigatórios antes de sair desta página.');
      }
    };

    const handleDocumentClick = (ev) => {
      if (!shouldBlock) return;
      const a = ev.target.closest && ev.target.closest('a[href]');
      if (a && a.getAttribute('href') && !a.getAttribute('target')) {
        ev.preventDefault();
        alert('Complete todos os campos obrigatórios antes de sair da página.');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleDocumentClick);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isDirty, isFormComplete]);

  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // validações locais
    if (senhaConfirm !== '985509') {
      setLocalError('Senha incorreta para criação do usuário.');
      return;
    }

    if (!isFormComplete) {
      setLocalError('Preencha todos os campos obrigatórios antes de registrar.');
      return;
    }

    try {
      // a função register deve aceitar o objeto com os novos campos
      await register({
        username: form.username,
        email: form.email,
        senha: form.senha,
        setor: form.setor,
        usuario_apisul: form.usuario_apisul,
        senha_apisul: form.senha_apisul,
        nome: form.nome,
        transportadora: form.transportadora,
        filial: form.filial,
      });

      alert('✅ Usuário registrado com sucesso!');
      // limpa e redireciona
      if (mounted.current) {
        setForm({
          username: '',
          email: '',
          senha: '',
          setor: setores[0],
          usuario_apisul: '',
          senha_apisul: '',
          nome: '',
          transportadora: '',
          filial: '',
        });
        setSenhaConfirm('');
        navigate('/login');
      }
    } catch (err) {
      // register pode lançar erro; exibe mensagem amigável
      setLocalError(err?.message || 'Erro ao registrar usuário.');
    }
  };

  const submitDisabled = loadingContext || !isFormComplete;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex items-center justify-center min-h-[80vh] bg-[#222]"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#0f0f11]/80 backdrop-blur-sm border border-gray-600 p-6 rounded-md shadow-md w-full max-w-lg space-y-4"
      >
        <h2 className="text-xl font-semibold text-green-400 flex items-center justify-center gap-2">
          <FiCheckCircle /> Registrar Novo Usuário
        </h2>

        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex gap-1 items-center">
            <FiUser /> Usuário *
          </label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            placeholder="Ex: joao"
            className={`bg-[#161616] text-sm px-3 py-1.5 border rounded-md focus:outline-none
              ${!form.username.trim() ? 'border-red-500' : 'border-gray-600'}`}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex gap-1 items-center">
            <FiUser /> Email *
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="exemplo@dominio.com"
            className={`bg-[#161616] text-sm px-3 py-1.5 border rounded-md focus:outline-none
              ${!form.email.trim() ? 'border-red-500' : 'border-gray-600'}`}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex gap-1 items-center">
            Nome Completo *
          </label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
            placeholder="Nome completo"
            className={`bg-[#161616] text-sm px-3 py-1.5 border rounded-md focus:outline-none
              ${!form.nome.trim() ? 'border-red-500' : 'border-gray-600'}`}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex gap-1 items-center">
            Transportadora *
          </label>
          <input
            type="text"
            name="transportadora"
            value={form.transportadora}
            onChange={handleChange}
            required
            placeholder="Ex: Dellmar"
            className={`bg-[#161616] text-sm px-3 py-1.5 border rounded-md focus:outline-none
              ${!form.transportadora.trim() ? 'border-red-500' : 'border-gray-600'}`}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex gap-1 items-center">
            Filial *
          </label>
          <input
            type="text"
            name="filial"
            value={form.filial}
            onChange={handleChange}
            required
            placeholder="Ex: Pindamonhangaba"
            className={`bg-[#161616] text-sm px-3 py-1.5 border rounded-md focus:outline-none
              ${!form.filial.trim() ? 'border-red-500' : 'border-gray-600'}`}
          />
        </div>

        <div className="flex flex-col relative">
          <label className="text-xs text-gray-300 mb-1 flex gap-1 items-center">
            <FiKey /> Senha *
          </label>
          <input
            type={senhaVisivel ? 'text' : 'password'}
            name="senha"
            value={form.senha}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className={`bg-[#161616] text-sm px-3 py-1.5 border rounded-md pr-10 focus:outline-none
              ${!form.senha.trim() ? 'border-red-500' : 'border-gray-600'}`}
          />
          <button
            type="button"
            onClick={() => setSenhaVisivel((s) => !s)}
            className="absolute right-3 top-9 text-gray-400"
            aria-label="Mostrar senha"
          >
            {senhaVisivel ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex gap-1 items-center">
            <FiServer /> Setor *
          </label>
          <select
            name="setor"
            value={form.setor}
            onChange={handleChange}
            required
            className="bg-[#161616] text-sm px-3 py-1.5 border border-gray-600 rounded-md focus:outline-none"
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
          onClick={() => setMostrarApisul((s) => !s)}
          className="text-sm text-green-400 hover:underline"
        >
          {mostrarApisul ? 'Esconder Apisul' : 'Utiliza Apisul?'}
        </button>

        <AnimatePresence>
          {mostrarApisul && (
            <motion.div
              key="apisul-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col">
                <label className="text-xs text-gray-300 mb-1 flex gap-1 items-center">
                  Usuário Apisul
                </label>
                <input
                  type="text"
                  name="usuario_apisul"
                  value={form.usuario_apisul}
                  onChange={handleChange}
                  placeholder="login.apisul"
                  className="bg-[#161616] text-sm px-3 py-1.5 border border-gray-600 rounded-md focus:outline-none"
                />
              </div>

              <div className="flex flex-col relative">
                <label className="text-xs text-gray-300 mb-1 flex gap-1 items-center">
                  Senha Apisul
                </label>
                <input
                  type={senhaApisulVisivel ? 'text' : 'password'}
                  name="senha_apisul"
                  value={form.senha_apisul}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="bg-[#161616] text-sm px-3 py-1.5 border border-gray-600 rounded-md pr-10 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSenhaApisulVisivel((s) => !s)}
                  className="absolute right-3 top-9 text-gray-400"
                  aria-label="Mostrar senha apisul"
                >
                  {senhaApisulVisivel ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col overflow-hidden">
          <label className="text-xs text-gray-300 mb-1 flex gap-1 items-center">
            <FiKey /> Informe a senha de administrador *
          </label>
          <input
            type="password"
            name="senhaConfirm"
            value={senhaConfirm}
            onChange={(e) => setSenhaConfirm(e.target.value)}
            placeholder="••••••••"
            className="bg-[#161616] text-sm px-3 py-1.5 border border-red-600 rounded-md focus:outline-none"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitDisabled}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium
              ${submitDisabled ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}
              transition`}
          >
            {loadingContext ? (
              <>
                <FiLoader className="animate-spin" /> Registrando...
              </>
            ) : (
              <>
                <FiCheckCircle /> Registrar
              </>
            )}
          </button>
        </div>

        {/* Feedback */}
        {(localError || registerError) && (
          <p className="text-red-400 text-center text-sm border border-red-600 p-2 rounded-md bg-red-600/6">
            {localError || registerError}
          </p>
        )}

        {!isFormComplete && (
          <p className="text-yellow-300 text-sm border border-yellow-600 p-2 rounded-md bg-yellow-600/6">
            Preencha todos os campos obrigatórios (*) antes de registrar.
          </p>
        )}
      </form>
    </motion.div>
  );
}
