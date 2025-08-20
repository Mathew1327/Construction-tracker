
// src/pages/Phases.tsx
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, MessageSquare } from "lucide-react";
import { Layout } from "../components/Layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import imageCompression from "browser-image-compression"; // ✅ added

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

  photos?: string[];
};

type PhotoComment = {
  id: string;
  photo_url: string;
  user_id: string;
  comment: string;
  created_at: string;
};

export function Phases() {
  const { userRole, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [comments, setComments] = useState<Record<string, PhotoComment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const [photos, setPhotos] = useState<FileList | null>(null);

  // Permissions
  const canManage = ["Admin", "Project Manager", "Site Engineer"].includes(
    userRole ?? ""
  );

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


  // Fetch phases + photos + comments
  const fetchPhases = async () => {
    const { data, error } = await supabase
      .from("phases")
      .select(`
        id,
        project_id,
        name,
        start_date,
        end_date,
        status,
        projects!inner(name)
      `)
      .order("start_date");

    if (error) {
      console.error("Error fetching phases:", error.message);
      return;
    }

    const mapped: Phase[] = (data || []).map((p: any) => ({
      id: p.id,
      project_id: p.project_id,
      project_name: p.projects?.name || "",
      name: p.name,
      start_date: p.start_date,
      end_date: p.end_date,
      status: p.status,
      photos: [],
    }));

    for (const phase of mapped) {
      const { data: files, error: filesError } = await supabase.storage
        .from("phase-photos")
        .list(phase.id + "/", { limit: 100 });

      if (!filesError && files?.length) {
        const urls = await Promise.all(
          files.map(async (f) => {
            const { data: publicUrl } = supabase.storage
              .from("phase-photos")
              .getPublicUrl(`${phase.id}/${f.name}`);
            return publicUrl.publicUrl;
          })
        );
        phase.photos = urls;

        // Fetch comments for each photo
        for (const url of urls) {
          await fetchComments(url);
        }
      }
    }

    setPhases(mapped);
  };

  const fetchComments = async (photoUrl: string) => {
    const { data, error } = await supabase
      .from("photo_comments")
      .select("*")
      .eq("photo_url", photoUrl)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error.message);
      return;
    }

    setComments((prev) => ({ ...prev, [photoUrl]: data || [] }));
  };

  const addComment = async (photoUrl: string) => {
    const text = newComment[photoUrl];
    if (!text?.trim() || !user) return;

    const { error } = await supabase.from("photo_comments").insert([
      {
        photo_url: photoUrl,
        user_id: user.id,
        comment: text.trim(),
      },
    ]);

    if (error) {
      console.error("Insert comment error:", error.message);
      return;
    }

    setNewComment((prev) => ({ ...prev, [photoUrl]: "" }));
    await fetchComments(photoUrl);

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


  // Save / update
  const savePhase = async () => {
    if (!form.project_id) return alert("Please select a project.");
    if (!form.name) return alert("Please enter a phase name.");

    if (editingPhase) {
      const { error } = await supabase
        .from("phases")
        .update({ ...form })
        .eq("id", editingPhase.id);

      if (error) console.error("Update error:", error.message);
      else {
        if (photos && photos.length > 0) {
          for (let i = 0; i < photos.length; i++) {
            const file = photos[i];

            // ✅ compress image before uploading
            const compressedFile = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1280,
              useWebWorker: true,
            });

            const filePath = `${editingPhase.id}/${file.name}`;

            const { error: uploadError } = await supabase.storage
              .from("phase-photos")
              .upload(filePath, compressedFile, {
                upsert: true,
              });

            if (uploadError) {
              console.error(uploadError);
            } else {
              // ✅ get public URL
              const { data: publicUrl } = supabase.storage
                .from("phase-photos")
                .getPublicUrl(filePath);

              // ✅ insert into phase_photos table
              await supabase.from("phase_photos").insert([
                {
                  phase_id: editingPhase.id,
                  uploaded_by: user?.id,
                  photo_url: publicUrl.publicUrl,
                },
              ]);
            }
          }
        }
        setShowModal(false);
        setEditingPhase(null);

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

        setPhotos(null);
        fetchPhases();
      }
    } else {
      const { error } = await supabase.from("phases").insert([form]).select();
      if (error) console.error("Insert error:", error.message);

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


  const editPhase = (phase: Phase) => {
    setEditingPhase(phase);

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

    setShowModal(true);
  };

  const deletePhase = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this phase?")) return;
    const { error } = await supabase.from("phases").delete().eq("id", id);
    if (error) console.error("Delete error:", error.message);

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


        {/* Add Phase form - only for Admin/PM/Engineer */}
        {canManage && (
          <div className="mb-6 p-4 border rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={form.project_id}
                onChange={(e) =>
                  setForm({ ...form, project_id: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
                className="border rounded p-2"
              />

              <input
                type="date"
                value={form.end_date}
                onChange={(e) =>
                  setForm({ ...form, end_date: e.target.value })
                }
                className="border rounded p-2"
              />

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as
                      | "Not Started"
                      | "In Progress"
                      | "Completed",
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
              Add Phase
            </button>
          </div>
        )}

        {/* Phase list */}
        <div className="space-y-8">
          {phases.map((phase) => (
            <div key={phase.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{phase.name}</h2>
                  <p className="text-sm text-gray-500">
                    {phase.project_name} • {phase.status}
                  </p>
                  <p className="text-xs text-gray-400">
                    {phase.start_date} → {phase.end_date}
                  </p>
                </div>

                {/* Only managers can edit/delete */}
                {canManage && (
                  <div className="flex gap-2">
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
                  </div>
                )}
              </div>

              {/* Photos + Comments */}
              {phase.photos && phase.photos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {phase.photos.map((url, i) => (
                    <div key={i} className="border rounded-lg p-2">
                      <img
                        src={url}
                        alt="phase"
                        className="w-full h-48 object-cover rounded-lg"
                      />

                      {/* Comments */}
                      <div className="mt-2">
                        <h3 className="font-semibold flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" /> Comments
                        </h3>
                        <div className="space-y-1 max-h-32 overflow-y-auto text-sm text-gray-700">
                          {(comments[url] || []).map((c) => (
                            <p key={c.id} className="border-b pb-1">
                              {c.comment}
                            </p>
                          ))}
                        </div>

                        {/* Anyone logged in (client/admin/etc.) can comment */}
                        {user && (
                          <div className="flex mt-2 gap-2">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              value={newComment[url] || ""}
                              onChange={(e) =>
                                setNewComment((prev) => ({
                                  ...prev,
                                  [url]: e.target.value,
                                }))
                              }
                              className="border rounded p-1 flex-1"
                            />
                            <button
                              onClick={() => addComment(url)}
                              className="px-2 bg-blue-600 text-white rounded"
                            >
                              Post
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {showModal && editingPhase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Phase</h2>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Phase Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border rounded p-2 w-full mb-3"
              />

              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
                className="border rounded p-2 w-full mb-3"
              />

              <input
                type="date"
                value={form.end_date}
                onChange={(e) =>
                  setForm({ ...form, end_date: e.target.value })
                }
                className="border rounded p-2 w-full mb-3"
              />

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as
                      | "Not Started"
                      | "In Progress"
                      | "Completed",
                  })
                }
                className="border rounded p-2 w-full mb-3"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              {/* Upload photos only if Site Engineer */}
              {userRole?.toLowerCase() === "site engineer" && (
                <input
                  type="file"
                  multiple
                  onChange={(e) => setPhotos(e.target.files)}
                  className="border rounded p-2 w-full mb-3"
                />
              )}

              <button
                onClick={savePhase}
                className="w-full bg-green-600 text-white p-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        )}

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
