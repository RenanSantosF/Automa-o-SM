import React, { useState } from "react";
import { MdFileUpload } from "react-icons/md";
import Input from "../Input/Input";
import AdicionarCampoBtn from "../AdicionarCampoBtn/AdicionarCampoBtn";
import { useLogin } from "../../Contexts/LoginContext";
import { necessitaGNRE } from "../../utils/necessita_gnre";
import AlertaGNRE from "../Alerta_GNRE/AlertaGNRE";

const NovaSM = ({ onUploadSuccess, onClose }) => {
  const [modalConfirmacaoGNRE, setmodalConfirmacaoGNRE] = useState(false);

  const [files, setFiles] = useState([]);
  const [resposta, setResposta] = useState(null);
  const [xmlData, setXmlData] = useState({});
  const [error, setError] = useState(null);
  const [placaCavaloBase, setPlacaCavaloBase] = useState(null);
  const { userData } = useLogin()
  const [rawXmlFiles, setRawXmlFiles] = useState([]);
  const [camposExtras, setCamposExtras] = useState({
    placa_cavalo: true,
    placa_carreta_1: "placa_carreta_1" in xmlData,
    placa_carreta_2: "placa_carreta_2" in xmlData,
  });
  


  const parseXML = (xml) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    const ns = "http://www.portalfiscal.inf.br/cte";

    const getTagText = (tag, scope = xmlDoc) =>
      scope.getElementsByTagNameNS(ns, tag)[0]?.textContent || "";

    const getObsCont = (campo) =>
      Array.from(xmlDoc.getElementsByTagNameNS(ns, "ObsCont"))
        .find(el => el.getAttribute("xCampo") === campo)
        ?.getElementsByTagNameNS(ns, "xTexto")[0]?.textContent || "";

    const remetente = xmlDoc.getElementsByTagNameNS(ns, "rem")[0];
    const destinatario = xmlDoc.getElementsByTagNameNS(ns, "dest")[0];

    return {
      condutor: getObsCont("motorista"),
      cpf_condutor: getObsCont("cpf_motorista"),
      valor_total_carga: getTagText("vCarga"),
      // ...(getObsCont("placa") && { placa_cavalo: getObsCont("placa") }),
      placa_cavalo: getObsCont("placa") || "", 
      ...(getObsCont("placa2") && { placa_carreta_1: getObsCont("placa2") }),
      ...(getObsCont("placa3") && { placa_carreta_2: getObsCont("placa3") }),

      local_origem: `${getTagText("xMunIni")} - ${getTagText("UFIni")}`,
      local_destino: `${getTagText("xMunFim")} - ${getTagText("UFFim")}`,

      remetente_nome: remetente ? getTagText("xNome", remetente) : "",
      remetente_cnpj: remetente ? getTagText("CNPJ", remetente) : "",
      remetente_endereco: remetente ? getTagText("xLgr", remetente) : "",
      destinatario_nome: destinatario ? getTagText("xNome", destinatario) : "",
      destinatario_cnpj: destinatario ? getTagText("CNPJ", destinatario) : "",
      destinatario_endereco: destinatario ? getTagText("xLgr", destinatario) : "",
      remetente_cadastrado_apisul:  null,
      destinatario_cadastrado_apisul:  null,
      rotas_cadastradas_apisul: []
    };
  };

  const handleChange = (field, value) => {
    let formattedValue = value

    if (
      field === "placa_cavalo" ||
      field === "placa_carreta_1" ||
      field === "placa_carreta_2"
    ) {
      formattedValue = value.replace(/[-\s]/g, "").toUpperCase()
    }

    setXmlData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const processFiles = (newFiles) => {
    const existingFileIds = new Set(files.map(f => f.name + f.size + f.lastModified));
    const filteredFiles = newFiles.filter(f => {
      const fileId = f.name + f.size + f.lastModified;
      return !existingFileIds.has(fileId);
    });

    if (filteredFiles.length === 0) return;

    const fileReaders = filteredFiles.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const rawXml = reader.result
            const parsed = parseXML(rawXml);
            resolve({ file, data: parsed, raw: rawXml });
          } catch (err) {
            reject(err.message);
          }
        };
        reader.readAsText(file);
      });
    });

    Promise.allSettled(fileReaders).then((results) => {
      const successes = results.filter(r => r.status === "fulfilled").map(r => r.value);
      const failures = results.filter(r => r.status === "rejected");

      setRawXmlFiles(prev => [...prev, ...successes.map(s => s.raw)])
      if (failures.length > 0) {
        setError(failures[0].reason || "Erro ao ler um ou mais XMLs.");
        return;
      }

      if (successes.length === 0) return;

      // Extrai todas as placas dos arquivos lidos
      const placas = successes.map(s => s.data.placa_cavalo);
      const primeiraPlaca = placaCavaloBase || placas[0];


      const todasIguais = placas.every(p => p === primeiraPlaca);
      const algumaSemPlaca = placas.some(p => !p);
      const algumaComPlaca = placas.some(p => !!p);

      if (!todasIguais || (algumaComPlaca && algumaSemPlaca)) {
        setError("Os XMLs devem ter a mesma placa ou todos sem placa. O upload não pode ser feito.");
        return;
      }

      // Tudo OK, pode adicionar
      setFiles(prev => [...prev, ...successes.map(s => s.file)]);
      // setXmlData(successes[successes.length - 1].data);
      setXmlData(prevData => {
        const novaCargaTotal = successes.reduce((total, s) => {
          const valor = parseFloat(s.data.valor_total_carga || "0");
          return total + (isNaN(valor) ? 0 : valor);
        }, parseFloat(prevData?.valor_total_carga || "0"));
      
        return {
          ...prevData,
          ...successes[successes.length - 1].data,
          valor_total_carga: novaCargaTotal.toFixed(2),
        };
      });
      
      setPlacaCavaloBase(primeiraPlaca);
      setError(null);
        // Atualiza os camposExtras com base nos dados do XML
      setCamposExtras({
        placa_cavalo: "placa_cavalo" in successes[0].data,
        placa_carreta_1: "placa_carreta_1" in successes[0].data,
        placa_carreta_2: "placa_carreta_2" in successes[0].data,
      });
    });
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    processFiles(newFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const ativarCampo = (campo) => {
    setCamposExtras((prev) => ({ ...prev, [campo]: true }));
  };

  const payload = {
    viagemData: xmlData,
    login: {
      usuario: userData?.usuario,
      senha: userData?.senha
    }
  };

  const handleSubmit = async (e = null) => {
    if (e) e.preventDefault();
    if (!xmlData || error) return;
      // Adicionando o log para depurar os dados antes de enviar
  
    try {
      const response = await fetch("http://localhost:8000/upload-xml/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setResposta(JSON.stringify(data, null, 2));
      onUploadSuccess();
  
      if (onClose) {
        onClose(); // Fecha o modal após sucesso
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
    }
  };

    const confirmarEnvio = (e) => {
    e.preventDefault();
    // Verifica se algum dos XMLs exige GNRE
    const precisaGNRE = rawXmlFiles.some(xmlStr => necessitaGNRE(xmlStr));
    
    if (precisaGNRE) {
      console.log("precisa de gnre")
      setmodalConfirmacaoGNRE(true);
    } else {
      console.log("Não precisa de gnre")
      handleSubmit(e);
    }
  };

    const confirmarEnvioComGNRE = () => {
      setmodalConfirmacaoGNRE(false); // fecha modal
      handleSubmit(); // envia formulário logo após
    };

  

  return (
    <div className="max-w-2xl items-start mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-base font-semibold text-gray-700 mb-6">Upload de CT-es (XML)</h2>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 max-w-md mx-auto">
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

        {Object.keys(xmlData).length > 0 && !error && (
          <div className="mt-4 text-sm text-gray-700">

            <div className="mt-4 text-sm text-gray-700 space-y-3">
              <div className="flex items-center pr-10 gap-3">
                <Input 
                  value={xmlData.condutor || ""} 
                  type="text" 
                  placeholder={"Condutor"} 
                  onChange={(e) => handleChange("condutor", e.target.value)} 
                />
              </div>

              <div className="flex items-center pr-10 gap-3 w-full">
                <Input
                  value={xmlData.cpf_condutor || ""}
                  type="text"
                  placeholder="CPF do Condutor"
                  onChange={(e) => handleChange("cpf_condutor", e.target.value)}
                />
              </div>


              <div className="flex items-center pr-10 gap-3 w-full">
                <Input
                  value={xmlData.placa_cavalo || ""}
                  type="text"
                  placeholder="Placa Cavalo"
                  onChange={(e) => handleChange("placa_cavalo", e.target.value)}
                />
              </div>
              

              {/* Placa Carreta 1 */}
              {camposExtras.placa_carreta_1 ? (
                <div className="flex items-center pr-10 gap-3 w-full">
                  <Input
                    value={xmlData.placa_carreta_1 || ""}
                    type="text"
                    placeholder="Placa Carreta 1"
                    onChange={(e) => handleChange("placa_carreta_1", e.target.value)}
                  />
                </div>
              ) : (
                <AdicionarCampoBtn onClick={() => ativarCampo("placa_carreta_1")} label="Adicionar Placa Carreta 1" />
              )}

              {/* Placa Carreta 2 */}
              {camposExtras.placa_carreta_2 ? (
                <div className="flex items-center pr-10 gap-3 w-full">
                  <Input
                    value={xmlData.placa_carreta_2 || ""}
                    type="text"
                    placeholder="Placa Carreta 2"
                    onChange={(e) => handleChange("placa_carreta_2", e.target.value)}
                  />
                </div>
              ) : (
                // <AdicionarCampoBtn onClick={() => ativarCampo("placa_carreta_2")} label="Adicionar Placa Carreta 2" />

                <AdicionarCampoBtn
                onClick={() => ativarCampo("placa_carreta_2")}
                label="Adicionar Placa Carreta 2"
                disabled={!camposExtras.placa_carreta_1} // 🔒 só ativa se a 1 estiver ativa
              />
              )}
            </div>

            <p>
              <strong>Valor Total Carga (Somada):</strong>{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(xmlData.valor_total_carga || 0))}
            </p>


            <p><strong>Local Origem:</strong> {xmlData.local_origem}</p>
            <p><strong>Local Destino:</strong> {xmlData.local_destino}</p>
            <p><strong>Remetente Nome:</strong> {xmlData.remetente_nome}</p>
            <p><strong>Remetente CNPJ:</strong> {xmlData.remetente_cnpj}</p>
            <p><strong>Destinatário Nome:</strong> {xmlData.destinatario_nome}</p>
            <p><strong>Destinatário CNPJ:</strong> {xmlData.destinatario_cnpj}</p>
          </div>
        )}

        {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}

        <button
          onClick={confirmarEnvio}
          disabled={
            files.length === 0 ||
            error === "As placas do cavalo são diferentes. O upload não pode ser feito." ||
            xmlData.cpf_condutor === "" ||
            xmlData.condutor === "" ||
            xmlData.placa_cavalo === "" 
          }
          className={`cursor-pointer flex justify-center items-center gap-2 px-4 py-2 rounded text-white transition-colors ${
            files.length === 0 ||
             error === "As placas do cavalo são diferentes. O upload não pode ser feito." ||
             xmlData.cpf_condutor === "" ||
             xmlData.condutor === "" ||
             xmlData.placa_cavalo === ""

              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-600'
          }`}
        >
          <MdFileUpload />
          Enviar XML
        </button>
      </form>
      {modalConfirmacaoGNRE && (
        <AlertaGNRE
          isOpen={confirmarEnvio}
          onClose={confirmarEnvioComGNRE}
        />
      )}

    </div>
    
  );
};

export default NovaSM;
