

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useLogin } from "./Contexts/LoginContext";
import LoginModal from "./components/LoginModal/LoginModal";
import Header from "./components/Header/Header";
import SolicitacaoMonitoramento from "./pages/SolicitacaoMonitoramento";
import ImportacaoNFE from "./pages/ImportacaoNFE";

function App() {
  const { isAuthenticated } = useLogin();

  if (!isAuthenticated) return <LoginModal />;

  return (
    <Router>
      <Header />
      <div className="py-6 px-4">
        <Routes>
          <Route path="/" element={<SolicitacaoMonitoramento />} />
          <Route path="/nfe" element={<ImportacaoNFE />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
