import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdAddBox } from "react-icons/md";
import axios from "axios";
import ModalCarga from "../components/Carga/ModalCarga";
import ModalRelatorio from "../components/Modal/ModalRelatorioCarga";

const API_URL = import.meta.env.VITE_API_URL;

export default function CargasPage() {
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRelatorio, setModalRelatorio] = useState(false);
  const [selectedCarga, setSelectedCarga] = useState(null);

  const [ufs, setUfs] = useState([]);
  const [cidadesOrigem, setCidadesOrigem] = useState([]);
  const [cidadesDestino, setCidadesDestino] = useState([]);

  const [filtro, setFiltro] = useState({
    uf_origem: "",
    cidade_origem: "",
    uf_destino: "",
    cidade_destino: "",
    rota: "",
    data_inicio: "",
    data_fim: "",
  });

  const api = axios.create({
    baseURL: `${API_URL}/gestor-cargas`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });

  // 🔹 Carregar UFs do IBGE (estados)
  useEffect(() => {
    axios
      .get("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then((res) => setUfs(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch((err) => console.error("Erro ao carregar UFs:", err));
  }, []);

  // 🔹 Carregar cidades Origem quando UF Origem mudar (usa filtro.uf_origem)
  useEffect(() => {
    const uf = filtro.uf_origem;
    if (!uf) {
      setCidadesOrigem([]);
      // garantir que cidade_origem seja limpa quando UF for removida
      setFiltro((prev) => ({ ...prev, cidade_origem: "" }));
      return;
    }

    axios
      .get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      .then((res) => setCidadesOrigem(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch((err) => {
        console.error("Erro ao carregar cidades origem:", err);
        setCidadesOrigem([]);
      });
  }, [filtro.uf_origem]);

  // 🔹 Carregar cidades Destino quando UF Destino mudar
  useEffect(() => {
    const uf = filtro.uf_destino;
    if (!uf) {
      setCidadesDestino([]);
      setFiltro((prev) => ({ ...prev, cidade_destino: "" }));
      return;
    }

    axios
      .get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      .then((res) => setCidadesDestino(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch((err) => {
        console.error("Erro ao carregar cidades destino:", err);
        setCidadesDestino([]);
      });
  }, [filtro.uf_destino]);

  // 🔹 Carregar cargas ao montar a página (sem filtros iniciais)
  useEffect(() => {
    fetchCargas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Busca cargas usando o filtro atual
  const fetchCargas = async () => {
    try {
      setLoading(true);
      const params = {};
      // Só inclui chaves com valor "truthy" (string não vazia etc)
      Object.entries(filtro).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) params[k] = v;
      });

      const res = await api.get("/cargas", { params });
      setCargas(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar cargas:", err);
      setCargas([]);
    } finally {
      setLoading(false);
    }
  };

  // gerarRelatorio agora aceita filtro opcional (quando chamado pelo modal)
  const gerarRelatorio = async (filtParam) => {
    try {
      const used = filtParam || filtro;
      const params = {};
      Object.entries(used).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) params[k] = v;
      });
      const res = await api.get("/estatisticas", { params });
      console.log("Relatório:", res.data);
      alert("Relatório gerado! Veja o console para detalhes.");
      setModalRelatorio(false);
      return res.data;
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
      alert("Erro ao gerar relatório. Veja o console para detalhes.");
      return null;
    }
  };

  // Handlers de mudança de UF que limpam cidade quando necessário
  const handleUfOrigChange = (value) => {
    setFiltro((prev) => ({
      ...prev,
      uf_origem: value,
      // se remover UF, limpa cidade; se definir UF, mantém a cidade anterior (ou o usuário trocar depois)
      cidade_origem: value ? prev.cidade_origem : "",
    }));
  };

  const handleUfDestChange = (value) => {
    setFiltro((prev) => ({
      ...prev,
      uf_destino: value,
      cidade_destino: value ? prev.cidade_destino : "",
    }));
  };

  // outros handlers (uso funcional para evitar stale state)
  const handleChange = (key, value) => {
    setFiltro((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = (carga) => {
    setSelectedCarga(carga);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedCarga(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedCarga(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col gap-6">
      {/* Título */}
      <motion.h1
        className="text-3xl font-bold text-gray-800"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Gestão de Cargas
      </motion.h1>

      {/* Estatísticas resumidas */}
      <motion.div className="flex flex-wrap gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="bg-white shadow-sm rounded-md p-4 flex-1 min-w-[150px]">
          <p className="text-gray-500 text-sm">Total de Cargas</p>
          <p className="text-xl font-semibold text-green-600">{cargas.length}</p>
        </div>

        <div className="bg-white shadow-sm rounded-md p-4 flex-1 min-w-[150px]">
          <p className="text-gray-500 text-sm">Em Rota</p>
          <p className="text-xl font-semibold text-green-600">{cargas.filter((c) => c.status === "em_rota").length}</p>
        </div>

        <div className="bg-white shadow-sm rounded-md p-4 flex-1 min-w-[150px]">
          <p className="text-gray-500 text-sm">Pendentes / Problemas</p>
          <p className="text-xl font-semibold text-red-500">{cargas.filter((c) => c.status !== "em_rota").length}</p>
        </div>
      </motion.div>

      {/* Botões */}
      <motion.div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.03, backgroundColor: "#16a34a" }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setModalRelatorio(true)}
          className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm cursor-pointer"
        >
          📊 Gerar Relatório
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, backgroundColor: "#16a34a" }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAdd}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 border border-green-700 hover:bg-green-700 font-medium rounded-md shadow-sm transition-all cursor-pointer"
        >
          <MdAddBox size={22} /> Nova Carga
        </motion.button>
      </motion.div>

      {/* Filtros */}
      <motion.div className="flex flex-col sm:flex-row gap-3 flex-wrap items-end" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* UF Origem */}
        <select
          value={filtro.uf_origem}
          onChange={(e) => handleUfOrigChange(e.target.value)}
          className="w-28 px-3 py-2 border border-gray-300 rounded-sm text-gray-700 bg-white text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
        >
          <option value="">UF Origem</option>
          {ufs.map((uf) => (
            <option key={uf.id} value={uf.sigla}>
              {uf.nome}
            </option>
          ))}
        </select>

        {/* Cidade Origem */}
        <select
          value={filtro.cidade_origem}
          onChange={(e) => handleChange("cidade_origem", e.target.value)}
          disabled={!cidadesOrigem.length}
          className="w-36 px-3 py-2 border border-gray-300 rounded-sm text-gray-700 bg-white text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 disabled:opacity-50"
        >
          <option value="">Cidade Origem</option>
          {cidadesOrigem.map((c) => (
            <option key={c.id} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>

        {/* UF Destino */}
        <select
          value={filtro.uf_destino}
          onChange={(e) => handleUfDestChange(e.target.value)}
          className="w-28 px-3 py-2 border border-gray-300 rounded-sm text-gray-700 bg-white text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
        >
          <option value="">UF Destino</option>
          {ufs.map((uf) => (
            <option key={uf.id} value={uf.sigla}>
              {uf.nome}
            </option>
          ))}
        </select>

        {/* Cidade Destino */}
        <select
          value={filtro.cidade_destino}
          onChange={(e) => handleChange("cidade_destino", e.target.value)}
          disabled={!cidadesDestino.length}
          className="w-36 px-3 py-2 border border-gray-300 rounded-sm text-gray-700 bg-white text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 disabled:opacity-50"
        >
          <option value="">Cidade Destino</option>
          {cidadesDestino.map((c) => (
            <option key={c.id} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>

        {/* Rota */}
        <input
          type="text"
          placeholder="Rota"
          value={filtro.rota}
          onChange={(e) => handleChange("rota", e.target.value)}
          className="w-48 px-3 py-2 border border-gray-300 rounded-sm text-gray-700 bg-white text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />

        {/* Datas */}
        <input
          type="date"
          value={filtro.data_inicio}
          onChange={(e) => handleChange("data_inicio", e.target.value)}
          className="w-32 px-3 py-2 border border-gray-300 rounded-sm text-gray-700 bg-white text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />
        <input
          type="date"
          value={filtro.data_fim}
          onChange={(e) => handleChange("data_fim", e.target.value)}
          className="w-32 px-3 py-2 border border-gray-300 rounded-sm text-gray-700 bg-white text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
        />

        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={fetchCargas} className="px-4 py-2 bg-green-600 text-white rounded-sm text-sm font-medium shadow-sm hover:bg-green-700 transition-all">
          Filtrar
        </motion.button>
      </motion.div>

      {/* Conteúdo principal */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center text-gray-500 mt-8 animate-pulse">Carregando cargas...</div>
      ) : cargas.length === 0 ? (
        <div className="flex-1 flex justify-center items-center text-gray-500 mt-8">Nenhuma carga encontrada.</div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
          <AnimatePresence>
            {cargas.map((carga) => (
              <motion.div
                key={carga.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleEdit(carga)}
                className="bg-white border border-gray-200 hover:border-green-400 transition-all shadow-sm hover:shadow-md p-5 rounded-md cursor-pointer"
              >
                <div className="space-y-1">
                  <h2 className="font-semibold text-gray-800 text-lg">
                    {carga.cidade_origem} - {carga.uf_origem} → {carga.cidade_destino} - {carga.uf_destino}
                  </h2>
                  <p className="text-gray-600 text-sm">Rota: {carga.rota}</p>
                  <p className="text-gray-600 text-sm">
                    Valor: <span className="font-medium text-green-600">R$ {Number(carga.valor_frete || 0).toFixed(2)}</span>
                  </p>
                  <p className="text-gray-600 text-sm">
                    Status:{" "}
                    <span className={`font-semibold ${carga.status === "em_rota" ? "text-green-600" : "text-red-500"}`}>
                      {carga.status}
                    </span>
                  </p>
                  {carga.observacao_cliente && (
                    <p className="mt-1 text-gray-500 text-sm italic border-l-2 border-green-400 pl-2">{carga.observacao_cliente}</p>
                  )}
                  {carga.ocorrencias?.length > 0 && (
                    <div className="mt-2">
                      <h4 className="font-semibold text-gray-700 text-sm">Ocorrências:</h4>
                      <ul className="mt-1 text-gray-600 text-sm list-disc list-inside space-y-0.5">
                        {carga.ocorrencias.map((oc) => (
                          <li key={oc.id || oc.motivo_id}>
                            {oc.motivo?.nome || "Sem motivo"}: {oc.observacao}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modais */}
      <AnimatePresence>
        {modalOpen && <ModalCarga cargaInicial={selectedCarga} onClose={handleClose} onSucesso={fetchCargas} />}
        {modalRelatorio && (
          <ModalRelatorio
            isOpen={modalRelatorio}
            onClose={() => setModalRelatorio(false)}
            filtro={filtro}
            onGerar={(f) => {
              // o modal retorna o filtro final (f); aplicamos localmente e chamamos gerarRelatorio com esse filtro
              setFiltro(f);
              gerarRelatorio(f);
              // opcional: re-buscar cargas com o filtro novo
              // NOTE: se quiser que ao gerar relatório também filtre a lista, chame fetchCargas() aqui após setFiltro.
              // fetchCargas();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
