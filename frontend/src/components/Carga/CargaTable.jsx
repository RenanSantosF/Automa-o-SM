import { Trash2, Pencil } from "lucide-react";

// StatusBadge (mesmo que o de cima)
const StatusBadge = ({ status }) => {
  const colors = {
    normal: "bg-blue-600/30 text-blue-400",
    concluida: "bg-green-600/30 text-green-400",
    pendente: "bg-yellow-600/30 text-yellow-400",
    atrasado: "bg-red-600/30 text-red-400",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        colors[status] || "bg-gray-600/30 text-gray-400"
      }`}
    >
      {status || "indefinido"}
    </span>
  );
};

const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString("pt-BR") : "-");
const formatCurrency = (valor) =>
  valor != null ? `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-";

const CargaTable = ({ cargas = [], onEdit = () => {}, onDelete = () => {} }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-sm text-left text-white">
      <thead className="bg-[#333] text-gray-200 uppercase text-xs">
        <tr>
          <th className="px-4 py-3">Origem</th>
          <th className="px-4 py-3">Destino</th>
          <th className="px-4 py-3">Rota</th>
          <th className="px-4 py-3">Data</th>
          <th className="px-4 py-3">Valor</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Observação</th>
          <th className="px-4 py-3 text-center">Ações</th>
        </tr>
      </thead>
      <tbody>
        {cargas.length > 0 ? (
          cargas.map((carga) => (
            <tr key={carga.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
              <td className="px-4 py-2">{carga.origem || "-"}</td>
              <td className="px-4 py-2">{carga.destino || "-"}</td>
              <td className="px-4 py-2">{carga.rota || "-"}</td>
              <td className="px-4 py-2">{formatDate(carga.data_carregamento)}</td>
              <td className="px-4 py-2">{formatCurrency(carga.valor_frete)}</td>
              <td className="px-4 py-2"><StatusBadge status={carga.status} /></td>
              <td className="px-4 py-2 text-gray-300">{carga.observacao_cliente || "-"}</td>
              <td className="px-4 py-2 flex justify-center gap-2">
                <button onClick={() => onEdit(carga)} className="p-2 rounded-md hover:bg-gray-600 transition">
                  <Pencil className="w-5 h-5 text-blue-400" />
                </button>
                <button onClick={() => onDelete(carga)} className="p-2 rounded-md hover:bg-gray-600 transition">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="8" className="text-center text-gray-400 py-6 italic">
              Nenhuma carga cadastrada
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default CargaTable;
