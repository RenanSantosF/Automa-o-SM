export default function RelatorioFilters({
  filtroLocal, setFiltroLocal,
  estados, cidadesOrigem, cidadesDestino,
  tipos, motivos, creators, transportadoras, filiais
}) {
  // classe base dark moderna
  const selectClass =
    "bg-zinc-800 text-gray-100 border border-zinc-700 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-150 appearance-none cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-gray-100";
  const inputClass =
    "bg-zinc-800 text-gray-100 border border-zinc-700 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-150";

  return (
    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
      {/* UFs e cidades */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={filtroLocal.uf_origem || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({ ...p, uf_origem: e.target.value }))
          }
          className={selectClass}
        >
          <option value="">UF Origem</option>
          {estados.map((uf) => (
            <option key={uf.id} value={uf.sigla}>
              {uf.sigla}
            </option>
          ))}
        </select>

        <select
          value={filtroLocal.cidade_origem || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({ ...p, cidade_origem: e.target.value }))
          }
          disabled={!filtroLocal.uf_origem}
          className={`${selectClass} disabled:opacity-50`}
        >
          <option value="">Cidade Origem</option>
          {cidadesOrigem.map((c) => (
            <option key={c.id} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={filtroLocal.uf_destino || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({ ...p, uf_destino: e.target.value }))
          }
          className={selectClass}
        >
          <option value="">UF Destino</option>
          {estados.map((uf) => (
            <option key={uf.id} value={uf.sigla}>
              {uf.sigla}
            </option>
          ))}
        </select>

        <select
          value={filtroLocal.cidade_destino || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({ ...p, cidade_destino: e.target.value }))
          }
          disabled={!filtroLocal.uf_destino}
          className={`${selectClass} disabled:opacity-50`}
        >
          <option value="">Cidade Destino</option>
          {cidadesDestino.map((c) => (
            <option key={c.id} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={filtroLocal.data_inicio || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({ ...p, data_inicio: e.target.value }))
          }
          className={inputClass}
        />
        <input
          type="date"
          value={filtroLocal.data_fim || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({ ...p, data_fim: e.target.value }))
          }
          className={inputClass}
        />
      </div>

      {/* Tipo e motivo */}
      <div className="grid grid-cols-1 gap-2">
        <select
          value={filtroLocal.tipo_ocorrencia || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({ ...p, tipo_ocorrencia: e.target.value }))
          }
          className={selectClass}
        >
          <option value="">Tipo de Ocorrência</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>

        <select
          value={filtroLocal.motivo_ocorrencia || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({ ...p, motivo_ocorrencia: e.target.value }))
          }
          disabled={!motivos.length}
          className={`${selectClass} disabled:opacity-50`}
        >
          <option value="">Motivo</option>
          {motivos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Criador / Transportadora / Filial */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={filtroLocal.criado_por_id || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({ ...p, criado_por_id: e.target.value }))
          }
          className={selectClass}
        >
          <option value="">Criador (Usuário)</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome || `#${c.id}`}
            </option>
          ))}
        </select>

        <select
          value={filtroLocal.criado_por_transportadora || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({
              ...p,
              criado_por_transportadora: e.target.value,
            }))
          }
          className={selectClass}
        >
          <option value="">Transportadora (Criador)</option>
          {transportadoras.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <select
          value={filtroLocal.criado_por_filial || ""}
          onChange={(e) =>
            setFiltroLocal((p) => ({
              ...p,
              criado_por_filial: e.target.value,
            }))
          }
          className={selectClass}
        >
          <option value="">Filial (Criador)</option>
          {filiais.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
