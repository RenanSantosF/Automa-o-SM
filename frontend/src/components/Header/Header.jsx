import { Link, useLocation } from 'react-router-dom';
import { IoLogOutOutline, IoMenu, IoPersonCircleOutline } from 'react-icons/io5';
import { FaHome, FaFileInvoice } from 'react-icons/fa';
import { FaFileSignature } from 'react-icons/fa6';
import { useLogin } from '../../Contexts/LoginContext';
import { motion } from 'framer-motion';
import { FiUsers } from 'react-icons/fi';

const Header = ({ isOpen, setIsOpen }) => {
  const { userData, logout } = useLogin();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const toggleSidebar = () => setIsOpen(!isOpen);
  const setor = userData?.setor?.toLowerCase();

  // ✅ Menu fixo (Painel de Usuários sempre aparece)
  const menuItems = [
    { label: 'Monitoramento', path: '/', icon: <FaHome /> },
    { label: 'Importação NFe', path: '/nfe', icon: <FaFileInvoice /> },
    { label: 'Comprovantes', path: '/comprovantes', icon: <FaFileSignature /> },
    { label: 'Painel de Usuários', path: '/painel-usuarios', icon: <FiUsers /> },
  ];

  // ✅ Define permissão
  const isLiberado = (label) => {
    if (setor === 'admin' || setor === 'expedicao') return true;
    return label === 'Comprovantes';
  };

  return (
    <motion.aside
      animate={{ width: isOpen ? 240 : 78 }}
      transition={{ duration: 0.3, type: 'spring', damping: 12 }}
      className="fixed top-0 left-0 h-screen 
                 bg-[#181818] backdrop-blur-sm
                 border-r border-gray-800 shadow-lg 
                 flex flex-col justify-between z-50 overflow-hidden"
    >
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
          <button onClick={toggleSidebar} className="text-gray-300 hover:text-green-400">
            <IoMenu size={22} />
          </button>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 text-green-300 text-lg font-semibold whitespace-nowrap"
            >
              <img src="/logo.png" className="w-7" alt="Logo" />
              Dellmar Docs
            </motion.span>
          )}
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-0.5 px-2 mt-5">
          {menuItems.map((item, index) => {
            const liberado = isLiberado(item.label);

            const baseClasses = `
              flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
              ${liberado
                ? isActive(item.path)
                  ? 'bg-green-700/80 text-white shadow-md'
                  : 'text-gray-300 hover:bg-green-900 hover:text-white transition-all'
                : 'text-gray-500/70 bg-gray-800/20 cursor-not-allowed'
              }
            `;

            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                title={liberado ? '' : 'Indisponível para seu setor'}
              >
                {liberado ? (
                  <Link to={item.path} className={baseClasses}>
                    {item.icon}
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </Link>
                ) : (
                  <div className={baseClasses}>
                    {item.icon}
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-medium whitespace-nowrap line-through opacity-50"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-800 flex flex-col gap-2">
        {/* Meus Dados */}
        <Link
          to="/updateusuario"
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm
            ${
              isActive('/updateusuario')
                ? 'bg-green-700/80 text-white shadow-md'
                : 'text-gray-300 hover:bg-green-900 hover:text-white transition-all'
            }`}
        >
          <IoPersonCircleOutline size={18} />
          {isOpen && <span className="whitespace-nowrap">Meus Dados</span>}
        </Link>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-500 whitespace-nowrap"
          >
            Logado como:
            <span className="text-gray-200 ml-1">{userData.username}</span>
          </motion.div>
        )}

        {/* Sair */}
        <button
          onClick={logout}
          className="cursor-pointer w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all text-sm"
        >
          <IoLogOutOutline size={16} />
          {isOpen && 'Sair'}
        </button>
      </div>
    </motion.aside>
  );
};

export default Header;
