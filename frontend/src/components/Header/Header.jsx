import { Link, useLocation } from "react-router-dom";
import { IoLogOutOutline, IoMenu } from "react-icons/io5";
import { FaHome, FaFileInvoice } from "react-icons/fa";
import { useLogin } from "../../Contexts/LoginContext";
import { motion } from "framer-motion";
import { useState } from "react";

const menuItems = [
  { label: "Monitoramento", path: "/", icon: <FaHome /> },
  { label: "Importação NFe", path: "/nfe", icon: <FaFileInvoice /> },
];

const Header = ({ isOpen, setIsOpen }) => {
  const { setIsAuthenticated, userData } = useLogin();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <motion.aside
      animate={{ width: isOpen ? 260 : 80 }}
      transition={{ duration: 0.4, type: "spring", damping: 12 }}
      className="fixed top-0 left-0 h-screen 
                 bg-[#1f1f1f]/80 backdrop-blur-md 
                 border-r border-green-600/50 shadow-lg 
                 flex flex-col justify-between z-50 overflow-hidden"
    >
      <div>
        {/* Header do Sidebar */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <button
            onClick={toggleSidebar}
            className="text-white hover:text-green-400"
          >
            <IoMenu size={26} />
          </button>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className= "flex gap-2 text-green-200 text-xl font-bold whitespace-nowrap"
            >
              <img src="/logo.png" className="w-8" alt="descrição da imagem" />

              Automação
            </motion.span>
          )}
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-1 px-2 mt-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg 
                  ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg"
                      : "text-gray-300 hover:bg-green-800 hover:text-white transition-all"
                  }`}
              >
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
            </motion.div>
          ))}
        </nav>
      </div>

      {/* Footer do Sidebar */}
      <div className="px-4 py-4 border-t border-gray-700">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-400 mb-2 whitespace-nowrap"
          >
            Logado como:
            <span className="text-white ml-1">{userData.usuario}</span>
          </motion.div>
        )}

        <button
          onClick={() => setIsAuthenticated(false)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
        >
          <IoLogOutOutline size={18} />
          {isOpen && "Sair"}
        </button>
      </div>
    </motion.aside>
  );
};

export default Header;
