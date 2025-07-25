import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Input from '../Input/Input';

const Filtros = ({ filtros, setFiltros }) => {
  const [mostrar, setMostrar] = useState(false);

  const limpar = () => {
    setFiltros({
      usuario: '',
      status: '',
      cte: '',
      nome: '',
      cliente: '',
      dataMaloteInicial: '',
      dataMaloteFinal: '',
      dataInicial: '',
      dataFinal: '',
      manifestoBaixado: '',
    });
    setMostrar(false); // Fecha os filtros
  };

  return (
    <div className=" pl-4 mb-3 mr-4  rounded-md  ">
      <button
        onClick={() => setMostrar(!mostrar)}
        className="cursor-pointer flex items-center gap-2 text-green-500 font-semibold"
      >
        Filtros
        <motion.div animate={{ rotate: mostrar ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {mostrar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-md overflow-hidden bg-[#333] mt-4 "
          >
            <div className="flex  flex-col gap-2 py-4">
              <Input
                type="text"
                placeholder="Nome do condutor"
                value={filtros.nome}
                onChange={(e) => setFiltros((f) => ({ ...f, nome: e.target.value }))}
              />

              <div className="flex p-2 gap-2">
                <Input
                  type="text"
                  placeholder="Nº do CTE"
                  value={filtros.cte}
                  onChange={(e) => setFiltros((f) => ({ ...f, cte: e.target.value }))}
                />
                <Input
                  type="text"
                  placeholder="Cliente"
                  value={filtros.cliente}
                  onChange={(e) => setFiltros((f) => ({ ...f, cliente: e.target.value }))}
                />
                <Input
                  type="text"
                  placeholder="Usuário"
                  value={filtros.usuario}
                  onChange={(e) => setFiltros((f) => ({ ...f, usuario: e.target.value }))}
                />
              </div>

              <div className="flex p-2 gap-2">
                <Input
                  placeholder="Malote Inicial"
                  type="date"
                  value={filtros.dataMaloteInicial}
                  onChange={(e) => setFiltros((f) => ({ ...f, dataMaloteInicial: e.target.value }))}
                />

                <Input
                  placeholder="Malote Final"
                  type="date"
                  value={filtros.dataMaloteFinal}
                  onChange={(e) => setFiltros((f) => ({ ...f, dataMaloteFinal: e.target.value }))}
                />
              </div>

              <div className="flex p-2 gap-2">
                <Input
                  placeholder="Data Inicial"
                  type="date"
                  value={filtros.dataInicial}
                  onChange={(e) => setFiltros((f) => ({ ...f, dataInicial: e.target.value }))}
                />

                <Input
                  placeholder="Data Final"
                  type="date"
                  value={filtros.dataFinal}
                  onChange={(e) => setFiltros((f) => ({ ...f, dataFinal: e.target.value }))}
                />
              </div>
<div className="flex flex-wrap w-full gap-3">
  <select
    className="flex-1 min-w-[200px] border cursor-pointer bg-gray-100 text-black border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
    value={filtros.status}
    onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}
  >
    <option value="">Todos os status</option>
    <option value="enviado">Enviado</option>
    <option value="aprovado">Aprovado</option>
    <option value="reprovado">Reprovado</option>
    <option value="saldo_liberado">Saldo Liberado</option>
  </select>

  <select
    className="flex-1 min-w-[200px] border cursor-pointer bg-gray-100 text-black border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
    value={filtros.manifestoBaixado}
    onChange={(e) =>
      setFiltros((f) => ({ ...f, manifestoBaixado: e.target.value.toLowerCase() }))
    }
  >
    <option value="">Todos os manifestos</option>
    <option value="true">Manifesto Baixado</option>
    <option value="false">Manifesto Não Baixado</option>
  </select>

  <button
    onClick={limpar}
    className="min-w-[200px] flex-1 bg-red-600 cursor-pointer hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
  >
    Limpar
  </button>
</div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Filtros;
