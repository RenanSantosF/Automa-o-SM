import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useLogin } from "./Contexts/LoginContext";
import LoginModal from "./components/LoginModal/LoginModal";
import Header from "./components/Header/Header";
import SolicitacaoMonitoramento from "./pages/SolicitacaoMonitoramento";
import ImportacaoNFE from "./pages/ImportacaoNFE";
import { useState } from "react";

function App() {
  const { isAuthenticated } = useLogin();
  const [isOpen, setIsOpen] = useState(false); // Estado do menu lateral

  if (!isAuthenticated) return <LoginModal />;

  return (
    <Router>
      <div className="-z-50 flex">
        {/* Sidebar */}
        <Header isOpen={isOpen} setIsOpen={setIsOpen} />

        {/* Conteúdo Principal */}
        <div
          className={`transition-all duration-300 
            ${isOpen ? "ml-[260px]" : "ml-[80px]"} 
            py-6 px-4 w-full min-h-screen bg-[#333]`}
        >
          <Routes>
            <Route path="/" element={<SolicitacaoMonitoramento />} />
            <Route path="/nfe" element={<ImportacaoNFE />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
