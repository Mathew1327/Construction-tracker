import React, { useState, useEffect } from "react";
import { Plus, Search, Download, X } from "lucide-react";
import { Layout } from "../components/Layout/Layout";
import { supabase } from "../lib/supabase";

type Material = {
  id: string;
  name: string;
  qty_required: number;
  unit_cost: number;
  vendor_id: string;
  vendor_name?: string;
};

export function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add material modal state
  const [showModal, setShowModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    qty_required: "",
    unit_cost: "",
    vendor_id: "",
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("materials")
      .select(
        `
        id,
        name,
        qty_required,
        unit_cost,
        vendor_id,
        vendors ( name )
      `
      );

    if (error) {
      setError(error.message);
    } else {
      const mapped = (data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        qty_required: m.qty_required,
        unit_cost: m.unit_cost,
        vendor_id: m.vendor_id,
        vendor_name: m.vendors?.name || "Unknown",
      }));
      setMaterials(mapped);
    }
    setLoading(false);
  };

  const handleAddMaterial = async () => {
    if (
      !newMaterial.name ||
      !newMaterial.qty_required ||
      !newMaterial.unit_cost ||
      !newMaterial.vendor_id
    ) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase.from("materials").insert([
      {
        name: newMaterial.name,
        qty_required: Number(newMaterial.qty_required),
        unit_cost: Number(newMaterial.unit_cost),
        vendor_id: newMaterial.vendor_id,
      },
    ]);

    if (error) {
      alert("Error adding material: " + error.message);
    } else {
      setShowModal(false);
      setNewMaterial({
        name: "",
        qty_required: "",
        unit_cost: "",
        vendor_id: "",
      });
      fetchMaterials();
    }
  };

  const filteredMaterials = materials.filter(
    (material) =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Materials</h1>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Material
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" /> Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials"
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              Loading materials...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : filteredMaterials.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No materials found
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vendor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaterials.map((material) => (
                  <tr key={material.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {material.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {material.qty_required}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      ₹{material.unit_cost}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {material.vendor_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Material Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Add Material</h2>
                <button onClick={() => setShowModal(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Material Name"
                  className="border rounded-lg w-full px-3 py-2"
                  value={newMaterial.name}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, name: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Quantity Required"
                  className="border rounded-lg w-full px-3 py-2"
                  value={newMaterial.qty_required}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      qty_required: e.target.value,
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Unit Cost"
                  className="border rounded-lg w-full px-3 py-2"
                  value={newMaterial.unit_cost}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      unit_cost: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Vendor ID"
                  className="border rounded-lg w-full px-3 py-2"
                  value={newMaterial.vendor_id}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      vendor_id: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={handleAddMaterial}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
