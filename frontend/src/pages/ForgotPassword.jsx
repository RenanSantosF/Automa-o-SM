import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoLockClosedOutline } from "react-icons/io5";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error();
      setEnviado(true);
    } catch {
      alert("Falha ao solicitar recuperação de senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0e0d0d] via-[#272729] to-[#1b1d22] p-4">
      
      {/* Luz ambiental */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,130,255,0.06),transparent_65%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-xl rounded-md px-10 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center"
      >
        <IoLockClosedOutline size={42} className="mx-auto mb-6 text-green-400" />

        <AnimatePresence mode="wait">
          {!enviado ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-semibold text-white">
                Recuperar senha
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                Informe seu e-mail para receber o link de redefinição
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-transparent px-1 pb-2 text-white placeholder-gray-400 outline-none border-b border-white/20 focus:border-green-400 transition"
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-sm bg-green-500 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-60"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-2xl font-semibold text-green-400">
                Solicitação enviada
              </h2>

              <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                Se o e-mail existir no sistema, você receberá um link para redefinir sua senha.
                <br />
                Verifique também a caixa de spam.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
