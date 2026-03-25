import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MyProfile = ({ user, onLogout }) => {
    const [profileData, setProfileData] = useState(user || {});
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [facultyHead, setFacultyHead] = useState(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const profileRes = await api.get('/users/profile');
                setProfileData(prev => ({ ...prev, ...profileRes.data }));

                if (user.role === 'TEACHER') {
                    const uploadRes = await api.get('/upload');
                    const myMaterials = uploadRes.data.filter(m => (m.uploadedBy?._id || m.uploadedBy) === user._id);
                    const assessRes = await api.get('/assessments');
                    setStats({ myMaterialsCount: myMaterials.length, assessmentsCount: assessRes.data.length });
                } else if (user.role === 'STUDENT') {
                    const subRes = await api.get('/submissions/my');
                    const completed = subRes.data.filter(s => s.status !== 'IN_PROGRESS');
                    setStats({ submissionsCount: completed.length });

                    if (profileRes.data.facultyHead) {
                        try {
                            const teacherRes = await api.get(`/users/teacher/${profileRes.data.facultyHead._id || profileRes.data.facultyHead}`);
                            setFacultyHead(teacherRes.data);
                        } catch { /* fail silently */ }
                    }
                } else if (user.role === 'ADMIN') {
                    const usersRes = await api.get('/admin/users');
                    const teachers = usersRes.data.filter(u => u.role === 'TEACHER').length;
                    const students = usersRes.data.filter(u => u.role === 'STUDENT').length;
                    setStats({ teacherCount: teachers, studentCount: students });
                }
                setLoading(false);
            } catch (err) {
                console.error('Profile fetch error:', err);
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const roleLabel = { ADMIN: 'Global Administrator', TEACHER: 'Instructional Faculty', STUDENT: 'Scholar Candidate' }[profileData.role] || profileData.role;

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-fadeUp pb-12">
            
            {/* ── Profile Hero Section ── */}
            <div className="card p-0 overflow-hidden bg-slate-900 border-none shadow-2xl relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />
                
                <div className="relative p-10 md:p-14 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center text-5xl md:text-6xl font-black text-white border border-white/10 shadow-2xl">
                        {profileData.name?.charAt(0)?.toUpperCase()}
                    </div>
                    
                    <div className="text-center md:text-left">
                        <span className="inline-block px-4 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-black tracking-widest uppercase mb-6 border border-indigo-500/20">
                            {roleLabel}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">{profileData.name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-6 text-white/50 text-sm font-bold uppercase tracking-widest">
                           <span className="flex items-center gap-2"><i className="fas fa-envelope opacity-40" /> {user.email}</span>
                           <span className="flex items-center gap-2"><i className="fas fa-id-badge opacity-40" /> REF: {user.role === 'STUDENT' ? (user.rollNumber || 'PENDING') : user._id?.slice(-8).toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Performance Metrics ── */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {user?.role === 'TEACHER' && [
                        { label: 'Knowledge Repository', value: stats.myMaterialsCount ?? 0, icon: 'fa-book-open', color: 'indigo' },
                        { label: 'Evaluation Records', value: stats.assessmentsCount ?? 0, icon: 'fa-layer-group', color: 'sky' },
                        { label: 'Assigned Domain', value: profileData.department || 'General', icon: 'fa-building', color: 'emerald' },
                        { label: 'Status', value: 'Active', icon: 'fa-check-circle', color: 'indigo' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="w-12 h-12 flex items-center justify-center rounded-xl text-xl"
                                 style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))' }}>
                                <i className={`fas ${s.icon}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>{s.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{s.label}</p>
                            </div>
                        </div>
                    ))}
                    {user?.role === 'STUDENT' && [
                        { label: 'Completed Quizzes', value: stats.submissionsCount ?? 0, icon: 'fa-clipboard-check', color: 'emerald' },
                        { label: 'Standing GPA', value: profileData.gpa ?? '0.00', icon: 'fa-star', color: 'amber' },
                        { label: 'Performance Tier', value: 'Distinction', icon: 'fa-award', color: 'indigo' },
                        { label: 'Batch Index', value: profileData.year || '2027', icon: 'fa-calendar-alt', color: 'sky' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="w-12 h-12 flex items-center justify-center rounded-xl text-xl"
                                 style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))' }}>
                                <i className={`fas ${s.icon}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>{s.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{s.label}</p>
                            </div>
                        </div>
                    ))}
                    {user?.role === 'ADMIN' && [
                        { label: 'Faculty Lead List', value: stats.teacherCount ?? 0, icon: 'fa-user-tie', color: 'indigo' },
                        { label: 'Enrolled Scholars', value: stats.studentCount ?? 0, icon: 'fa-user-graduate', color: 'emerald' },
                        { label: 'Institutional Access', value: 'Root', icon: 'fa-shield-alt', color: 'sky' },
                        { label: 'System Topology', value: 'Cloud', icon: 'fa-network-wired', color: 'indigo' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="w-12 h-12 flex items-center justify-center rounded-xl text-xl"
                                 style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))' }}>
                                <i className={`fas ${s.icon}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>{s.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Identity Details ── */}
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 card p-8 md:p-10">
                    <div className="section-header">
                        <div className="section-icon" style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))' }}>
                            <i className="fas fa-fingerprint" />
                        </div>
                        <h3 className="section-title">Verified Identity Records</h3>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-10 mt-8">
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Legal Identity</p>
                                <p className="text-xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>{profileData.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Primary Domain</p>
                                <p className="text-xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>{profileData.department || 'General Institutional'}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {profileData.role === 'STUDENT' && (
                                <>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Institutional Reference</p>
                                        <p className="text-xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>{profileData.rollNumber || 'PENDING-AUTH'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Assigned Lead Mentor</p>
                                        <p className="text-xl font-black" style={{ color: 'rgb(var(--primary))' }}>
                                            {facultyHead ? facultyHead.name : 'Unassigned Lead'}
                                        </p>
                                    </div>
                                </>
                            )}
                            {profileData.role === 'TEACHER' && (
                                 <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Core Competencies</p>
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.subjects?.length ? profileData.subjects.map(s => (
                                            <span key={s} className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-3 py-1 font-black text-[10px]">{s}</span>
                                        )) : <span className="text-sm font-bold opacity-50">General Professional Studies</span>}
                                    </div>
                                </div>
                            )}
                            {profileData.role === 'ADMIN' && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Access Level</p>
                                    <span className="badge badge-indigo text-[10px] px-4 py-1.5 font-black uppercase">Root Administrator</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card p-8 bg-slate-50 dark:bg-slate-800/20 border-none">
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-6">Security & Session</h4>
                        <div className="space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-emerald-500">
                                 <i className="fas fa-shield-alt" />
                              </div>
                              <div>
                                 <p className="text-xs font-black uppercase" style={{ color: 'rgb(var(--text-primary))' }}>Two-Factor</p>
                                 <p className="text-[10px] font-bold text-emerald-600">Active</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-sky-500">
                                 <i className="fas fa-history" />
                              </div>
                              <div>
                                 <p className="text-xs font-black uppercase" style={{ color: 'rgb(var(--text-primary))' }}>Session Period</p>
                                 <p className="text-[10px] font-bold opacity-50">Indefinite</p>
                              </div>
                           </div>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-600 transition-all shadow-xl shadow-slate-900/10 hover:shadow-rose-600/20"
                    >
                        <i className="fas fa-power-off" /> Terminate Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
