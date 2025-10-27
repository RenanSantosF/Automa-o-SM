// OcorrenciaForm.jsx
import { useState, useEffect } from "react";
import { MdAddBox, MdClose, MdEdit, MdCancel } from "react-icons/md";

const OcorrenciaForm = ({ tipos = [], motivos = [], initialData = {}, onSubmit, onRemove, onListMotivosPorTipo }) => {
  const [formData, setFormData] = useState({
    tipo_id: initialData.tipo_id || "",
    motivo_id: initialData.motivo_id || "",
    observacao: initialData.observacao || initialData.descricao || "",
  });
  
  const [isEditing, setIsEditing] = useState(!initialData.id);
  const [motivosFiltrados, setMotivosFiltrados] = useState([]);
  const [loadingMotivos, setLoadingMotivos] = useState(false);


  console.log('OcorrenciaForm initialData:', initialData);
console.log('OcorrenciaForm props:', { tipos, motivos, onListMotivosPorTipo });


  // Carrega motivos quando o tipo é selecionado ou alterado
  useEffect(() => {
    const carregarMotivos = async () => {
      if (formData.tipo_id) {
        setLoadingMotivos(true);
        try {
          const motivosPorTipo = await onListMotivosPorTipo(formData.tipo_id);
          console.log('Motivos filtrados para tipo', formData.tipo_id, ':', motivosPorTipo);
          
          setMotivosFiltrados(motivosPorTipo);
          
          if (formData.motivo_id && !motivosPorTipo.some(m => m.id == formData.motivo_id)) {
            setFormData(prev => ({ ...prev, motivo_id: "" }));
          }
        } catch (error) {
          console.error("Erro ao carregar motivos:", error);
          setMotivosFiltrados([]);
        } finally {
          setLoadingMotivos(false);
        }
      } else {
        setMotivosFiltrados([]);
        setFormData(prev => ({ ...prev, motivo_id: "" }));
      }
    };

    carregarMotivos();
  }, [formData.tipo_id, onListMotivosPorTipo]);

  // Inicializa com dados existentes
  useEffect(() => {
    if (initialData.id) {
      console.log('Initial data:', initialData);
      setFormData({
        tipo_id: initialData.tipo_id || "",
        motivo_id: initialData.motivo_id || "",
        observacao: initialData.observacao || "",
      });
      
      if (initialData.tipo_id) {
        const carregarMotivosIniciais = async () => {
          try {
            const motivosPorTipo = await onListMotivosPorTipo(initialData.tipo_id);
            setMotivosFiltrados(motivosPorTipo);
          } catch (error) {
            console.error("Erro ao carregar motivos iniciais:", error);
          }
        };
        carregarMotivosIniciais();
      }
      
      setIsEditing(false);
    }
  }, [initialData, onListMotivosPorTipo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

// No OcorrenciaForm, certifique-se de que está enviando apenas motivo_id
// OcorrenciaForm.jsx - Adicione um console.log para debug
const handleAddOrUpdate = (e) => {
  e.preventDefault();
  
  if (!formData.tipo_id || !formData.motivo_id || !formData.observacao.trim()) {
    alert("Por favor, preencha todos os campos da ocorrência.");
    return;
  }
  
  const dadosParaEnviar = {
    id: initialData.id || null, // mantém o id se for edição
    tipo_id: parseInt(formData.tipo_id),
    motivo_id: parseInt(formData.motivo_id),
    observacao: formData.observacao
  };

  
  console.log('OcorrenciaForm enviando:', dadosParaEnviar);
  onSubmit(dadosParaEnviar);
  
  setIsEditing(false);
};

  const handleCancel = () => {
    if (initialData.id) {
      setFormData({
        tipo_id: initialData.tipo_id || "",
        motivo_id: initialData.motivo_id || "",
        observacao: initialData.observacao || initialData.descricao || "",
      });
      setIsEditing(false);
    } else {
      setFormData({
        tipo_id: "",
        motivo_id: "",
        observacao: "",
      });
      if (onRemove) {
        onRemove();
      }
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(initialData.id);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col gap-3 text-white">
      <div className="flex flex-col md:flex-row gap-2">
        <select
          name="tipo_id"
          value={formData.tipo_id}
          onChange={handleChange}
          className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          disabled={!isEditing}
          required
        >
          <option value="">Selecione um tipo</option>
          {tipos.map(tipo => (
            <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
          ))}
        </select>

        <select
          name="motivo_id"
          value={formData.motivo_id}
          onChange={handleChange}
          className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          disabled={!isEditing || !formData.tipo_id || loadingMotivos}
          required
        >
          <option value="">{loadingMotivos ? "Carregando..." : "Selecione um motivo"}</option>
          {motivosFiltrados.map(m => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
      </div>

      <textarea
        name="observacao"
        value={formData.observacao}
        onChange={handleChange}
        className="p-2 rounded-md bg-gray-700 text-white"
        rows={2}
        placeholder="Observação da ocorrência"
        disabled={!isEditing}
        required
      />

      <div className="flex justify-end gap-2">
        {initialData.id ? (
          <>
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1 rounded-md bg-gray-600 hover:bg-gray-700"
                >
                  <MdCancel size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleAddOrUpdate}
                  className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <MdAddBox size={20} /> Atualizar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700"
                >
                  <MdClose size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <MdEdit size={20} /> Editar
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700"
            >
              <MdClose size={20} />
            </button>
            <button
              type="button"
              onClick={handleAddOrUpdate}
              className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <MdAddBox size={20} /> Adicionar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OcorrenciaForm;