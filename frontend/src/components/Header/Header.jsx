import { Link, useLocation } from 'react-router-dom';
import { IoLogOutOutline, IoMenu, IoPersonCircleOutline } from 'react-icons/io5';
import { FaHome, FaFileInvoice } from 'react-icons/fa';
import { FaFileSignature, FaTruck } from 'react-icons/fa6';
import { useLogin } from '../../Contexts/LoginContext';
import { motion } from 'framer-motion';
import { FiUsers } from 'react-icons/fi';
import { useState } from 'react';
import { IoDocumentTextOutline } from 'react-icons/io5';

const Header = ({ isOpen, setIsOpen }) => {
  const { userData, logout } = useLogin();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const setor = userData?.setor?.toLowerCase();

  const isActive = (path) => location.pathname === path;
  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    { label: 'Monitoramento', path: '/', icon: <FaHome /> },

    { label: 'Comprovantes', path: '/comprovantes', icon: <FaFileSignature /> },
    { label: 'Base de Conhecimento', path: '/knowledge', icon: <IoDocumentTextOutline /> }, // nova aba
    { label: 'Baixar NFes', path: '/nfe-download', icon: <FaFileInvoice /> }, // novo item
    {
      label: 'Cargas',
      icon: <FaTruck />,
      subItems: [
        { label: 'Cargas', path: '/cargas' },
        { label: 'Cadastros de Ocorrências', path: '/ocorrencias' },
      ],
    },
    { label: 'Painel de Usuários', path: '/painel-usuarios', icon: <FiUsers /> },
  ];

  // Permissões
  const isLiberado = (label) => {
    if (setor === 'admin' || setor === 'expedicao') return true;
    return ['Comprovantes', 'Base de Conhecimento'].includes(label);
  };

  return (
    <motion.aside
      animate={{ width: isOpen ? 260 : 78 }}
      transition={{ duration: 0.3, type: 'spring', damping: 12 }}
      className="fixed top-0 left-0 h-screen bg-[#181818] border-r border-gray-800 shadow-lg flex flex-col justify-between z-50 overflow-hidden"
    >
      {/* Topo */}
      <div>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
          <button onClick={toggleSidebar} className="text-gray-300 hover:text-green-400">
            <IoMenu size={22} />
          </button>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-green-300 text-lg font-bold"
            >
              <img src="/logo.png" className="w-7" alt="Logo" />
              Dellmar Docs
            </motion.div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex flex-col mt-5 px-2 gap-1">
          {menuItems.map((item, idx) => {
            const liberado = isLiberado(item.label);
            const active = isActive(item.path);
            const hasSubmenu = item.subItems && item.subItems.length > 0;

            const baseClasses = `
              flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
              ${
                liberado
                  ? active
                    ? 'bg-green-700/80 text-white shadow-md'
                    : 'text-gray-300 hover:bg-green-900 hover:text-white transition-all'
                  : 'text-gray-500/70 bg-gray-800/20 cursor-not-allowed'
              }
            `;

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {hasSubmenu ? (
                  <>
                    <div
                      className={`${baseClasses} cursor-pointer flex justify-between items-center`}
                      onClick={() => setOpenSubmenu(openSubmenu === item.label ? null : item.label)}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {isOpen && <span className="font-medium">{item.label}</span>}
                      </div>
                      {isOpen && (
                        <span
                          className={`transition-transform ${
                            openSubmenu === item.label ? 'rotate-90' : 'rotate-0'
                          }`}
                        >
                          ▶
                        </span>
                      )}
                    </div>
                    {isOpen && openSubmenu === item.label && (
                      <div className="ml-6 flex flex-col gap-1 mt-1">
{item.subItems.map((sub) => {
  const liberadoSub = true; // liberado para todos
  return liberadoSub ? (
    <Link
      key={sub.path}
      to={sub.path}
      className={`text-gray-300 hover:text-white text-sm ${
        isActive(sub.path) ? 'font-semibold' : ''
      }`}
    >
      {sub.label}
    </Link>
  ) : (
    <div
      key={sub.path}
      className="text-gray-500/70 text-sm cursor-not-allowed line-through opacity-50"
      title="Indisponível"
    >
      {sub.label}
    </div>
  );
})}
                      </div>
                    )}
                  </>
                ) : liberado ? (
                  <Link to={item.path} className={baseClasses}>
                    {item.icon}
                    {isOpen && <span className="font-medium">{item.label}</span>}
                  </Link>
                ) : (
                  <div className={baseClasses}>
                    {item.icon}
                    {isOpen && (
                      <span className="font-medium line-through opacity-50">{item.label}</span>
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
          {isOpen && <span>Meus Dados</span>}
        </Link>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400"
          >
            Logado como: <span className="text-gray-200 ml-1">{userData.username}</span>
          </motion.div>
        )}

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
