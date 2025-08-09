import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Eye, Upload, FileText, Image, Archive } from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { supabase } from '../lib/supabase';

export function Documents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['Blueprints', 'Invoices', 'Photos', 'Reports', 'Permits', 'Contracts'];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents') // <-- Your documents table in Supabase
      .select(`
        id,
        name,
        category,
        project,
        uploaded_by,
        upload_date,
        size,
        version,
        type,
        status
      `);

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'zip':
        return <Archive className="h-5 w-5 text-orange-500" />;
      case 'jpg':
      case 'png':
        return <Image className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.project?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalSize = documents.reduce((sum, doc) => {
    if (!doc.size) return sum;
    const size = parseFloat(doc.size.split(' ')[0]);
    const unit = doc.size.split(' ')[1];
    return sum + (unit === 'MB' ? size : size / 1000);
  }, 0);

  return (
    <Layout title="Document Archive">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border p-5">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Total Documents</dt>
                <dd className="text-lg font-semibold">{documents.length}</dd>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border p-5">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">✓</div>
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Approved</dt>
                <dd className="text-lg font-semibold">
                  {documents.filter(d => d.status === 'approved').length}
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border p-5">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">#</div>
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Categories</dt>
                <dd className="text-lg font-semibold">{categories.length}</dd>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border p-5">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">MB</div>
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Total Size</dt>
                <dd className="text-lg font-semibold">{totalSize.toFixed(1)} MB</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </button>
        </div>

        {/* Documents List */}
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="bg-white shadow-sm rounded-lg border p-6 hover:shadow-md">
                <div className="flex justify-between">
                  <div className="flex space-x-3">
                    {getFileIcon(document.type)}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 truncate">{document.name}</h3>
                      <p className="text-sm text-gray-500">Project: {document.project}</p>
                      <p className="text-sm text-gray-500">Category: {document.category}</p>
                      <p className="text-sm text-gray-500">Size: {document.size} • Version: {document.version}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}>
                    {document.status}
                  </span>
                </div>
                <div className="mt-4 flex justify-between text-sm text-gray-500">
                  <div>
                    <p>Uploaded by {document.uploaded_by}</p>
                    <p>{document.upload_date ? new Date(document.upload_date).toLocaleDateString() : ''}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-4 w-4" /></button>
                    <button className="p-2 hover:text-green-600 hover:bg-green-50 rounded-lg"><Download className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
