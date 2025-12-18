import { Link, useLocation } from 'react-router-dom';
import {
  IoLogOutOutline,
  IoMenu,
  IoPersonCircleOutline,
  IoChevronForward,
  IoLockClosedOutline,
} from 'react-icons/io5';
import { FaHome, FaFileInvoice } from 'react-icons/fa';
import { FaFileSignature, FaTruck } from 'react-icons/fa6';
import { FiUsers } from 'react-icons/fi';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { MdTrackChanges } from 'react-icons/md';

import { useLogin } from '../../Contexts/LoginContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const SIDEBAR_OPEN = 260;
const SIDEBAR_CLOSED = 78;
  const isActive = (path) => location.pathname === path;

const Header = ({ isOpen, setIsOpen }) => {
  const { userData, logout } = useLogin();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const isMeusDadosActive = isActive('/updateusuario');

  const toggleSidebar = () => setIsOpen(!isOpen);

  /* ================= MENU ================= */
  const menuItems = [
    { label: 'Início', path: '/', icon: <FaHome /> },
    { label: 'Monitoramento', path: '/monitoramento', icon: <MdTrackChanges /> },
    { label: 'Comprovantes', path: '/comprovantes', icon: <FaFileSignature /> },
    {
      label: 'Cargas',
      icon: <FaTruck />,
      subItems: [
        { label: 'Cargas', path: '/cargas' },
        { label: 'Cadastros de Ocorrências', path: '/ocorrencias' },
      ],
    },
    { label: 'Base de Conhecimento', path: '/knowledge', icon: <IoDocumentTextOutline /> },
    { label: 'Baixar NFes', path: '/nfe-download', icon: <FaFileInvoice /> },
    { label: 'Painel de Usuários', path: '/painel-usuarios', icon: <FiUsers /> },
  ];

  const menuPermissions = {
    Monitoramento: 'execucoes.acessar_pagina',
    Comprovantes: 'comprovantes.acessar_pagina',
    Cargas: 'cargas.acessar_pagina',
    'Cadastros de Ocorrências': 'ocorrencias.tipos.acessar_pagina',
    'Base de Conhecimento': 'base_de_conhecimento.acessar_pagina',
    'Baixar NFes': 'baixar_nfes.acessar_pagina',
    'Painel de Usuários': 'usuarios.list',
  };

  const hasPermission = (label) => {
    if (label === 'Painel de Usuários') {
      return userData?.setor?.toLowerCase() === 'admin';
    }
    const perm = menuPermissions[label];
    if (!perm) return true;
    return userData?.permissoes?.includes(perm);
  };

  


  /* ================= CLASSES ================= */
const itemBase =
  'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all select-none';

const itemActive =
  'bg-[#1f2a25] text-green-300 shadow-inner ring-1 ring-green-700/20';

const itemIdle =
  'text-gray-300 hover:bg-[#1f1f22] hover:text-green-300';

const itemDisabled =
  'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-gray-500 bg-[#141414] border border-gray-800 cursor-not-allowed';

  /* ================= RENDER ================= */
  return (
    <motion.aside
      animate={{ width: isOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED }}
      transition={{ duration: 0.3, type: 'spring', damping: 12 }}
      className="fixed top-0 left-0 h-screen bg-[#181818] border-r border-gray-800 shadow-lg flex flex-col justify-between z-50 overflow-hidden"
    >
      {/* TOPO */}
      <div>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
          <button onClick={toggleSidebar} className="text-gray-300 hover:text-green-400">
            <IoMenu size={22} />
          </button>

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      className="flex items-center gap-2 text-gray-200 text-lg font-semibold"
    >
      <img src="/logo.png" className="w-7 drop-shadow" alt="Logo" />
      Dellmar Docs
    </motion.div>
  )}
</AnimatePresence>

        </div>

        {/* MENU */}
        <nav className="flex flex-col mt-5 px-2 gap-1">
          {menuItems.map((item) => {
            const allowed = hasPermission(item.label);
            const hasSubmenu = !!item.subItems;
            const active =
              (item.path && isActive(item.path)) ||
              (hasSubmenu && item.subItems.some((s) => isActive(s.path)));

            return (
              <div key={item.label}>
                {/* ITEM NORMAL */}
                {!hasSubmenu && allowed && (
                  <Link to={item.path} className={`${itemBase} ${active ? itemActive : itemIdle}`}>
                    {item.icon}
                    {isOpen && <span>{item.label}</span>}
                  </Link>
                )}

                {!hasSubmenu && !allowed && (
                  <div className={itemDisabled} title="Sem permissão">
                    {item.icon}
                    {isOpen && <span>{item.label}</span>}
                    {isOpen && <IoLockClosedOutline className="ml-auto text-gray-600" />}
                  </div>
                )}

                {/* SUBMENU */}
                {hasSubmenu && (
                  <>
                    <div
                      onClick={() =>
                        allowed && setOpenSubmenu(openSubmenu === item.label ? null : item.label)
                      }
                      className={`${allowed ? itemBase : itemDisabled} ${
                        active && allowed ? itemActive : allowed ? itemIdle : ''
                      } justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {isOpen && <span>{item.label}</span>}
                      </div>
                      {isOpen &&
                        (allowed ? (
                          <IoChevronForward
                            className={`transition-transform ${
                              openSubmenu === item.label ? 'rotate-90' : ''
                            }`}
                          />
                        ) : (
                          <IoLockClosedOutline className="text-gray-600" />
                        ))}
                    </div>

                    <AnimatePresence>
                      {isOpen && openSubmenu === item.label && allowed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-9 mt-1 flex flex-col gap-1"
                        >
                          {item.subItems.map((sub) => {
                            const subAllowed = hasPermission(sub.label);
                            return subAllowed ? (
                              <Link
                                key={sub.path}
                                to={sub.path}
                                className="text-gray-300 hover:text-white text-sm px-2 py-1.5 rounded-md"
                              >
                                {sub.label}
                              </Link>
                            ) : (
                              <div
                                key={sub.path}
                                className="text-gray-500 text-sm px-2 py-1.5 rounded-md bg-[#1b1b1b] border border-gray-800 cursor-not-allowed"
                              >
                                {sub.label}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="px-3 py-4 border-t border-gray-800 flex flex-col gap-2">
        <Link
          to="/updateusuario"
          className={`${itemBase} ${isMeusDadosActive ? itemActive : itemIdle}`}
        >
          <IoPersonCircleOutline />
          {isOpen && <span>Meus Dados</span>}
        </Link>

        <button
          onClick={logout}
          className="w-full flex justify-center gap-2 px-3 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
        >
          <IoLogOutOutline />
          {isOpen && 'Sair'}
        </button>
      </div>
    </motion.aside>
  );
};

export default Header;
