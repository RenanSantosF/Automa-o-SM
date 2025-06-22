import { useState } from 'react';
import { useLogin } from '../../Contexts/LoginContext';
import { IoLogInOutline } from 'react-icons/io5';

export default function LoginModal() {
  const { login } = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch {
      setError('Usuário ou senha inválidos');
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-[#333] border  rounded-2xl shadow-2xl w-[90%] max-w-sm p-8 space-y-6"
      >
        <div className="flex flex-col items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-16" />
          <h2 className="text-2xl font-bold text-green-400">Login Automação</h2>
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
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#2b2b2b] border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition-all text-white p-3 rounded-xl font-semibold"
        >
          <IoLogInOutline size={20} />
          Entrar
        </button>
      </form>
    </div>
  );
}
