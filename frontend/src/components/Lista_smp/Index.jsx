import React, { useState, useEffect } from 'react';
import IconButton from '../Btn_Icone/Index';
import { CgDetailsMore } from 'react-icons/cg';
import { IoReload } from 'react-icons/io5';
import Modal from '../Modal';
import { useLogin } from '../../Contexts/LoginContext';
import { IoReloadCircle } from 'react-icons/io5';
import Loader from '../loarder/Loader';
import { MdDelete } from 'react-icons/md';
import { TbReport } from 'react-icons/tb';
import { toast } from 'react-toastify';

const api = import.meta.env.VITE_API_URL;

const ListaSM = () => {
  const [loading, setLoading] = useState(false);

  const [execucoes, setExecucoes] = useState([]);
  const [offset, setOffset] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const { userData } = useLogin();
  const LIMITE_POR_PAGINA = 20;

  useEffect(() => {
    carregarMaisExecucoes(); // primeira carga
  }, []);

  const [temMais, setTemMais] = useState(true); // <- novo estado

  const carregarMaisExecucoes = async (offsetForcado = null) => {
    setCarregandoMais(true);

    const offsetReal = offsetForcado !== null ? offsetForcado : offset;
    console.log('carregarMaisExecucoes chamado com offsetReal:', offsetReal);

    const url = `${api}/execucoes/?limite=${LIMITE_POR_PAGINA}&offset=${offsetReal}`;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const textoResposta = await response.text();

      let novasExecucoes = [];
      try {
        novasExecucoes = JSON.parse(textoResposta);
      } catch {
        throw new Error('Resposta da API não é um JSON válido.');
      }

      setExecucoes((prev) =>
        offsetReal === 0
          ? novasExecucoes
          : [...prev, ...novasExecucoes.filter((e) => !prev.some((p) => p.id === e.id))]
      );

      // Atualiza offset depois de adicionar
      setOffset(offsetReal + LIMITE_POR_PAGINA);

      if (novasExecucoes.length < LIMITE_POR_PAGINA) {
        setTemMais(false);
      }
    } catch (error) {
      console.error('Erro ao carregar execuções:', error);
    }
    setCarregandoMais(false);
  };
  const deletarExecucao = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta execução?')) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await fetch(`${api}/execucao/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 🔒 Sem permissão
      if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.detail || 'Você não tem permissão para deletar esta execução.');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao deletar execução');
      }

      // ✅ Remove do estado
      setExecucoes((prev) => prev.filter((e) => e.id !== id));

      toast.success('Execução deletada com sucesso!');
    } catch (error) {
      console.error(`Erro ao deletar execução ${id}:`, error);
      toast.error('Erro inesperado ao deletar a execução.');
    } finally {
      setLoading(false);
    }
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
    return dataObj
      .toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(',', '');
  };

  const recarregarExecucoes = async () => {
    setLoading(true);
    setExecucoes([]);
    setTemMais(true);
    setOffset(0);
    await carregarMaisExecucoes(0); // força o offset inicial
    setLoading(false);
  };

  const prioridadeStatus = {
    'Solicitação em andamento': 0,
    Erro: 1,
    Sucesso: 2,
  };

const reprocessarExecucao = async (id) => {
  setLoading(true);

  try {
    const token = localStorage.getItem('token');

    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!userData?.usuario_apisul || !userData?.senha_apisul) {
      toast.error('Credenciais da Apisul não configuradas.');
      return;
    }

    const payload = {
      execucao_id: { id },
      login: {
        usuario: userData.usuario_apisul,
        senha: userData.senha_apisul,
      },
    };

    const response = await fetch(`${api}/reprocessar-execucao/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // 🔒 Sem permissão
    if (response.status === 401 || response.status === 403) {
      const data = await response.json().catch(() => ({}));
      toast.error(data?.detail || 'Você não tem permissão para reprocessar esta execução.');
      return;
    }

    if (!response.ok) {
      throw new Error('Erro ao reprocessar execução');
    }

    toast.success('Reprocessamento iniciado com sucesso!');

    await recarregarExecucoes();
  } catch (error) {
    console.error(`Erro ao reprocessar execução ${id}:`, error);
    toast.error('Erro inesperado ao reprocessar a execução.');
  } finally {
    setLoading(false);
  }
};

  const formatarCNPJ = (cnpj) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const execucoesOrdenadas = [...execucoes].sort((a, b) => {
    const pa = prioridadeStatus[a.status] ?? 99; // 99 se não encontrado para colocar no fim
    const pb = prioridadeStatus[b.status] ?? 99;
    return pa - pb;
  });

  const renderDetalhes = (exec) => {
    return (
      <div className="text-sm text-gray-800">
        <h2 className="text-2xl font-semibold mb-6">Detalhes</h2>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-justify">
            <p>
              <span className="font-semibold text-green-600">SMP:</span> {exec.numero_smp}
            </p>
            <p>
              <span className="font-semibold text-green-600">Status:</span> {exec.status}
            </p>
            <p>
              <span className="font-semibold text-green-600">Data:</span>{' '}
              {formatarData(exec.criado_em)}
            </p>
            <p>
              <span className="font-semibold text-green-600">Valor Total:</span> R${' '}
              {exec.valor_total_carga?.toLocaleString('pt-BR')}
            </p>
            <p>
              <span className="font-semibold text-green-600">Condutor:</span> {exec.condutor}
            </p>
            <p>
              <span className="font-semibold text-green-600">CPF:</span> {exec.cpf_condutor}
            </p>
            <p>
              <span className="font-semibold text-green-600">Placa Cavalo:</span>{' '}
              {exec.placa_cavalo}
            </p>
            {exec.placa_carreta_1 && (
              <p>
                <span className="font-semibold text-green-600">Carreta 1:</span>{' '}
                {exec.placa_carreta_1}
              </p>
            )}
            {exec.placa_carreta_2 && (
              <p>
                <span className="font-semibold text-green-600">Carreta 2:</span>{' '}
                {exec.placa_carreta_2}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg  mb-4">Remetente</h3>
            <p className="text-justify">
              <span className="font-semibold text-green-600">Nome:</span> {exec.remetente_nome}
            </p>

            <p className="text-justify">
              <span className="font-semibold text-green-600">origem:</span> {exec.local_origem}
            </p>
            <p className="text-justify">
              <span className="font-semibold text-green-600">CNPJ:</span>{' '}
              {formatarCNPJ(exec.remetente_cnpj)}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg ">Destinatário</h3>
            <p className="text-justify">
              <span className="font-semibold text-green-600">Nome:</span> {exec.destinatario_nome}
            </p>
            <p className="text-justify">
              <span className="font-semibold text-green-600">Destino:</span> {exec.local_destino}
            </p>

            <p className="text-justify">
              <span className="font-semibold text-green-600">CNPJ:</span>{' '}
              {formatarCNPJ(exec.destinatario_cnpj)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-justify">
            <p className="sm:col-span-2">
              <span className="font-semibold text-green-600">
                Origem e destino cadastrados Apisul
              </span>
            </p>
            <p className="sm:col-span-2">
              <span className="font-semibold text-green-600"></span>
              {exec.remetente_cadastrado_apisul}
            </p>
            <p className="sm:col-span-2">
              <span className="font-semibold text-green-600"></span>
              {exec.destinatario_cadastrado_apisul}
            </p>
            <p className="sm:col-span-2">
              <span className="font-semibold text-green-600">Rota Selecionada:</span>{' '}
              {exec.rota_selecionada || ''}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {loading ? (
        <div className="w-full flex justify-center">
          <Loader />
        </div>
      ) : execucoes.length === 0 ? (
        <p className="text-xl text-gray-500">Nenhuma execução registrada ainda.</p>
      ) : (
        <div className="max-w-full mx-auto py-6">
          <div className="w-full flex items-center">
            <h2 className="text-2xl font-semibold text-gray-300">Solicitações realizadas</h2>

            <IconButton
              icon={IoReloadCircle}
              onClick={() => recarregarExecucoes()}
              color="#FFF"
              size={28}
              tooltip="Recarregar lista"
            />
          </div>

          {execucoes.length === 0 ? (
            <p className="text-xl text-gray-500">Nenhuma execução registrada ainda.</p>
          ) : (
            <>
              <div className=" overflow-x-auto bg-white rounded-sm shadow-lg">
                <table className="min-w-full table-auto border-collapse">
                  <thead className="sticky top-0">
                    <tr className="bg-gray-100 text-center text-gray-700">
                      <th className="px-2 py-2 text-sm font-bold">Ações</th>
                      <th className="px-4 py-2 text-sm font-bold">Data</th>
                      <th className="px-4 py-2 text-sm font-bold">SMP</th>
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
                    {execucoesOrdenadas.map((exec, index) => (
                      <tr
                        key={exec.id}
                        className={`${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } hover:bg-gray-200 transition duration-200 text-center`}
                      >
                        <td className="px-2 flex items-center">
                          <IconButton
                            icon={MdDelete}
                            color="#f87171"
                            size={20}
                            onClick={() => deletarExecucao(exec.id)}
                            tooltip="Deletar"
                          />
                          <IconButton
                            icon={CgDetailsMore}
                            size={20}
                            onClick={() => openModal(renderDetalhes(exec))}
                            tooltip="Detalhes"
                          />
                        </td>
                        <td className="whitespace-nowrap px-4  text-sm text-gray-800">
                          {formatarData(exec.criado_em)}
                        </td>
                        <td className="whitespace-nowrap px-4  text-sm text-gray-800">
                          {exec.numero_smp}
                        </td>
                        <td className="whitespace-nowrap px-4 items-center  text-sm flex justify-center gap-2 text-gray-800">
                          {exec.status}
                          <IconButton
                            icon={TbReport}
                            tooltip="Registro de alterações"
                            onClick={() => {
                              if (!Array.isArray(exec.historico) || exec.historico.length === 0) {
                                openModal(<div>Sem histórico disponível</div>);
                              } else {
                                openModal(
                                  <div>
                                    {exec.historico
                                      .slice()
                                      .reverse()
                                      .map((item, i) => (
                                        <div key={i} style={{ marginBottom: '10px' }}>
                                          <div className="p-3">{item}</div>
                                          <hr className="border-1 border-gray-300" />
                                        </div>
                                      ))}
                                  </div>
                                );
                              }
                            }}
                          />
                          {exec.status == 'Erro' && (
                            <IconButton
                              icon={IoReload}
                              onClick={() => reprocessarExecucao(exec.id)}
                              tooltip="Reprocessar SMP"
                            />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3  text-[12px]  text-gray-800">
                          {exec.condutor}
                        </td>
                        <td className="whitespace-nowrap px-3  text-[12px]  text-gray-800">
                          {exec.placa_cavalo}
                        </td>
                        <td className="whitespace-nowrap px-3  text-[12px]  text-gray-800">
                          {exec.local_origem}
                        </td>
                        <td className="whitespace-nowrap px-3  text-[12px]  text-gray-800">
                          {exec.local_destino}
                        </td>
                        <td className="whitespace-nowrap px-3  text-[12px]  text-gray-800">
                          R$ {exec.valor_total_carga?.toLocaleString('pt-BR')}
                        </td>
                        <td className="whitespace-nowrap px-3  text-[12px]  text-gray-800">
                          <select
                            className="text-[12px]  border border-gray-300 rounded px-2  text-sm"
                            value={exec.rota_selecionada || ''}
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
                          <Modal isOpen={isModalOpen} onClose={closeModal} content={modalContent} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {temMais ? (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => carregarMaisExecucoes()}
                    disabled={carregandoMais}
                    className="px-6 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {carregandoMais ? 'Carregando...' : 'Carregar mais'}
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
      )}
    </>
  );
};

export default ListaSM;
