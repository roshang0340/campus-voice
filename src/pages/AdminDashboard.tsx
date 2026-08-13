import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Complaint, Analytics } from '../types';
import { ShieldCheck, BarChart3, PieChart as PieChartIcon, Users, MessageSquare, CheckCircle2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminDashboard({ user }: { user: User }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<'Registered' | 'Under Review' | 'Action In Progress' | 'Action Taken'>('Under Review');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [complaintsRes, analyticsRes] = await Promise.all([
        axios.get('/api/complaints', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/analytics', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setComplaints(complaintsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectComplaint = async (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setStatus(complaint.status as any);
    setResponse(complaint.response || '');

    if (!complaint.is_viewed) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.patch(`/api/complaints/${complaint.id}/view`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComplaints(prev => prev.map(c => c.id === complaint.id ? { ...c, is_viewed: 1, viewed_by: res.data.viewed_by } : c));
      } catch (err) {
        console.error('Failed to mark complaint as viewed', err);
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/complaints/${selectedComplaint.id}`, { status, response }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedComplaint(null);
      setResponse('');
      fetchData();
    } catch (err) {
      console.error('Failed to update complaint', err);
    } finally {
      setUpdating(false);
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Registered': return <Clock className="w-4 h-4 text-neutral-500" />;
      case 'Under Review': return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      case 'Action In Progress': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'Action Taken': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return null;
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Low': return 'bg-blue-100 text-blue-700';
      case 'Medium': return 'bg-amber-100 text-amber-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Critical': return 'bg-red-100 text-red-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">System Administration</h2>
          <p className="text-neutral-500">Global overview of institution-wide complaints and performance</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-semibold border border-emerald-100">
          <ShieldCheck className="w-5 h-5" />
          Admin Access
        </div>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <p className="text-sm font-medium text-neutral-500 mb-1">Total Complaints</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-neutral-900">{analytics.total}</p>
                <TrendingUp className="w-5 h-5 text-emerald-500 mb-1" />
              </div>
            </div>
            {analytics.byStatus.map((s, i) => (
              <div key={s.status} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <p className="text-sm font-medium text-neutral-500 mb-1">{s.status}</p>
                <p className="text-3xl font-bold text-neutral-900">{s.count}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-neutral-400" />
                Category Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.byCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="category"
                    >
                      {analytics.byCategory?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-neutral-400" />
                Priority Analysis
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byPriority}>
                    <XAxis dataKey="priority" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-neutral-400" />
              All Complaints
            </h3>
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Live Feed</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-neutral-500">Loading complaints...</td></tr>
                ) : complaints.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-neutral-500">No complaints found.</td></tr>
                ) : (
                  complaints.map((c) => (
                    <tr 
                      key={c.id} 
                      onClick={() => handleSelectComplaint(c)}
                      className={cn(
                        "hover:bg-neutral-50 transition-colors cursor-pointer",
                        selectedComplaint?.id === c.id ? "bg-emerald-50/50" : ""
                      )}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <span>#{c.id}</span>
                          {c.is_viewed !== 1 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" title="New/Unread" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">{c.category}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", getPriorityColor(c.priority))}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                          c.status === 'Registered' ? "bg-neutral-50 text-neutral-500" :
                          c.status === 'Under Review' ? "bg-blue-50 text-blue-600" :
                          c.status === 'Action In Progress' ? "bg-orange-50 text-orange-600" :
                          "bg-emerald-50 text-emerald-600"
                        )}>
                          {getStatusIcon(c.status)}
                          {c.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-400">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Admin Action Center
            </h3>
            {selectedComplaint ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Complaint Details</label>
                  <div className="bg-neutral-50 p-3 rounded-lg text-sm text-neutral-600 max-h-40 overflow-y-auto border border-neutral-100">
                    <p className="font-bold text-neutral-900 mb-1">#{selectedComplaint.id} - {selectedComplaint.category}</p>
                    {selectedComplaint.description}
                  </div>
                  {selectedComplaint.photo_url && (
                    <a 
                      href={selectedComplaint.photo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                    >
                      View Photo Proof
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Update Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="Registered">Registered</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Action In Progress">Action In Progress</option>
                    <option value="Action Taken">Action Taken</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Official Response</label>
                  <textarea
                    required
                    rows={4}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Provide an official response or update..."
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {updating ? 'Updating...' : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Update Complaint
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="w-full text-center text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="text-center py-12 text-neutral-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Select a complaint from the list to take administrative action.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
