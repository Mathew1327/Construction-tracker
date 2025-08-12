import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, FolderOpen, X } from "lucide-react";
import { Layout } from "../components/Layout/Layout";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    type: "Residential",
    location: "",
    manager_id: "",
    start_date: "",
    end_date: ""
  });

  const navigate = useNavigate();

  // Fetch all projects
  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*, manager:profiles(full_name)")
      .order("created_at", { ascending: false });

    if (!error) setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch all managers
  const [managers, setManagers] = useState<any[]>([]);
  const fetchManagers = async () => {
    const { data, error } = await supabase.from("profiles").select("id, full_name");
    if (!error) setManagers(data || []);
  };
  useEffect(() => {
    fetchManagers();
  }, []);

  // Add or update project
  const handleSaveProject = async () => {
    if (!newProject.name || !newProject.type) {
      alert("Please fill required fields");
      return;
    }

    let error;
    if (editingProject) {
      // Update existing project
      ({ error } = await supabase
        .from("projects")
        .update({
          name: newProject.name,
          type: newProject.type,
          location: newProject.location,
          manager_id: newProject.manager_id || null,
          start_date: newProject.start_date || null,
          end_date: newProject.end_date || null
        })
        .eq("id", editingProject.id));
    } else {
      // Insert new project
      ({ error } = await supabase.from("projects").insert([newProject]));
    }

    if (error) {
      console.error("Error saving project:", error.message);
      alert("Failed to save project");
    } else {
      setIsModalOpen(false);
      setEditingProject(null);
      setNewProject({
        name: "",
        type: "Residential",
        location: "",
        manager_id: "",
        start_date: "",
        end_date: ""
      });
      fetchProjects();
    }
  };

  // Open edit modal
  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setNewProject({
      name: project.name || "",
      type: project.type || "Residential",
      location: project.location || "",
      manager_id: project.manager_id || "",
      start_date: project.start_date || "",
      end_date: project.end_date || ""
    });
    setIsModalOpen(true);
  };

  const filteredProjects = projects.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Projects">
      <div className="space-y-6">
        {/* Search + Add */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => {
              setEditingProject(null);
              setNewProject({
                name: "",
                type: "Residential",
                location: "",
                manager_id: "",
                start_date: "",
                end_date: ""
              });
              setIsModalOpen(true);
            }}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
        </div>

        {/* Loading */}
        {loading && <div className="text-center text-gray-500">Loading...</div>}

        {/* Projects */}
        {!loading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white p-6 shadow rounded-lg border space-y-2">
                <h3 className="text-lg font-medium">{project.name}</h3>
                <p className="text-sm text-gray-600">
                  Type: {project.type} | Location: {project.location || "-"}
                </p>
                <p className="text-sm text-gray-600">
                  Manager: {project.manager?.full_name || "-"}
                </p>
                <p className="text-sm text-gray-600">
                  Start: {project.start_date || "-"} | End: {project.end_date || "-"}
                </p>

                <div className="flex gap-2 pt-3">
       

                  <button
                    onClick={() => handleEditProject(project)}
                    className="flex items-center px-3 py-1 bg-yellow-500 text-white text-sm rounded-lg"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filteredProjects.length === 0 && (
          <div className="text-center text-gray-500">No projects found</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                {editingProject ? "Edit Project" : "Add New Project"}
              </h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Project Name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
              <select
                value={newProject.type}
                onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                className="w-full border rounded-lg p-2"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
              <input
                type="text"
                placeholder="Location"
                value={newProject.location}
                onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
              <select
                value={newProject.manager_id}
                onChange={(e) => setNewProject({ ...newProject, manager_id: e.target.value })}
                className="w-full border rounded-lg p-2"
              >
                <option value="">Select Manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
              <input
                type="date"
                value={newProject.start_date}
                onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
              <input
                type="date"
                value={newProject.end_date}
                onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
