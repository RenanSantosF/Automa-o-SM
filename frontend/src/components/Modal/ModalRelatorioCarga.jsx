import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FaFilePdf, FaFileExcel, FaFileCsv, FaChartBar } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const apiBase = `${import.meta.env.VITE_API_URL}/gestor-cargas/`;

export default function ModalRelatorio({ isOpen, onClose, filtro, onGerar }) {
  // estado local do filtro (não altera o pai até o usuário confirmar)
  const [filtroLocal, setFiltroLocal] = useState(filtro || {});
  const [tipos, setTipos] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [filteredMotivos, setFilteredMotivos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidadesOrigem, setCidadesOrigem] = useState([]);
  const [cidadesDestino, setCidadesDestino] = useState([]);
  const [loading, setLoading] = useState(false);

  // sincroniza ao abrir / quando pai muda
  useEffect(() => {
    if (isOpen) setFiltroLocal(filtro || {});
  }, [isOpen, filtro]);

  const api = axios.create({
    baseURL: apiBase,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  // util: extrai tipo_id de um motivo (vários formatos possíveis)
  const getMotivoTipoId = (mot) =>
    mot?.tipo_id ?? mot?.tipoId ?? mot?.tipo?.id ?? mot?.tipo?.tipo_id ?? null;

  // carrega tipos e motivos do backend quando modal abrir
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [tiposRes, motivosRes] = await Promise.all([api.get('/tipos'), api.get('/motivos')]);
        const tiposData = Array.isArray(tiposRes.data) ? tiposRes.data : tiposRes.data?.tipos || [];
        const motivosData = Array.isArray(motivosRes.data) ? motivosRes.data : motivosRes.data?.motivos || [];
        setTipos(tiposData);
        setMotivos(motivosData);
      } catch (err) {
        console.error('Erro ao carregar tipos/motivos:', err);
      }
    })();
  }, [isOpen]);

  // carrega UFs IBGE
  useEffect(() => {
    axios
      .get('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then((res) => setEstados(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch((err) => console.error('Erro ao carregar estados IBGE:', err));
  }, []);

  // carregar cidades origem quando uf_origem local mudar
  useEffect(() => {
    const uf = filtroLocal?.uf_origem;
    if (!uf) {
      setCidadesOrigem([]);
      // limpa cidade local (não altera o pai ainda)
      setFiltroLocal((prev) => ({ ...prev, cidade_origem: '' }));
      return;
    }
    axios
      .get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      .then((res) => setCidadesOrigem(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch((err) => console.error('Erro ao carregar cidades origem IBGE:', err));
  }, [filtroLocal?.uf_origem]);

  // carregar cidades destino quando uf_destino local mudar
  useEffect(() => {
    const uf = filtroLocal?.uf_destino;
    if (!uf) {
      setCidadesDestino([]);
      setFiltroLocal((prev) => ({ ...prev, cidade_destino: '' }));
      return;
    }
    axios
      .get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      .then((res) => setCidadesDestino(res.data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch((err) => console.error('Erro ao carregar cidades destino IBGE:', err));
  }, [filtroLocal?.uf_destino]);

  // quando motivos ou tipo mudarem, filtra motivos relevantes
  useEffect(() => {
    const tipoSelecionado = filtroLocal?.tipo_ocorrencia;
    if (!tipoSelecionado) {
      // sem tipo, mostramos todos (opção: trocar para [] se quiser bloquear)
      setFilteredMotivos(motivos);
      return;
    }
    const fm = motivos.filter((m) => String(getMotivoTipoId(m)) === String(tipoSelecionado));
    setFilteredMotivos(fm);
    // remove motivo inválido se necessário
    if (filtroLocal.motivo_ocorrencia && !fm.some((m) => String(m.id) === String(filtroLocal.motivo_ocorrencia))) {
      setFiltroLocal((prev) => ({ ...prev, motivo_ocorrencia: '' }));
    }
  }, [motivos, filtroLocal?.tipo_ocorrencia]);

  // monta params prontos para enviar ao backend /estatisticas
  const buildParamsFromFiltroLocal = () => {
    // comece copiando
    const copy = { ...filtroLocal };

    // regras: se não houver uf correspondente, não envie a cidade
    if (!copy.uf_origem) delete copy.cidade_origem;
    if (!copy.uf_destino) delete copy.cidade_destino;

    // converte nome de campos para os esperados pelo backend
    const params = {};

    // campos diretos pass-through
    ['uf_origem', 'cidade_origem', 'uf_destino', 'cidade_destino', 'rota', 'data_inicio', 'data_fim', 'skip', 'limit'].forEach((k) => {
      if (copy[k] !== undefined && copy[k] !== '' && copy[k] !== null) params[k] = copy[k];
    });

    // tipo/motivo -> backend espera tipo_ocorrencia_id e motivo_ocorrencia_id
    if (copy.tipo_ocorrencia !== undefined && copy.tipo_ocorrencia !== '' && copy.tipo_ocorrencia !== null) {
      const maybeNum = Number(copy.tipo_ocorrencia);
      params['tipo_ocorrencia_id'] = Number.isNaN(maybeNum) ? copy.tipo_ocorrencia : maybeNum;
    }
    if (copy.motivo_ocorrencia !== undefined && copy.motivo_ocorrencia !== '' && copy.motivo_ocorrencia !== null) {
      const maybeNum = Number(copy.motivo_ocorrencia);
      params['motivo_ocorrencia_id'] = Number.isNaN(maybeNum) ? copy.motivo_ocorrencia : maybeNum;
    }

    return params;
  };

  // função que chama /estatisticas e retorna dados (usada por gerar/export)
  const gerarRelatorio = async () => {
    setLoading(true);
    try {
      const params = buildParamsFromFiltroLocal();
      console.log('ModalRelatorio: chamando /estatisticas com params ->', params);
      const res = await api.get('/estatisticas', { params });
      console.log('Relatório retornado:', res.data);
      return res.data || {};
    } catch (err) {
      console.error('Erro ao gerar relatório:', err?.response?.data || err);
      alert('Erro ao gerar relatório. Veja console para detalhes.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ---------- export functions (mantive seu comportamento original) ----------
  const objEntriesToAoA = (obj = {}) => Object.entries(obj).map(([k, v]) => [String(k), String(v)]);

  const exportarExcel = async () => {
    setLoading(true);
    try {
      const dados = await gerarRelatorio();
      if (!dados) return;

      const wb = XLSX.utils.book_new();
      const resumoAoA = [
        ['Chave', 'Valor'],
        ['Total Cargas', dados.total_cargas ?? ''],
        ['Total Valor Frete', dados.total_valor_frete ?? ''],
        ['Média Valor Frete', dados.media_valor_frete ?? ''],
        ['Min Valor Frete', dados.min_valor_frete ?? ''],
        ['Max Valor Frete', dados.max_valor_frete ?? ''],
        ['Cargas com ocorrências', dados.cargas_com_ocorrencias ?? ''],
        ['Cargas sem ocorrências', dados.cargas_sem_ocorrencias ?? ''],
        ['Ocorrências totais', dados.ocorrencias_totais ?? ''],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoAoA), 'Resumo');

      const ocTipoAoA = [['Tipo', 'Qtd'], ...objEntriesToAoA(dados.ocorrencias_por_tipo)];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ocTipoAoA.length > 1 ? ocTipoAoA : [['Nenhum dado', '']]), 'Ocorrencias_por_tipo');

      const ocMotAoA = [['Motivo', 'Qtd'], ...objEntriesToAoA(dados.ocorrencias_por_motivo)];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ocMotAoA.length > 1 ? ocMotAoA : [['Nenhum dado', '']]), 'Ocorrencias_por_motivo');

      const statusAoA = [['Status', 'Qtd'], ...objEntriesToAoA(dados.por_status)];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statusAoA.length > 1 ? statusAoA : [['Nenhum dado', '']]), 'Por_Status');

      const ufOrigAoA = [['UF Origem', 'Qtd'], ...objEntriesToAoA(dados.por_uf_origem)];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ufOrigAoA.length > 1 ? ufOrigAoA : [['Nenhum dado', '']]), 'Por_UF_Origem');

      const ufDestAoA = [['UF Destino', 'Qtd'], ...objEntriesToAoA(dados.por_uf_destino)];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ufDestAoA.length > 1 ? ufDestAoA : [['Nenhum dado', '']]), 'Por_UF_Destino');

      const topRotasAoA = [['Rota', 'Qtd'], ...(Array.isArray(dados.top_rotas) ? dados.top_rotas.map((r) => [r.rota || '', r.qtd ?? '']) : [])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topRotasAoA.length > 1 ? topRotasAoA : [['Nenhum dado', '']]), 'Top_Rotas');

      const topCargasAoA = [
        ['ID', 'Data', 'Valor Frete', 'UF Origem', 'Cidade Origem', 'UF Destino', 'Cidade Destino'],
        ...(Array.isArray(dados.top_cargas_por_valor) ? dados.top_cargas_por_valor.map((c) => [
          c.id ?? '', c.data_carregamento ?? '', c.valor_frete ?? '', c.uf_origem ?? '', c.cidade_origem ?? '', c.uf_destino ?? '', c.cidade_destino ?? ''
        ]) : []),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topCargasAoA.length > 1 ? topCargasAoA : [['Nenhum dado', '']]), 'Top_Cargas');

      const cargas = Array.isArray(dados.cargas) ? dados.cargas : [];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cargas), 'Cargas_Detalhadas');

      XLSX.writeFile(wb, 'relatorio_cargas_completo.xlsx');
    } catch (err) {
      console.error('Erro exportarExcel:', err);
      alert('Erro ao exportar Excel. Veja console.');
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = async () => {
    setLoading(true);
    try {
      const dados = await gerarRelatorio();
      if (!dados) return;

      let csv = '';
      csv += 'Resumo\n';
      csv += `Total Cargas,${dados.total_cargas ?? ''}\n`;
      csv += `Total Valor Frete,${dados.total_valor_frete ?? ''}\n`;
      csv += `Media Valor Frete,${dados.media_valor_frete ?? ''}\n`;
      csv += `Min Valor Frete,${dados.min_valor_frete ?? ''}\n`;
      csv += `Max Valor Frete,${dados.max_valor_frete ?? ''}\n`;
      csv += `Cargas com ocorrencias,${dados.cargas_com_ocorrencias ?? ''}\n`;
      csv += `Cargas sem ocorrencias,${dados.cargas_sem_ocorrencias ?? ''}\n\n`;

      csv += 'Ocorrencias por Tipo\nTipo,Qtd\n';
      Object.entries(dados.ocorrencias_por_tipo || {}).forEach(([k, v]) => { csv += `${k},${v}\n`; });
      csv += '\n';

      csv += 'Ocorrencias por Motivo\nMotivo,Qtd\n';
      Object.entries(dados.ocorrencias_por_motivo || {}).forEach(([k, v]) => { csv += `${k},${v}\n`; });
      csv += '\n';

      csv += 'Cargas Detalhadas\n';
      const cargasCsv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dados.cargas || []));
      csv += cargasCsv;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'relatorio_cargas_completo.csv';
      link.click();
    } catch (err) {
      console.error('Erro exportarCSV:', err);
      alert('Erro ao exportar CSV. Veja console.');
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = async () => {
    setLoading(true);
    try {
      const dados = await gerarRelatorio();
      if (!dados) return;

      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(18);
      doc.text('Relatório de Cargas', 14, 14);

      let cursorY = 22;
      doc.setFontSize(11);
      const resumo = [
        ['Total de cargas', String(dados.total_cargas ?? '')],
        ['Total valor frete', String(dados.total_valor_frete ?? '')],
        ['Média valor frete', String(dados.media_valor_frete ?? '')],
        ['Min valor frete', String(dados.min_valor_frete ?? '')],
        ['Max valor frete', String(dados.max_valor_frete ?? '')],
        ['Cargas com ocorrências', String(dados.cargas_com_ocorrencias ?? '')],
        ['Cargas sem ocorrências', String(dados.cargas_sem_ocorrencias ?? '')],
        ['Ocorrências totais', String(dados.ocorrencias_totais ?? '')],
      ];
      autoTable(doc, { startY: cursorY, theme: 'plain', head: [['Chave', 'Valor']], body: resumo, styles: { fontSize: 10 }, headStyles: { fillColor: [44, 62, 80] } });
      cursorY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : cursorY + 40;

      const ocTipoBody = Object.entries(dados.ocorrencias_por_tipo || {}).map(([k, v]) => [k, String(v)]);
      autoTable(doc, { startY: cursorY, head: [['Ocorrência (Tipo)', 'Qtd']], body: ocTipoBody.length ? ocTipoBody : [['Nenhum dado', '']], styles: { fontSize: 9 } });
      cursorY = doc.lastAutoTable.finalY + 6;

      const ocMotBody = Object.entries(dados.ocorrencias_por_motivo || {}).map(([k, v]) => [k, String(v)]);
      autoTable(doc, { startY: cursorY, head: [['Ocorrência (Motivo)', 'Qtd']], body: ocMotBody.length ? ocMotBody : [['Nenhum dado', '']], styles: { fontSize: 9 } });
      cursorY = doc.lastAutoTable.finalY + 6;

      const statusBody = Object.entries(dados.por_status || {}).map(([k, v]) => [k, String(v)]);
      autoTable(doc, { startY: cursorY, head: [['Status', 'Qtd']], body: statusBody.length ? statusBody : [['Nenhum dado', '']], styles: { fontSize: 9 } });
      cursorY = doc.lastAutoTable.finalY + 6;

      const topRotasBody = Array.isArray(dados.top_rotas) ? dados.top_rotas.map((r) => [r.rota ?? '', String(r.qtd ?? '')]) : [];
      autoTable(doc, { startY: cursorY, head: [['Rota', 'Qtd']], body: topRotasBody.length ? topRotasBody : [['Nenhum dado', '']], styles: { fontSize: 9 } });
      cursorY = doc.lastAutoTable.finalY + 6;

      const cargasDetalhadas = Array.isArray(dados.cargas) ? dados.cargas : [];
      const cargasTableBody = cargasDetalhadas.map((c) => [
        c.id ?? '', c.data_carregamento ?? '', c.uf_origem ?? '', c.cidade_origem ?? '', c.uf_destino ?? '', c.cidade_destino ?? '',
        c.valor_frete != null ? Number(c.valor_frete).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '', c.status ?? ''
      ]);
      autoTable(doc, { startY: cursorY, head: [['ID','Data','UF Origem','Cidade Origem','UF Destino','Cidade Destino','Valor Frete','Status']], body: cargasTableBody.length ? cargasTableBody : [['Nenhum dado','','','','','','','']], styles: { fontSize: 8 }, theme: 'grid', margin: { left: 8, right: 8 } });

      doc.save('relatorio_cargas_completo.pdf');
    } catch (err) {
      console.error('Erro exportarPDF:', err);
      alert('Erro ao exportar PDF. Veja console.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- render ----------
  // Ao confirmar, enviamos o filtro *mapeado* para o pai (com as chaves que o backend espera)
  const handleConfirmGerar = () => {
    const params = buildParamsFromFiltroLocal();
    // envia para o pai (o pai atualiza seu filtro/estado conforme quiser)
    onGerar?.(params);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.25 }} className="bg-zinc-900 text-gray-200 rounded-2xl shadow-2xl w-11/12 max-w-lg p-6 flex flex-col gap-4 border border-zinc-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2"><FaChartBar className="text-green-500" /> Relatório de Cargas</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-lg transition">✕</button>
            </div>

            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2">
                <select value={filtroLocal.uf_origem || ''} onChange={(e) => setFiltroLocal((p) => ({ ...p, uf_origem: e.target.value }))} className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option value="">UF Origem</option>
                  {estados.map((uf) => (<option key={uf.id} value={uf.sigla}>{uf.sigla}</option>))}
                </select>

                <select value={filtroLocal.cidade_origem || ''} onChange={(e) => setFiltroLocal((p) => ({ ...p, cidade_origem: e.target.value }))} disabled={!filtroLocal.uf_origem} className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                  <option value="">Cidade Origem</option>
                  {cidadesOrigem.map((c) => (<option key={c.id} value={c.nome}>{c.nome}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select value={filtroLocal.uf_destino || ''} onChange={(e) => setFiltroLocal((p) => ({ ...p, uf_destino: e.target.value }))} className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option value="">UF Destino</option>
                  {estados.map((uf) => (<option key={uf.id} value={uf.sigla}>{uf.sigla}</option>))}
                </select>

                <select value={filtroLocal.cidade_destino || ''} onChange={(e) => setFiltroLocal((p) => ({ ...p, cidade_destino: e.target.value }))} disabled={!filtroLocal.uf_destino} className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                  <option value="">Cidade Destino</option>
                  {cidadesDestino.map((c) => (<option key={c.id} value={c.nome}>{c.nome}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={filtroLocal.data_inicio || ''} onChange={(e) => setFiltroLocal((p) => ({ ...p, data_inicio: e.target.value }))} className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500" />
                <input type="date" value={filtroLocal.data_fim || ''} onChange={(e) => setFiltroLocal((p) => ({ ...p, data_fim: e.target.value }))} className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500" />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <select value={filtroLocal.tipo_ocorrencia || ''} onChange={(e) => setFiltroLocal((p) => ({ ...p, tipo_ocorrencia: e.target.value }))} className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option value="">Tipo de Ocorrência</option>
                  {tipos.map((t) => (<option key={t.id} value={t.id}>{t.nome}</option>))}
                </select>

                <select value={filtroLocal.motivo_ocorrencia || ''} onChange={(e) => setFiltroLocal((p) => ({ ...p, motivo_ocorrencia: e.target.value }))} disabled={!filteredMotivos.length} className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                  <option value="">Motivo</option>
                  {filteredMotivos.map((m) => (<option key={m.id} value={m.id}>{m.nome}</option>))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={handleConfirmGerar} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition font-medium flex items-center gap-2"><FaChartBar /> Gerar</button>

              <motion.button whileHover={{ scale: 1.05 }} onClick={exportarPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition font-medium" disabled={loading}><FaFilePdf /> PDF</motion.button>

              <motion.button whileHover={{ scale: 1.05 }} onClick={exportarExcel} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition font-medium" disabled={loading}><FaFileExcel /> Excel</motion.button>

              <motion.button whileHover={{ scale: 1.05 }} onClick={exportarCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-medium" disabled={loading}><FaFileCsv /> CSV</motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
