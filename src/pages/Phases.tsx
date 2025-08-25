// src/pages/Phases.tsx
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, MessageSquare, Check } from "lucide-react";
import { Layout } from "../components/Layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import imageCompression from "browser-image-compression";

type Project = { id: string; name: string };

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
  full_name?: string | null;
};

export function Phases() {
  const { userRole, user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [comments, setComments] = useState<Record<string, PhotoComment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [editingComment, setEditingComment] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    project_id: "",
    name: "",
    start_date: "",
    end_date: "",
    status: "Not Started" as "Not Started" | "In Progress" | "Completed",
  });
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [photos, setPhotos] = useState<FileList | null>(null);

  const canManage = ["Admin", "Project Manager", "Site Engineer"].includes(userRole ?? "");

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase.from("projects").select("id, name").order("name");
      if (error) console.error("Error fetching projects:", error.message);
      else setProjects(data || []);
    };
    fetchProjects();
  }, []);

  // Fetch phases + photos + comments
  const fetchPhases = async () => {
    const { data, error } = await supabase
      .from("phases")
      .select(
        `id, project_id, name, start_date, end_date, status, projects!inner(name)`
      )
      .order("start_date");

    if (error) return console.error("Error fetching phases:", error.message);

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
        .list(`${phase.id}/`, { limit: 100 });

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

        for (const url of urls) {
          await fetchComments(url);
        }
      }
    }

    setPhases(mapped);
  };

  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchComments = async (photoUrl: string) => {
    const { data, error } = await supabase
      .from("photo_comments")
      .select("id, photo_url, user_id, comment, created_at")
      .eq("photo_url", photoUrl)
      .order("created_at", { ascending: true });

    if (error) return console.error("Error fetching comments:", error.message);

    const withNames: PhotoComment[] = await Promise.all(
      (data || []).map(async (c) => {
        let fullName: string | null = null;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", c.user_id)
          .single();
        if (profile) fullName = profile.full_name;
        return { ...c, full_name: fullName };
      })
    );

    setComments((prev) => ({ ...prev, [photoUrl]: withNames }));
  };

  const addComment = async (photoUrl: string) => {
    const text = newComment[photoUrl];
    if (!text?.trim() || !user) return;

    const { error } = await supabase.from("photo_comments").insert([
      { photo_url: photoUrl, user_id: user.id, comment: text.trim() },
    ]);

    if (error) console.error("Insert comment error:", error.message);
    else {
      setNewComment((prev) => ({ ...prev, [photoUrl]: "" }));
      await fetchComments(photoUrl);
    }
  };

  const updateComment = async (commentId: string, photoUrl: string) => {
    const text = editingComment[commentId];
    if (!text?.trim()) return;

    const { error } = await supabase
      .from("photo_comments")
      .update({ comment: text.trim() })
      .eq("id", commentId);

    if (error) console.error("Update comment error:", error.message);
    else {
      setEditingComment((prev) => {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      });
      await fetchComments(photoUrl);
    }
  };

  const deleteComment = async (commentId: string, photoUrl: string) => {
    if (!window.confirm("Delete this comment?")) return;
    const { error } = await supabase.from("photo_comments").delete().eq("id", commentId);
    if (error) console.error("Delete comment error:", error.message);
    else await fetchComments(photoUrl);
  };

  const savePhase = async () => {
    if (!form.project_id) return alert("Please select a project.");
    if (!form.name) return alert("Please enter a phase name.");

    if (editingPhase) {
      const { error } = await supabase.from("phases").update({ ...form }).eq("id", editingPhase.id);

      if (error) console.error("Update error:", error.message);
      else {
        if (photos && photos.length > 0) {
          for (let i = 0; i < photos.length; i++) {
            const file = photos[i];
            const compressedFile = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1280,
              useWebWorker: true,
            });
            const filePath = `${editingPhase.id}/${file.name}`;

            const { error: uploadError } = await supabase.storage
              .from("phase-photos")
              .upload(filePath, compressedFile, { upsert: true });

            if (uploadError) console.error(uploadError);
            else {
              const { data: publicUrl } = supabase.storage
                .from("phase-photos")
                .getPublicUrl(filePath);

              await supabase.from("phase_photos").insert([
                { phase_id: editingPhase.id, uploaded_by: user?.id, photo_url: publicUrl.publicUrl },
              ]);
            }
          }
        }

        setEditingPhase(null);
        setShowModal(false);
        setPhotos(null);
        setForm({ project_id: "", name: "", start_date: "", end_date: "", status: "Not Started" });
        fetchPhases();
      }
    } else {
      const { error } = await supabase.from("phases").insert([form]);
      if (error) console.error("Insert error:", error.message);
      else {
        setForm({ project_id: "", name: "", start_date: "", end_date: "", status: "Not Started" });
        fetchPhases();
      }
    }
  };

  const editPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setForm({
      project_id: phase.project_id,
      name: phase.name,
      start_date: phase.start_date,
      end_date: phase.end_date,
      status: phase.status,
    });
    setShowModal(true);
  };

  const deletePhase = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this phase?")) return;
    const { error } = await supabase.from("phases").delete().eq("id", id);
    if (error) console.error("Delete error:", error.message);
    else fetchPhases();
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Phases</h1>

        {/* Add / Edit Phase form always visible for roles that can manage */}
        {canManage && (
          <div className="mb-6 p-4 border rounded-lg">
            <select className="border p-2 rounded w-full mb-2" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">Select Project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="text" className="border p-2 rounded w-full mb-2" placeholder="Phase Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="date" className="border p-2 rounded w-full mb-2" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <input type="date" className="border p-2 rounded w-full mb-2" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            <select className="border p-2 rounded w-full mb-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Phase["status"] })}>
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
            <input type="file" multiple onChange={(e) => setPhotos(e.target.files)} className="mb-2"/>
            <button onClick={savePhase} className="bg-blue-600 text-white p-2 rounded w-full">{editingPhase ? "Update Phase" : "Add Phase"}</button>
          </div>
        )}

        {/* Phase List */}
        <div className="space-y-8">
          {phases.map((phase) => (
            <div key={phase.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">{phase.name} <span className="text-gray-500 text-sm">({phase.project_name})</span></h2>
                {canManage && (
                  <div className="flex gap-2">
                    <button onClick={() => editPhase(phase)} className="text-blue-600"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => deletePhase(phase.id)} className="text-red-600"><Trash2 className="w-5 h-5" /></button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-700">{phase.start_date} → {phase.end_date} | <span className="font-medium">{phase.status}</span></p>

              {/* Photos + Comments */}
              {phase.photos && phase.photos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {phase.photos.map((url, i) => (
                    <div key={i} className="border rounded-lg p-2">
                      <img src={url} alt="phase" className="w-full h-48 object-cover rounded-lg" />

                      <div className="mt-2">
                        <h3 className="font-semibold flex items-center gap-1"><MessageSquare className="w-4 h-4"/> Comments</h3>
                        <div className="space-y-1 max-h-32 overflow-y-auto text-sm text-gray-700">
                          {(comments[url] || []).map((c) => (
                            <div key={c.id} className="border-b pb-1 flex justify-between items-center">
                              <div className="flex-1">
                                <span className="font-semibold">{c.full_name || "Unknown"}:</span>{" "}
                                {editingComment[c.id] !== undefined ? (
                                  <input type="text" value={editingComment[c.id]} onChange={(e) => setEditingComment(prev => ({ ...prev, [c.id]: e.target.value }))} className="border rounded p-1 w-full text-sm"/>
                                ) : c.comment}
                              </div>
                              {user?.id === c.user_id && (
                                <div className="flex gap-1 ml-2">
                                  {editingComment[c.id] !== undefined ? (
                                    <button onClick={() => updateComment(c.id, url)} className="text-green-600"><Check className="w-4 h-4"/></button>
                                  ) : (
                                    <button onClick={() => setEditingComment(prev => ({ ...prev, [c.id]: c.comment }))} className="text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                  )}
                                  <button onClick={() => deleteComment(c.id, url)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {user && (
                          <div className="flex mt-2 gap-2">
                            <input type="text" placeholder="Add a comment..." value={newComment[url] || ""} onChange={(e) => setNewComment(prev => ({ ...prev, [url]: e.target.value }))} className="border rounded p-1 flex-1"/>
                            <button onClick={() => addComment(url)} className="px-2 bg-blue-600 text-white rounded">Post</button>
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

        {/* Edit Modal (if needed) */}
        {showModal && editingPhase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            {/* You can keep your modal code unchanged here */}
          </div>
        )}
      </div>
    </Layout>
  );
}
