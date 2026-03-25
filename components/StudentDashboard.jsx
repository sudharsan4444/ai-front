import React, { useState } from 'react';
import StudentResults from './StudentResults';
import QuizTaking from './QuizTaking';
import MyProfile from './MyProfile';
import api from '../services/api';

const StudentDashboard = ({ user, assessments, submissions, onStartQuiz, onQuizStateChange, onLogout, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  const mySubmissions = submissions || [];
  const myResults = (submissions || []).filter(s => s.status !== 'IN_PROGRESS');
  const availableAssessments = (assessments || []).filter(a => a.status === 'PUBLISHED');

  const avgScore = myResults.length > 0
    ? (myResults.reduce((s, b) => s + (parseFloat(b.teacherOverrideScore ?? b.score) || 0), 0) / myResults.length * 10).toFixed(0)
    : '0';

  const handleBeginQuiz = async (assessment) => {
    setIsStarting(true);
    try {
      const res = await api.post('/submissions/start', { assessmentId: assessment._id });
      setCurrentSubmissionId(res.data._id);
      setSelectedAssessment(assessment);
      if (onQuizStateChange) onQuizStateChange(true);
    } catch (err) {
      console.error(err);
      alert('Failed to start quiz: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsStarting(false);
    }
  };

  if (selectedAssessment && currentSubmissionId) {
    return (
      <QuizTaking
        assessment={selectedAssessment}
        submissionId={currentSubmissionId}
        user={user}
        onCancel={() => {
          setSelectedAssessment(null);
          setCurrentSubmissionId(null);
          if (onQuizStateChange) onQuizStateChange(false);
        }}
        onBack={() => {
          setSelectedAssessment(null);
          setCurrentSubmissionId(null);
          if (onQuizStateChange) onQuizStateChange(false);
          if (onRefresh) onRefresh();
        }}
        onSubmit={() => {
          setSelectedAssessment(null);
          setCurrentSubmissionId(null);
          if (onQuizStateChange) onQuizStateChange(false);
          if (onStartQuiz) onStartQuiz();
          setActiveTab('overview');
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-8 animate-fadeIn pb-12 px-4 md:px-10">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            Welcome, <span style={{ color: 'rgb(var(--primary))' }}>{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-lg font-semibold mt-2 opacity-70" style={{ color: 'rgb(var(--text-muted))' }}>
            Student Portal · {user.department || 'General Education'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm border" 
               style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border))' }}>
            <i className="fas fa-circle text-[8px] animate-pulse" style={{ color: 'rgb(var(--primary))' }} />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgb(var(--text-primary))' }}>
              Academic Session Live
            </span>
          </div>
        </div>
      </div>

      {/* ── Professional Tab Bar ── */}
      <div className="tab-bar no-scrollbar overflow-x-auto">
        {[
          { id: 'overview', label: 'Dashboard', icon: 'fa-th-large' },
          { id: 'results', label: 'Performance', icon: 'fa-chart-line' },
          { id: 'profile', label: 'My Profile', icon: 'fa-user-circle' },
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
                { label: 'Overall GPA', value: user.gpa || '0.00', icon: 'fa-graduation-cap', color: 'indigo' },
                { label: 'Avg Accuracy', value: `${avgScore}%`, icon: 'fa-bullseye', color: 'emerald' },
                { label: 'Completed', value: myResults.length, icon: 'fa-check-circle', color: 'sky' },
                { label: 'Available', value: availableAssessments.length, icon: 'fa-clock', color: 'amber' }
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
              {/* Assessments List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="section-header">
                  <div className="section-icon" style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))' }}>
                    <i className="fas fa-clipboard-list" />
                  </div>
                  <h3 className="section-title">Open Assessments</h3>
                  <div className="section-line" />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {availableAssessments.length === 0 ? (
                    <div className="col-span-full card p-12 text-center opacity-50">
                      <p className="text-sm font-bold uppercase tracking-widest">No active assessments found.</p>
                    </div>
                  ) : (
                    availableAssessments.map(a => {
                      const completed = (submissions || [])?.some(s => (s.assessmentId?._id || s.assessmentId) === a._id && s.status !== 'IN_PROGRESS');
                      return (
                        <div key={a._id} className="card p-6 flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
                          <div>
                             <div className="flex justify-between items-start mb-4">
                                <span className={`badge ${completed ? 'badge-green' : 'badge-amber'}`}>
                                   {completed ? 'Completed' : 'Available'}
                                </span>
                                <i className="fas fa-brain text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors text-2xl" />
                             </div>
                             <h4 className="text-lg font-black leading-tight mb-2" style={{ color: 'rgb(var(--text-primary))' }}>{a.title}</h4>
                             <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-6">{a.topic}</p>
                          </div>
                          
                          <button
                            disabled={completed || isStarting}
                            onClick={() => handleBeginQuiz(a)}
                            className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                              completed 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg'
                            }`}
                          >
                            {isStarting ? (
                                <><i className="fas fa-spinner fa-spin mr-2" /> Initializing...</>
                            ) : (
                                completed ? 'Results in History' : 'Begin Assessment'
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Recent Activity Sidebar */}
              <div className="space-y-6">
                 <div className="card p-8 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px] -mr-16 -mt-16" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-6">Recent Records</h4>
                    <div className="space-y-6 relative z-10">
                       {myResults.slice(0, 3).map(s => (
                         <div key={s._id} className="pb-4 border-b border-white/10 last:border-0 last:pb-0">
                            <p className="font-bold text-sm mb-1 truncate">{(s.assessmentId?.title || 'Assessment')}</p>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                               <span className="text-slate-400">{new Date(s.submittedAt || s.updatedAt).toLocaleDateString()}</span>
                               <span className="text-emerald-400">Score: {((parseFloat(s.teacherOverrideScore ?? s.score) || 0) * 10).toFixed(0)}%</span>
                            </div>
                         </div>
                       ))}
                       {myResults.length === 0 && <p className="text-xs font-bold text-slate-500 italic">No submissions yet.</p>}
                    </div>
                 </div>

                 <div className="card p-6 border-l-4" style={{ borderLeftColor: 'rgb(var(--primary))' }}>
                    <h4 className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                       Goal Tracking
                    </h4>
                    <p className="text-sm font-medium leading-relaxed opacity-70">
                       You've completed {myResults.length} assessments this term. Keep maintaining your momentum to hit your target GPA!
                    </p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="animate-fadeUp">
             <StudentResults user={user} assessments={assessments} submissions={submissions} onRefresh={onRefresh} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fadeUp max-w-4xl mx-auto">
             <MyProfile user={user} onLogout={onLogout} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
