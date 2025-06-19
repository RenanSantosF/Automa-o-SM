// src/components/Header.jsx
import { Link, useLocation } from "react-router-dom";
import { IoLogOutOutline } from "react-icons/io5";
import { useLogin } from "../../Contexts/LoginContext";

const Header = () => {
  const { setIsAuthenticated, userData } = useLogin();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-[#242323] px-6 py-4 flex justify-between items-center">
      <nav className="flex gap-4">
        <Link
          to="/"
          className={`${
            isActive("/") ? "bg-green-900" : "hover:bg-green-800"
          } text-white px-4 py-2 rounded`}
        >
          Solicitação de Monitoramento
        </Link>
        <Link
          to="/nfe"
          className={`${
            isActive("/nfe") ? "bg-green-900" : "hover:bg-green-800"
          } text-white px-4 py-2 rounded`}
        >
          Importação NFe
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        <span className="text-white">{userData.usuario}</span>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="flex items-center gap-1 px-3 py-1 bg-green-300 text-gray-900 rounded hover:bg-green-400"
        >
          Sair <IoLogOutOutline />
        </button>
      </div>
    </header>
  );
};

export default Header;
