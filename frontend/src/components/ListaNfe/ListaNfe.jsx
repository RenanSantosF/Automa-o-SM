import React, { useEffect, useState } from 'react';
import { IoReloadCircle } from 'react-icons/io5';
import { FaSync, FaExclamationCircle, FaRecycle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import IconButton from '../Btn_Icone/Index';
import { MdDelete } from 'react-icons/md';

const api = import.meta.env.VITE_API_URL;

const ListaNfe = () => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [btnStatus, setBtnStatus] = useState('idle');
  const [btnStatusPendentes, setBtnStatusPendentes] = useState('idle');
  const [btnStatusErros, setBtnStatusErros] = useState('idle');
  const [btnStatusSolicitacao, setBtnStatusSolicitacao] = useState({});
  const [btnStatusErrosSolicitacao, setBtnStatusErrosSolicitacao] = useState({});

  const fetchSolicitacoes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${api}/solicitacoes`);
      const data = await response.json();
      setSolicitacoes(data.solicitacoes || []);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const reprocessarNaoBaixadas = async () => {
    setBtnStatusPendentes('loading');

    try {
      const response = await reprocessar('reprocessar-nao-baixadas');

      const statusMsg = response.status?.toLowerCase() || '';

      if (statusMsg.includes('nenhuma nfe pendente para reprocessar')) {
        setBtnStatusPendentes('empty');
        setTimeout(() => setBtnStatusPendentes('idle'), 3000);
      } else {
        setBtnStatusPendentes('idle');
      }
    } catch {
      setBtnStatusPendentes('idle');
    }
  };

  const reprocessarErros = async () => {
    setBtnStatusErros('loading');

    try {
      const response = await reprocessar('reprocessar-erros');

      console.log('Resposta reprocessar-erros:', response);

      if (
        !response.status ||
        response.status.toLowerCase().includes('nenhuma nfe com erro para reprocessar')
      ) {
        setBtnStatusErros('empty');
        setTimeout(() => setBtnStatusErros('idle'), 3000);
      } else {
        setBtnStatusErros('idle');
      }
    } catch {
      setBtnStatusErros('idle');
    }
  };

  const reprocessar = async (rota) => {
    try {
      const response = await fetch(`${api}/${rota}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.status || 'Erro no reprocessamento.');
      }

      toast.success(data.status || 'Reprocessamento concluído com sucesso.');
      fetchSolicitacoes();

      return data; // importante para usar na função que chamou
    } catch (error) {
      toast.error(error.message || 'Erro ao reprocessar.');
      throw error;
    }
  };

  const reprocessarSolicitacao = async (solicitacaoId) => {
    setBtnStatusSolicitacao((prev) => ({ ...prev, [solicitacaoId]: 'loading' }));

    try {
      const response = await reprocessar(`reprocessa-solicitacao/${solicitacaoId}`);

      if (response.status === 'empty') {
        setBtnStatusSolicitacao((prev) => ({ ...prev, [solicitacaoId]: 'empty' }));
        setTimeout(() => {
          setBtnStatusSolicitacao((prev) => ({ ...prev, [solicitacaoId]: 'idle' }));
        }, 3000);
      } else {
        setBtnStatusSolicitacao((prev) => ({ ...prev, [solicitacaoId]: 'idle' }));
      }
    } catch {
      setBtnStatusSolicitacao((prev) => ({ ...prev, [solicitacaoId]: 'idle' }));
    }
  };

  const handleDeleteSolicitacao = async (solicitacaoId) => {
    const confirmado = confirm(`Tem certeza que deseja excluir a solicitação ${solicitacaoId}?`);

    if (!confirmado) return;

    try {
      const response = await fetch(`${api}/solicitacao/${solicitacaoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Solicitação excluída com sucesso!');
        // Atualiza a lista após excluir
        setSolicitacoes((prev) => prev.filter((s) => s.solicitacao_id !== solicitacaoId));
      } else {
        const error = await response.json();
        alert(`Erro ao excluir: ${error.detail || error.message}`);
      }
    } catch (error) {
      alert('Erro ao excluir solicitação');
      console.error(error);
    }
  };

  const reprocessarErrosSolicitacao = async (solicitacaoId) => {
    setBtnStatusErrosSolicitacao((prev) => ({ ...prev, [solicitacaoId]: 'loading' }));

    try {
      const response = await reprocessar(`reprocessar-erros/${solicitacaoId}`);
      const statusMsg = response.status?.toLowerCase() || '';

      if (statusMsg.includes('nenhuma nfe com erro')) {
        setBtnStatusErrosSolicitacao((prev) => ({ ...prev, [solicitacaoId]: 'empty' }));
        setTimeout(() => {
          setBtnStatusErrosSolicitacao((prev) => ({ ...prev, [solicitacaoId]: 'idle' }));
        }, 3000);
      } else {
        setBtnStatusErrosSolicitacao((prev) => ({ ...prev, [solicitacaoId]: 'idle' }));
      }
    } catch {
      setBtnStatusErrosSolicitacao((prev) => ({ ...prev, [solicitacaoId]: 'idle' }));
    }
  };

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  return (
    // <div className="max-w-full mx-auto py-6">
    //   <div className="w-full flex items-center">
    //     <h2 className="text-2xl font-semibold text-gray-300">
    //       Solicitações de NFes por CT-e
    //     </h2>
    //     <IconButton
    //       icon={IoReloadCircle}
    //       onClick={fetchSolicitacoes}
    //       color="#FFF"
    //       size={28}
    //       tooltip="Recarregar lista"
    //     />
    //   </div>

    //   <div className="flex gap-4 my-4">
    //   <button
    //     onClick={reprocessarNaoBaixadas}
    //     disabled={btnStatusPendentes === "loading"}
    //     className={`${
    //       btnStatusPendentes === "loading"
    //         ? "bg-gray-400 cursor-not-allowed"
    //         : "bg-green-600 hover:bg-green-700"
    //     } text-white px-4 py-2 rounded flex items-center gap-2`}
    //   >
    //     <FaSync />
    //     {btnStatusPendentes === "loading" && "Processando..."}
    //     {btnStatusPendentes === "empty" && "Nenhuma pendente"}
    //     {btnStatusPendentes === "idle" && "Reprocessar todas NFs Pendentes"}
    //   </button>

    //   <button
    //     onClick={reprocessarErros}
    //     disabled={btnStatusErros === "loading"}
    //     className={`${
    //       btnStatusErros === "loading"
    //         ? "bg-gray-400 cursor-not-allowed"
    //         : "bg-yellow-500 hover:bg-yellow-600"
    //     } text-white px-4 py-2 rounded flex items-center gap-2`}
    //   >
    //     <FaSync />
    //     {btnStatusErros === "loading" && "Processando..."}
    //     {btnStatusErros === "empty" && "Nenhum erro"}
    //     {btnStatusErros === "idle" && "Reprocessar todas NFs com Erro"}
    //   </button>

    //   </div>

    //   {loading ? (
    //     <p className="text-gray-600">Carregando...</p>
    //   ) : solicitacoes.length === 0 ? (
    //     <p className="text-gray-500 text-xl">Nenhuma solicitação encontrada.</p>
    //   ) : (
    //     solicitacoes.map((sol) =>  {
    //       const totalNfes = sol.ctes.reduce(
    //         (acc, cte) => acc + (cte.nfes ? cte.nfes.length : 0),
    //         0
    //       );

    //       const nfesProcessadas = sol.ctes.reduce(
    //         (acc, cte) =>
    //           acc +
    //           (cte.nfes
    //             ? cte.nfes.filter(
    //                 (nfe) => nfe.baixado || nfe.status === "sucesso"
    //               ).length
    //             : 0),
    //         0
    //       );

    //       const progresso =
    //         totalNfes > 0 ? Math.round((nfesProcessadas / totalNfes) * 100) : 0;

    //       return (
    //       <div key={sol.solicitacao_id} className="bg-white rounded-xl shadow p-6 mb-6">
    //         <div className="flex justify-between items-center">

    //         <div className="flex items-center">
    //             <IconButton
    //               icon={MdDelete}
    //               color="#f87171"
    //               size={20}
    //               onClick={() => handleDeleteSolicitacao(sol.solicitacao_id)}
    //               tooltip="Deletar"
    //             />
    //             <h3 className="text-xl font-semibold text-green-700 whitespace-nowrap">
    //               Solicitação {sol.solicitacao_id.substring(0, 8)}
    //             </h3>

    //             <div className="w-full flex flex-col px-5 gap-1 mt-2">
    //               <p className="text-xs text-gray-500">
    //                 Progresso: {progresso}% ({nfesProcessadas}/{totalNfes})
    //               </p>
    //               <div className="w-full bg-gray-200 rounded-full h-3">
    //                 <div
    //                   className={`h-3 rounded-full ${
    //                     progresso === 100 ? "bg-green-600" : "bg-blue-500"
    //                   }`}
    //                   style={{ width: `${progresso}%` }}
    //                 ></div>
    //               </div>
    //             </div>

    //           </div>

    //           <div className="flex gap-2">
    //             <button
    //               onClick={() => reprocessarSolicitacao(sol.solicitacao_id)}
    //               disabled={btnStatusSolicitacao[sol.solicitacao_id] === "loading"}
    //               className={`${
    //                 btnStatusSolicitacao[sol.solicitacao_id] === "loading"
    //                   ? "bg-gray-400 cursor-not-allowed"
    //                   : "bg-blue-600 hover:bg-blue-700"
    //               } text-white px-3 py-1 rounded flex items-center gap-1`}
    //             >
    //               <FaSync />
    //               {btnStatusSolicitacao[sol.solicitacao_id] === "loading" && "Processando..."}
    //               {btnStatusSolicitacao[sol.solicitacao_id] === "empty" && "Nenhuma NFe"}
    //               {(!btnStatusSolicitacao[sol.solicitacao_id] || btnStatusSolicitacao[sol.solicitacao_id] === "idle") && "Rep. Pendentes"}
    //             </button>
    //             <button
    //               onClick={() => reprocessarErrosSolicitacao(sol.solicitacao_id)}
    //               disabled={btnStatusErrosSolicitacao[sol.solicitacao_id] === "loading"}
    //               className={`${
    //                 btnStatusErrosSolicitacao[sol.solicitacao_id] === "loading"
    //                   ? "bg-gray-400 cursor-not-allowed"
    //                   : "bg-yellow-500 hover:bg-yellow-600"
    //               } text-white px-3 py-1 rounded flex items-center gap-1`}
    //             >
    //               <FaSync />
    //               {btnStatusErrosSolicitacao[sol.solicitacao_id] === "loading" && "Processando..."}
    //               {btnStatusErrosSolicitacao[sol.solicitacao_id] === "empty" && "Nenhum erro"}
    //               {(!btnStatusErrosSolicitacao[sol.solicitacao_id] || btnStatusErrosSolicitacao[sol.solicitacao_id] === "idle") && "Rep. Erros"}
    //             </button>
    //           </div>
    //         </div>

    //         <div className="mt-4">
    //           {sol.ctes.map((cte) => (
    //             <div
    //               key={cte.id}
    //               className="border rounded-lg p-4 mb-3 bg-gray-50"
    //             >
    //               <p className="font-semibold text-gray-800">
    //                 📄 {cte.nome}
    //               </p>
    //               {cte.nfes && cte.nfes.length > 0 ? (
    //                 <ul className="mt-2 ml-4 list-disc text-sm text-gray-700">
    //                   {cte.nfes.map((nfe) => (
    //                     <li key={nfe.id}>
    //                       🔑 <span className="font-mono">{nfe.chave}</span> —{" "}
    //                       <span
    //                         className={`italic ${
    //                           nfe.status === "erro"
    //                             ? "text-red-600"
    //                             : nfe.status === "sucesso"
    //                             ? "text-green-600"
    //                             : "text-yellow-600"
    //                         }`}
    //                       >
    //                         {nfe.status}
    //                       </span>{" "}
    //                       {nfe.baixado && <span className="text-green-500">✔️ Baixado</span>}
    //                     </li>
    //                   ))}
    //                 </ul>
    //               ) : (
    //                 <p className="text-xs text-gray-500 mt-1 ml-4">
    //                   Nenhuma NFe vinculada
    //                 </p>
    //               )}

    //             </div>
    //           ))}
    //         </div>
    //       </div>
    //     )})
    //   )}
    // </div>

    <div className="max-w-full mx-auto py-6 px-2 sm:px-6">
      <div className="w-full flex items-center flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-300">
          Solicitações de NFes por CT-e
        </h2>
        <IconButton
          icon={IoReloadCircle}
          onClick={fetchSolicitacoes}
          color="#FFF"
          size={28}
          tooltip="Recarregar lista"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 my-4">
        <button
          onClick={reprocessarNaoBaixadas}
          disabled={btnStatusPendentes === 'loading'}
          className={`${
            btnStatusPendentes === 'loading'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          } text-white px-4 py-2 rounded flex items-center justify-center gap-2 text-sm`}
        >
          <FaSync />
          {btnStatusPendentes === 'loading' && 'Processando...'}
          {btnStatusPendentes === 'empty' && 'Nenhuma pendente'}
          {btnStatusPendentes === 'idle' && 'Reprocessar todas NFs Pendentes'}
        </button>

        <button
          onClick={reprocessarErros}
          disabled={btnStatusErros === 'loading'}
          className={`${
            btnStatusErros === 'loading'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600'
          } text-white px-4 py-2 rounded flex items-center justify-center gap-2 text-sm`}
        >
          <FaSync />
          {btnStatusErros === 'loading' && 'Processando...'}
          {btnStatusErros === 'empty' && 'Nenhum erro'}
          {btnStatusErros === 'idle' && 'Reprocessar todas NFs com Erro'}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : solicitacoes.length === 0 ? (
        <p className="text-gray-500 text-xl">Nenhuma solicitação encontrada.</p>
      ) : (
        solicitacoes.map((sol) => {
          const totalNfes = sol.ctes.reduce(
            (acc, cte) => acc + (cte.nfes ? cte.nfes.length : 0),
            0
          );

          const nfesProcessadas = sol.ctes.reduce(
            (acc, cte) =>
              acc +
              (cte.nfes
                ? cte.nfes.filter((nfe) => nfe.baixado || nfe.status === 'sucesso').length
                : 0),
            0
          );

          const progresso = totalNfes > 0 ? Math.round((nfesProcessadas / totalNfes) * 100) : 0;

          return (
            <div key={sol.solicitacao_id} className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <IconButton
                    icon={MdDelete}
                    color="#f87171"
                    size={20}
                    onClick={() => handleDeleteSolicitacao(sol.solicitacao_id)}
                    tooltip="Deletar"
                  />
                  <h3 className="text-lg sm:text-xl font-semibold text-green-700">
                    Solicitação {sol.solicitacao_id.substring(0, 8)}
                  </h3>

                  <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <p className="text-xs text-gray-500">
                      Progresso: {progresso}% ({nfesProcessadas}/{totalNfes})
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          progresso === 100 ? 'bg-green-600' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progresso}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => reprocessarSolicitacao(sol.solicitacao_id)}
                    disabled={btnStatusSolicitacao[sol.solicitacao_id] === 'loading'}
                    className={`${
                      btnStatusSolicitacao[sol.solicitacao_id] === 'loading'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white px-3 py-1 rounded flex items-center justify-center gap-1 text-sm`}
                  >
                    <FaSync />
                    {btnStatusSolicitacao[sol.solicitacao_id] === 'loading' && 'Processando...'}
                    {btnStatusSolicitacao[sol.solicitacao_id] === 'empty' && 'Nenhuma NFe'}
                    {(!btnStatusSolicitacao[sol.solicitacao_id] ||
                      btnStatusSolicitacao[sol.solicitacao_id] === 'idle') &&
                      'Rep. Pendentes'}
                  </button>
                  <button
                    onClick={() => reprocessarErrosSolicitacao(sol.solicitacao_id)}
                    disabled={btnStatusErrosSolicitacao[sol.solicitacao_id] === 'loading'}
                    className={`${
                      btnStatusErrosSolicitacao[sol.solicitacao_id] === 'loading'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-yellow-500 hover:bg-yellow-600'
                    } text-white px-3 py-1 rounded flex items-center justify-center gap-1 text-sm`}
                  >
                    <FaSync />
                    {btnStatusErrosSolicitacao[sol.solicitacao_id] === 'loading' &&
                      'Processando...'}
                    {btnStatusErrosSolicitacao[sol.solicitacao_id] === 'empty' && 'Nenhum erro'}
                    {(!btnStatusErrosSolicitacao[sol.solicitacao_id] ||
                      btnStatusErrosSolicitacao[sol.solicitacao_id] === 'idle') &&
                      'Rep. Erros'}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {sol.ctes.map((cte) => (
                  <div key={cte.id} className="border rounded-lg p-4 mb-3 bg-gray-50">
                    <p className="font-semibold text-gray-800 break-words">📄 {cte.nome}</p>
                    {cte.nfes && cte.nfes.length > 0 ? (
                      <ul className="mt-2 ml-4 list-disc text-sm text-gray-700">
                        {cte.nfes.map((nfe) => (
                          <li key={nfe.id} className="break-words">
                            🔑 <span className="font-mono">{nfe.chave}</span> —{' '}
                            <span
                              className={`italic ${
                                nfe.status === 'erro'
                                  ? 'text-red-600'
                                  : nfe.status === 'sucesso'
                                  ? 'text-green-600'
                                  : 'text-yellow-600'
                              }`}
                            >
                              {nfe.status}
                            </span>{' '}
                            {nfe.baixado && <span className="text-green-500">✔️ Baixado</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1 ml-4">Nenhuma NFe vinculada</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ListaNfe;
