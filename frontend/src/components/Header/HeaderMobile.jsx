import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IoMenu, IoClose, IoLogOutOutline, IoPersonCircleOutline } from 'react-icons/io5';
import { FaHome, FaFileInvoice } from 'react-icons/fa';
import { FaFileSignature } from 'react-icons/fa6';
import { useLogin } from '../../Contexts/LoginContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers } from 'react-icons/fi';
import { IoDocumentTextOutline } from 'react-icons/io5';

const sidebarVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0 },
};

const HeaderMobile = () => {
  const { userData, logout } = useLogin();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const toggleMenu = () => setMenuOpen((v) => !v);

  const setor = userData?.setor?.toLowerCase();

  // Menu fixo, Painel de Usuários sempre aparece
  const menuItems = [
    { label: 'Monitoramento', path: '/', icon: <FaHome /> },
    { label: 'Comprovantes', path: '/comprovantes', icon: <FaFileSignature /> },
    { label: 'Baixar NFes', path: '/nfe-download', icon: <FaFileInvoice /> },
    { label: 'Base de Conhecimento', path: '/knowledge', icon: <IoDocumentTextOutline /> },
    {
      label: 'Cargas',
      subItems: [
        { label: 'Cargas', path: '/cargas' },
        { label: 'Cadastros de Ocorrências', path: '/ocorrencias' },
      ],
    },
    { label: 'Painel de Usuários', path: '/painel-usuarios', icon: <FiUsers /> },
  ];

  // Permissão
  const isLiberado = (label) => {
    if (setor === 'admin' || setor === 'expedicao') return true;
    return label === 'Comprovantes';
  };

  return (
    <>
      <header className="fixed h-14 top-0 left-0 right-0 bg-[#181818] text-white shadow-md z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-7" />
          <span className="font-semibold text-lg">Dellmar Docs</span>
        </div>
        <button onClick={toggleMenu} aria-label="Menu" className="text-gray-300 text-2xl z-50">
          {menuOpen ? <IoClose /> : <IoMenu />}
        </button>
      </header>

      {/* Sidebar */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Fundo */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu Lateral */}
            <motion.nav
              className="fixed top-0 left-0 h-full w-64 bg-[#181818] text-white z-50 flex flex-col"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={sidebarVariants}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Logo */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Logo" className="w-7" />
                  <span className="font-semibold text-lg">Dellmar Docs</span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-1">
                {menuItems.map((item) => {
                  const hasSubmenu = item.subItems && item.subItems.length > 0;
                  const liberado = true; // todos liberados

                  if (hasSubmenu) {
                    return (
                      <div key={item.label} className="flex flex-col gap-1">
                        <span className="px-3 py-2 text-gray-300 font-medium">{item.label}</span>
                        <div className="ml-4 flex flex-col gap-1">
                          {item.subItems.map((sub) => (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              onClick={() => setMenuOpen(false)}
                              className={`text-gray-300 hover:text-white text-sm px-3 py-2 rounded-md ${
                                isActive(sub.path) ? 'bg-green-700/80 font-semibold' : ''
                              }`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return liberado ? (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                        isActive(item.path)
                          ? 'bg-green-700/80 text-white shadow-md'
                          : 'text-gray-300 hover:bg-green-900 hover:text-white transition-all'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ) : null;
                })}

                {/* Meus Dados */}
                <Link
                  to="/updateusuario"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm
                    ${
                      isActive('/updateusuario')
                        ? 'bg-green-700/80 text-white shadow-md'
                        : 'text-gray-300 hover:bg-green-900 hover:text-white transition-all'
                    }`}
                >
                  <IoPersonCircleOutline />
                  <span>Meus Dados</span>
                </Link>

                {/* Sair */}
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 mt-auto text-sm"
                >
                  <IoLogOutOutline />
                  <span>Sair</span>
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default HeaderMobile;
