import React, { useEffect, useState } from "react";

const api = import.meta.env.VITE_API_URL;

const StatusScrapingNfe = () => {
  const [status, setStatus] = useState(null);

  const buscarStatus = async () => {
    try {
      const resp = await fetch(`${api}/status-nfe`);
      if (!resp.ok) throw new Error("Erro ao buscar status");
      const data = await resp.json();
      setStatus(data);
    } catch (err) {
      console.error("Erro ao buscar status:", err.message);
    }
  };

  useEffect(() => {
    buscarStatus();
    const interval = setInterval(buscarStatus, 3000); // atualiza a cada 3s
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const progresso = Math.floor((status.atual / status.total) * 100);

  return (
    <div className="w-full mt-6 bg-gray-100 p-4 rounded shadow">
      <div className="mb-2 text-sm text-gray-700">
        {status.status} ({status.atual}/{status.total})
      </div>
      <div className="w-full bg-gray-300 h-4 rounded">
        <div
          className="bg-green-600 h-4 rounded"
          style={{ width: `${progresso}%` }}
        />
      </div>
    </div>
  );
};

export default StatusScrapingNfe;
