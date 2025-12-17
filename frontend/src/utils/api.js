const api = import.meta.env.VITE_API_URL;

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${api}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(data?.detail || data || "Erro inesperado");
  }

  return data;
}
