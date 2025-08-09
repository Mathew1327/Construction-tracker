import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderOpen,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Layout } from "../components/Layout/Layout";
import { supabase } from "../lib/supabase";

export function Dashboard() {
  const [stats, setStats] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Active Projects
      const { data: projects } = await supabase.from("projects").select("*");

      // Total Expenses
      const { data: expenses } = await supabase.from("expenses").select("amount");

      // Materials Stock
      const { data: materials } = await supabase
        .from("materials")
        .select("qty_required");

      // Team Members (from profiles)
      const { data: teamMembers } = await supabase
        .from("profiles")
        .select("*");

      setStats([
        {
          name: "Active Projects",
          value: projects?.length || 0,
          change: "",
          icon: FolderOpen,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          href: "/projects",
        },
        {
          name: "Total Expenses",
          value: `$${(expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0).toLocaleString()}`,
          change: "",
          icon: DollarSign,
          color: "text-green-600",
          bgColor: "bg-green-100",
          href: "/expenses",
        },
        {
          name: "Materials Stock",
          value: materials?.reduce((sum, m) => sum + (m.qty_required || 0), 0) || 0,
          change: "",
          icon: Package,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          href: "/materials",
        },
        {
          name: "Team Members",
          value: teamMembers?.length || 0,
          change: "",
          icon: Users,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          href: "/users",
        },
      ]);
    };

    const fetchRecentActivities = async () => {
      const { data: phases } = await supabase
        .from("phases")
        .select("name, status, end_date")
        .order("end_date", { ascending: false })
        .limit(3);

      const { data: recentExpenses } = await supabase
        .from("expenses")
        .select("amount, date, phase_id")
        .order("date", { ascending: false })
        .limit(2);

      let activities: any[] = [];

      phases?.forEach((p) => {
        activities.push({
          id: `phase-${p.name}`,
          type: "project",
          message: `Phase "${p.name}" status: ${p.status}`,
          time: p.end_date ? new Date(p.end_date).toLocaleDateString() : "No date",
          icon: CheckCircle,
          color: "text-green-500",
        });
      });

      recentExpenses?.forEach((e) => {
        activities.push({
          id: `expense-${e.phase_id}`,
          type: "expense",
          message: `Expense of $${e.amount} recorded`,
          time: e.date ? new Date(e.date).toLocaleDateString() : "No date",
          icon: DollarSign,
          color: "text-blue-500",
        });
      });

      setRecentActivities(activities.slice(0, 5));
    };

    fetchData();
    fetchRecentActivities();
  }, []);

  // ✅ Updated Quick Actions to go to main sections
  const quickActions = [
    {
      name: "Add New Project",
      description: "Create a new construction project",
      icon: FolderOpen,
      href: "/projects", // changed
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      name: "Log Expense",
      description: "Record a new project expense",
      icon: DollarSign,
      href: "/expenses", // changed
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      name: "Material Request",
      description: "Request materials for project",
      icon: Package,
      href: "/materials", // changed
      color: "bg-yellow-600 hover:bg-yellow-700",
    },
    {
      name: "Generate Report",
      description: "Create project or financial report",
      icon: TrendingUp,
      href: "/reports", // changed
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.name}
                to={stat.href}
                className="bg-white overflow-hidden shadow-sm rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 ${stat.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  {stat.change && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-600">{stat.change}</div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white shadow-sm rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.name}
                      to={action.href}
                      className={`${action.color} text-white p-4 rounded-lg text-center transition-colors`}
                    >
                      <Icon className="h-8 w-8 mx-auto mb-2" />
                      <h4 className="font-medium">{action.name}</h4>
                      <p className="text-sm opacity-90 mt-1">{action.description}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow-sm rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${activity.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
