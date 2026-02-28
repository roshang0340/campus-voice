import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Complaint, Analytics } from '../types';
import { MessageSquare, Clock, CheckCircle2, AlertTriangle, Send, BarChart3, PieChart as PieChartIcon, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function InstitutionDashboard({ user }: { user: User }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<'Registered' | 'Under Review' | 'Action In Progress' | 'Action Taken'>('Under Review');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
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

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

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
          <h2 className="text-2xl font-bold text-neutral-900">{user.department} Department Dashboard</h2>
          <p className="text-neutral-500">Manage and resolve student complaints for your department</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
          title="Refresh"
        >
          <Clock className="w-5 h-5" />
        </button>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total Complaints</p>
                <p className="text-2xl font-bold text-neutral-900">{analytics.total}</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {analytics.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm md:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Filter className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-neutral-900">Priority Distribution</p>
            </div>
            <div className="h-48">
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-neutral-400" />
            Recent Complaints
          </h3>
          {loading ? (
            <div className="text-center py-12 text-neutral-500">Loading...</div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-neutral-300">
              <p className="text-neutral-500">No complaints assigned to your department yet.</p>
            </div>
          ) : (
            complaints.map((complaint) => (
              <motion.div
                key={complaint.id}
                layout
                onClick={() => {
                  setSelectedComplaint(complaint);
                  setStatus(complaint.status);
                  setResponse(complaint.response || '');
                }}
                className={cn(
                  "bg-white p-6 rounded-2xl border transition-all cursor-pointer",
                  selectedComplaint?.id === complaint.id 
                    ? "border-emerald-500 ring-1 ring-emerald-500 shadow-md" 
                    : "border-neutral-200 hover:border-neutral-300 shadow-sm"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", getPriorityColor(complaint.priority))}>
                      {complaint.priority}
                    </span>
                    <span className="text-xs text-neutral-400">{new Date(complaint.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase",
                    complaint.status === 'Registered' ? "bg-neutral-50 text-neutral-500" :
                    complaint.status === 'Under Review' ? "bg-blue-50 text-blue-600" :
                    complaint.status === 'Action In Progress' ? "bg-orange-50 text-orange-600" :
                    "bg-emerald-50 text-emerald-600"
                  )}>
                    {complaint.status}
                  </div>
                </div>
                <p className="text-neutral-800 line-clamp-2 leading-relaxed">{complaint.description}</p>
              </motion.div>
            ))
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-neutral-900 mb-6">Action Center</h3>
            {selectedComplaint ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Complaint Details</label>
                  <div className="bg-neutral-50 p-3 rounded-lg text-sm text-neutral-600 max-h-40 overflow-y-auto border border-neutral-100">
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Action Response</label>
                  <textarea
                    required
                    rows={4}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Describe the action taken or provide an update..."
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {updating ? 'Updating...' : (
                    <>
                      <Send className="w-4 h-4" />
                      Update Complaint
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-12 text-neutral-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Select a complaint from the list to take action.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
