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
      dataMalote: '',
      dataInicial: '',
      dataFinal: '',
    });
  };

  return (
    <div className=" pl-4 mb-3  rounded-md  ">
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
            className="p-4 rounded-md overflow-hidden bg-[#555] mt-4 "
          >
            <div className="flex  flex-col gap-2 py-4">
              <Input
                type="text"
                
                placeholder="Nome do condutor"
                value={filtros.nome}
                onChange={(e) => setFiltros((f) => ({ ...f, nome: e.target.value }))}
              />
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
                placeholder="Data do Malote"
                type="date"
                value={filtros.dataMalote}
                onChange={(e) => setFiltros((f) => ({ ...f, dataMalote: e.target.value }))}
              />

              <Input
                type="text"
                placeholder="Usuário"
                value={filtros.usuario}
                onChange={(e) => setFiltros((f) => ({ ...f, usuario: e.target.value }))}
              />

              
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

              <select
                className="border bg-gray-100 text-black border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={filtros.status}
                onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">Todos os status</option>
                <option value="enviado">Enviado</option>
                <option value="aprovado">Aprovado</option>
                <option value="reprovado">Reprovado</option>
                <option value="saldo_liberado">Saldo Liberado</option>
              </select>

              <button
                onClick={limpar}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm mt-2"
              >
                Limpar Filtros
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Filtros;
