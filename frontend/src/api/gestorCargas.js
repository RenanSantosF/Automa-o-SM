import axios from "axios";

const token = localStorage.getItem("token");
const api = axios.create({
  baseURL: "http://localhost:8000/api/gestor-cargas",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
});

export const listarCargas = async () => {
  const res = await api.get("/cargas");
  return res.data;
};

export const criarCarga = async (cargaData) => {
  if (!cargaData) throw new Error("Payload nulo para criarCarga");
  const res = await api.post("/cargas", cargaData);
  return res.data;
};

export const atualizarCarga = async (id, cargaData) => {
  if (!cargaData) throw new Error("Payload nulo para atualizarCarga");
  const res = await api.put(`/cargas/${id}`, cargaData);
  return res.data;
};

export const deletarCarga = async (id) => {
  const res = await api.delete(`/cargas/${id}`);
  return res.data;
};
