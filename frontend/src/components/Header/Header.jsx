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

  // ✅ Criação dinâmica do menu
  const menuItems = [
    { label: 'Monitoramento', path: '/', icon: <FaHome /> },
    { label: 'Importação NFe', path: '/nfe', icon: <FaFileInvoice /> },
    { label: 'Comprovantes', path: '/comprovantes', icon: <FaFileSignature /> },
  ];

  // ✅ Adiciona Painel de Usuários só se for admin
  if (setor === 'admin') {
    menuItems.push({
      label: 'Painel de Usuários',
      path: '/painel-usuarios',
      icon: <FiUsers />,
    });
  }

  const isLiberado = (label) => {
    if (setor === 'admin' || setor === 'expedicao') return true;
    return label === 'Comprovantes';
  };

  return (
    <motion.aside
      animate={{ width: isOpen ? 260 : 80 }}
      transition={{ duration: 0.4, type: 'spring', damping: 12 }}
      className="fixed top-0 left-0 h-screen 
                 bg-[#1f1f1f]/80 backdrop-blur-md 
                 border-r-1 border-gray-500 shadow-lg 
                 flex flex-col justify-between z-50 overflow-hidden"
    >
      <div>
        {/* Header do Sidebar */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <button onClick={toggleSidebar} className="cursor-pointer text-white hover:text-green-400">
            <IoMenu size={26} />
          </button>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 text-green-200 text-xl font-bold whitespace-nowrap"
            >
              <img src="/logo.png" className="w-8" alt="Logo" />
              Dellmar Docs
            </motion.span>
          )}
        </div>

        {/* Menu Principal */}
        <nav className="flex flex-col gap-1 px-2 mt-6">
          {menuItems.map((item, index) => {
            const liberado = isLiberado(item.label);

            const baseClasses = `
              flex items-center gap-3 px-4 py-3 rounded-lg 
              ${liberado
                ? isActive(item.path)
                  ? 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-green-800 hover:text-white transition-all'
                : 'text-gray-500 bg-gray-700/30 cursor-not-allowed'
              }
            `;

            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
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
      <div className="px-4 py-4 border-t border-gray-700 flex flex-col gap-2">
        {/* Meus Dados */}
        <Link
          to="/updateusuario"
          className={`flex items-center gap-3 px-4 py-2 rounded-lg 
            ${
              isActive('/updateusuario')
                ? 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg'
                : 'text-gray-300 hover:bg-green-800 hover:text-white transition-all'
            }`}
        >
          <IoPersonCircleOutline size={20} />
          {isOpen && <span className="whitespace-nowrap">Meus Dados</span>}
        </Link>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400 whitespace-nowrap"
          >
            Logado como:
            <span className="text-white ml-1">{userData.username}</span>
          </motion.div>
        )}

        {/* Botão Sair */}
        <button
          onClick={logout}
          className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
        >
          <IoLogOutOutline size={18} />
          {isOpen && 'Sair'}
        </button>
      </div>
    </motion.aside>
  );
};

export default Header;
