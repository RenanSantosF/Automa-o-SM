import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoLockClosedOutline, IoEye, IoEyeOff } from 'react-icons/io5';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const [novaSenha, setNovaSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
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

      if (!res.ok) throw new Error();

      toast.success('Senha redefinida com sucesso! Redirecionando...');
      setTimeout(() => navigate('/'), 2000);
    } catch {
      toast.error('Falha ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0e0d0d] via-[#272729] to-[#1b1d22] text-red-400">
        Token inválido ou ausente
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0e0d0d] via-[#272729] to-[#1b1d22] p-4">
      
      {/* Luz ambiental */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,130,255,0.06),transparent_65%)]"
      />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-xl rounded-md px-10 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center"
      >
        <IoLockClosedOutline size={42} className="mx-auto mb-6 text-green-400" />

        <h2 className="text-2xl font-semibold text-white">
          Redefinir senha
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Digite sua nova senha para acessar sua conta novamente
        </p>

        {/* Input senha */}
        <div className="relative mt-8">
          <input
            type={showSenha ? 'text' : 'password'}
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
            disabled={loading}
            className="w-full bg-transparent px-1 pb-2 text-white placeholder-gray-400 outline-none border-b border-white/20 focus:border-green-400 transition"
          />

          <button
            type="button"
            onClick={() => setShowSenha((prev) => !prev)}
            className="absolute right-0 bottom-2 text-gray-400 hover:text-green-400 transition"
          >
            {showSenha ? <IoEyeOff size={18} /> : <IoEye size={18} />}
          </button>
        </div>

        {/* Botão */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-sm bg-green-500 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-60"
        >
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </motion.button>
      </motion.form>
    </div>
  );
}
