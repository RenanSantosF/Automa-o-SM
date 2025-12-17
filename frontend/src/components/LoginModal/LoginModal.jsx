import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogin } from '../../Contexts/LoginContext';
import { IoLogInOutline, IoClose, IoPersonAddOutline, IoMailOutline, IoCallOutline } from 'react-icons/io5';

export default function LoginModal() {
  const { login } = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError('Aceite os Termos de Uso para continuar');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0e0d0d] via-[#272729] to-[#1b1d22]">

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]"
      />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-[92%] max-w-md rounded-md bg-white/5 backdrop-blur-xl px-10 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
      >
        {/* Header */}
        <div className="mb-10 flex flex-col items-center">
          <motion.img
            src="/logo.png"
            className="mb-4 w-20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
          <h1 className="text-3xl font-semibold tracking-tight text-white">Dellmar Docs</h1>
          <p className="mt-1 text-sm text-gray-300">Plataforma corporativa de documentos</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inputs */}
        <div className="space-y-5">
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="w-full bg-transparent px-1 pb-2 text-white placeholder-gray-400 outline-none border-b border-white/20 focus:border-green-400 transition"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full bg-transparent px-1 pb-2 text-white placeholder-gray-400 outline-none border-b border-white/20 focus:border-green-400 transition"
          />
        </div>

        {/* Terms */}
        <div className="mt-6 flex items-start gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 accent-green-400"
          />
          <span>
            Concordo com os{' '}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-green-400 hover:underline"
            >
              Termos de Uso e Política de Privacidade
            </button>
          </span>
        </div>

        {/* Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-sm bg-green-500 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-60"
        >
          <IoLogInOutline size={18} />
          {loading ? 'Entrando...' : 'Entrar'}
        </motion.button>

        {/* Links */}
        <div className="mt-6 flex justify-between text-xs text-gray-300">
          <a href="/forgot-password" className="hover:text-green-400">Esqueci a senha</a>
          <a href="/registro" className="flex items-center gap-1 hover:text-green-400">
            <IoPersonAddOutline size={14} /> Criar conta
          </a>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-white/10 pt-4 text-center text-xs text-gray-400">
          <div className="flex justify-center gap-4">
            <span className="flex items-center gap-1"><IoCallOutline /> (27) 3012-3636</span>
            <span className="flex items-center gap-1"><IoMailOutline /> contato@dellmar.com.br</span>
          </div>
          <p className="mt-2">© {new Date().getFullYear()} Dellmar Transportes LTDA</p>
        </div>
      </motion.form>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-h-[80vh] w-[90%] max-w-2xl overflow-y-auto rounded-sm bg-[#2b2c2c] p-8 text-gray-300"
            >
              <button
                onClick={() => setShowTerms(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white"
              >
                <IoClose size={22} />
              </button>

<h2 className="mb-4 text-2xl font-semibold text-green-400">
  Termos de Uso – Dellmar Docs
</h2>

<div className="space-y-4 text-sm leading-relaxed text-gray-300">
  <p>
    O <strong>Dellmar Docs</strong> é uma plataforma corporativa de uso
    <strong> exclusivamente interno</strong>, destinada a colaboradores,
    prestadores de serviço e usuários previamente autorizados pela
    Dellmar Transportes LTDA.
  </p>

  <p>
    Ao acessar ou utilizar este sistema, o usuário declara estar ciente e
    de acordo com estes Termos de Uso, comprometendo-se a utilizar a
    plataforma apenas para finalidades profissionais e autorizadas.
  </p>

  <h3 className="mt-4 font-semibold text-green-300">
    Uso e Responsabilidades
  </h3>

  <ul className="list-disc space-y-2 pl-5">
    <li>
      O usuário é responsável por manter a confidencialidade de suas
      credenciais de acesso.
    </li>
    <li>
      É proibido compartilhar login e senha ou permitir acesso por
      terceiros não autorizados.
    </li>
    <li>
      Todas as ações realizadas na plataforma são registradas e
      rastreáveis.
    </li>
  </ul>

  <h3 className="mt-4 font-semibold text-green-300">
    Tratamento de Dados Pessoais
  </h3>

  <p>
    Os dados tratados na plataforma seguem rigorosamente a
    <strong> Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD)</strong>,
    sendo utilizados exclusivamente para fins operacionais, administrativos
    e legais da Dellmar Transportes LTDA.
  </p>

  <p>
    São adotadas medidas técnicas e organizacionais para garantir a
    segurança, confidencialidade, integridade e rastreabilidade das
    informações, incluindo controle de acesso, criptografia de senhas e
    gestão de permissões por perfil.
  </p>

  <h3 className="mt-4 font-semibold text-green-300">
    Uso Indevido
  </h3>

  <p>
    É vedada a utilização do sistema para fins pessoais, ilícitos ou
    diversos das atividades da empresa, bem como a inserção de informações
    falsas, não autorizadas ou o acesso indevido a dados restritos.
  </p>

  <p>
    O descumprimento destes Termos poderá resultar em suspensão ou
    encerramento do acesso, além de eventuais medidas administrativas,
    civis e legais cabíveis.
  </p>

  <h3 className="mt-4 font-semibold text-green-300">
    Disposições Finais
  </h3>

  <p>
    Estes Termos de Uso podem ser atualizados a qualquer momento para
    refletir alterações legais, técnicas ou operacionais. O uso contínuo
    da plataforma implica concordância com eventuais atualizações.
  </p>
</div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
