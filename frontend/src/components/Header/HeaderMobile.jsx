import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IoMenu, IoClose, IoLogOutOutline, IoPersonCircleOutline } from 'react-icons/io5';
import { FaHome, FaFileInvoice } from 'react-icons/fa';
import { FaFileSignature } from 'react-icons/fa6';
import { useLogin } from '../../Contexts/LoginContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers } from 'react-icons/fi';

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

  // Cria dinamicamente os itens do menu conforme setor
  const menuItems = [
    { label: 'Monitoramento', path: '/', icon: <FaHome /> },
    { label: 'Importação NFe', path: '/nfe', icon: <FaFileInvoice /> },
    { label: 'Comprovantes', path: '/comprovantes', icon: <FaFileSignature /> },
  ];

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
    <>
      <header className="fixed h-16 top-0 left-0 right-0 bg-[#1f1f1f] text-white shadow-md z-50 flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8" />
          <span className="font-bold text-lg">Dellmar Docs</span>
        </div>
        <button onClick={toggleMenu} aria-label="Menu" className="text-white text-3xl z-50">
          {menuOpen ? <IoClose /> : <IoMenu />}
        </button>
      </header>

      {/* Sidebar Lateral Animada */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Fundo semitransparente que fecha o menu ao clicar */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />

            <motion.nav
              className="fixed top-0 left-0 h-full w-64 bg-[#2a2a2a] text-white z-50 flex flex-col"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={sidebarVariants}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Logo" className="w-8" />
                  <span className="font-bold text-lg">Dellmar Docs</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-1">
                {menuItems.map((item) => {
                  const liberado = isLiberado(item.label);
                  return liberado ? (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md
                        ${isActive(item.path) ? 'bg-green-700' : 'hover:bg-green-600'}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <div
                      key={item.path}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-500 cursor-not-allowed line-through opacity-50"
                      title="Indisponível para seu setor"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  );
                })}

                <Link
                  to="/updateusuario"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md
                    ${isActive('/updateusuario') ? 'bg-green-700' : 'hover:bg-green-600'}`}
                >
                  <IoPersonCircleOutline />
                  <span>Meus Dados</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 mt-auto"
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
