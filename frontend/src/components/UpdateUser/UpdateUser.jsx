import React, { useState, useEffect, useRef } from 'react';
import {
  FiUser,
  FiKey,
  FiCheckCircle,
  FiLoader,
  FiEye,
  FiEyeOff,
  FiEdit2,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../Contexts/LoginContext';

const setores = ['ocorrencia', 'expedicao', 'outros'];
const api = import.meta.env.VITE_API_URL;

export default function UpdateUser() {
  const { logout } = useLogin();
  const navigate = useNavigate();

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

  const [setorInicial, setSetorInicial] = useState('');
  const [senhaConfirmSetor, setSenhaConfirmSetor] = useState('');
  const [mostrarApisul, setMostrarApisul] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isEditing, setIsEditing] = useState(false); // precisa apertar "Editar Cadastro"
  const [isFormComplete, setIsFormComplete] = useState(true); // assume true até buscar dados
  const mounted = useRef(false);

  // campos obrigatórios para considerar cadastro completo
  const requiredFields = ['email', 'nome', 'transportadora', 'filial'];

  useEffect(() => {
    mounted.current = true;
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
          nome: data.nome || '',
          transportadora: data.transportadora || '',
          filial: data.filial || '',
        });
        setSetorInicial(data.setor || setores[0]);

        // define completude
        const complete = requiredFields.every((f) => {
          const v = (data[f] ?? '').toString().trim();
          return v.length > 0;
        });
        setIsFormComplete(complete);
        // se incompleto, força edição para que preencham (opcional: manter bloqueado até click editar)
        if (!complete) {
          // força modo edição ativo para facilitar preenchimento
          setIsEditing(true);
        }
      } catch (err) {
        setError(err.message);
      }
    }
    fetchUser();

    return () => {
      mounted.current = false;
    };
  }, []); // eslint-disable-line

  // bloqueia fechar/atualizar aba
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isFormComplete) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // popstate = back/forward do navegador
    const handlePopState = (e) => {
      if (!isFormComplete) {
        // re-insere estado para impedir navegar para trás
        window.history.pushState(null, '', window.location.href);
        // alerta simples
        alert('Preencha todos os campos obrigatórios antes de sair desta página.');
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Também previne clicar em links externos (âncoras) - intercepta clicks
    const handleDocumentClick = (ev) => {
      if (!isFormComplete) {
        // se clicar em elemento <a href> que muda a página
        const a = ev.target.closest && ev.target.closest('a[href]');
        if (a && a.getAttribute('href') && !a.getAttribute('target')) {
          ev.preventDefault();
          alert('Complete os campos obrigatórios antes de sair da página.');
        }
      }
    };
    document.addEventListener('click', handleDocumentClick);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isFormComplete]);

  // recalcula completude sempre que o form muda
  useEffect(() => {
    const complete = requiredFields.every((f) => {
      const v = (form[f] ?? '').toString().trim();
      return v.length > 0;
    });
    setIsFormComplete(complete);
  }, [form]); // eslint-disable-line

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'setor') {
      setSenhaConfirmSetor('');
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // antes de enviar, valida completude (já obrigatório)
    if (!isFormComplete) {
      setError('Por favor, preencha todos os campos obrigatórios antes de salvar.');
      setLoading(false);
      return;
    }

    if (form.setor !== setorInicial) {
      if (senhaConfirmSetor !== '985509') {
        setError('Senha incorreta para alteração do setor.');
        setLoading(false);
        return;
      }
    }

    const payload = {};
    // campos que podem ser atualizados
    if (form.email !== '') payload.email = form.email;
    if (form.senha) payload.senha = form.senha;
    if (form.setor !== setorInicial) payload.setor = form.setor;
    if (mostrarApisul && form.usuario_apisul) payload.usuario_apisul = form.usuario_apisul;
    if (mostrarApisul && form.senha_apisul) payload.senha_apisul = form.senha_apisul;

    // novos campos devem sempre ser enviados para o backend (são obrigatórios aqui)
    payload.nome = form.nome;
    payload.transportadora = form.transportadora;
    payload.filial = form.filial;

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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Erro ao atualizar usuário');
      }

      setSuccessMessage('✅ Usuário atualizado com sucesso!');
      setSetorInicial(form.setor);
      setSenhaConfirmSetor('');
      setIsEditing(false); // travar edicao após salvar

      // após salvar, desloga e redireciona (como antes)
      setTimeout(() => {
        logout();
        localStorage.removeItem('token');
        navigate('/login');
      }, 1400);

      setForm((prev) => ({ ...prev, senha: '', senha_apisul: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex items-center justify-center min-h-[80vh] bg-[#222]"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#0f0f11]/80 backdrop-blur-sm border border-gray-600 p-6 rounded-md shadow-md w-full max-w-lg space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
            <FiCheckCircle /> Atualizar Usuário
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing((s) => !s)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-600 text-sm bg-transparent hover:bg-gray-800 transition"
            >
              <FiEdit2 />
              {isEditing ? 'Cancelar edição' : 'Editar cadastro'}
            </button>
          </div>
        </div>

        {/* Usuário (readonly) */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex gap-2 items-center">
            <FiUser /> Usuário
          </label>
          <input
            type="text"
            name="username"
            value={form.username}
            readOnly
            className="bg-[#161616] border border-gray-600 rounded-md px-3 py-2 text-gray-300 cursor-not-allowed text-sm"
          />
        </div>

        {/* Nome - obrigatório */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex gap-2 items-center">
            <FiUser /> Nome Completo *
          </label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            readOnly={!isEditing}
            placeholder="Nome Completo"
            className={`bg-[#161616] text-sm px-3 py-2 border rounded-md focus:outline-none
              ${isEditing ? 'cursor-text' : 'cursor-not-allowed opacity-80'}
              ${isEditing && !form.nome.trim() ? 'border-red-500' : 'border-gray-600'}
            `}
          />
        </div>

        {/* Email - obrigatório */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex gap-2 items-center">
            <FiUser /> Email *
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            readOnly={!isEditing}
            required
            placeholder="exemplo@dominio.com"
            className={`bg-[#161616] text-sm px-3 py-2 border rounded-md focus:outline-none
              ${isEditing ? 'cursor-text' : 'cursor-not-allowed opacity-80'}
              ${isEditing && !form.email.trim() ? 'border-red-500' : 'border-gray-600'}
            `}
          />
        </div>

{/* Transportadora - obrigatório */}
<div className="flex flex-col">
  <label className="text-xs text-gray-300 mb-1 flex gap-2 items-center">
    Transportadora *
  </label>
  <select
    name="transportadora"
    value={form.transportadora}
    onChange={handleChange}
    disabled={!isEditing}
    className={`bg-[#161616] text-sm px-3 py-2 border rounded-md focus:outline-none
      appearance-none
      ${isEditing ? 'cursor-pointer hover:bg-[#1d1d1f]' : 'cursor-not-allowed opacity-80'}
      ${isEditing && !form.transportadora.trim() ? 'border-red-500' : 'border-gray-600'}
    `}
  >
    <option value="">Selecione a transportadora</option>
    <option value="Dellmar Transportes LTDA">Dellmar Transportes LTDA</option>
  </select>
</div>

{/* Filial - obrigatório */}
<div className="flex flex-col">
  <label className="text-xs text-gray-300 mb-1 flex gap-2 items-center">
    Filial *
  </label>
  <select
    name="filial"
    value={form.filial}
    onChange={handleChange}
    disabled={!isEditing}
    className={`bg-[#161616] text-sm px-3 py-2 border rounded-md focus:outline-none
      appearance-none
      ${isEditing ? 'cursor-pointer hover:bg-[#1d1d1f]' : 'cursor-not-allowed opacity-80'}
      ${isEditing && !form.filial.trim() ? 'border-red-500' : 'border-gray-600'}
    `}
  >
    <option value="">Selecione a filial</option>
    <option value="Viana - ES">Viana - ES</option>
    <option value="Pindamonhangaba - SP">Pindamonhangaba - SP</option>
    <option value="Itatiaia - RJ">Itatiaia - RJ</option>
    <option value="Aparecida de Goiânia - GO">Aparecida de Goiânia - GO</option>
    <option value="Ponta Grossa - PR">Ponta Grossa - PR</option>
    <option value="São Jose dos Campos - SP">São Jose dos Campos - SP</option>
    <option value="Campos dos Goytacazes - RJ">Campos dos Goytacazes - RJ</option>
    <option value="Conceição Do Jacuípe - BA">Conceição Do Jacuípe - BA</option>
    <option value="João Pessoa - PB">João Pessoa - PB</option>
    <option value="Jaboatão dos Guararapes - PE">Jaboatão dos Guararapes - PE</option>
    <option value="Açailândia - MA">Açailândia - MA</option>
    <option value="Rondonópolis - MT">Rondonópolis - MT</option>
  </select>
</div>


        {/* Senha */}
        <div className="flex flex-col relative">
          <label className="text-xs text-gray-300 mb-1 flex gap-2 items-center">
            <FiKey /> Nova Senha
          </label>
          <input
            type={mostrarSenha ? 'text' : 'password'}
            name="senha"
            value={form.senha}
            onChange={handleChange}
            readOnly={!isEditing}
            placeholder="••••••••"
            className={`bg-[#161616] text-sm px-3 py-2 pr-10 border rounded-md focus:outline-none
              ${isEditing ? 'cursor-text' : 'cursor-not-allowed opacity-80'}
            `}
          />
          <span
            className="absolute right-3 top-[38px] text-gray-400 cursor-pointer"
            onClick={() => setMostrarSenha((s) => !s)}
          >
            {mostrarSenha ? <FiEyeOff /> : <FiEye />}
          </span>
        </div>

        {/* Setor (apenas leitura no seu layout atual) */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex gap-2 items-center">
            Setor
          </label>
          <div className="bg-[#161616] border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-300 select-none">
            {form.setor.charAt(0).toUpperCase() + form.setor.slice(1)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMostrarApisul((s) => !s)}
          className="text-sm text-green-400 underline"
        >
          {mostrarApisul ? 'Ocultar campos Apisul' : 'Utiliza Apisul?'}
        </button>

        <AnimatePresence>
          {mostrarApisul && (
            <motion.div
              key="apisul-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="space-y-3"
            >
              <div className="flex flex-col">
                <label className="text-xs text-gray-300 mb-1 flex gap-2 items-center">
                  Usuário Apisul
                </label>
                <input
                  type="text"
                  name="usuario_apisul"
                  value={form.usuario_apisul}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  placeholder="login.apisul"
                  className={`bg-[#161616] text-sm px-3 py-2 border rounded-md focus:outline-none
                    ${isEditing ? 'cursor-text' : 'cursor-not-allowed opacity-80'}
                  `}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-300 mb-1 flex gap-2 items-center">
                  Senha Apisul
                </label>
                <input
                  type="text"
                  name="senha_apisul"
                  value={form.senha_apisul}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  placeholder="••••••••"
                  className={`bg-[#161616] text-sm px-3 py-2 border rounded-md focus:outline-none
                    ${isEditing ? 'cursor-text' : 'cursor-not-allowed opacity-80'}
                  `}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ações */}
        <div className="w-full flex justify-end gap-2">
          <button
            type="submit"
            disabled={!isEditing || loading}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium
              ${!isEditing ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}
              transition
            `}
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" /> Atualizando...
              </>
            ) : (
              <>
                <FiCheckCircle /> Salvar
              </>
            )}
          </button>
        </div>

        {/* feedbacks */}
        {successMessage && (
          <p className="text-green-400 text-center text-sm border border-green-600 p-2 rounded-md bg-green-600/6">
            {successMessage}
          </p>
        )}
        {error && (
          <p className="text-red-400 text-center text-sm border border-red-600 p-2 rounded-md bg-red-600/6">
            {error}
          </p>
        )}

        {/* Se o cadastro estiver incompleto e não estiver editando, mostramos aviso persistente */}
        {!isFormComplete && (
          <p className="text-yellow-300 text-sm border border-yellow-600 p-2 rounded-md bg-yellow-600/6">
            Cadastro incompleto — preencha todos os campos marcados com * antes de sair.
          </p>
        )}
      </form>
    </motion.div>
  );
}
