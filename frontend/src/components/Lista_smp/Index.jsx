import React, { useState, useEffect } from "react";
import IconButton from "../Btn_Icone/Index";
import { CgDetailsMore } from "react-icons/cg";
import { IoReload } from "react-icons/io5";
import Modal from "../Modal";
import { useLogin } from "../../Contexts/LoginContext";

const ListaSM = () => {
  const [execucoes, setExecucoes] = useState([]);
  const [offset, setOffset] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const { userData } = useLogin();
  const LIMITE_POR_PAGINA = 20;

  useEffect(() => {
    carregarMaisExecucoes(); // primeira carga
  }, []);

  const [temMais, setTemMais] = useState(true); // <- novo estado

  const carregarMaisExecucoes = async () => {
    setCarregandoMais(true);

    try {
      const response = await fetch(`http://automacaosm.vercel.app/execucoes/?limite=${LIMITE_POR_PAGINA}&offset=${offset}`);
      const novasExecucoes = await response.json();

      // setExecucoes((prev) => [...prev, ...novasExecucoes]);
      setExecucoes((prev) => {
        const idsExistentes = new Set(prev.map((e) => e.id));
        const novasUnicas = novasExecucoes.filter((e) => !idsExistentes.has(e.id));
        return [...prev, ...novasUnicas];
      });
      setOffset((prev) => prev + LIMITE_POR_PAGINA);
  
      if (novasExecucoes.length < LIMITE_POR_PAGINA) {
        setTemMais(false); // chegou no fim
      }
    } catch (error) {
      console.error("Erro ao carregar execuções:", error);
    }
    setCarregandoMais(false);
  };
  

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const formatarData = (data) => {
    const dataObj = new Date(data);
    return dataObj.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  };

  const reprocessarExecucao = async (id) => {
    const payload = {
      execucao_id: {
        id: id,
      },
      login: userData,
    };

    try {
      const response = await fetch(`http://automacaosm.vercel.app/reprocessar-execucao/`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erro ao reprocessar");
      }

      console.log("Reprocessamento iniciado com sucesso!");
    } catch (error) {
      console.log(`Erro ao reprocessar execução ${id}: ${error.message}`);
    }
  };

  return (
    <div className="max-w-full mx-auto py-6">
      <h2 className="text-2xl font-semibold text-gray-300 mb-4">
        Solicitações realizadas
      </h2>

      {execucoes.length === 0 ? (
        <p className="text-xl text-gray-500">
          Nenhuma execução registrada ainda.
        </p>
      ) : (
        <>
          <div className=" overflow-x-auto bg-white rounded-lg shadow-lg">
            <table className="min-w-full table-auto border-collapse">
              <thead className="sticky top-0">
                <tr className="bg-gray-100 text-center text-gray-700">
                  <th className="px-4 py-2 text-sm font-bold">Data</th>
                  <th className="px-4 py-2 text-sm font-bold">Status</th>
                  <th className="px-4 py-2 text-sm font-bold">Condutor</th>
                  <th className="px-4 py-2 text-sm font-bold">Cavalo</th>
                  <th className="px-4 py-2 text-sm font-bold">Origem</th>
                  <th className="px-4 py-2 text-sm font-bold">Destino</th>
                  <th className="px-4 py-2 text-sm font-bold">Valor</th>
                  <th className="px-4 py-2 text-sm font-bold">Rota</th>
                </tr>
              </thead>
              <tbody>
                {execucoes.map((exec, index) => (
                  <tr
                    key={exec.id}
                    className={`${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-200 transition duration-200 text-center`}
                  >
                    <td className="whitespace-nowrap px-4 py-1 text-sm text-gray-800">
                      {formatarData(exec.criado_em)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-sm flex items-center justify-center gap-2 text-gray-800">
                      {exec.status}
                      <IconButton
                        icon={CgDetailsMore}
                        onClick={() => openModal(exec.erro)}
                      />
                      {exec.status == "Erro" && (
                        <IconButton
                          icon={IoReload}
                          onClick={() => reprocessarExecucao(exec.id)}
                        />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1 text-[12px]  text-gray-800">
                      {exec.condutor}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1 text-[12px]  text-gray-800">
                      {exec.placa_cavalo}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1 text-[12px]  text-gray-800">
                      {exec.local_origem}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1 text-[12px]  text-gray-800">
                      {exec.local_destino}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1 text-[12px]  text-gray-800">
                      R$ {exec.valor_total_carga?.toLocaleString("pt-BR")}
                    </td>

                    <td className="whitespace-nowrap px-3 py-1 text-[12px]  text-gray-800">
                      <select
                        className="text-[12px]  border border-gray-300 rounded px-2 py-1 text-sm"
                        value={exec.rota_selecionada || ""}
                        onChange={(e) => handleSelecionarRota(exec.id, e.target.value)}
                      >
                        {Array.isArray(exec.rotas_cadastradas_apisul) ? (
                          exec.rotas_cadastradas_apisul.map((rota, i) => {
                            const isSelecionada = rota === exec.rota_selecionada;
                            return (
                              <option className="text-[12px] " key={i} value={rota}>
                                {isSelecionada ? '✅ ' : ''}
                                {rota}
                              </option>
                            );
                          })
                        ) : (
                          <option>Não há rota cadastrada</option>
                        )}
                      </select>
                      <Modal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        content={modalContent}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {temMais ? (
            <div className="flex justify-center mt-6">
              <button
                onClick={carregarMaisExecucoes}
                disabled={carregandoMais}
                className="px-6 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition disabled:opacity-50"
              >
                {carregandoMais ? "Carregando..." : "Carregar mais"}
              </button>
            </div>
          ) : (
            <p className="text-center mt-6 text-sm text-gray-300">
              Todas as execuções foram carregadas.
            </p>
          )}

        </>
      )}
    </div>
  );
};

export default ListaSM;

