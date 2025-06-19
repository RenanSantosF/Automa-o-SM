import React,  { useState, useEffect } from "react";
import { MdOutlineExpandMore } from "react-icons/md";
import { MdExpandLess } from "react-icons/md";
import StatusScrapingNfe from "../Status/StatusScrapingNfe";
const api = import.meta.env.VITE_API_URL;
import { v4 as uuidv4 } from "uuid";

const UploadCtes = () => {
  const [solicitacaoId, setSolicitacaoId] = useState("");
  const [notasPorCte, setNotasPorCte] = useState([]);
  const [error, setError] = useState(null);
  const [aberto, setAberto] = useState(null);
  const [files, setFiles] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const parseNotasFiscaisDoCte = (xml, fileName) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");

    const isCte =
      xmlDoc.getElementsByTagName("CTe").length > 0 ||
      xmlDoc.getElementsByTagName("cteProc").length > 0 ||
      xmlDoc.getElementsByTagName("cteSimpProc").length > 0 ||
      xmlDoc.getElementsByTagName("CTeSimp").length > 0
       

    if (!isCte) {
      throw new Error(`Arquivo ${fileName} não é um CT-e.`);
    }

    const ns = "http://www.portalfiscal.inf.br/cte";
    const infNFeTags = xmlDoc.getElementsByTagNameNS(ns, "infNFe");

    function extrairChave(el, ns) {
      const nomesPossiveis = ["chNFe", "chave"];
      for (const nome of nomesPossiveis) {
        const encontrado = el.getElementsByTagNameNS(ns, nome)[0];
        if (encontrado?.textContent) return encontrado.textContent;
      }
      return "";
    }

    const chaves = Array.from(infNFeTags)
      .map(el => extrairChave(el, ns))
      .filter(Boolean);


    console.log(`Arquivo: ${fileName}`, chaves);
    return chaves;
  };

  const processFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    setFiles(fileArray);

    const readers = fileArray.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const xmlString = reader.result;
            const notas = parseNotasFiscaisDoCte(xmlString, file.name);
            resolve({ nome: file.name, xml: xmlString, notas });
          } catch (err) {
            reject(`Erro no arquivo ${file.name}: ${err.message}`);
          }
        };
        reader.onerror = () => reject(`Erro ao ler o arquivo ${file.name}`);
        reader.readAsText(file);
      });
    });

    Promise.allSettled(readers).then((results) => {
      const sucesso = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
      const erros = results.filter((r) => r.status === "rejected");

      if (erros.length > 0) {
        setError(erros[0].reason);
      } else {
        setError(null);
      }

      setNotasPorCte(sucesso);
    });
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const enviarParaBackend = async () => {
    setEnviando(true);
    try {
      const response = await fetch(`${api}/importa-e-processa-recentes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          notasPorCte.map((cte) => ({
            nome: cte.nome,
            xml: cte.xml,
            solicitacao_id: solicitacaoId,  // aqui envia o ID gerado no backend
            notas: cte.notas.map((chave) => ({ chave })),
          }))
        ),
      });

      if (!response.ok) throw new Error("Erro ao enviar para o backend");

      alert("Dados enviados com sucesso!");
      setNotasPorCte([]);
      setFiles([]);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setEnviando(false);
    }
  };


  useEffect(() => {
    setSolicitacaoId(uuidv4());
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Importar CT-es (XML)</h2>

      {/* Dropzone */}
      <div
        className="relative h-20 w-full p-4 border-2 border-dashed border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".xml"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[+1]"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
          {files.length > 0
            ? `Arquivos selecionados: ${files.length}`
            : "Arraste ou clique para inserir o XML"}
        </span>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {notasPorCte.length > 0 && (
        <>
          <div className="space-y-2 mt-6">
            {notasPorCte.map((cte, index) => (
              <div key={index} className="border rounded overflow-hidden">
                <button
                  onClick={() => setAberto(aberto === index ? null : index)}
                  className="w-full text-left text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 font-semibold text-gray-800 flex justify-between items-center"
                >
                  {cte.nome}
                  <span>
                    {aberto === index ? (
                      <MdExpandLess size={30} />
                    ) : (
                      <MdOutlineExpandMore size={30} />
                    )}
                  </span>
                </button>
                {aberto === index && (
                  <ul className="p-4 bg-gray-50 text-sm text-gray-700 space-y-1">
                    {cte.notas.map((chave, idx) => (
                      <li key={idx} className="break-all">• {chave}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <div className="w-full flex flex-col justify-end-safe">
            <div className="flex justify-end-safe">
              <button
                onClick={enviarParaBackend}
                disabled={enviando}
                className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {enviando ? "Enviando..." : "Importar para o email"}
              </button>
            </div>

          </div>


        </>
      )}

                  <div>

            </div>
    </div>
  );
};

export default UploadCtes;
