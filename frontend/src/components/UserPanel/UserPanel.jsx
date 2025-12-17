

import { useState } from "react";
import UsersAdmin from "./UsersAdmin";
import GroupsAdmin from "./GroupsAdmin";

export default function AdminPanel() {
  const [tab, setTab] = useState("users");

  return (
    <div className="min-h-screen bg-[#222] text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-green-400 mb-6">
        Painel Administrativo
      </h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-sm border ${
            tab === "users"
              ? "bg-green-600 border-green-600"
              : "border-gray-600 hover:bg-gray-700"
          }`}
        >
          Usuários
        </button>

        <button
          onClick={() => setTab("groups")}
          className={`px-4 py-2 rounded-sm border ${
            tab === "groups"
              ? "bg-green-600 border-green-600"
              : "border-gray-600 hover:bg-gray-700"
          }`}
        >
          Grupos
        </button>
      </div>

      {tab === "users" ? <UsersAdmin /> : <GroupsAdmin />}
    </div>
  );
}
