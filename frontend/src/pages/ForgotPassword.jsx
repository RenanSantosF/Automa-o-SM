import { useState } from "react";
import { IoLockClosedOutline } from "react-icons/io5";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false); // controla exibição da mensagem

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Erro ao enviar solicitação");
      setEnviado(true); // marca como enviado
    } catch (err) {
      alert("Falha ao solicitar recuperação de senha"); // mensagem simples de erro
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#222] to-[#444] p-4">
      <div className="bg-[#2b2b2b] border border-gray-700 rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6 text-center">
        <IoLockClosedOutline size={40} className="text-green-400 mx-auto" />
        {!enviado ? (
          <>
            <h2 className="text-2xl font-bold text-green-400">Recuperar Senha</h2>
            <p className="text-gray-400">
              Informe seu e-mail para receber o link de redefinição
            </p>

            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-[#1f1f1f] border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full cursor-pointer bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold transition-all flex justify-center items-center gap-2 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : null}
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-green-400">Solicitação enviada!</h2>
            <p className="text-gray-400">
              Se o e-mail existir no sistema, você receberá um link para redefinir sua senha. <br />
              Verifique a caixa de entrada e também o spam.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
