// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import axios from 'axios';
// import { toast } from 'react-toastify';

// const api = import.meta.env.VITE_API_URL;

// export default function NfePorChave() {
//   const [chaves, setChaves] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [concluido, setConcluido] = useState(false);
//   const [ultimoZip, setUltimoZip] = useState(null);

//   const sanitize = (t) =>
//     t.split('\n').map((l) => l.replace(/\D/g, '')).filter(Boolean);

//   // ----------------------------------------------------------
//   // UTILS
//   // ----------------------------------------------------------
//   const baixarBlob = (blob, filename) => {
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename;
//     a.click();
//     a.remove();
//   };

//   const base64ToBlob = (base64, type) => {
//     const bytes = atob(base64);
//     const arr = new Uint8Array(bytes.length);
//     for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
//     return new Blob([arr], { type });
//   };

//   const baixarMultiSeparado = (lista) => {
//     lista.forEach((nota) => {
//       // PDF
//       const pdfBlob = base64ToBlob(nota.pdf, "application/pdf");
//       baixarBlob(pdfBlob, `${nota.chave}.pdf`);

//       // XML
//       const xmlBlob = new Blob([nota.xml], { type: "application/xml" });
//       baixarBlob(xmlBlob, `${nota.chave}.xml`);
//     });
//   };

//   // ----------------------------------------------------------
//   // HANDLERS PRINCIPAIS
//   // ----------------------------------------------------------
//   const handleDownload = async (modo) => {
//     const lista = sanitize(chaves);
//     if (!lista.length) return toast.error('Cole ao menos uma chave!');

//     try {
//       setLoading(true);

//       if (modo === "zip") {
//         const res = await axios.post(
//           `${api}/nfe/download?modo=zip`,
//           lista,
//           { responseType: 'blob' }
//         );

//         const blob = new Blob([res.data]);
//         setUltimoZip(blob);
//         baixarBlob(blob, "notas_fiscais.zip");

//       } else if (modo === "individual") {
//         const res = await axios.post(`${api}/nfe/download?modo=individual`, lista);
//         if (!res.data.pdf || !res.data.xml) return toast.error("Erro na nota!");

//         const pdfBlob = base64ToBlob(res.data.pdf, "application/pdf");
//         baixarBlob(pdfBlob, `${res.data.chave}.pdf`);

//         const xmlBlob = new Blob([res.data.xml], { type: "application/xml" });
//         baixarBlob(xmlBlob, `${res.data.chave}.xml`);

//       } else if (modo === "multi") {
//         const res = await axios.post(`${api}/nfe/download?modo=multi`, lista);

//         if (res.data.sucesso.length === 0)
//           return toast.error("Nenhuma nota válida!");

//         baixarMultiSeparado(res.data.sucesso);
//       }

//       toast.success('Download concluído!');
//       setConcluido(true);

//     } catch (e) {
//       console.error(e);
//       toast.error('Erro ao baixar NFes!');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleNovaConsulta = () => {
//     setChaves('');
//     setConcluido(false);
//     setUltimoZip(null);
//   };

//   const handleBaixarUltimoZip = () => {
//     if (!ultimoZip) return;
//     baixarBlob(ultimoZip, "notas_fiscais.zip");
//   };

//   // ----------------------------------------------------------
//   // UI
//   // ----------------------------------------------------------
//   return (
//     <>
//       {!concluido ? (
//         <>
//           <textarea
//             className="w-full h-56 p-3 rounded bg-[#222] border border-gray-700
//                        focus:ring-2 focus:ring-green-400 text-white placeholder-gray-400"
//             placeholder="Cole aqui as chaves, uma por linha"
//             value={chaves}
//             onChange={(e) => setChaves(e.target.value)}
//             disabled={loading}
//           />

//           <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">

//             {/* BOTÃO ZIP */}
//             <motion.button
//               disabled={loading}
//               onClick={() => handleDownload("zip")}
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.97 }}
//               className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700
//                          text-white rounded shadow-md disabled:bg-gray-600"
//             >
//               {loading ? "Processando..." : "ZIP"}
//             </motion.button>

//             {/* BOTÃO INDIVIDUAL */}
//             {/* <motion.button
//               disabled={loading}
//               onClick={() => handleDownload("individual")}
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.97 }}
//               className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700
//                          text-white rounded shadow-md disabled:bg-gray-600"
//             >
//               Individual
//             </motion.button> */}

//             {/* BOTÃO MULTI */}
//             <motion.button
//               disabled={loading}
//               onClick={() => handleDownload("multi")}
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.97 }}
//               className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700
//                          text-white rounded shadow-md disabled:bg-gray-600"
//             >
//               Multi (sem zip)
//             </motion.button>
//           </div>
//         </>
//       ) : (
//         <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center w-full">

//           <motion.button
//             onClick={handleNovaConsulta}
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.97 }}
//             className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700
//                        text-white rounded shadow-md"
//           >
//             Nova consulta
//           </motion.button>

//           <motion.button
//             onClick={handleBaixarUltimoZip}
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.97 }}
//             className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-800
//                        text-white rounded shadow-md"
//           >
//             Baixar ZIP novamente
//           </motion.button>

//         </div>
//       )}
//     </>
//   );
// }

import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

const api = import.meta.env.VITE_API_URL;

export default function NfePorChave() {
  const [chaves, setChaves] = useState('');
  const [loading, setLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);

  const [ultimoZip, setUltimoZip] = useState(null);
  const [listaNotas, setListaNotas] = useState([]); // 🔥 LISTA DE NOTAS BAIXADAS
  const [modoUsado, setModoUsado] = useState(null); // zip | multi

  const sanitize = (t) =>
    t
      .split('\n')
      .map((l) => l.replace(/\D/g, ''))
      .filter(Boolean);

  // ------------------------- UTILS -------------------------
  const baixarBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
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

  const visualizarPdfNovaAba = (pdfBase64) => {
    const blob = base64ToBlob(pdfBase64, 'application/pdf');
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // ------------------------- HANDLER DE DOWNLOAD -------------------------
  const handleDownload = async (modo) => {
    const lista = sanitize(chaves);
    if (!lista.length) return toast.error('Cole ao menos uma chave!');

    try {
      setLoading(true);
      setModoUsado(modo);

      if (modo === 'zip') {
        const res = await axios.post(`${api}/nfe/download?modo=zip`, lista, {
          responseType: 'blob',
        });

        const blob = new Blob([res.data]);
        setUltimoZip(blob);

        const agora = new Date();

        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');

        const h = String(agora.getHours()).padStart(2, '0');
        const m = String(agora.getMinutes()).padStart(2, '0');
        const s = String(agora.getSeconds()).padStart(2, '0');

        const nomeZip = `notas fiscais ${dia}-${mes}-${ano} - ${h}h-${m}m-${s}s.zip`;

        baixarBlob(blob, nomeZip);

        toast.success('ZIP baixado!');
        setConcluido(true);
        setListaNotas([]);
      } else if (modo === 'multi') {
        const res = await axios.post(`${api}/nfe/download?modo=multi`, lista);

        if (!res.data.sucesso.length) {
          toast.error('Nenhuma nota válida!');
          return;
        }

        // 🔥 Salva lista das notas baixadas
        setListaNotas(res.data.sucesso);

        // Baixa automaticamente cada uma
        res.data.sucesso.forEach((n) => {
          const pdfBlob = base64ToBlob(n.pdf, 'application/pdf');
          baixarBlob(pdfBlob, `${n.chave}.pdf`);

          const xmlBlob = new Blob([n.xml], { type: 'application/xml' });
          baixarBlob(xmlBlob, `${n.chave}.xml`);
        });

        toast.success('Download individual completo!');
        setConcluido(true);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao baixar NFes!');
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarUltimoZip = () => {
    if (!ultimoZip) return;
    baixarBlob(ultimoZip, 'notas_fiscais.zip');
  };

  const handleBaixarMultiNovamente = () => {
    if (!listaNotas.length) return;
    listaNotas.forEach((n) => {
      const pdfBlob = base64ToBlob(n.pdf, 'application/pdf');
      baixarBlob(pdfBlob, `${n.chave}.pdf`);

      const xmlBlob = new Blob([n.xml], { type: 'application/xml' });
      baixarBlob(xmlBlob, `${n.chave}.xml`);
    });
  };

  const handleNovaConsulta = () => {
    setChaves('');
    setConcluido(false);
    setUltimoZip(null);
    setListaNotas([]);
    setModoUsado(null);
  };

  // ------------------------- UI -------------------------
  return (
    <>
      {!concluido ? (
        <>
          {/* TEXTAREA */}
          <textarea
            className="w-full h-56 p-3 rounded bg-[#222] border border-gray-700
                       focus:ring-2 focus:ring-green-400 text-white placeholder-gray-400"
            placeholder="Cole aqui as chaves, uma por linha"
            value={chaves}
            onChange={(e) => setChaves(e.target.value)}
            disabled={loading}
          />

          {/* BOTÕES PRINCIPAIS */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
            {/* ZIP */}
            <motion.button
              disabled={loading}
              onClick={() => handleDownload('zip')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded shadow-md disabled:bg-gray-600"
            >
              {loading ? 'Processando...' : 'Arquivo zipado'}
            </motion.button>

            {/* MULTI */}
            <motion.button
              disabled={loading}
              onClick={() => handleDownload('multi')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded shadow-md disabled:bg-gray-600"
            >
              Baixar todas as notas (sem zip)
            </motion.button>
          </div>
        </>
      ) : (
        <>
          {/* BOTÕES DE AÇÃO APÓS DOWNLOAD */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center w-full">
            <motion.button
              onClick={handleNovaConsulta}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded shadow-md"
            >
              Nova consulta
            </motion.button>

            {modoUsado === 'zip' && (
              <motion.button
                onClick={handleBaixarUltimoZip}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-800 text-white rounded shadow-md"
              >
                Baixar ZIP novamente
              </motion.button>
            )}

            {modoUsado === 'multi' && (
              <motion.button
                onClick={handleBaixarMultiNovamente}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 text-sm bg-purple-700 hover:bg-purple-800 text-white rounded shadow-md"
              >
                Baixar MULTI novamente
              </motion.button>
            )}
          </div>

          {/* LISTA DAS NOTAS BAIXADAS */}
          {listaNotas.length > 0 && (
            <div className="mt-6 bg-[#1c1c1c] p-4 rounded-lg border border-gray-700">
              <h2 className="text-white font-semibold mb-3">Notas baixadas</h2>

              <div className="space-y-3">
                {listaNotas.map((nota) => (
                  <div
                    key={nota.chave}
                    className="p-3 bg-[#222] rounded border border-gray-700 flex items-center justify-between"
                  >
                    <span className="text-gray-300 text-xs">{nota.chave}</span>

                    <div className="flex gap-2">
                      {/* VISUALIZAR */}
                      <button
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                        onClick={() => visualizarPdfNovaAba(nota.pdf)}
                      >
                        Visualizar
                      </button>

                      {/* PDF */}
                      <button
                        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                        onClick={() =>
                          baixarBlob(base64ToBlob(nota.pdf, 'application/pdf'), `${nota.chave}.pdf`)
                        }
                      >
                        Baixar PDF
                      </button>

                      {/* XML */}
                      <button
                        className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                        onClick={() => {
                          const blob = new Blob([nota.xml], {
                            type: 'application/xml',
                          });
                          baixarBlob(blob, `${nota.chave}.xml`);
                        }}
                      >
                        Baixar XML
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
