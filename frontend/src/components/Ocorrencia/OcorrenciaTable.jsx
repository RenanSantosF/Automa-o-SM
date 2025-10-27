import { useState, useEffect } from "react";
import { MdAddBox, MdClose } from "react-icons/md";

const OcorrenciaForm = ({ tipos = [], motivos = [], initialData = {}, onSubmit, onRemove }) => {
  const [formData, setFormData] = useState({
    tipo_id: initialData.tipo_id || "",
    motivo_id: initialData.motivo_id || "",
    descricao: initialData.descricao || "",
  });

  useEffect(() => {
    // Só inicializa quando initialData mudar
    if (initialData.id) {
      setFormData({
        tipo_id: initialData.tipo_id || "",
        motivo_id: initialData.motivo_id || "",
        descricao: initialData.descricao || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdate = () => {
    if (!formData.tipo_id || !formData.motivo_id || !formData.descricao) return;
    onSubmit(formData);
    if (!initialData.id) {
      setFormData({ tipo_id: tipos[0]?.id || "", motivo_id: motivos[0]?.id || "", descricao: "" });
    }
  };

  if (!tipos.length || !motivos.length) {
    return <div className="text-gray-400">Carregando tipos e motivos...</div>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col gap-3 text-white">
      <div className="flex flex-col md:flex-row gap-2">
        <select name="tipo_id" value={formData.tipo_id} onChange={handleChange} className="flex-1 p-2 rounded-md bg-gray-700 text-white">
          {tipos.map(tipo => <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>)}
        </select>

        <select name="motivo_id" value={formData.motivo_id} onChange={handleChange} className="flex-1 p-2 rounded-md bg-gray-700 text-white">
          {motivos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>

      <textarea
        name="descricao"
        value={formData.descricao}
        onChange={handleChange}
        className="p-2 rounded-md bg-gray-700 text-white"
        rows={2}
        placeholder="Descrição da ocorrência"
      />

      <div className="flex justify-end gap-2">
        {onRemove && (
          <button type="button" onClick={() => onRemove(initialData.id)} className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700">
            <MdClose size={20} />
          </button>
        )}
        <button type="button" onClick={handleAddOrUpdate} className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 flex items-center gap-2">
          <MdAddBox size={20} /> {initialData.id ? "Atualizar" : "Adicionar"}
        </button>
      </div>
    </div>
  );
};

export default OcorrenciaForm;
