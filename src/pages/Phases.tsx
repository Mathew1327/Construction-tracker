import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Layout } from "../components/Layout/Layout";
import { supabase } from "../lib/supabase";

type Project = {
  id: string;
  name: string;
};

type Phase = {
  id: string;
  project_id: string;
  project_name?: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "Not Started" | "In Progress" | "Completed";
};

export function Phases() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    project_id: "",
    name: "",
    start_date: "",
    end_date: "",
    status: "Not Started" as "Not Started" | "In Progress" | "Completed",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");

      if (error) console.error("Error fetching projects:", error.message);
      else setProjects(data || []);
    };
    fetchProjects();
  }, []);

  // Fetch phases
  const fetchPhases = async () => {
    const { data, error } = await supabase
      .from("phases")
      .select("id, project_id, name, start_date, end_date, status, projects(name)")
      .order("start_date");

    if (error) console.error("Error fetching phases:", error.message);
    else {
      const mapped = data?.map((p: any) => ({
        id: p.id,
        project_id: p.project_id,
        project_name: p.projects?.name || "",
        name: p.name,
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status,
      }));
      setPhases(mapped || []);
    }
  };

  useEffect(() => {
    fetchPhases();
  }, []);

  // Save phase
  const savePhase = async () => {
    if (!form.project_id) {
      alert("Please select a project.");
      return;
    }
    if (!form.name) {
      alert("Please enter a phase name.");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("phases")
        .update({
          project_id: form.project_id,
          name: form.name,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          status: form.status,
        })
        .eq("id", editingId);

      if (error) console.error("Error updating phase:", error.message);
      else {
        setEditingId(null);
        setForm({
          project_id: "",
          name: "",
          start_date: "",
          end_date: "",
          status: "Not Started",
        });
        fetchPhases();
      }
    } else {
      const { error } = await supabase.from("phases").insert([
        {
          project_id: form.project_id,
          name: form.name,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          status: form.status,
        },
      ]);

      if (error) console.error("Error inserting phase:", error.message);
      else {
        setForm({
          project_id: "",
          name: "",
          start_date: "",
          end_date: "",
          status: "Not Started",
        });
        fetchPhases();
      }
    }
  };

  // Edit phase
  const editPhase = (phase: Phase) => {
    setEditingId(phase.id);
    setForm({
      project_id: phase.project_id,
      name: phase.name,
      start_date: phase.start_date || "",
      end_date: phase.end_date || "",
      status: phase.status,
    });
  };

  // Delete phase
  const deletePhase = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this phase?")) return;
    const { error } = await supabase.from("phases").delete().eq("id", id);
    if (error) console.error("Error deleting phase:", error.message);
    else fetchPhases();
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Phases</h1>

        {/* Form */}
        <div className="mb-6 p-4 border rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="border rounded p-2"
            >
              <option value="">Select Project</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Phase Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded p-2"
            />

            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="border rounded p-2"
            />

            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="border rounded p-2"
            />

            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as "Not Started" | "In Progress" | "Completed",
                })
              }
              className="border rounded p-2"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <button
            onClick={savePhase}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            {editingId ? "Update Phase" : "Add Phase"}
          </button>
        </div>

        {/* Table */}
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-2 border">Project</th>
              <th className="p-2 border">Phase Name</th>
              <th className="p-2 border">Start Date</th>
              <th className="p-2 border">End Date</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {phases.map((phase) => (
              <tr key={phase.id} className="border-b">
                <td className="p-2 border">{phase.project_name}</td>
                <td className="p-2 border">{phase.name}</td>
                <td className="p-2 border">{phase.start_date}</td>
                <td className="p-2 border">{phase.end_date}</td>
                <td className="p-2 border">{phase.status}</td>
                <td className="p-2 border flex gap-2">
                  <button
                    onClick={() => editPhase(phase)}
                    className="text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePhase(phase.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
