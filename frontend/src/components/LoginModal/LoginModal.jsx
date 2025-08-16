import { useState } from 'react';
import { useLogin } from '../../Contexts/LoginContext';
import { IoLogInOutline } from 'react-icons/io5';

export default function LoginModal() {
  const { login } = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    await login(username, password);
  } catch (err) {
    // Mostra a mensagem real do erro vindo do LoginContext
    setError(err.message || 'Erro desconhecido');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-[#333] border border-gray-400 rounded-2xl shadow-2xl w-[90%] max-w-sm p-8 space-y-6"
      >
        <div className="flex flex-col items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-16" />
          <h2 className="text-2xl font-bold text-green-400">Login Dellmar Docs</h2>
          <p className="text-sm text-gray-400">Acesse sua conta</p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-md text-sm">{error}</div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#2b2b2b] border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#2b2b2b] border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`cursor-pointer w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition-all text-white p-3 rounded-xl font-semibold ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
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
              Entrando...
            </>
          ) : (
            <>
              <IoLogInOutline size={20} />
              Entrar
            </>
          )}
        </button>

        <p className="text-sm text-gray-400 text-center">
          <a href="/forgot-password" className="text-green-500 hover:underline">
            Esqueci minha senha
          </a>
        </p>
      </form>
    </div>
  );
}
