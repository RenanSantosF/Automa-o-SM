import { Trash2, Pencil } from "lucide-react";

// Badge de status
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

// Funções internas
const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("pt-BR") : "-";

const formatCurrency = (valor) =>
  valor != null
    ? `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "-";

const CargaItem = ({ carga, onEdit, onDelete }) => (
  <tr className="border-b border-gray-700 hover:bg-gray-700/50 transition">
    <td className="px-4 py-2">{carga.origem || "-"}</td>
    <td className="px-4 py-2">{carga.destino || "-"}</td>
    <td className="px-4 py-2">{carga.rota || "-"}</td>
    <td className="px-4 py-2">{formatDate(carga.data_carregamento)}</td>
    <td className="px-4 py-2">{formatCurrency(carga.valor_frete)}</td>
    <td className="px-4 py-2"><StatusBadge status={carga.status} /></td>
    <td className="px-4 py-2 text-gray-300">{carga.observacao_cliente || "-"}</td>
    <td className="px-4 py-2 flex justify-center gap-2">
      <button
        onClick={() => onEdit(carga)}
        className="p-2 rounded-md hover:bg-gray-600 transition"
      >
        <Pencil className="w-5 h-5 text-blue-400" />
      </button>
      <button
        onClick={() => onDelete(carga)}
        className="p-2 rounded-md hover:bg-gray-600 transition"
      >
        <Trash2 className="w-5 h-5 text-red-400" />
      </button>
    </td>
  </tr>
);

export default CargaItem;
