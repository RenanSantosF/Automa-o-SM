// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// const api = import.meta.env.VITE_API_URL;

// export default function NfePorXML() {
//   const [arquivos, setArquivos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [ultimoZip, setUltimoZip] = useState(null);

//   const parseXML = (xmlString) => {
//     const parser = new DOMParser();
//     const xml = parser.parseFromString(xmlString, 'text/xml');
//     const nodes = xml.getElementsByTagName('chave');
//     const chaves = [];
//     for (let i = 0; i < nodes.length; i++) chaves.push(nodes[i].textContent.replace(/\D/g, ''));
//     return chaves;
//   };

//   const handleArquivos = (e) => setArquivos([...e.target.files]);

//   const handleImportar = async () => {
//     if (!arquivos.length) return toast.error('Selecione ao menos um arquivo XML');

//     try {
//       setLoading(true);
//       const todasChaves = [];

//       for (let file of arquivos) {
//         const text = await file.text();
//         todasChaves.push(...parseXML(text));
//       }

//       if (!todasChaves.length) return toast.error('Nenhuma chave encontrada nos XMLs');

//       const res = await axios.post(`${api}/nfe/download`, todasChaves, { responseType: 'blob' });
//       const blob = new Blob([res.data]);
//       setUltimoZip(blob);

//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', 'notas_fiscais.zip');
//       document.body.appendChild(link);
//       link.click();
//       link.remove();

//       toast.success('Download concluído!');
//     } catch {
//       toast.error('Erro ao processar XMLs');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBaixarUltimo = () => {
//     if (!ultimoZip) return;
//     const url = window.URL.createObjectURL(ultimoZip);
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', 'notas_fiscais.zip');
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//   };

//   return (
//     <div className="w-full flex flex-col items-center gap-4">
//       <input
//         type="file"
//         multiple
//         accept=".xml"
//         onChange={handleArquivos}
//         disabled={loading}
//         className="text-white w-full file:bg-gray-700 file:text-white file:px-4 file:py-2 file:rounded-md file:border-0 file:cursor-pointer hover:file:bg-green-600 transition-all"
//       />
//       <motion.button
//         onClick={handleImportar}
//         disabled={loading || !arquivos.length}
//         whileHover={{ scale: 1.03 }}
//         whileTap={{ scale: 0.97 }}
//         className={`px-6 py-3 rounded-md font-semibold shadow-md cursor-pointer transition-all duration-300 ${
//           loading || !arquivos.length ? 'bg-gray-600 cursor-not-allowed text-gray-300' : 'bg-green-600 hover:bg-green-700 text-white'
//         }`}
//         style={{ borderRadius: '6px 2px 6px 2px' }}
//       >
//         {loading ? 'Processando...' : 'Importar NFes'}
//       </motion.button>

//       {ultimoZip && (
//         <motion.button
//           onClick={handleBaixarUltimo}
//           whileHover={{ scale: 1.03 }}
//           whileTap={{ scale: 0.97 }}
//           className="px-6 py-3 rounded-md font-semibold bg-green-500 hover:bg-green-600 shadow-md cursor-pointer transition-all"
//           style={{ borderRadius: '6px 2px 6px 2px' }}
//         >
//           Baixar novamente
//         </motion.button>
//       )}
//     </div>
//   );
// }



import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";

const api = import.meta.env.VITE_API_URL;

export default function NfePorXML() {
  const [arquivo, setArquivo] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dadosCte, setDadosCte] = useState(null); // motorista, cpf, placas
  const [listaNotas, setListaNotas] = useState([]);
  const [ultimoZip, setUltimoZip] = useState(null);
  const [modoUsado, setModoUsado] = useState(null);

  // ---------------- UTILIDADES ----------------
  const copiarTexto = (texto) => {
    navigator.clipboard.writeText(texto);
    toast.success("Copiado!");
  };

  const baixarBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    a.remove();
  };

  const base64ToBlob = (base64, type) => {
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type });
  };

  const visualizarPdf = (base64) => {
    const blob = base64ToBlob(base64, "application/pdf");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // ---------------- EXTRAÇÃO DO CT-e ----------------
  const extrairDadosCTe = (xml) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");

    const getCampo = (campo) =>
      doc.querySelector(`ObsCont[xCampo="${campo}"] xTexto`)
        ?.textContent.trim() || "";

    const motorista = getCampo("motorista");
    const cpf = getCampo("cpf_motorista");
    const cavalo = getCampo("placa");
    const carreta = getCampo("placa2");

    // Chaves das NFe vinculadas
    const chaves = [...doc.getElementsByTagName("chave")].map((n) =>
      n.textContent.replace(/\D/g, "")
    );

    if (!chaves.length) {
      toast.error("Nenhuma chave NFe encontrada neste CT-e!");
      return null;
    }

    return { motorista, cpf, cavalo, carreta, chaves };
  };

  // ---------------- HANDLERS ----------------
  const handleArquivo = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xml")) {
      toast.error("Selecione um arquivo XML válido");
      return;
    }
    setArquivo(f);
  };

  const handleImportar = async (modo) => {
    if (!arquivo) return toast.error("Selecione um CT-e primeiro!");

    try {
      setLoading(true);
      setModoUsado(modo);

      const xmlTexto = await arquivo.text();
      const dados = extrairDadosCTe(xmlTexto);

      if (!dados) return;
      setDadosCte(dados);

      const res = await axios.post(
        `${api}/nfe/download?modo=${modo}`,
        dados.chaves,
        modo === "zip" ? { responseType: "blob" } : {}
      );

      if (modo === "zip") {
        // Criar nome do arquivo com data+hora
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");
        const h = String(agora.getHours()).padStart(2, "0");
        const m = String(agora.getMinutes()).padStart(2, "0");
        const s = String(agora.getSeconds()).padStart(2, "0");

        const nomeZip = `notas_fiscais_${ano}-${mes}-${dia}_${h}-${m}-${s}.zip`;

        const blob = new Blob([res.data]);
        setUltimoZip(blob);
        baixarBlob(blob, nomeZip);
        setListaNotas([]);
      } else {
        // MULTI
        setListaNotas(res.data.sucesso);
      }

      toast.success("Processado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao processar CT-e");
    } finally {
      setLoading(false);
    }
  };

  const baixarZipNovamente = () => {
    if (!ultimoZip) return;

    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    const h = String(agora.getHours()).padStart(2, "0");
    const mm = String(agora.getMinutes()).padStart(2, "0");
    const s = String(agora.getSeconds()).padStart(2, "0");

    baixarBlob(ultimoZip, `notas_fiscais_${ano}-${mes}-${dia}_${h}-${mm}-${s}.zip`);
  };

  // ---------------- UI ----------------
  return (
    <div className="w-full flex flex-col gap-4">
      {/* INPUT */}
      <input
        type="file"
        accept=".xml"
        onChange={handleArquivo}
        disabled={loading}
        className="text-white w-full file:bg-gray-700 file:text-white 
        file:px-4 file:py-2 file:rounded-md file:border-0 file:cursor-pointer 
        hover:file:bg-green-600 transition-all"
      />

      {/* BOTÕES */}
      <div className="flex gap-3">
        <motion.button
          onClick={() => handleImportar("zip")}
          disabled={loading || !arquivo}
          whileHover={{ scale: 1.02 }}
          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 
          text-white rounded shadow-md disabled:bg-gray-600"
        >
          {loading ? "Processando..." : "Baixar ZIP"}
        </motion.button>

        <motion.button
          onClick={() => handleImportar("multi")}
          disabled={loading || !arquivo}
          whileHover={{ scale: 1.02 }}
          className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 
          text-white rounded shadow-md disabled:bg-gray-600"
        >
          Multi (sem ZIP)
        </motion.button>
      </div>

      {/* DADOS DO CT-e */}
      {dadosCte && (
        <div className="bg-[#1c1c1c] p-4 rounded border border-gray-700">
          <p className="text-white text-sm">
            <strong>Motorista:</strong> {dadosCte.motorista} - CPF: {dadosCte.cpf}
          </p>
          <p className="text-white text-sm">
            <strong>Cavalo:</strong> {dadosCte.cavalo}
          </p>
          <p className="text-white text-sm">
            <strong>Carreta:</strong> {dadosCte.carreta}
          </p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            className="mt-3 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 
            text-white rounded"
            onClick={() =>
              copiarTexto(
                `Motorista: ${dadosCte.motorista} - CPF: ${dadosCte.cpf}\nCavalo: ${dadosCte.cavalo}\nCarreta: ${dadosCte.carreta}`
              )
            }
          >
            Copiar
          </motion.button>
        </div>
      )}

      {/* LISTA DAS NOTAS */}
      {listaNotas.length > 0 && (
        <div className="mt-4 bg-[#1c1c1c] p-4 rounded border border-gray-700">
          <h2 className="text-white text-sm mb-3">Notas baixadas</h2>

          <div className="space-y-2">
            {listaNotas.map((n) => (
              <div
                key={n.chave}
                className="p-3 bg-[#222] rounded border border-gray-700 
                flex items-center justify-between"
              >
                <span className="text-gray-300 text-xs">{n.chave}</span>

                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                    onClick={() => visualizarPdf(n.pdf)}
                  >
                    Visualizar
                  </button>

                  <button
                    className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                    onClick={() =>
                      baixarBlob(
                        base64ToBlob(n.pdf, "application/pdf"),
                        `${n.chave}.pdf`
                      )
                    }
                  >
                    Baixar PDF
                  </button>

                  <button
                    className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                    onClick={() =>
                      baixarBlob(new Blob([n.xml], { type: "application/xml" }), `${n.chave}.xml`)
                    }
                  >
                    Baixar XML
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão baixar ZIP novamente */}
      {modoUsado === "zip" && ultimoZip && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={baixarZipNovamente}
          className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 
          text-white rounded shadow-md"
        >
          Baixar ZIP novamente
        </motion.button>
      )}
    </div>
  );
}
