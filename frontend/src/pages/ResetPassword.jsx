import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IoLockClosedOutline, IoEye, IoEyeOff } from 'react-icons/io5';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const [novaSenha, setNovaSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false); // para mostrar/ocultar
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nova_senha: novaSenha }),
      });

      if (!res.ok) throw new Error('Erro ao redefinir senha');

      toast.success('Senha redefinida com sucesso! Redirecionando...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      toast.error('Falha ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-400 bg-gradient-to-br from-[#222] to-[#444] p-4">
        Token inválido ou ausente
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#222] to-[#444] p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#2b2b2b] border border-gray-700 rounded-3xl shadow-xl w-full max-w-md p-8 space-y-6 transition-all"
      >
        <div className="flex flex-col items-center gap-4">
          <IoLockClosedOutline size={50} className="text-green-400 animate-pulse" />
          <h2 className="text-3xl font-bold text-green-400">Redefinir Senha</h2>
          <p className="text-gray-400 text-center">
            Digite sua nova senha abaixo para acessar sua conta novamente
          </p>
        </div>

        {/* Input com botão para mostrar/ocultar */}
        <div className="relative">
          <input
            type={showSenha ? 'text' : 'password'}
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
            className="w-full p-2 rounded-sm bg-[#1f1f1f] border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowSenha((prev) => !prev)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-green-400 transition-colors"
          >
            {showSenha ? <IoEyeOff size={20} /> : <IoEye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex cursor-pointer justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white p-2 rounded-sm font-semibold transition-all ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : null}
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>
    </div>
  );
}
