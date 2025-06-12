import { useState } from 'react';
import { useLogin } from '../../Contexts/LoginContext';

export default function LoginModal() {
  const { login } = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Usuário ou senha inválidos');
    }
  };

  const handleMonitorOnly = () => {
    // Aqui você define como será tratado o login anônimo
    login('', '');
  };

  return (
    <div className="fixed inset-0 bg-black/4 flex justify-center items-center z-50">
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-lg shadow-md w-80 space-y-4 bg-[#3b3b3b] "
      >
        <div className='w-full flex justify-center'>
          <h2 className="text-xl text-white font-semibold">Login Apisul</h2>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded-xl hover:bg-green-700"
        >
          Entrar
        </button>
        <div className='w-full flex justify-center'>
          <button
            type="button"
            onClick={handleMonitorOnly}
            className=" border text-gray-200 px-4 py-1 border-gray-200 rounded hover:text-white"
          >
            Pular
          </button>
          
        </div>

      </form>
    </div>
  );
}
