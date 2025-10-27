// CargaForm.jsx
import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import OcorrenciaForm from "../Ocorrencia/OcorrenciaForm";
// REMOVA esta importação: import { useMotivos } from "../../Hooks/useMotivos";

const CargaForm = ({ 
  initialData = null, 
  onSubmit, 
  onClose, 
  tipos = [], 
  motivos = [], 
  listarMotivosPorTipo
}) => {
  const [formData, setFormData] = useState({
    data_carregamento: "",
    origem: "",
    destino: "",
    rota: "",
    valor_frete: 0,
    status: "normal",
    observacao_cliente: "",
  });

  const [ocorrencias, setOcorrencias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOcorrenciaForm, setShowOcorrenciaForm] = useState(false);

  useEffect(() => {
    setIsLoading(false);
    
    if (initialData) {
      console.log('Initial data da carga:', initialData);
      setFormData({
        data_carregamento: initialData.data_carregamento || "",
        origem: initialData.origem || "",
        destino: initialData.destino || "",
        rota: initialData.rota || "",
        valor_frete: initialData.valor_frete || 0,
        status: initialData.status || "normal",
        observacao_cliente: initialData.observacao_cliente || "",
      });
      
      console.log('Ocorrências da carga:', initialData.ocorrencias);
      
      const ocorrenciasFormatadas = initialData.ocorrencias?.map(oc => ({
        id: oc.id,
        tipo_id: oc.tipo?.id || oc.tipo_id || "",
        motivo_id: oc.motivo?.id || oc.motivo_id || "",
        observacao: oc.observacao || ""
      })) || [];
      
      console.log('Ocorrências formatadas:', ocorrenciasFormatadas);
      setOcorrencias(ocorrenciasFormatadas);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "valor_frete" ? parseFloat(value) || 0 : value
    }));
  };

// CargaForm.jsx - Corrija a função handleAddOcorrencia
// CargaForm.jsx - Adicione logs para debug
const handleAddOcorrencia = (data) => {
  console.log('handleAddOcorrencia recebeu:', data);

  if (data.tipo_id && data.motivo_id && data.observacao.trim()) {
    const novaOcorrencia = { ...data, id: null }; // 👈 não gera id fake
    console.log('Adicionando ocorrência:', novaOcorrencia);

    setOcorrencias(prev => {
      const novasOcorrencias = [...prev, novaOcorrencia];
      console.log('Novo array de ocorrências:', novasOcorrencias);
      return novasOcorrencias;
    });

    setShowOcorrenciaForm(false);
  } else {
    console.log('Dados inválidos para ocorrência:', data);
  }
};

  
  const handleUpdateOcorrencia = (id, data) => {
    setOcorrencias(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
  };

  const handleRemoveOcorrencia = (id) => {
    setOcorrencias(prev => prev.filter(o => o.id !== id));
  };

// CargaForm.jsx - Ajuste o handleSubmit
// CargaForm.jsx - Adicione mais logs
const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('Ocorrências no estado:', ocorrencias);
  
  // Filtra apenas ocorrências válidas
  const ocorrenciasValidas = ocorrencias.filter(oc => 
    oc.tipo_id && oc.motivo_id && oc.observacao?.trim()
  );
  
  console.log('Ocorrências válidas:', ocorrenciasValidas);
  
  // Prepare as ocorrências no formato esperado pelo backend
  const ocorrenciasParaEnviar = ocorrenciasValidas.map(oc => ({
    id: oc.id || null, // se já existir, manda o id
    motivo_id: parseInt(oc.motivo_id),
    observacao: oc.observacao
  }));

  
  console.log('Ocorrências para enviar:', ocorrenciasParaEnviar);
  
  // Prepare os dados da carga
  const dadosParaEnviar = {
    data_carregamento: formData.data_carregamento,
    origem: formData.origem,
    destino: formData.destino,
    rota: formData.rota,
    valor_frete: parseFloat(formData.valor_frete) || 0,
    status: formData.status,
    observacao_cliente: formData.observacao_cliente,
    ocorrencias: ocorrenciasParaEnviar
  };
  
  console.log('Dados completos para enviar:', dadosParaEnviar);
  onSubmit(dadosParaEnviar);
};

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />
        <div className="relative bg-[#333] p-8 rounded-2xl shadow-lg text-white z-50">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <motion.div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />

        <form
          onSubmit={handleSubmit}
          onClick={e => e.stopPropagation()}
          className="relative bg-[#333] p-4 rounded-2xl shadow-lg w-full max-w-lg flex flex-col gap-4 text-white z-50 max-h-[90vh] overflow-y-auto"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-300 hover:text-white"
          >
            <MdClose size={26} />
          </button>

          <h2 className="text-xl font-bold mb-2">
            {initialData ? "Editar Carga" : "Nova Carga"}
          </h2>

          <div className="flex flex-wrap gap-2">
            <input type="date" name="data_carregamento" value={formData.data_carregamento} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white flex-1" required />
            <input type="text" name="origem" placeholder="Origem" value={formData.origem} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white flex-1" required />
            <input type="text" name="destino" placeholder="Destino" value={formData.destino} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white flex-1" required />
            <input type="text" name="rota" placeholder="Rota" value={formData.rota} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white flex-1" required />
            <input type="number" step="0.01" name="valor_frete" placeholder="Valor do frete" value={formData.valor_frete} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white flex-1" required />
            <select name="status" value={formData.status} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white flex-1">
              <option value="normal">Normal</option>
              <option value="atrasado">Atrasado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <textarea
            name="observacao_cliente"
            value={formData.observacao_cliente}
            onChange={handleChange}
            placeholder="Observação cliente (opcional)"
            className="p-2 rounded-md bg-gray-700 text-white w-full"
            rows={3}
          />

          <div className="border-t border-gray-600 pt-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Ocorrências (opcional)</h3>
              {!showOcorrenciaForm && (
                <button
                  type="button"
                  onClick={() => setShowOcorrenciaForm(true)}
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  + Adicionar Ocorrência
                </button>
              )}
            </div>

            {ocorrencias.map(o => (
              <OcorrenciaForm
                key={o.id}
                tipos={tipos}
                motivos={motivos}
                initialData={o}
                onSubmit={(data) => handleUpdateOcorrencia(o.id, data)}
                onRemove={handleRemoveOcorrencia}
                onListMotivosPorTipo={listarMotivosPorTipo}
              />
            ))}

            {showOcorrenciaForm && (
              <OcorrenciaForm 
                tipos={tipos} 
                motivos={motivos} 
                onSubmit={handleAddOcorrencia}
                onRemove={() => setShowOcorrenciaForm(false)}
                onListMotivosPorTipo={listarMotivosPorTipo}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700">Salvar</button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};

export default CargaForm;