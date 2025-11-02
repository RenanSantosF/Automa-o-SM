import { motion } from 'framer-motion';
import { FaFilePdf, FaFileExcel, FaFileCsv, FaChartBar } from 'react-icons/fa';

export default function RelatorioActions({ onGerar, exportarPDF, exportarExcel, exportarCSV, loading }) {
  return (
    <div className="flex justify-end gap-3 mt-4">
      <button
        onClick={onGerar}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition font-medium flex items-center gap-2"
      >
        <FaChartBar /> Gerar
      </button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={exportarPDF}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition font-medium"
        disabled={loading}
      >
        <FaFilePdf /> PDF
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={exportarExcel}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition font-medium"
        disabled={loading}
      >
        <FaFileExcel /> Excel
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={exportarCSV}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-medium"
        disabled={loading}
      >
        <FaFileCsv /> CSV
      </motion.button>
    </div>
  );
}
