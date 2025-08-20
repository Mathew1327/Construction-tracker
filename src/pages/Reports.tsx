import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout/Layout";
import { supabase } from "../lib/supabase";
import { FileText, Download } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#4CAF50", "#FF9800", "#F44336", "#2196F3", "#9C27B0"];

interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
}

export function Reports() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("id, category, amount, date")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error.message);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  }

  function getChartData() {
    const grouped: { [key: string]: number } = {};
    expenses.forEach((e) => {
      grouped[e.category] = (grouped[e.category] || 0) + e.amount;
    });
    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }

  function downloadPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Expense Report", 14, 20);

    doc.autoTable({
      startY: 30,
      head: [["Category", "Amount", "Date"]],
      body: expenses.map((e) => [
        e.category,
        e.amount.toFixed(2),
        e.date,
      ]),
    });

    doc.save("expense_report.pdf");
  }

  const chartData = getChartData();

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" /> Reports
          </h1>
          <button
            onClick={downloadPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : expenses.length === 0 ? (
          <p>No expenses found.</p>
        ) : (
          <>
            <div className="bg-white p-4 rounded shadow mb-6 flex justify-center">
              <PieChart width={400} height={300}>
                <Pie
                  data={chartData}
                  cx={200}
                  cy={150}
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Category</th>
                    <th className="p-2 border">Amount</th>
                    <th className="p-2 border">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="p-2 border">{e.category}</td>
                      <td className="p-2 border">{e.amount.toFixed(2)}</td>
                      <td className="p-2 border">{e.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
