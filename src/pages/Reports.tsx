import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { supabase } from '../lib/supabase';
import { FileText, Download } from 'lucide-react';

type Report = {
  id: string; // uuid
  title: string;
  report_type: string;
  file_url: string;
  created_at: string;
  project_id: string;
  projects?: {
    name: string;
  };
};

export function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          report_type,
          file_url,
          created_at,
          project_id,
          projects ( name )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setReports(data || []);
      }
      setLoading(false);
    };

    fetchReports();
  }, []);

  const handleDownload = (fileUrl: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Reports</h1>

        {loading && <p className="text-gray-500">Loading reports...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && reports.length === 0 && (
          <p className="text-gray-500">No reports found.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-medium">{report.title}</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Type: {report.report_type}
                </p>
                <p className="text-sm text-gray-600">
                  Project: {report.projects?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => handleDownload(report.file_url)}
                className="mt-4 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
