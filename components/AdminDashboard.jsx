import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MaterialUpload from './MaterialUpload';
import MaterialLibrary from './MaterialLibrary';
import MyProfile from './MyProfile';
import SubmissionReview from './SubmissionReview';
import ManualEvaluation from './ManualEvaluation';

const AdminDashboard = ({ user, assessments, submissions, onLogout, onRefresh, onUpdateSubmission }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [reviewingAssessment, setReviewingAssessment] = useState(null);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null);
  const [localAssessments, setLocalAssessments] = useState(assessments || []);
  
  useEffect(() => { setLocalAssessments(assessments || []); }, [assessments]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    department: '',
    year: '',
    subjects: '',
    facultyHead: '',
    subjectTeachers: []
  });
  const [editingUser, setEditingUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => fetchUsers(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleDeleteUser = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('PERMANENTLY REMOVE THIS USER? All their data will be lost.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      if (onRefresh) onRefresh();
      if (selectedTeacher?._id === id) setSelectedTeacher(null);
      fetchUsers(true);
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleSystemReset = async () => {
    if (!window.confirm('CRITICAL ACTION: This will delete ALL assessments and student submissions. User profiles will be preserved. This cannot be undone. Are you sure?')) {
      return;
    }
    const pass = window.prompt('Type "RESET" to confirm:');
    if (pass !== 'RESET') return;
    try {
      const { data } = await api.post('/admin/system/cleanup');
      alert(`System Cleared!\n- Submissions Deleted: ${data.details.submissionsDeleted}\n- Assessments Deleted: ${data.details.assessmentsDeleted}`);
      fetchUsers();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Reset failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePublishToggle = async (assessment) => {
    try {
      const newStatus = assessment.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await api.patch(`/assessments/${assessment._id}/status`, { status: newStatus });
      if (onRefresh) onRefresh();
    } catch (err) { alert('Failed to update status'); }
  };

  const handleDeleteAssessment = async (a) => {
    if (!window.confirm(`Permanently delete "${a.title}"?`)) return;
    try {
      await api.delete(`/assessments/${a._id}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...newUser,
        year: (newUser.role === 'STUDENT' && newUser.year) ? parseInt(newUser.year) : undefined,
        subjects: newUser.subjects ? newUser.subjects.split(',').map(s => s.trim()).filter(s => s) : [],
        facultyHead: (newUser.role === 'STUDENT' && newUser.facultyHead) ? newUser.facultyHead : undefined
      };
      await api.post('/admin/create-user', data);
      alert('User created successfully');
      setShowAddUser(false);
      setNewUser({ 
        name: '', email: '', password: '', role: 'STUDENT', 
        department: '', year: '', subjects: '', 
        facultyHead: '', subjectTeachers: [] 
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.put(`/admin/users/${editingUser._id}`, {
        ...editingUser,
        year: editingUser.year ? parseInt(editingUser.year) : undefined,
        subjects: typeof editingUser.subjects === 'string' ? editingUser.subjects.split(',').map(s => s.trim()).filter(s => s) : editingUser.subjects
      });
      alert('User profile updated successfully');
      setEditingUser(null);
      if (onRefresh) onRefresh();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating user');
    } finally {
      setIsUpdating(false);
    }
  };

  const allTeachers = users.filter(u => u.role === 'TEACHER');
  const allStudents = users.filter(u => u.role === 'STUDENT');
  const allDepts = Array.from(new Set([...users.map(u => u.department).filter(d => d)])).sort();

  const STANDARD_DEPARTMENTS = [
    'Computer Science', 'Electronics', 'Electrical & Electronics',
    'Mechanical', 'Civil', 'AI&DataScience', 'AI&MachineLearning',
    'Information Technology', 'Data Science', 'Automobile Engineering',
    'Aerospace Engineering', 'Biotechnology', 'Chemical Engineering'
  ];
  const allDeptOptions = Array.from(new Set([...STANDARD_DEPARTMENTS, ...allDepts])).sort();

  const EditUserModal = () => {
    if (!editingUser) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setEditingUser(null)}>
        <div className="card max-w-2xl w-full p-8 md:p-10 shadow-2xl relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-8 border-b pb-6" style={{ borderColor: 'rgb(var(--border))' }}>
            <div>
              <h3 className="text-2xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>Modify Profile</h3>
              <p className="text-sm font-medium opacity-60" style={{ color: 'rgb(var(--text-muted))' }}>Institutional Administration Access</p>
            </div>
            <button onClick={() => setEditingUser(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-all">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleUpdateUser} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Full Name</label>
                <input type="text" required className="input-field" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Email Address</label>
                <input type="email" required className="input-field" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Department</label>
                <input 
                  type="text" 
                  list="dept-list-edit" 
                  className="input-field" 
                  placeholder="Type or select department..." 
                  value={editingUser.department || ''} 
                  onChange={e => setEditingUser({ ...editingUser, department: e.target.value })} 
                />
                <datalist id="dept-list-edit">
                  {allDeptOptions.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Account Role</label>
                <select className="input-field font-bold text-indigo-600" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                  <option value="STUDENT">Student Candidate</option>
                  <option value="TEACHER">Instructional Faculty</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>
            </div>

            {editingUser.role === 'STUDENT' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Academic Year</label>
                  <input type="number" className="input-field" value={editingUser.year} onChange={e => setEditingUser({ ...editingUser, year: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Assigned Faculty Head</label>
                  <select
                    className="input-field"
                    value={editingUser.facultyHead?._id || editingUser.facultyHead || ''}
                    onChange={e => setEditingUser({ ...editingUser, facultyHead: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {allTeachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.department})</option>)}
                  </select>
                </div>
              </div>
            )}

            {editingUser.role === 'TEACHER' && (
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Expertise Subjects</label>
                  <input type="text" className="input-field" value={Array.isArray(editingUser.subjects) ? editingUser.subjects.join(', ') : editingUser.subjects} onChange={e => setEditingUser({ ...editingUser, subjects: e.target.value })} />
               </div>
            )}

            <div className="pt-6 flex gap-4">
              <button type="button" onClick={() => setEditingUser(null)} className="btn-ghost flex-1 py-4">Cancel</button>
              <button type="submit" disabled={isUpdating} className="btn-primary flex-[2] py-4 justify-center">
                {isUpdating ? <><i className="fas fa-spinner fa-spin mr-2"></i> Syncing...</> : 'Commit Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const TeacherDetailModal = () => {
    if (!selectedTeacher) return null;
    const assignedStudents = users.filter(s => s.role === 'STUDENT' && String(s.facultyHead?._id || s.facultyHead) === String(selectedTeacher._id));
    const avgGPA = assignedStudents.length > 0
      ? (assignedStudents.reduce((sum, s) => sum + (parseFloat(s.gpa) || 0), 0) / assignedStudents.length).toFixed(2)
      : '0.00';

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setSelectedTeacher(null)}>
        <div className="card max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
          <div className="bg-slate-900 p-10 text-white flex justify-between items-start">
            <div className="flex gap-8 items-center">
              <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl">
                {selectedTeacher.name[0]}
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight">{selectedTeacher.name}</h2>
                <p className="text-indigo-300 font-bold opacity-80 mt-1">{selectedTeacher.email}</p>
                <div className="flex gap-3 mt-4">
                  <span className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5">{selectedTeacher.department} Faculty</span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active</span>
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedTeacher(null)} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <div className="p-10 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="card p-6 bg-slate-50 dark:bg-slate-800/40 border-none text-center">
                <p className="text-4xl font-black" style={{ color: 'rgb(var(--primary))' }}>{assignedStudents.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-2">Assigned Scholars</p>
              </div>
              <div className="card p-6 bg-indigo-600 text-white border-none text-center shadow-xl">
                <p className="text-4xl font-black">{avgGPA}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mt-2">Cohort Master GPA</p>
              </div>
              <div className="card p-6 bg-slate-50 dark:bg-slate-800/40 border-none text-center">
                <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Primary Domain</p>
                <p className="text-base font-black truncate">{selectedTeacher.department || 'Unassigned'}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="section-header">
                <h3 className="section-title">Institutional Scholar Roster</h3>
              </div>
              {assignedStudents.length === 0 ? (
                <div className="p-12 text-center opacity-40 italic font-bold">
                  No scholars currently assigned to this lead.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {assignedStudents.map(student => (
                    <div key={student._id} className="card p-5 flex items-center justify-between hover:border-indigo-500/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-lg">
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="font-black leading-tight" style={{ color: 'rgb(var(--text-primary))' }}>{student.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">{student.rollNumber || 'NO-REF'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black ${parseFloat(student.gpa) >= 8 ? 'text-emerald-500' : 'text-indigo-500'}`}>{student.gpa || '0.00'}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40">GPA</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-12 pt-8 border-t flex gap-6" style={{ borderColor: 'rgb(var(--border))' }}>
               <button onClick={() => { setEditingUser(selectedTeacher); setSelectedTeacher(null); }} className="btn-primary flex-1 py-4 justify-center">
                 <i className="fas fa-edit mr-2"></i> Update Faculty Records
               </button>
               <button onClick={(e) => { handleDeleteUser(selectedTeacher._id, e); }} className="w-16 h-14 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                 <i className="fas fa-trash-alt text-xl"></i>
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (evaluatingSubmission) {
    return (
      <ManualEvaluation
        submission={evaluatingSubmission}
        assessment={reviewingAssessment || localAssessments.find(a => a._id === (evaluatingSubmission.assessmentId?._id || evaluatingSubmission.assessmentId))}
        onBack={() => setEvaluatingSubmission(null)}
        onUpdate={(updated) => {
          setEvaluatingSubmission(null);
          if (onUpdateSubmission) onUpdateSubmission(updated);
          if (onRefresh) onRefresh();
        }}
      />
    );
  }

  if (reviewingAssessment) {
    const liveAssessment = localAssessments.find(a => a._id === reviewingAssessment._id) || reviewingAssessment;
    return (
      <SubmissionReview
        assessment={liveAssessment}
        submissions={submissions}
        onBack={() => setReviewingAssessment(null)}
        onEvaluate={(sub) => setEvaluatingSubmission(sub)}
        onUpdateSubmission={() => { if (onUpdateSubmission) onUpdateSubmission(); if (onRefresh) onRefresh(); }}
      />
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-8 animate-fadeIn pb-12 px-4 md:px-10">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            Hello, <span style={{ color: 'rgb(var(--primary))' }}>{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-lg font-semibold mt-2 opacity-70" style={{ color: 'rgb(var(--text-muted))' }}>
            Administrative Console · Global Oversight
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSystemReset} 
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border bg-rose-500/5 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-500/20 transition-all font-black text-xs uppercase tracking-widest shadow-sm"
          >
            <i className="fas fa-undo"></i> Institutional Reset
          </button>
          <div className="px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm border" 
               style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border))' }}>
            <i className="fas fa-shield-alt text-[10px]" style={{ color: 'rgb(var(--primary))' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                {user?.role} · {user?.department || 'System Admin'}
              </span>
          </div>
        </div>
      </div>

      {/* ── Professional Tab Bar ── */}
      <div className="tab-bar no-scrollbar overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Monitor', icon: 'fa-cube' },
          { id: 'staff', label: 'Faculty', icon: 'fa-chalkboard-teacher' },
          { id: 'students', label: 'Scholars', icon: 'fa-user-graduate' },
          { id: 'assessments', label: 'Evaluation', icon: 'fa-clipboard-list' },
          { id: 'materials', label: 'Repository', icon: 'fa-database' },
          { id: 'profile', label: 'Identity', icon: 'fa-id-badge' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <i className={`fas ${tab.icon} ${activeTab === tab.id ? 'text-white' : 'opacity-50'}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="min-h-[60vh]">
        
        {/* MONITOR / OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-fadeUp">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Accounts', value: users.length, icon: 'fa-users', color: 'indigo' },
                { label: 'Active Faculty', value: allTeachers.length, icon: 'fa-user-tie', color: 'emerald' },
                { label: 'Total Scholars', value: allStudents.length, icon: 'fa-graduation-cap', color: 'sky' },
                { label: 'Global Mean GPA', value: (allStudents.reduce((a, b) => a + (parseFloat(b.gpa) || 0), 0) / (allStudents.length || 1)).toFixed(2), icon: 'fa-star', color: 'amber' }
              ].map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl text-xl"
                       style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))' }}>
                    <i className={`fas ${stat.icon}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>{stat.value}</p>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="section-header">
                  <h3 className="section-title">Administrative Vectors</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="card p-8 flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
                    <div>
                      <i className="fas fa-user-plus text-3xl mb-4" style={{ color: 'rgb(var(--primary))' }} />
                      <h4 className="text-xl font-black mb-2" style={{ color: 'rgb(var(--text-primary))' }}>Register Faculty</h4>
                      <p className="text-sm font-medium opacity-60 mb-6">Initialize a new instructor profile with department and expertise indexing.</p>
                    </div>
                    <button onClick={() => { setActiveTab('staff'); setShowAddUser(true); }} className="btn-primary w-full justify-center py-4">
                      Initialize User
                    </button>
                  </div>
                  <div className="card p-8 flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
                    <div>
                      <i className="fas fa-microchip text-3xl mb-4 text-emerald-500" />
                      <h4 className="text-xl font-black mb-2" style={{ color: 'rgb(var(--text-primary))' }}>System Integrity</h4>
                      <p className="text-sm font-medium opacity-60 mb-6">Monitor global assessment records and institutional submission metrics.</p>
                    </div>
                    <button onClick={() => setActiveTab('assessments')} className="btn-ghost w-full justify-center py-4">
                      Audit Records
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card p-8 bg-slate-900 text-white">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6">Institutional Distribution</h4>
                   <div className="space-y-5">
                      {allDepts.slice(0, 5).map(dept => (
                        <div key={dept} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                           <p className="font-bold text-sm">{dept}</p>
                           <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-indigo-300 bg-white/5 px-3 py-1 rounded-lg">
                                {allTeachers.filter(t => t.department === dept).length} Staff
                              </span>
                              <span className="text-[10px] font-black text-emerald-400">
                                {allStudents.filter(s => s.department === dept).length} Schl
                              </span>
                           </div>
                        </div>
                      ))}
                      <button onClick={() => setActiveTab('staff')} className="w-full pt-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
                        Full Institutional Index →
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAFF / FACULTY */}
        {activeTab === 'staff' && (
          <div className="space-y-8 animate-fadeUp">
             <div className="flex items-center justify-between">
                <div className="section-header !mb-0">
                   <h3 className="section-title">Instructional Faculty Registry</h3>
                </div>
                <button 
                  onClick={() => setShowAddUser(!showAddUser)} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    showAddUser ? 'bg-rose-500/10 text-rose-500' : 'btn-primary'
                  }`}
                >
                   <i className={`fas ${showAddUser ? 'fa-times' : 'fa-plus'}`} />
                   {showAddUser ? 'Cancel Registration' : 'Register New Faculty'}
                </button>
             </div>

             {showAddUser && (
               <div className="card p-8 md:p-10 animate-fadeUp">
                  <form onSubmit={handleAddUser} className="space-y-8">
                     <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Full Name</label>
                           <input type="text" required className="input-field" placeholder="Prof. Alexander Wright" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Corporate Email</label>
                           <input type="email" required className="input-field" placeholder="a.wright@university.edu" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Institutional Role</label>
                           <select className="input-field font-bold text-indigo-600" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                             <option value="TEACHER">Instructional Faculty</option>
                             <option value="ADMIN">System Administrator</option>
                             <option value="STUDENT">Student Candidate</option>
                           </select>
                        </div>
                     </div>
                     <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Access Password</label>
                           <input type="password" required className="input-field" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Department Assignment</label>
                           <input 
                             type="text" 
                             list="dept-list-create" 
                             required 
                             className="input-field" 
                             placeholder="Type or select department..."
                             value={newUser.department} 
                             onChange={e => setNewUser({...newUser, department: e.target.value})} 
                           />
                           <datalist id="dept-list-create">
                             {allDeptOptions.map(d => <option key={d} value={d} />)}
                           </datalist>
                        </div>
                     </div>
                     {newUser.role === 'TEACHER' && (
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Expertise Domains (Comma Separated)</label>
                           <input type="text" className="input-field" placeholder="Advanced ML, Calculus, Neural Networks" value={newUser.subjects} onChange={e => setNewUser({...newUser, subjects: e.target.value})} />
                        </div>
                     )}
                     <div className="pt-4 flex justify-end">
                        <button type="submit" className="btn-primary px-12 py-4 justify-center">Commit Registration</button>
                     </div>
                  </form>
               </div>
             )}

             <div className="grid md:grid-cols-3 gap-6">
               {allTeachers.map(teacher => (
                  <div
                    key={teacher._id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className="card p-0 overflow-hidden group cursor-pointer hover:border-indigo-500/40 transition-all"
                  >
                     <div className="p-6 flex items-start justify-between">
                        <div className="flex gap-4">
                           <div className="w-14 h-14 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                             {teacher.name[0]}
                           </div>
                           <div>
                              <h3 className="font-black text-lg leading-tight" style={{ color: 'rgb(var(--text-primary))' }}>{teacher.name}</h3>
                              <p className="text-[11px] font-medium opacity-50 mt-1">{teacher.email}</p>
                           </div>
                        </div>
                        <span className="badge font-black text-[9px] px-3 py-1">{teacher.department?.slice(0,3) || 'FAC'}</span>
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/20 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                           <i className="fas fa-user-graduate text-[10px] text-indigo-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                             {allStudents.filter(s => String(s.facultyHead?._id || s.facultyHead) === String(teacher._id)).length} Scholars
                           </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setEditingUser(teacher); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                            <i className="fas fa-edit text-xs" />
                          </button>
                          <button onClick={(e) => handleDeleteUser(teacher._id, e)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                            <i className="fas fa-trash-alt text-xs" />
                          </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* SCHOLARS TAB */}
        {activeTab === 'students' && (
          <div className="space-y-8 animate-fadeUp">
             <div className="section-header">
                <h3 className="section-title">Institutional Scholar Index</h3>
             </div>

             <div className="card overflow-hidden">
               <div className="overflow-x-auto no-scrollbar">
                 <table className="data-table">
                   <thead>
                     <tr>
                        <th>Candidate Profile</th>
                        <th>Academic Domain</th>
                        <th>Lead Faculty</th>
                        <th className="text-right">Performance</th>
                        <th className="text-right">Admin Control</th>
                     </tr>
                   </thead>
                   <tbody>
                     {allStudents.map(student => {
                       const mentor = allTeachers.find(t => String(t._id) === String(student.facultyHead?._id || student.facultyHead));
                       return (
                         <tr key={student._id}>
                            <td>
                               <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center font-black">
                                    {student.name[0]}
                                 </div>
                                 <div>
                                   <p className="font-black leading-tight" style={{ color: 'rgb(var(--text-primary))' }}>{student.name}</p>
                                   <p className="text-[10px] font-medium opacity-50">{student.email}</p>
                                 </div>
                               </div>
                            </td>
                            <td>
                               <p className="font-black text-sm" style={{ color: 'rgb(var(--text-primary))' }}>{student.department || 'Unassigned Domain'}</p>
                               <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">{student.rollNumber || 'REF-N/A'}</p>
                            </td>
                            <td>
                               {mentor ? (
                                 <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-indigo-500/10 text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-black border border-indigo-500/10">
                                      {mentor.name[0]}
                                    </div>
                                    <p className="text-xs font-black" style={{ color: 'rgb(var(--text-primary))' }}>{mentor.name}</p>
                                 </div>
                               ) : (
                                 <span className="badge badge-amber text-[9px] font-black px-3 py-1">UNASSIGNED</span>
                               )}
                            </td>
                            <td className="text-right">
                               <span className={`text-2xl font-black ${parseFloat(student.gpa) >= 8 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                 {student.gpa || '0.00'}
                               </span>
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-3 text-slate-400">
                                <button onClick={() => setEditingUser(student)} className="btn-ghost">
                                  Modify
                                </button>
                                <button onClick={(e) => handleDeleteUser(student._id, e)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                  <i className="fas fa-trash-alt text-xs" />
                                </button>
                              </div>
                            </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             </div>
          </div>
        )}

        {/* RECORDS TAB */}
        {activeTab === 'assessments' && (
          <div className="space-y-8 animate-fadeUp">
            <div className="section-header">
               <h3 className="section-title">Global Academic Records</h3>
            </div>

            {localAssessments.length === 0 ? (
              <div className="card p-24 text-center opacity-40 italic">
                <i className="fas fa-folder-open text-5xl mb-6 block" />
                <p className="font-black text-sm uppercase tracking-widest">No evaluation records indexed in institutional database.</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Status Toggle</th>
                        <th>Evaluation Narrative</th>
                        <th>Question Density</th>
                        <th>Submissions</th>
                        <th className="text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localAssessments.map(a => {
                        const subCount = submissions.filter(s =>
                          (s.assessmentId?._id || s.assessmentId) === a._id && s.status !== 'IN_PROGRESS'
                        ).length;
                        const isPublished = a.status === 'PUBLISHED';
                        return (
                          <tr key={a._id}>
                            <td>
                              <button
                                onClick={() => handlePublishToggle(a)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border outline-none ${
                                  isPublished
                                    ? 'bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/20'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 shadow-sm'
                                }`}
                              >
                                <i className={`fas ${isPublished ? 'fa-check' : 'fa-upload'}`} />
                                {isPublished ? 'Published' : 'Relay'}
                              </button>
                            </td>
                            <td>
                              <p className="font-black text-lg leading-tight" style={{ color: 'rgb(var(--text-primary))' }}>{a.title}</p>
                              <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">
                                 <span><i className="fas fa-tag mr-2" /> {a.topic}</span>
                                 <span><i className="fas fa-calendar-alt mr-2" /> {new Date(a.createdAt).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-3">
                                 <span className="text-2xl font-black" style={{ color: 'rgb(var(--primary))' }}>{a.questions?.length || 0}</span>
                                 <span className="text-[10px] font-black uppercase opacity-40">Questions</span>
                              </div>
                            </td>
                            <td>
                               <div className="flex items-center gap-3">
                                  <span className="text-2xl font-black text-emerald-500">{subCount}</span>
                                  <span className="text-[10px] font-black uppercase opacity-40">Submissions</span>
                               </div>
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-3">
                                <button onClick={() => setReviewingAssessment(a)} className="btn-ghost">
                                  Matrix
                                </button>
                                <button onClick={() => handleDeleteAssessment(a)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                  <i className="fas fa-trash-alt text-xs" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="animate-fadeUp grid lg:grid-cols-2 gap-8 items-start">
             <div className="card p-8">
                <div className="section-header">
                   <h3 className="section-title">Upload Knowledge</h3>
                </div>
                <p className="text-sm font-medium opacity-60 mb-8 leading-relaxed"> Populate the institution's global repository with documentation for indexing. </p>
                <MaterialUpload user={user} onRefresh={onRefresh} />
             </div>
             <div className="card p-8 h-fit">
                <div className="section-header">
                  <h3 className="section-title">Institutional Library</h3>
                </div>
                <MaterialLibrary user={user} ownOnly={false} />
             </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="animate-fadeUp max-w-4xl mx-auto">
             <MyProfile user={user} onLogout={onLogout} />
          </div>
        )}
      </div>

      {EditUserModal()}
      {TeacherDetailModal()}
    </div>
  );
};

export default AdminDashboard;
