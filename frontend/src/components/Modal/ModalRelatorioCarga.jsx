

// // dentro do componente ModalRelatorio:


// import { useEffect, useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import axios from 'axios';
// import { FaFilePdf, FaFileExcel, FaFileCsv, FaChartBar } from 'react-icons/fa';
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import RelatorioFilters from './RelatorioFilters';
// import RelatorioActions from './RelatorioActions';

// const apiBase = `${import.meta.env.VITE_API_URL}/gestor-cargas`;

// export default function ModalRelatorio({ isOpen, onClose, filtro, onGerar }) {
//   const [filtroLocal, setFiltroLocal] = useState(filtro || {});
//   const [tipos, setTipos] = useState([]);
//   const [motivos, setMotivos] = useState([]);
//   const [filteredMotivos, setFilteredMotivos] = useState([]);
//   const [estados, setEstados] = useState([]);
//   const [cidadesOrigem, setCidadesOrigem] = useState([]);
//   const [cidadesDestino, setCidadesDestino] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // novos: listas para filtros de criador/transportadora/filial
//   const [creators, setCreators] = useState([]);
//   const [transportadoras, setTransportadoras] = useState([]);
//   const [filiais, setFiliais] = useState([]);




//   // 🔹 EXPORTAÇÕES (mantidas dentro do componente!)
// const exportarExcel = async () => {
//   setLoading(true);
//   try {
//     const dados = await gerarRelatorio();
//     if (!dados) return;

//     const wb = XLSX.utils.book_new();
//     const resumoAoA = [
//       ['Chave', 'Valor'],
//       ['Total Cargas', dados.total_cargas ?? ''],
//       ['Total Valor Frete', dados.total_valor_frete ?? ''],
//       ['Média Valor Frete', dados.media_valor_frete ?? ''],
//       ['Min Valor Frete', dados.min_valor_frete ?? ''],
//       ['Max Valor Frete', dados.max_valor_frete ?? ''],
//       ['Cargas com ocorrências', dados.cargas_com_ocorrencias ?? ''],
//       ['Cargas sem ocorrências', dados.cargas_sem_ocorrencias ?? ''],
//       ['Ocorrências totais', dados.ocorrencias_totais ?? ''],
//     ];
//     XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoAoA), 'Resumo');

//     const cargas = Array.isArray(dados.cargas) ? dados.cargas : [];
//     XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cargas), 'Cargas');

//     XLSX.writeFile(wb, 'relatorio_cargas.xlsx');
//   } catch (err) {
//     console.error('Erro exportarExcel:', err);
//     alert('Erro ao exportar Excel. Veja console.');
//   } finally {
//     setLoading(false);
//   }
// };

// const exportarCSV = async () => {
//   setLoading(true);
//   try {
//     const dados = await gerarRelatorio();
//     if (!dados) return;

//     const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dados.cargas || []));
//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.download = 'relatorio_cargas.csv';
//     link.click();
//   } catch (err) {
//     console.error('Erro exportarCSV:', err);
//   } finally {
//     setLoading(false);
//   }
// };

// const exportarPDF = async () => {
//   setLoading(true);
//   try {
//     const dados = await gerarRelatorio();
//     if (!dados) return;

//     const doc = new jsPDF({ orientation: 'landscape' });
//     doc.setFontSize(18);
//     doc.text('Relatório de Cargas', 14, 14);
//     autoTable(doc, {
//       startY: 22,
//       head: [['ID', 'UF Origem', 'UF Destino', 'Valor Frete', 'Criado Por']],
//       body: (dados.cargas || []).map((c) => [
//         c.id,
//         c.uf_origem,
//         c.uf_destino,
//         c.valor_frete,
//         c.criado_por_nome,
//       ]),
//     });
//     doc.save('relatorio_cargas.pdf');
//   } catch (err) {
//     console.error('Erro exportarPDF:', err);
//   } finally {
//     setLoading(false);
//   }
// };



//   // sincroniza filtro pai ao abrir
//   useEffect(() => {
//     if (isOpen) setFiltroLocal(filtro || {});
//   }, [isOpen, filtro]);

//   const api = axios.create({
//     baseURL: apiBase,
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem('token')}`,
//       'Content-Type': 'application/json',
//     },
//   });

//   const getMotivoTipoId = (mot) => mot?.tipo_id ?? mot?.tipo?.id ?? null;

//   // carrega tipos, motivos e filtros backend
//   useEffect(() => {
//     if (!isOpen) return;
//     (async () => {
//       try {
//         const [tiposRes, motivosRes, filtersRes] = await Promise.all([
//           api.get('/tipos'),
//           api.get('/motivos'),
//           api.get('/filters'),
//         ]);

//         setTipos(tiposRes.data || []);
//         setMotivos(motivosRes.data || []);

//         const fr = filtersRes.data || {};
//         setCreators(fr.creators || []);
//         setTransportadoras(fr.transportadoras?.filter(Boolean) || []);
//         setFiliais(fr.filiais?.filter(Boolean) || []);
//       } catch (err) {
//         console.error('Erro ao carregar dados iniciais:', err);
//       }
//     })();
//   }, [isOpen]);

//   // carregar UFs IBGE
//   useEffect(() => {
//     axios
//       .get('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
//       .then((res) => setEstados(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
//       .catch((err) => console.error('Erro ao carregar estados IBGE:', err));
//   }, []);

//   // cidades origem/destino
//   useEffect(() => {
//     const uf = filtroLocal?.uf_origem;
//     if (!uf) return setCidadesOrigem([]);
//     axios
//       .get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
//       .then((res) => setCidadesOrigem(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
//       .catch(console.error);
//   }, [filtroLocal?.uf_origem]);

//   useEffect(() => {
//     const uf = filtroLocal?.uf_destino;
//     if (!uf) return setCidadesDestino([]);
//     axios
//       .get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
//       .then((res) => setCidadesDestino(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
//       .catch(console.error);
//   }, [filtroLocal?.uf_destino]);

//   // filtra motivos conforme tipo
//   useEffect(() => {
//     if (!filtroLocal.tipo_ocorrencia) return setFilteredMotivos(motivos);
//     const fm = motivos.filter((m) => String(getMotivoTipoId(m)) === String(filtroLocal.tipo_ocorrencia));
//     setFilteredMotivos(fm);
//     if (filtroLocal.motivo_ocorrencia && !fm.some((m) => String(m.id) === String(filtroLocal.motivo_ocorrencia))) {
//       setFiltroLocal((p) => ({ ...p, motivo_ocorrencia: '' }));
//     }
//   }, [motivos, filtroLocal?.tipo_ocorrencia]);

//   // monta parâmetros compatíveis com backend
//   const buildParamsFromFiltroLocal = () => {
//     const copy = { ...filtroLocal };
//     if (!copy.uf_origem) delete copy.cidade_origem;
//     if (!copy.uf_destino) delete copy.cidade_destino;
//     const params = {};
//     const direct = ['uf_origem', 'cidade_origem', 'uf_destino', 'cidade_destino', 'rota', 'data_inicio', 'data_fim', 'skip', 'limit'];
//     direct.forEach((k) => copy[k] && (params[k] = copy[k]));

//     if (copy.tipo_ocorrencia) params.tipo_ocorrencia_id = Number(copy.tipo_ocorrencia);
//     if (copy.motivo_ocorrencia) params.motivo_ocorrencia_id = Number(copy.motivo_ocorrencia);
//     if (copy.criado_por_id) params.criado_por_id = Number(copy.criado_por_id);
//     if (copy.criado_por_transportadora) params.criado_por_transportadora = copy.criado_por_transportadora;
//     if (copy.criado_por_filial) params.criado_por_filial = copy.criado_por_filial;
//     return params;
//   };

//   const gerarRelatorio = async () => {
//     setLoading(true);
//     try {
//       const params = buildParamsFromFiltroLocal();
//       const res = await api.get('/estatisticas', { params });
//       return res.data || {};
//     } catch (err) {
//       console.error('Erro ao gerar relatório:', err);
//       alert('Erro ao gerar relatório. Veja console para detalhes.');
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // callback do botão "Gerar"
//   const handleConfirmGerar = () => {
//     const params = buildParamsFromFiltroLocal();
//     onGerar?.(params);
//     onClose?.();
//   };

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
//         >
//           <motion.div
//             initial={{ scale: 0.9, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             exit={{ scale: 0.9, opacity: 0 }}
//             transition={{ duration: 0.25 }}
//             className="bg-zinc-900 text-gray-200 rounded-2xl shadow-2xl w-11/12 max-w-lg p-6 flex flex-col gap-4 border border-zinc-700"
//           >
//             <div className="flex items-center justify-between">
//               <h2 className="text-2xl font-semibold flex items-center gap-2">
//                 <FaChartBar className="text-green-500" /> Relatório de Cargas
//               </h2>
//               <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-lg transition">
//                 ✕
//               </button>
//             </div>

//             {/* filtros separados em componente */}
//             <RelatorioFilters
//               filtroLocal={filtroLocal}
//               setFiltroLocal={setFiltroLocal}
//               estados={estados}
//               cidadesOrigem={cidadesOrigem}
//               cidadesDestino={cidadesDestino}
//               tipos={tipos}
//               motivos={filteredMotivos}
//               creators={creators}
//               transportadoras={transportadoras}
//               filiais={filiais}
//             />

//             {/* ações e exportações */}
// <RelatorioActions
//   onGerar={handleConfirmGerar}
//   exportarPDF={exportarPDF}
//   exportarExcel={exportarExcel}
//   exportarCSV={exportarCSV}
//   loading={loading}
// />

//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }


import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FaFilePdf, FaFileExcel, FaFileCsv, FaChartBar } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import RelatorioFilters from './RelatorioFilters';
import RelatorioActions from './RelatorioActions';

const apiBase = `${import.meta.env.VITE_API_URL}/gestor-cargas`;

export default function ModalRelatorio({ isOpen, onClose, filtro, onGerar }) {
  const [filtroLocal, setFiltroLocal] = useState(filtro || {});
  const [tipos, setTipos] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [filteredMotivos, setFilteredMotivos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidadesOrigem, setCidadesOrigem] = useState([]);
  const [cidadesDestino, setCidadesDestino] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // novos filtros de criador / transportadora / filial
  const [creators, setCreators] = useState([]);
  const [transportadoras, setTransportadoras] = useState([]);
  const [filiais, setFiliais] = useState([]);

  const api = axios.create({
    baseURL: apiBase,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  // --- sincroniza filtro pai ao abrir
  useEffect(() => {
    if (isOpen) setFiltroLocal(filtro || {});
  }, [isOpen, filtro]);

  // --- carrega dados iniciais (tipos, motivos e filtros backend)
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        setLoading(true);
        const [tiposRes, motivosRes, filtersRes] = await Promise.all([
          api.get('/tipos'),
          api.get('/motivos'),
          api.get('/filters'),
        ]);

        setTipos(tiposRes.data || []);
        setMotivos(motivosRes.data || []);

        const fr = filtersRes.data || {};
        setCreators(fr.creators || []);
        setTransportadoras(fr.transportadoras?.filter(Boolean) || []);
        setFiliais(fr.filiais?.filter(Boolean) || []);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  // --- carregar UFs (IBGE)
  useEffect(() => {
    axios
      .get('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then((res) => setEstados(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch((err) => console.error('Erro ao carregar estados IBGE:', err));
  }, []);

  // --- cidades origem/destino dinâmicas
  useEffect(() => {
    const uf = filtroLocal?.uf_origem;
    if (!uf) return setCidadesOrigem([]);
    axios
      .get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      .then((res) => setCidadesOrigem(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch(console.error);
  }, [filtroLocal?.uf_origem]);

  useEffect(() => {
    const uf = filtroLocal?.uf_destino;
    if (!uf) return setCidadesDestino([]);
    axios
      .get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      .then((res) => setCidadesDestino(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch(console.error);
  }, [filtroLocal?.uf_destino]);

  // --- filtra motivos conforme tipo
  const getMotivoTipoId = (mot) => mot?.tipo_id ?? mot?.tipo?.id ?? null;

  useEffect(() => {
    if (!filtroLocal.tipo_ocorrencia) return setFilteredMotivos(motivos);
    const fm = motivos.filter(
      (m) => String(getMotivoTipoId(m)) === String(filtroLocal.tipo_ocorrencia)
    );
    setFilteredMotivos(fm);
    if (
      filtroLocal.motivo_ocorrencia &&
      !fm.some((m) => String(m.id) === String(filtroLocal.motivo_ocorrencia))
    ) {
      setFiltroLocal((p) => ({ ...p, motivo_ocorrencia: '' }));
    }
  }, [motivos, filtroLocal?.tipo_ocorrencia]);

  // --- monta parâmetros compatíveis com backend
  const buildParamsFromFiltroLocal = () => {
    const copy = { ...filtroLocal };
    if (!copy.uf_origem) delete copy.cidade_origem;
    if (!copy.uf_destino) delete copy.cidade_destino;
    const params = {};
    const direct = [
      'uf_origem',
      'cidade_origem',
      'uf_destino',
      'cidade_destino',
      'rota',
      'data_inicio',
      'data_fim',
      'skip',
      'limit',
    ];
    direct.forEach((k) => copy[k] && (params[k] = copy[k]));
    if (copy.tipo_ocorrencia) params.tipo_ocorrencia_id = Number(copy.tipo_ocorrencia);
    if (copy.motivo_ocorrencia) params.motivo_ocorrencia_id = Number(copy.motivo_ocorrencia);
    if (copy.criado_por_id) params.criado_por_id = Number(copy.criado_por_id);
    if (copy.criado_por_transportadora)
      params.criado_por_transportadora = copy.criado_por_transportadora;
    if (copy.criado_por_filial) params.criado_por_filial = copy.criado_por_filial;
    return params;
  };

  // --- gerar relatório principal
  const gerarRelatorio = async () => {
    setLoading(true);
    setStatusMsg('Gerando relatório...');
    try {
      const params = buildParamsFromFiltroLocal();
      const res = await api.get('/estatisticas', { params });
      setStatusMsg('Relatório pronto!');
      return res.data || {};
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setStatusMsg('Erro ao gerar relatório.');
      alert('Erro ao gerar relatório. Veja console para detalhes.');
      return null;
    } finally {
      setTimeout(() => setStatusMsg(''), 1800);
      setLoading(false);
    }
  };

  // --- EXPORTAÇÕES
// função auxiliar (coloque antes das exportações)
const objEntriesToAoA = (obj = {}, headers = ['Chave', 'Valor']) => {
  const entries = Object.entries(obj || {});
  if (!entries.length) return [['Nenhum dado', '']];
  return [headers, ...entries.map(([k, v]) => [String(k), String(v)])];
};

const formatCurrency = (num) =>
  num != null ? Number(num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';

// ----------------------------------------------
// 📘 EXPORTAR EXCEL
// ----------------------------------------------
const exportarExcel = async () => {
  setLoading(true);
  try {
    const dados = await gerarRelatorio();
    if (!dados) return;

    const wb = XLSX.utils.book_new();

    // --- Aba: Resumo Geral ---
    const resumoAoA = [
      ['Métrica', 'Valor'],
      ['Total de Cargas', dados.total_cargas ?? ''],
      ['Total Valor Frete', formatCurrency(dados.total_valor_frete)],
      ['Média Valor Frete', formatCurrency(dados.media_valor_frete)],
      ['Min Valor Frete', formatCurrency(dados.min_valor_frete)],
      ['Max Valor Frete', formatCurrency(dados.max_valor_frete)],
      ['Cargas com Ocorrências', dados.cargas_com_ocorrencias ?? ''],
      ['Cargas sem Ocorrências', dados.cargas_sem_ocorrencias ?? ''],
      ['Ocorrências Totais', dados.ocorrencias_totais ?? ''],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoAoA), 'Resumo');

    // --- Aba: Ocorrências ---
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(objEntriesToAoA(dados.ocorrencias_por_tipo, ['Tipo', 'Quantidade'])),
      'Ocorrências por Tipo'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(objEntriesToAoA(dados.ocorrencias_por_motivo, ['Motivo', 'Quantidade'])),
      'Ocorrências por Motivo'
    );

    // --- Aba: Status / UF / Criadores ---
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(objEntriesToAoA(dados.por_status, ['Status', 'Qtd'])),
      'Por Status'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(objEntriesToAoA(dados.por_uf_origem, ['UF Origem', 'Qtd'])),
      'UF Origem'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(objEntriesToAoA(dados.por_uf_destino, ['UF Destino', 'Qtd'])),
      'UF Destino'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(objEntriesToAoA(dados.por_criador, ['Criador', 'Qtd'])),
      'Por Criador'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(objEntriesToAoA(dados.por_criador_transportadora, ['Transportadora', 'Qtd'])),
      'Por Transportadora'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(objEntriesToAoA(dados.por_criador_filial, ['Filial', 'Qtd'])),
      'Por Filial'
    );

    // --- Aba: Top Rotas ---
    const topRotasAoA = [['Rota', 'Qtd']];
    (dados.top_rotas || []).forEach((r) => topRotasAoA.push([r.rota ?? '', r.qtd ?? '']));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topRotasAoA), 'Top Rotas');

    // --- Aba: Top Cargas ---
    const topCargasAoA = [
      ['ID', 'Data', 'Valor Frete', 'Origem', 'Destino', 'Status'],
      ...(dados.top_cargas_por_valor || []).map((c) => [
        c.id ?? '',
        c.data_carregamento ?? '',
        formatCurrency(c.valor_frete),
        `${c.cidade_origem ?? ''}/${c.uf_origem ?? ''}`,
        `${c.cidade_destino ?? ''}/${c.uf_destino ?? ''}`,
        c.status ?? '',
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topCargasAoA), 'Top Cargas');

    // --- Aba: Cargas Detalhadas ---
    const cargas = Array.isArray(dados.cargas) ? dados.cargas : [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cargas), 'Cargas Detalhadas');

    XLSX.writeFile(wb, 'relatorio_cargas_corporativo.xlsx');
  } catch (err) {
    console.error('Erro exportarExcel:', err);
    alert('Erro ao exportar Excel. Veja console.');
  } finally {
    setLoading(false);
  }
};

// ----------------------------------------------
// 📗 EXPORTAR CSV
// ----------------------------------------------
const exportarCSV = async () => {
  setLoading(true);
  try {
    const dados = await gerarRelatorio();
    if (!dados) return;

    let csv = '';

    // Seção Resumo
    csv += 'Resumo Geral\n';
    csv += `Total Cargas,${dados.total_cargas}\n`;
    csv += `Total Valor Frete,${formatCurrency(dados.total_valor_frete)}\n`;
    csv += `Média Valor Frete,${formatCurrency(dados.media_valor_frete)}\n`;
    csv += `Min Valor Frete,${formatCurrency(dados.min_valor_frete)}\n`;
    csv += `Max Valor Frete,${formatCurrency(dados.max_valor_frete)}\n\n`;

    // Ocorrências
    csv += 'Ocorrências por Tipo\nTipo,Qtd\n';
    Object.entries(dados.ocorrencias_por_tipo || {}).forEach(([k, v]) => (csv += `${k},${v}\n`));
    csv += '\nOcorrências por Motivo\nMotivo,Qtd\n';
    Object.entries(dados.ocorrencias_por_motivo || {}).forEach(([k, v]) => (csv += `${k},${v}\n`));

    // Status e UFs
    csv += '\nStatus,Qtd\n';
    Object.entries(dados.por_status || {}).forEach(([k, v]) => (csv += `${k},${v}\n`));
    csv += '\nUF Origem,Qtd\n';
    Object.entries(dados.por_uf_origem || {}).forEach(([k, v]) => (csv += `${k},${v}\n`));
    csv += '\nUF Destino,Qtd\n';
    Object.entries(dados.por_uf_destino || {}).forEach(([k, v]) => (csv += `${k},${v}\n`));

    // Criadores
    csv += '\nPor Criador,Qtd\n';
    Object.entries(dados.por_criador || {}).forEach(([k, v]) => (csv += `${k},${v}\n`));
    csv += '\nPor Transportadora,Qtd\n';
    Object.entries(dados.por_criador_transportadora || {}).forEach(([k, v]) => (csv += `${k},${v}\n`));
    csv += '\nPor Filial,Qtd\n';
    Object.entries(dados.por_criador_filial || {}).forEach(([k, v]) => (csv += `${k},${v}\n`));

    // Rotas e Cargas
    csv += '\nTop Rotas\nRota,Qtd\n';
    (dados.top_rotas || []).forEach((r) => (csv += `${r.rota},${r.qtd}\n`));
    csv += '\nCargas Detalhadas\n';
    csv += XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dados.cargas || []));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio_cargas_corporativo.csv';
    link.click();
  } catch (err) {
    console.error('Erro exportarCSV:', err);
    alert('Erro ao exportar CSV. Veja console.');
  } finally {
    setLoading(false);
  }
};

// ----------------------------------------------
// 📕 EXPORTAR PDF
// ----------------------------------------------
const exportarPDF = async () => {
  setLoading(true);
  try {
    const dados = await gerarRelatorio();
    if (!dados) return;

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(18);
    doc.text('Relatório de Cargas - Visão Completa', 14, 14);

    let cursorY = 22;

    // --- Seção: Resumo
    const resumo = [
      ['Total Cargas', String(dados.total_cargas ?? '')],
      ['Total Valor Frete', formatCurrency(dados.total_valor_frete)],
      ['Média Valor Frete', formatCurrency(dados.media_valor_frete)],
      ['Min Valor Frete', formatCurrency(dados.min_valor_frete)],
      ['Max Valor Frete', formatCurrency(dados.max_valor_frete)],
      ['Cargas com Ocorrências', String(dados.cargas_com_ocorrencias ?? '')],
      ['Cargas sem Ocorrências', String(dados.cargas_sem_ocorrencias ?? '')],
    ];
    autoTable(doc, {
      startY: cursorY,
      head: [['Indicador', 'Valor']],
      body: resumo,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 90, 60] },
    });
    cursorY = doc.lastAutoTable.finalY + 8;

    // --- Seção: Ocorrências
    const ocTipoBody = Object.entries(dados.ocorrencias_por_tipo || {}).map(([k, v]) => [k, String(v)]);
    autoTable(doc, { startY: cursorY, head: [['Tipo de Ocorrência', 'Qtd']], body: ocTipoBody.length ? ocTipoBody : [['Nenhum dado', '']] });
    cursorY = doc.lastAutoTable.finalY + 6;

    const ocMotBody = Object.entries(dados.ocorrencias_por_motivo || {}).map(([k, v]) => [k, String(v)]);
    autoTable(doc, { startY: cursorY, head: [['Motivo de Ocorrência', 'Qtd']], body: ocMotBody.length ? ocMotBody : [['Nenhum dado', '']] });
    cursorY = doc.lastAutoTable.finalY + 6;

    // --- Seção: Status, Criadores, Rotas
    const statusBody = Object.entries(dados.por_status || {}).map(([k, v]) => [k, String(v)]);
    autoTable(doc, { startY: cursorY, head: [['Status', 'Qtd']], body: statusBody.length ? statusBody : [['Nenhum dado', '']] });
    cursorY = doc.lastAutoTable.finalY + 6;

    const criadores = Object.entries(dados.por_criador || {}).map(([k, v]) => [k, v]);
    autoTable(doc, { startY: cursorY, head: [['Criador', 'Qtd']], body: criadores.length ? criadores : [['Nenhum dado', '']] });
    cursorY = doc.lastAutoTable.finalY + 6;

    const rotas = (dados.top_rotas || []).map((r) => [r.rota ?? '', String(r.qtd ?? '')]);
    autoTable(doc, { startY: cursorY, head: [['Rota', 'Qtd']], body: rotas.length ? rotas : [['Nenhum dado', '']] });
    cursorY = doc.lastAutoTable.finalY + 6;

    // --- Seção: Detalhes das Cargas
    const cargasDetalhadas = Array.isArray(dados.cargas) ? dados.cargas : [];
    const cargasTableBody = cargasDetalhadas.map((c) => [
      c.id ?? '',
      c.data_carregamento ?? '',
      `${c.cidade_origem ?? ''}/${c.uf_origem ?? ''}`,
      `${c.cidade_destino ?? ''}/${c.uf_destino ?? ''}`,
      formatCurrency(c.valor_frete),
      c.status ?? '',
    ]);
    autoTable(doc, {
      startY: cursorY,
      head: [['ID', 'Data', 'Origem', 'Destino', 'Valor Frete', 'Status']],
      body: cargasTableBody.length ? cargasTableBody : [['Nenhum dado', '', '', '', '', '']],
      styles: { fontSize: 8 },
      theme: 'grid',
    });

    doc.save('relatorio_cargas_corporativo.pdf');
  } catch (err) {
    console.error('Erro exportarPDF:', err);
    alert('Erro ao exportar PDF. Veja console.');
  } finally {
    setLoading(false);
  }
};


  // --- callback "Gerar"
  const handleConfirmGerar = () => {
    const params = buildParamsFromFiltroLocal();
    onGerar?.(params);
    onClose?.();
  };

  // --- render principal
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-zinc-900 text-gray-200 rounded-2xl shadow-2xl w-11/12 max-w-2xl p-6 flex flex-col gap-5 border border-zinc-700 relative"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <FaChartBar className="text-green-500" /> Relatório de Cargas
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-red-400 text-lg transition"
              >
                ✕
              </button>
            </div>

            {statusMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-emerald-400 bg-emerald-900/30 border border-emerald-700 rounded-md px-3 py-1 text-center"
              >
                {statusMsg}
              </motion.div>
            )}

            <RelatorioFilters
              filtroLocal={filtroLocal}
              setFiltroLocal={setFiltroLocal}
              estados={estados}
              cidadesOrigem={cidadesOrigem}
              cidadesDestino={cidadesDestino}
              tipos={tipos}
              motivos={filteredMotivos}
              creators={creators}
              transportadoras={transportadoras}
              filiais={filiais}
            />

            <RelatorioActions
              onGerar={handleConfirmGerar}
              exportarPDF={exportarPDF}
              exportarExcel={exportarExcel}
              exportarCSV={exportarCSV}
              loading={loading}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
