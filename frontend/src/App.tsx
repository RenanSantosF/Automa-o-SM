import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [resposta, setResposta] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload-pdf/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResposta(data.texto_extraido);
    } catch (error) {
      console.error('Erro ao enviar PDF:', error);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2>Upload de CT-e (PDF)</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button type="submit" style={{ marginLeft: '1rem' }}>
          Enviar
        </button>
      </form>

      {resposta && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Texto extraído:</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{resposta}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
