import React, { useState, useEffect } from "react";
import { Plus, Search, Download, X } from "lucide-react";
import { Layout } from "../components/Layout/Layout";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";

interface Expense {
  id: string;
  project_name: string;
  phase_name: string;
  category: string;
  amount: number;
  date: string;
  proof_url?: string;
}

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [phaseId, setPhaseId] = useState("");
  const [category, setCategory] = useState("Labour");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const [phases, setPhases] = useState<{ id: string; name: string; project_name: string }[]>([]);

  useEffect(() => {
    fetchExpenses();
    fetchPhases();
  }, []);

  async function fetchExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        id,
        category,
        amount,
        date,
        proof_url,
        phases (
          name,
          projects ( name )
        )
      `)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
    } else {
      const formatted = data.map((e: any) => ({
        id: e.id,
        category: e.category,
        amount: e.amount,
        date: e.date,
        proof_url: e.proof_url,
        phase_name: e.phases?.name || "",
        project_name: e.phases?.projects?.name || "",
      }));
      setExpenses(formatted);
    }
  }

  async function fetchPhases() {
    const { data, error } = await supabase
      .from("phases")
      .select(`
        id,
        name,
        projects ( name )
      `);

    if (error) {
      console.error("Error fetching phases:", error);
    } else {
      const formatted = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        project_name: p.projects?.name || "",
      }));
      setPhases(formatted);
    }
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("expenses").insert([
      {
        phase_id: phaseId,
        category,
        amount: parseFloat(amount),
        date: date || new Date().toISOString().split("T")[0],
        proof_url: proofUrl || null,
      },
    ]);

    if (error) {
      console.error("Insert Error:", error);
    } else {
      fetchExpenses();
      setShowForm(false);
      setPhaseId("");
      setCategory("Labour");
      setAmount("");
      setDate("");
      setProofUrl("");
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Expenses</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <Plus className="mr-2" size={18} /> Add Expense
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center mb-4">
          <Search className="mr-2" size={18} />
          <input
            type="text"
            placeholder="Search expenses..."
            className="border p-2 rounded w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Project</th>
              <th className="p-2 border">Phase</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Proof</th>
            </tr>
          </thead>
          <tbody>
            {expenses
              .filter((e) =>
                e.project_name.toLowerCase().includes(search.toLowerCase()) ||
                e.phase_name.toLowerCase().includes(search.toLowerCase()) ||
                e.category.toLowerCase().includes(search.toLowerCase())
              )
              .map((e) => (
                <tr key={e.id}>
                  <td className="p-2 border">{e.project_name}</td>
                  <td className="p-2 border">{e.phase_name}</td>
                  <td className="p-2 border">{e.category}</td>
                  <td className="p-2 border">₹{e.amount}</td>
                  <td className="p-2 border">{format(new Date(e.date), "yyyy-MM-dd")}</td>
                  <td className="p-2 border">
                    {e.proof_url ? (
                      <a href={e.proof_url} target="_blank" rel="noreferrer" className="text-blue-600">
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Add Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Expense</h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={addExpense} className="space-y-4">
                <div>
                  <label className="block font-medium">Phase</label>
                  <select
                    className="border p-2 rounded w-full"
                    value={phaseId}
                    onChange={(e) => setPhaseId(e.target.value)}
                    required
                  >
                    <option value="">Select Phase</option>
                    {phases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium">Category</label>
                  <select
                    className="border p-2 rounded w-full"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Labour</option>
                    <option>Materials</option>
                    <option>Equipment</option>
                    <option>Transport</option>
                    <option>Misc</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 rounded w-full"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium">Date</label>
                  <input
                    type="date"
                    className="border p-2 rounded w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium">Proof URL</label>
                  <input
                    type="url"
                    className="border p-2 rounded w-full"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
