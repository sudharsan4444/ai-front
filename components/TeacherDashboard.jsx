import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import SubmissionReview from './SubmissionReview';
import ManualEvaluation from './ManualEvaluation';
import TeacherStudents from './TeacherStudents';
import MaterialLibrary from './MaterialLibrary';
import MaterialUpload from './MaterialUpload';
import MyProfile from './MyProfile';
import api from '../services/api';

const TeacherDashboard = ({ user, assessments, submissions, onAddAssessment, onUpdateSubmission, onLogout, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [qCount, setQCount] = useState(5);
  const [showForm, setShowForm] = useState(false);
  const [reviewingAssessment, setReviewingAssessment] = useState(null);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null);
  const [myMaterials, setMyMaterials] = useState([]);
  const [localAssessments, setLocalAssessments] = useState(assessments || []);

  useEffect(() => { setLocalAssessments(assessments || []); }, [assessments]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await api.get('/upload');
        const mine = res.data.filter(m => (m.uploadedBy?._id || m.uploadedBy) === user._id || user.role === 'ADMIN');
        setMyMaterials(mine);
      } catch (err) { console.error(err); }
    };
    fetchMaterials();
  }, [user._id, user.role]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic) return alert('Please select a material');
    setIsGenerating(true);
    try {
      const selectedMaterial = myMaterials.find(m => m._id === topic);
      const res = await api.post('/ai/generate-quiz', { materialId: topic, count: qCount, difficulty });
      const { questions, answerKey } = res.data;
      
      if (!questions || questions.length === 0) {
        throw new Error('AI failed to generate questions. Please try again with a different material or count.');
      }

      const newAssessment = {
        title: `${selectedMaterial ? selectedMaterial.title : 'Assessment'} - ${difficulty} Quiz`,
        topic: selectedMaterial ? selectedMaterial.title : 'Topic',
        questions: questions,
        answerKey: answerKey || [],
        materialId: topic,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        department: user.department || user.dept || '',
        status: 'PUBLISHED'
      };
      onAddAssessment(newAssessment);
      alert(`Assessment generated! ${questions.length} questions created.`);
      setShowForm(false);
      setTopic('');
    } catch (error) {
      console.error(error);
      alert('Failed: ' + (error.response?.data?.message || 'Check console.'));
    } finally {
      setIsGenerating(false);
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

  const chartData = localAssessments.map(a => {
    const subs = (submissions || []).filter(s => (s.assessmentId?._id || s.assessmentId) === a._id && s.status !== 'IN_PROGRESS');
    const avg = subs.length > 0
      ? subs.reduce((sum, s) => sum + (parseFloat(s.teacherOverrideScore ?? s.score) || 0), 0) / subs.length
      : 0;
    return { name: a.title.slice(0, 14), score: Math.round(avg * 10) / 10 };
  });

  const avgScore = submissions && submissions.length > 0 
    ? (submissions.reduce((s, b) => s + (parseFloat(b.teacherOverrideScore ?? b.score) || 0), 0) / submissions.length * 10).toFixed(0)
    : '0';

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
            Faculty Control · {user.department || 'General Education'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <i className="fas fa-magic" />
            Initialize Assessment
          </button>
          <div className="px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm border" 
               style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border))' }}>
            <i className="fas fa-circle text-[8px] animate-pulse" style={{ color: 'rgb(var(--primary))' }} />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgb(var(--text-primary))' }}>
              {user.department || 'Faculty'} · Active
            </span>
          </div>
        </div>
      </div>

      {/* ── Professional Tab Bar ── */}
      <div className="tab-bar no-scrollbar overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: 'fa-layer-group' },
          { id: 'materials', label: 'Materials', icon: 'fa-book-open' },
          { id: 'insights', label: 'Insights', icon: 'fa-chart-pie' },
          { id: 'students', label: 'Scholars', icon: 'fa-user-graduate' },
          { id: 'profile', label: 'Profile', icon: 'fa-id-card' },
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
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-fadeUp">
            
            {/* Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Avg Achievement', value: `${avgScore}%`, icon: 'fa-star', color: 'indigo' },
                { label: 'Evaluations', value: submissions?.length || 0, icon: 'fa-users', color: 'emerald' },
                { label: 'Active Items', value: localAssessments.length, icon: 'fa-clipboard-check', color: 'sky' },
                { label: 'System status', value: 'Active', icon: 'fa-check-circle', color: 'amber' }
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
              {/* Performance Matrix */}
              <div className="lg:col-span-2 card p-8">
                <div className="section-header">
                  <div className="section-icon" style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))' }}>
                    <i className="fas fa-chart-line" />
                  </div>
                  <h3 className="section-title">Performance Matrix</h3>
                  <div className="section-line" />
                </div>
                
                <div className="h-[320px] w-full mt-6">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgb(var(--text-muted))', fontSize: 11, fontWeight: 700}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgb(var(--text-muted))', fontSize: 11, fontWeight: 700}} domain={[0, 10]} />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'rgb(var(--bg-card))', 
                            border: '1px solid rgb(var(--border))', 
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-md)',
                            color: 'rgb(var(--text-primary))'
                          }} 
                        />
                        <Area type="monotone" dataKey="score" stroke="rgb(var(--primary))" strokeWidth={3} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 italic font-medium">
                      No assessment data available yet
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Summary Sidebar */}
              <div className="space-y-6">
                <div className="card p-6" style={{ background: 'linear-gradient(135deg, rgb(var(--primary-bg)), rgb(var(--bg-card)))' }}>
                  <h4 className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                    AI Insight
                  </h4>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
                    Cohort performance is showing a positive trend in {user.department || 'core'} topics. Consider exploring more advanced analytical assessments to further challenge the scholars.
                  </p>
                </div>

                <div className="card p-6 border-l-4" style={{ borderLeftColor: 'rgb(var(--primary))' }}>
                  <h4 className="text-sm font-black uppercase tracking-widest mb-4" style={{ color: 'rgb(var(--text-muted))' }}>
                    Quick Links
                  </h4>
                  <ul className="space-y-3">
                    <li><button onClick={() => setActiveTab('materials')} className="text-sm font-bold hover:text-indigo-600 transition-colors flex items-center gap-2"><i className="fas fa-file-pdf opacity-40" /> Material Library</button></li>
                    <li><button onClick={() => setActiveTab('insights')} className="text-sm font-bold hover:text-indigo-600 transition-colors flex items-center gap-2"><i className="fas fa-chart-bar opacity-40" /> Recent Results</button></li>
                    <li><button onClick={() => setShowForm(true)} className="text-sm font-bold hover:text-indigo-600 transition-colors flex items-center gap-2"><i className="fas fa-plus-circle opacity-40" /> New Assessment</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="animate-fadeUp grid lg:grid-cols-2 gap-8 items-start">
             <div className="card p-8">
                <div className="section-header">
                  <h3 className="section-title">Knowledge Uploader</h3>
                </div>
                <p className="text-sm font-medium mb-6" style={{ color: 'rgb(var(--text-muted))' }}>
                  Populate your repository with PDF or Text documents. AI will index them for instant assessment generation.
                </p>
                <MaterialUpload user={user} onRefresh={onRefresh} />
             </div>
             <div className="card p-8">
                <MaterialLibrary user={user} ownOnly={false} />
             </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="animate-fadeUp space-y-6">
            <div className="flex items-center justify-between">
               <div className="section-header !mb-0">
                  <h3 className="section-title">Institutional Assessments</h3>
               </div>
               <div className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border"
                    style={{ background: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-primary))' }}>
                 {localAssessments.length} Total Records
               </div>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Narrative</th>
                      <th>Created By</th>
                      <th>Cohort Submissions</th>
                      <th className="text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localAssessments.map(a => {
                      const assessmentSubmissions = (submissions || []).filter(s => 
                        (s.assessmentId?._id || s.assessmentId) === a._id && s.status !== 'IN_PROGRESS'
                      );
                      const isPublished = a.status === 'PUBLISHED';

                      return (
                        <tr key={a._id}>
                          <td>
                            <span className={`badge ${isPublished ? 'badge-green' : 'badge-amber'}`}>
                              {a.status || 'DRAFT'}
                            </span>
                          </td>
                          <td className="min-w-[250px]">
                            <p className="font-bold text-lg mb-1" style={{ color: 'rgb(var(--text-primary))' }}>{a.title}</p>
                            <div className="flex gap-4 text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgb(var(--text-faint))' }}>
                              <span><i className="fas fa-layer-group mr-1" /> {a.topic}</span>
                              <span><i className="fas fa-calendar-alt mr-1" /> {new Date(a.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                                   style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))' }}>
                                {a.createdBy?.name?.[0] || 'T'}
                              </div>
                              <span className="text-sm font-bold" style={{ color: 'rgb(var(--text-secondary))' }}>
                                {a.createdBy?.name || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-black" style={{ color: 'rgb(var(--primary))' }}>{assessmentSubmissions.length}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Submissions</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => handlePublishToggle(a)}
                                title={isPublished ? "Unpublish" : "Publish to Course"}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-all border ${
                                  isPublished ? 'bg-emerald-500 text-white' : 'bg-transparent text-slate-400 hover:text-indigo-600'
                                }`}
                                style={{ borderColor: isPublished ? 'transparent' : 'rgb(var(--border))' }}
                              >
                                <i className={`fas ${isPublished ? 'fa-check' : 'fa-upload'}`} />
                              </button>
                               <button 
                                 onClick={() => handleDeleteAssessment(a)}
                                 title="Permanently Delete Assessment"
                                 className="w-10 h-10 rounded-xl flex items-center justify-center bg-transparent text-slate-400 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                               >
                                 <i className="fas fa-trash-alt" />
                               </button>
                               <button 
                                 onClick={() => setReviewingAssessment(a)}
                                 className="btn-ghost"
                               >
                                 Insights
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

        {activeTab === 'students' && (
          <div className="animate-fadeUp">
             <TeacherStudents 
               user={user}
               teacherId={user._id} 
               students={[]} 
               submissions={submissions}
               assessments={localAssessments}
             />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fadeUp max-w-4xl mx-auto">
             <MyProfile user={user} onLogout={onLogout} />
          </div>
        )}
      </div>

      {/* ── AI Assessment Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowForm(false)}>
           <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl border p-8 md:p-10 relative" 
                style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border))' }}
                onClick={e => e.stopPropagation()}>
             
             <div className="flex items-center justify-between mb-8 pb-6 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
               <div>
                  <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3" style={{ color: 'rgb(var(--text-primary))' }}>
                    <i className="fas fa-magic" style={{ color: 'rgb(var(--primary))' }} /> AI Assessment Forge
                  </h2>
                  <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Transform materials into intelligent evaluations</p>
               </div>
               <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors" 
                       style={{ background: 'rgb(var(--bg-surface))', color: 'rgb(var(--text-muted))' }}>
                  <i className="fas fa-times text-xl" />
               </button>
             </div>
             
             <form onSubmit={handleGenerate} className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                   <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgb(var(--text-muted))' }}>
                     <i className="fas fa-book-open" /> Knowledge Source
                   </label>
                   <select
                     value={topic}
                     onChange={(e) => setTopic(e.target.value)}
                     required
                     className="input-field"
                   >
                     <option value="" disabled>Select material...</option>
                     {myMaterials.map(m => (
                       <option key={m._id} value={m._id}>{m.title}</option>
                     ))}
                   </select>
                   {myMaterials.length === 0 && (
                     <p className="text-rose-500 text-xs font-semibold mt-2 px-1">
                       <i className="fas fa-exclamation-triangle" /> No materials found in your library.
                     </p>
                   )}
                 </div>
                 
                 <div className="space-y-3">
                   <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgb(var(--text-muted))' }}>
                     <i className="fas fa-list-ol" /> Question Count
                   </label>
                   <div className="flex items-center gap-4 p-1.5 rounded-xl border w-fit" style={{ background: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))' }}>
                     <button type="button" onClick={() => setQCount(Math.max(5, qCount - 1))} className="w-9 h-9 rounded-lg bg-white shadow-sm font-black hover:bg-slate-50 transition-all">-</button>
                     <span className="text-lg font-black w-8 text-center" style={{ color: 'rgb(var(--text-primary))' }}>{qCount}</span>
                     <button type="button" onClick={() => setQCount(Math.min(25, qCount + 1))} className="w-9 h-9 rounded-lg bg-white shadow-sm font-black hover:bg-slate-50 transition-all">+</button>
                   </div>
                 </div>
               </div>

               <div className="space-y-3">
                 <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgb(var(--text-muted))' }}>
                   <i className="fas fa-brain" /> Cognitive Complexity
                 </label>
                 <select
                   value={difficulty}
                   onChange={(e) => setDifficulty(e.target.value)}
                   className="input-field"
                 >
                   <option value="Easy">Easy</option>
                   <option value="Medium">Medium</option>
                   <option value="Hard">Hard</option>
                 </select>
               </div>

               <div className="pt-4">
                 <button
                   type="submit"
                   disabled={isGenerating || myMaterials.length === 0}
                   className="btn-primary w-full py-4 justify-center"
                 >
                   {isGenerating
                     ? <><i className="fas fa-spinner fa-spin mr-2" /> Forging Assessments...</>
                     : <><i className="fas fa-bolt mr-2" /> Generate Assessment</>
                   }
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
