import React, { useEffect, useState } from 'react';
import { Search, Download, Eye, Upload } from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { supabase } from '../lib/supabase';

type DocRecord = {
  id: string;
  name: string;
  category?: string;
  project?: string;
  uploaded_by?: string;
  upload_date?: string;
  size?: string;
  version?: string;
  type?: string;
  status?: string;
  file_path?: string;
};

type Project = {
  id: string;
  name: string;
};

const constructionCategories = [
  'Site Plan',
  'Building Permit',
  'Structural Drawings',
  'Electrical Plans',
  'Plumbing Plans',
  'HVAC Plans',
  'Material Specifications',
  'Safety Certificates',
  'Inspection Reports',
  'Completion Certificate',
];

export function Documents() {
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [project, setProject] = useState('');

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);

  async function fetchDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error.message);
    } else {
      setDocuments(data || []);
    }
  }

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error.message);
    } else {
      setProjects(data || []);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }
    if (!category || !project) {
      alert('Please select both a category and project');
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      alert('You must be logged in to upload documents');
      return;
    }

    const userId = userData.user.id;
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('project-docs')
      .upload(filePath, selectedFile);

    if (uploadError) {
      console.error('Error uploading file:', uploadError.message);
      alert('Upload failed');
      return;
    }

    const { error: insertError } = await supabase.from('documents').insert([
      {
        name: selectedFile.name,
        category,
        project,
        uploaded_by: userId,
        file_path: filePath,
        type: fileExt,
        size: `${(selectedFile.size / 1024).toFixed(2)} KB`,
        status: 'pending',
      },
    ]);

    if (insertError) {
      console.error('Failed to save document metadata:', insertError.message);
      alert('Failed to save document metadata');
    } else {
      alert('Document uploaded successfully!');
      setSelectedFile(null);
      setCategory('');
      setProject('');
      fetchDocuments();
    }
  }

  async function handleDownload(filePath: string, fileName: string) {
    const { data, error } = await supabase.storage
      .from('project-docs')
      .download(filePath);

    if (error) {
      console.error('Error downloading file:', error.message);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <h1 className="text-xl font-bold">Documents</h1>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="border px-2 py-1 rounded"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="cursor-pointer" />
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <select
            className="border px-2 py-1 rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            {constructionCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            className="border px-2 py-1 rounded"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            <option value="">Select Project</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.name}>
                {proj.name}
              </option>
            ))}
          </select>
          <button
            className="bg-blue-500 text-white px-4 py-1 rounded flex items-center gap-1"
            onClick={handleUpload}
          >
            <Upload size={16} /> Upload
          </button>
        </div>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Project</th>
              <th className="p-2 border">Uploaded By</th>
              <th className="p-2 border">Upload Date</th>
              <th className="p-2 border">Size</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents
              .filter((doc) =>
                doc.name?.toLowerCase().includes(search.toLowerCase())
              )
              .map((doc) => (
                <tr key={doc.id}>
                  <td className="p-2 border">{doc.name}</td>
                  <td className="p-2 border">{doc.category}</td>
                  <td className="p-2 border">{doc.project}</td>
                  <td className="p-2 border">{doc.uploaded_by}</td>
                  <td className="p-2 border">
                    {doc.upload_date
                      ? new Date(doc.upload_date).toLocaleDateString()
                      : ''}
                  </td>
                  <td className="p-2 border">{doc.size}</td>
                  <td className="p-2 border flex gap-2">
                    <Eye
                      className="cursor-pointer"
                      onClick={() =>
                        window.open(
                          supabase.storage
                            .from('project-docs')
                            .getPublicUrl(doc.file_path || '').data.publicUrl,
                          '_blank'
                        )
                      }
                    />
                    <Download
                      className="cursor-pointer"
                      onClick={() =>
                        handleDownload(doc.file_path || '', doc.name || '')
                      }
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
