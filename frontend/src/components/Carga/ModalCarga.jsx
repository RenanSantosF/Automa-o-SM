import { useState, useEffect } from 'react';
import { MdClose, MdDelete, MdEdit } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function ModalCarga({ cargaInicial = null, onClose, onSucesso }) {
  // começar em edição quando não há cargaInicial (ou seja, criando)
  const [formData, setFormData] = useState({
    data_carregamento: '',
    uf_origem: '',
    cidade_origem: '',
    uf_destino: '',
    cidade_destino: '',
    rota: '',
    valor_frete: '',
    status: 'em_rota',
    observacao_cliente: '',
  });

  const [ocorrencias, setOcorrencias] = useState([]);
  const [novaOcorrencia, setNovaOcorrencia] = useState({
    tipo_id: '',
    motivo_id: '',
    observacao: '',
  });
  const [editingOcIndex, setEditingOcIndex] = useState(null); // index quando editando uma ocorrência existente
  const [tipos, setTipos] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [ufs, setUfs] = useState([]);
  const [cidadesOrigem, setCidadesOrigem] = useState([]);
  const [cidadesDestino, setCidadesDestino] = useState([]);
  const [loading, setLoading] = useState(true);
// começar em edição quando não há cargaInicial (ou seja, criando)
const [isEditing, setIsEditing] = useState(() => (cargaInicial ? false : true));

// caso o prop cargaInicial mude enquanto o modal está aberto, sincroniza o modo
useEffect(() => {
  setIsEditing(cargaInicial ? false : true);
}, [cargaInicial]);

  const api = axios.create({
    baseURL: 'http://localhost:8000/api/gestor-cargas',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  // carregar tipos/motivos/ufs e popular form se houver cargaInicial
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [tiposRes, motivosRes] = await Promise.all([api.get('/tipos'), api.get('/motivos')]);
        setTipos(tiposRes.data || []);
        setMotivos(motivosRes.data || []);

        const resUfs = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        const siglas = resUfs.data.map((u) => u.sigla).sort();
        setUfs(siglas);

        if (cargaInicial) {
          setFormData({
            data_carregamento: cargaInicial.data_carregamento || '',
            uf_origem: cargaInicial.uf_origem || '',
            cidade_origem: cargaInicial.cidade_origem || '',
            uf_destino: cargaInicial.uf_destino || '',
            cidade_destino: cargaInicial.cidade_destino || '',
            rota: cargaInicial.rota || '',
            valor_frete: cargaInicial.valor_frete || '',
            status: cargaInicial.status || 'em_rota',
            observacao_cliente: cargaInicial.observacao_cliente || '',
          });

          setOcorrencias(
            (cargaInicial.ocorrencias || []).map((oc) => ({
              id: oc.id != null ? Number(oc.id) : undefined,
              tipo_id: oc.tipo?.id ?? oc.tipo_id ?? '',
              motivo_id: oc.motivo?.id ?? oc.motivo_id ?? '',
              observacao: oc.observacao ?? '',
            }))
          );
        }
      } catch (err) {
        console.error('Erro ao buscar dados iniciais', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [cargaInicial]);

  // carregar cidades quando muda UF origem/destino
  useEffect(() => {
    if (!formData.uf_origem) {
      setCidadesOrigem([]);
      setFormData((p) => ({ ...p, cidade_origem: '' }));
      return;
    }
    axios
      .get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.uf_origem}/municipios`)
      .then((r) => setCidadesOrigem(r.data.map((c) => c.nome).sort()))
      .catch((e) => console.error('Erro cidades origem', e));
  }, [formData.uf_origem]);

  useEffect(() => {
    if (!formData.uf_destino) {
      setCidadesDestino([]);
      setFormData((p) => ({ ...p, cidade_destino: '' }));
      return;
    }
    axios
      .get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.uf_destino}/municipios`)
      .then((r) => setCidadesDestino(r.data.map((c) => c.nome).sort()))
      .catch((e) => console.error('Erro cidades destino', e));
  }, [formData.uf_destino]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNovaOcorrenciaChange = (e) => {
    const { name, value } = e.target;
    setNovaOcorrencia((prev) => ({ ...prev, [name]: value }));
  };

  // adicionar ou salvar edição de ocorrência localmente
  const handleAddOrSaveOcorrencia = () => {
    if (!novaOcorrencia.tipo_id || !novaOcorrencia.motivo_id || !novaOcorrencia.observacao.trim()) return;

    const normalizedKey = `${novaOcorrencia.tipo_id}|${novaOcorrencia.motivo_id}|${novaOcorrencia.observacao.trim()}`;

    // dedupe simples: evitar duplicar a mesma assinatura
    const alreadyIndex = ocorrencias.findIndex(
      (o, i) =>
        `${o.tipo_id}|${o.motivo_id}|${(o.observacao || '').trim()}` === normalizedKey &&
        (editingOcIndex === null || editingOcIndex !== i)
    );
    if (alreadyIndex !== -1) {
      // já tem igual (e não é o que estamos editando) -> apenas limpa e retorna
      setNovaOcorrencia({ tipo_id: '', motivo_id: '', observacao: '' });
      setEditingOcIndex(null);
      return;
    }

    if (editingOcIndex !== null && ocorrencias[editingOcIndex]) {
      // atualizar ocorrência existente no array
      setOcorrencias((prev) => {
        const clone = [...prev];
        clone[editingOcIndex] = {
          ...clone[editingOcIndex],
          tipo_id: novaOcorrencia.tipo_id,
          motivo_id: novaOcorrencia.motivo_id,
          observacao: novaOcorrencia.observacao,
        };
        return clone;
      });
      setEditingOcIndex(null);
    } else {
      // nova ocorrência
      setOcorrencias((prev) => [...prev, { ...novaOcorrencia, id: null }]);
    }
    setNovaOcorrencia({ tipo_id: '', motivo_id: '', observacao: '' });
  };

  // editar ocorrência inline (popula inputs)
  const startEditOcorrencia = (idx) => {
    if (!isEditing) return;
    const oc = ocorrencias[idx];
    setNovaOcorrencia({
      tipo_id: oc.tipo_id ?? '',
      motivo_id: oc.motivo_id ?? '',
      observacao: oc.observacao ?? '',
    });
    setEditingOcIndex(idx);
  };

  // remover ocorrência local (e no backend se tiver id)
  const handleRemoveOcorrencia = async (idx) => {
    const oc = ocorrencias[idx];
    if (oc?.id) {
      try {
        await api.delete(`/ocorrencias/${oc.id}`);
      } catch (err) {
        console.error('Erro ao deletar ocorrência:', err);
        alert('Erro ao deletar ocorrência (veja console).');
        return;
      }
    }
    setOcorrencias((prev) => prev.filter((_, i) => i !== idx));
    // se estávamos editando esse index, limpar
    if (editingOcIndex === idx) {
      setNovaOcorrencia({ tipo_id: '', motivo_id: '', observacao: '' });
      setEditingOcIndex(null);
    }
  };

  // deletar carga inteira
  const handleDeleteCarga = async () => {
    if (!cargaInicial?.id) return;
    const ok = window.confirm('Confirmar exclusão desta carga? Esta ação não pode ser desfeita.');
    if (!ok) return;
    try {
      await api.delete(`/cargas/${cargaInicial.id}`);
      if (onSucesso) onSucesso();
      onClose();
    } catch (err) {
      console.error('Erro ao deletar carga:', err);
      alert('Erro ao deletar carga. Veja o console.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.uf_origem ||
      !formData.cidade_origem ||
      !formData.uf_destino ||
      !formData.cidade_destino ||
      !formData.rota ||
      !formData.data_carregamento
    ) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    // dedupe no frontend por assinatura
    const seen = new Set();
    const deduped = [];
    for (const oc of ocorrencias) {
      const key = `${oc.tipo_id}|${oc.motivo_id}|${(oc.observacao || '').trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(oc);
      }
    }

    const ocorrenciasPayload = deduped.map((oc) => {
      const base = {
        tipo_id: Number(oc.tipo_id),
        motivo_id: Number(oc.motivo_id),
        observacao: oc.observacao,
      };
      return oc.id ? { id: Number(oc.id), ...base } : base;
    });

    const payload = {
      ...formData,
      valor_frete: parseFloat(formData.valor_frete) || 0,
      ocorrencias: ocorrenciasPayload,
    };

    try {
      if (cargaInicial?.id) await api.put(`/cargas/${cargaInicial.id}`, payload);
      else await api.post('/cargas', payload);
      if (onSucesso) onSucesso();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar carga:', err);
      alert('Erro ao salvar carga. Veja o console para detalhes.');
    }
  };

  const motivosFiltrados = novaOcorrencia.tipo_id
    ? motivos.filter((m) => m.tipo_id === Number(novaOcorrencia.tipo_id))
    : [];

  if (loading) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="fixed inset-0 bg-black/40" onClick={() => { if (!isEditing) onClose(); }} />

        <motion.form
          onSubmit={handleSubmit}
          className="relative bg-white p-6 rounded-md shadow-2xl w-11/12 max-w-3xl flex flex-col gap-4 z-50 max-h-[95vh] overflow-y-auto"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Header: Close / Title / Edit / Delete */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-800">
                {cargaInicial ? 'Detalhes da Carga' : 'Nova Carga'}
              </h2>
              {cargaInicial && (
                <span className="text-sm text-gray-500">#{cargaInicial.id}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {cargaInicial && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing((s) => !s)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm  text-white  rounded-sm border ${isEditing ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-green-300 border-green-400 hover:bg-green-400'}`}
                  >
                    <MdEdit size={18} />
                    {isEditing ? 'Editando' : 'Editar'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteCarga}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  >
                    <MdDelete size={18} />
                    Deletar
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    const ok = window.confirm('Sair sem salvar? Alterações serão perdidas.');
                    if (!ok) return;
                    setIsEditing(false);
                  } else {
                    onClose();
                  }
                }}
                className="p-1.5 rounded-sm text-gray-600 hover:text-gray-900"
                aria-label="Fechar"
              >
                <MdClose size={22} />
              </button>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="date"
              name="data_carregamento"
              value={formData.data_carregamento}
              onChange={handleChange}
              disabled={!isEditing}
              className={`h-9 px-3 border ${isEditing ? 'border-gray-300' : 'border-transparent'} rounded-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-300`}
              required
            />

            <select
              name="uf_origem"
              value={formData.uf_origem}
              onChange={handleChange}
              disabled={!isEditing}
              className="h-9 px-3 border rounded-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-300"
              required
            >
              <option value="">UF Origem</option>
              {ufs.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>

            <select
              name="cidade_origem"
              value={formData.cidade_origem}
              onChange={handleChange}
              disabled={!isEditing || !formData.uf_origem}
              className="h-9 px-3 border rounded-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-300"
              required
            >
              <option value="">Cidade Origem</option>
              {cidadesOrigem.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              name="uf_destino"
              value={formData.uf_destino}
              onChange={handleChange}
              disabled={!isEditing}
              className="h-9 px-3 border rounded-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-300"
              required
            >
              <option value="">UF Destino</option>
              {ufs.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>

            <select
              name="cidade_destino"
              value={formData.cidade_destino}
              onChange={handleChange}
              disabled={!isEditing || !formData.uf_destino}
              className="h-9 px-3 border rounded-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-300"
              required
            >
              <option value="">Cidade Destino</option>
              {cidadesDestino.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="rota"
              placeholder="Rota"
              value={formData.rota}
              onChange={handleChange}
              disabled={!isEditing}
              className="h-9 px-3 border rounded-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-300"
              required
            />

            <input
              type="number"
              step="0.01"
              name="valor_frete"
              placeholder="Valor do frete"
              value={formData.valor_frete}
              onChange={handleChange}
              disabled={!isEditing}
              className="h-9 px-3 border rounded-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-300"
              required
            />

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={!isEditing}
              className="h-9 px-3 border rounded-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-300"
            >
              <option value="em_rota">Em Rota</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <textarea
            name="observacao_cliente"
            placeholder="Observação do cliente"
            value={formData.observacao_cliente}
            onChange={handleChange}
            disabled={!isEditing}
            className="px-3 py-2 border rounded-sm w-full text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-300"
            rows={4}
          />

          {/* Ocorrências */}
          <div className="mt-3 border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Ocorrências</h3>
              <div className="text-sm text-gray-500">{ocorrencias.length} itens</div>
            </div>

            <div className="flex flex-col gap-2">
              {ocorrencias.length === 0 && (
                <div className="text-sm text-gray-500">Nenhuma ocorrência adicionada.</div>
              )}

              {ocorrencias.map((oc, idx) => {
                const motivo = motivos.find((m) => Number(m.id) === Number(oc.motivo_id));
                const tipo = tipos.find((t) => Number(t.id) === Number(oc.tipo_id)) || motivo?.tipo;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 border-l-4 border-green-400 rounded-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {tipo?.nome || 'Tipo desconhecido'} — <span className="font-normal text-gray-600">{motivo?.nome || 'Motivo'}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1 truncate">{oc.observacao}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditOcorrencia(idx)}
                        disabled={!isEditing}
                        title="Editar ocorrência"
                        className={`p-1.5 rounded-sm ${isEditing ? 'hover:bg-gray-100' : 'opacity-40 cursor-not-allowed'}`}
                      >
                        <MdEdit size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveOcorrencia(idx)}
                        disabled={!isEditing}
                        title="Remover ocorrência"
                        className={`p-1.5 rounded-sm ${isEditing ? 'hover:bg-red-50 text-red-600' : 'opacity-40 cursor-not-allowed'}`}
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controls para adicionar/editar ocorrência */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <select
                name="tipo_id"
                value={novaOcorrencia.tipo_id}
                onChange={handleNovaOcorrenciaChange}
                disabled={!isEditing}
                className="h-9 px-3 border rounded-sm text-gray-800 focus:outline-none"
              >
                <option value="">Tipo</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>

              <select
                name="motivo_id"
                value={novaOcorrencia.motivo_id}
                onChange={handleNovaOcorrenciaChange}
                disabled={!isEditing || !novaOcorrencia.tipo_id}
                className="h-9 px-3 border rounded-sm text-gray-800 focus:outline-none"
              >
                <option value="">Motivo</option>
                {motivosFiltrados.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="observacao"
                placeholder="Observação"
                value={novaOcorrencia.observacao}
                onChange={handleNovaOcorrenciaChange}
                disabled={!isEditing}
                className="h-9 px-3 border rounded-sm text-gray-800 focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddOrSaveOcorrencia}
                  disabled={!isEditing}
                  className={`w-full h-9 rounded-sm text-white font-medium transition ${isEditing ? 'bg-gradient-to-r from-green-500 to-green-600 shadow' : 'opacity-50 cursor-not-allowed'}`}
                >
                  {editingOcIndex !== null ? 'Salvar ocorrência' : 'Adicionar ocorrência'}
                </button>
              </div>
            </div>
          </div>

          {/* Actions footer */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  const ok = window.confirm('Deseja cancelar a edição e sair? Alterações locais serão perdidas.');
                  if (!ok) return;
                  setIsEditing(false);
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              {isEditing ? 'Cancelar edição' : 'Fechar'}
            </button>

            <button
              type="submit"
              disabled={!isEditing}
              className={`px-6 py-2 bg-gray-500 rounded-sm font-semibold text-white transition ${isEditing ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg hover:scale-[1.01]' : 'opacity-50 cursor-not-allowed'}`}
            >
              Salvar
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
