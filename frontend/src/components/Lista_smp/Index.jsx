
import React, { useState } from "react";
import IconButton from "../Btn_Icone/Index";
import { CgDetailsMore } from "react-icons/cg";
import { IoReload } from "react-icons/io5";
import Modal from "../Modal";
import { useLogin } from "../../Contexts/LoginContext";

const ListaSM = ({ execucoes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const { userData } = useLogin()

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
      const response = await fetch(`http://localhost:8000/reprocessar-execucao/`, {
        method: "POST",
        headers: {
          "content-type": "application/json",

        },
        body: JSON.stringify(payload)
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
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full table-auto border-collapse">
            <thead>
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
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatarData(exec.criado_em)}
                  </td>
                  <td className="px-4 py-3 text-sm flex items-center justify-center gap-2 text-gray-800">
                    {exec.status}
                    <IconButton
                      icon={CgDetailsMore}
                      onClick={() => openModal(exec.erro)}
                    />
                    {exec.erro && (
                      <IconButton
                        icon={IoReload}
                        onClick={() => reprocessarExecucao(exec.id)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {exec.condutor}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {exec.placa_cavalo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {exec.local_origem}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {exec.local_destino}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    R$ {exec.valor_total_carga?.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {exec.print_rota ? (
                      <img
                        src={`http://localhost:8000/${exec.print_rota}`}
                        alt="Rota"
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      "-"
                    )}
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
      )}
    </div>
  );
};

export default ListaSM;
