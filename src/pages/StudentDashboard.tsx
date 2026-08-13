import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Complaint } from '../types';
import { Plus, MessageSquare, Clock, CheckCircle2, AlertTriangle, Star, Camera, X, Send, User as UserIcon, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function StudentDashboard({ user }: { user: User }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [category, setCategory] = useState('Hostel Food');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'complaints' | 'profile'>('complaints');

  // Profile state
  const [profileName, setProfileName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileUpdating, setProfileUpdating] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileUpdating(true);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('New passwords do not match');
      setProfileUpdating(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch('/api/users/profile', {
        name: profileName,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword ? newPassword : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update stored user
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      setProfileSuccess('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileUpdating(false);
    }
  };

  const categories = ["Hostel Food", "Canteen", "Faculty", "Infrastructure", "Maintenance", "Other"];
  const priorities = ["Low", "Medium", "High", "Critical"];

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter complaints to ensure only this student's complaints are displayed
      const studentComplaints = Array.isArray(response.data) ? response.data.filter((c: Complaint) => c.student_id === user?.id) : [];
      setComplaints(studentComplaints);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('description', description);
      if (photo) formData.append('photo', photo);

      await axios.post('/api/complaints', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setShowForm(false);
      setCategory('Hostel Food');
      setPriority('Medium');
      setDescription('');
      setPhoto(null);
      fetchComplaints();
    } catch (err) {
      console.error('Failed to submit complaint', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRating = async (id: number, rating: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/complaints/${id}`, { rating }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchComplaints();
    } catch (err) {
      console.error('Failed to update rating', err);
    }
  };

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
      {/* Tab Switcher */}
      <div className="flex border-b border-neutral-200 gap-6">
        <button
          onClick={() => setActiveTab('complaints')}
          className={cn(
            "pb-4 text-sm font-bold transition-all border-b-2 px-1",
            activeTab === 'complaints'
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-neutral-500 hover:text-neutral-900"
          )}
        >
          My Complaints
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "pb-4 text-sm font-bold transition-all border-b-2 px-1",
            activeTab === 'profile'
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-neutral-500 hover:text-neutral-900"
          )}
        >
          My Profile
        </button>
      </div>

      {activeTab === 'complaints' ? (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">My Complaints</h2>
              <p className="text-neutral-500">Track and manage your anonymous feedback</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchComplaints}
                className="p-2 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                title="Refresh"
              >
                <Clock className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-sm"
              >
                <Plus className="w-5 h-5" />
                New Complaint
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-lg"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-neutral-900">Submit Anonymous Complaint</h3>
                  <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Priority Level</label>
                      <div className="flex flex-wrap gap-2">
                        {priorities.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                              priority === p 
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                                : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Photo Proof (Optional)</label>
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors">
                          <Camera className="w-5 h-5 text-neutral-400" />
                          <span className="text-sm text-neutral-600">{photo ? photo.name : 'Upload image'}</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => setPhoto(e.target.files?.[0] || null)} 
                          />
                        </label>
                        {photo && (
                          <button type="button" onClick={() => setPhoto(null)} className="text-red-500 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                      <textarea
                        required
                        rows={6}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your issue in detail. Remember, your identity remains anonymous."
                        className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit Complaint
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="text-center py-12 text-neutral-500">Loading complaints...</div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-neutral-300">
                <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">No complaints found. Your voice matters, start by submitting one!</p>
              </div>
            ) : (
              complaints.map((complaint) => (
                <motion.div
                  key={complaint.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", getPriorityColor(complaint.priority))}>
                          {complaint.priority}
                        </span>
                        <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">{complaint.category}</span>
                        <span className="text-xs text-neutral-400">•</span>
                        <span className="text-xs text-neutral-400">{new Date(complaint.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-neutral-800 mb-4 leading-relaxed">{complaint.description}</p>
                      
                      {complaint.photo_url && (
                        <div className="mb-4">
                          <img 
                            src={complaint.photo_url} 
                            alt="Proof" 
                            className="h-32 w-auto rounded-lg border border-neutral-200 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {complaint.response && (
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 mt-4">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-bold text-neutral-900">Official Response</span>
                          </div>
                          <p className="text-sm text-neutral-600 italic">"{complaint.response}"</p>
                          
                          {complaint.status === 'Action Taken' && (
                            <div className="mt-4 pt-4 border-t border-neutral-200">
                              <p className="text-xs font-bold text-neutral-400 uppercase mb-2">Rate this resolution</p>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => handleRating(complaint.id, star)}
                                    className={cn(
                                      "p-1 transition-colors",
                                      (complaint.rating || 0) >= star ? "text-amber-400" : "text-neutral-300 hover:text-amber-200"
                                    )}
                                  >
                                    <Star className="w-5 h-5 fill-current" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border",
                        complaint.status === 'Registered' ? "bg-neutral-50 border-neutral-100 text-neutral-500" :
                        complaint.status === 'Under Review' ? "bg-blue-50 border-blue-100 text-blue-700" :
                        complaint.status === 'Action In Progress' ? "bg-orange-50 border-orange-100 text-orange-700" :
                        "bg-emerald-50 border-emerald-100 text-emerald-700"
                      )}>
                        {getStatusIcon(complaint.status)}
                        {complaint.status}
                      </div>
                      {complaint.is_viewed === 1 && (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full mt-1 shadow-xs" title={`Seen by ${complaint.viewed_by || `${complaint.category} Dept`}`}>
                          <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>Seen by {complaint.viewed_by || `${complaint.category} Dept`}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm max-w-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-50 p-4 rounded-full text-emerald-600">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900">{profileName}</h3>
              <p className="text-sm text-neutral-500 capitalize">{user.role} Account</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {profileError && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{profileError}</p>
              </div>
            )}
            {profileSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700 font-medium">{profileSuccess}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="block w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 cursor-not-allowed sm:text-sm"
                />
                <p className="text-xs text-neutral-400 mt-1">Your registered email cannot be changed.</p>
              </div>

              <div>
                <label htmlFor="profileName" className="block text-sm font-semibold text-neutral-700 mb-1">Full Name</label>
                <input
                  id="profileName"
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white sm:text-sm transition-all"
                />
              </div>

              <div className="border-t border-neutral-100 pt-6">
                <h4 className="text-sm font-bold text-neutral-900 mb-4">Change Password</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-semibold text-neutral-700 mb-1">Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white sm:text-sm transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-semibold text-neutral-700 mb-1">New Password</label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white sm:text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700 mb-1">Confirm New Password</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white sm:text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={profileUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                {profileUpdating ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
