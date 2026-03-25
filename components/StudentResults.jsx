import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GradeBadge = ({ grade }) => {
    return (
        <span className="badge font-black px-4 py-1.5" 
              style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))', borderColor: 'rgb(var(--primary))' }}>
            {grade || 'N/A'}
        </span>
    );
};

const getGradePoints = (percentage) => {
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 50) return 6;
    if (percentage >= 40) return 5;
    if (percentage >= 35) return 4;
    return 0;
};

const StudentResults = ({ user, assessments = [], submissions = [] }) => {
    const [expandedId, setExpandedId] = useState(null);

    const mySubmissions = submissions
        .filter(s => (s.studentId?._id || s.studentId) === user._id && (s.status === 'SUBMITTED' || s.status === 'GRADED'))
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

    const averagePct = mySubmissions.length > 0
        ? (mySubmissions.reduce((sum, s) => {
            const score = parseFloat(s.teacherOverrideScore ?? s.score) || 0;
            const maxScore = parseFloat(s.maxScore) || 1;
            return sum + (score / maxScore);
        }, 0) / mySubmissions.length * 10).toFixed(1)
        : '0.0';

    let cumulativePoints = 0;
    const trendData = mySubmissions.map((s, idx) => {
        const score = parseFloat(s.teacherOverrideScore ?? s.score) || 0;
        const maxScore = parseFloat(s.maxScore) || 1;
        const pct = (score / maxScore) * 100;
        cumulativePoints += getGradePoints(pct);
        const currentGPA = (cumulativePoints / (idx + 1)).toFixed(2);
        const a = assessments.find(ax => ax._id === (s.assessmentId?._id || s.assessmentId));
        return {
            name: a?.title ? a.title.slice(0, 10) : `Quiz ${idx + 1}`,
            gpa: parseFloat(currentGPA)
        };
    });

    const bestSub = mySubmissions.reduce((best, cur) => {
        const bestScore = parseFloat(best?.teacherOverrideScore ?? best?.score) || 0;
        const bestMax = parseFloat(best?.maxScore) || 1;
        const curScore = parseFloat(cur?.teacherOverrideScore ?? cur?.score) || 0;
        const curMax = parseFloat(cur?.maxScore) || 1;
        return (curScore / curMax) > (bestScore / bestMax) ? cur : best;
    }, null);
    
    const bestPct = bestSub ? Math.round((parseFloat(bestSub.teacherOverrideScore ?? bestSub.score) / (parseFloat(bestSub.maxScore) || 1)) * 100) : 0;

    const formatTime = (secs) => {
        if (!secs) return '—';
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    const performanceLabel = (gpa) => {
        if (gpa >= 9.5) return 'Academic Excellence';
        if (gpa >= 8.5) return 'Distinction';
        if (gpa >= 7.5) return 'Very Good';
        if (gpa >= 6.5) return 'Good';
        if (gpa >= 5.5) return 'Satisfactory';
        return 'Standard';
    };

    return (
        <div className="space-y-10 animate-fadeUp pb-12">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
                <div className="section-header !mb-0">
                    <div className="section-icon" style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))' }}>
                        <i className="fas fa-chart-line" />
                    </div>
                    <h3 className="section-title">Academic Insights</h3>
                </div>
                <div className="px-5 py-3 rounded-2xl border" 
                     style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border))' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Standard Target</p>
                    <p className="text-2xl font-black" style={{ color: 'rgb(var(--primary))' }}>10.0 <span className="text-xs opacity-50">CGPA</span></p>
                </div>
            </div>

            {/* GPA Trend & Overview */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 card p-8 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>GPA Growth Track</h3>
                            <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'rgb(var(--text-muted))' }}>Distribution of Cumulative Points</p>
                        </div>
                    </div>
                    
                    <div className="h-64 w-full relative z-10">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData.slice(-7)}>
                                    <defs>
                                        <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgb(var(--text-muted))', fontSize: 10, fontWeight: 700}} tickMargin={12} />
                                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: 'rgb(var(--text-muted))', fontSize: 10, fontWeight: 700}} tickMargin={12} />
                                    <Tooltip 
                                      contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: '1px solid rgb(var(--border))', 
                                        boxShadow: 'var(--shadow-md)',
                                        background: 'rgb(var(--bg-card))',
                                        color: 'rgb(var(--text-primary))'
                                      }} 
                                    />
                                    <Area type="monotone" dataKey="gpa" stroke="rgb(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorGpa)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 italic font-bold">
                                No assessment records found
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] -mr-24 -mt-24" />
                    <div className="relative z-10">
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Academic Standing</p>
                        <h2 className="text-6xl font-black mb-6">{trendData.length > 0 ? trendData[trendData.length - 1].gpa : '0.00'}</h2>
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 w-full">
                           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 opacity-60 mb-1">Pedagogical Level</p>
                           <p className="font-bold text-lg text-white">{performanceLabel(trendData.length > 0 ? trendData[trendData.length - 1].gpa : 0)}</p>
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 relative z-10 pt-8 mt-auto italic">
                       Dynamically computed cumulative grade point average
                    </p>
                </div>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Submissions', value: mySubmissions.length, icon: 'fa-tasks', color: 'indigo' },
                  { label: 'Best Score', value: `${bestPct}%`, icon: 'fa-award', color: 'emerald' },
                  { label: 'Mean Accuracy', value: `${(parseFloat(averagePct) * 10).toFixed(0)}%`, icon: 'fa-bullseye', color: 'sky' },
                  { label: 'Avg Latency', value: mySubmissions.length > 0 ? formatTime(Math.round(mySubmissions.reduce((s, sub) => s + (parseFloat(sub.timeTaken) || 0), 0) / mySubmissions.length)) : '—', icon: 'fa-clock', color: 'purple' }
                ].map((card, idx) => (
                  <div key={idx} className="card p-6 flex flex-col gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl"
                         style={{ background: 'rgb(var(--primary-bg))', color: 'rgb(var(--primary))' }}>
                      <i className={`fas ${card.icon} text-lg`} />
                    </div>
                    <div>
                        <p className="text-2xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>{card.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgb(var(--text-muted))' }}>{card.label}</p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Results List */}
            <div className="space-y-6">
                <div className="section-header">
                    <h3 className="section-title">Chronological Evaluation Records</h3>
                </div>

                {mySubmissions.length === 0 ? (
                    <div className="card p-16 text-center opacity-40 italic">
                        <i className="fas fa-clipboard-list text-4xl mb-4" />
                        <p className="font-bold text-sm uppercase tracking-widest">No evaluation records generated yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {mySubmissions.map(sub => {
                            const a = assessments.find(ax => ax._id === (sub.assessmentId?._id || sub.assessmentId));
                            const effectiveScore = parseFloat(sub.teacherOverrideScore ?? sub.score) || 0;
                            const maxScore = parseFloat(sub.maxScore) || 1;
                            const pct = Math.round((effectiveScore / maxScore) * 100);
                            const breakdown = sub.aiFeedbackBreakdown?.breakdown || sub.breakdown || [];
                            const isExpanded = expandedId === sub._id;
                            const isPublished = a?.status === 'PUBLISHED';

                            return (
                                <div key={sub._id} className="card overflow-hidden">
                                    {/* Evaluation Summary */}
                                    <div className="p-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                   <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border"
                                                         style={{ background: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-muted))' }}>
                                                      {a?.topic || 'General Domain'}
                                                   </span>
                                                   {isPublished ? (
                                                       <span className="badge badge-green text-[10px]"><i className="fas fa-check-circle mr-1" /> Evaluated</span>
                                                   ) : (
                                                       <span className="badge badge-amber text-[10px]"><i className="fas fa-history mr-1" /> Pending</span>
                                                   )}
                                                </div>
                                                <h3 className="font-black text-2xl leading-tight mb-2" style={{ color: 'rgb(var(--text-primary))' }}>{a?.title || 'System Assessment'}</h3>
                                                <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest" style={{ color: 'rgb(var(--text-faint))' }}>
                                                    <span><i className="fas fa-calendar-alt mr-2" /> {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                                    <span><i className="fas fa-clock mr-2" /> {formatTime(sub.timeTaken)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-8 p-6 rounded-2xl border" style={{ background: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))' }}>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>
                                                        {effectiveScore}<span className="text-lg opacity-30 ml-1">/{sub.maxScore}</span>
                                                    </p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: 'rgb(var(--primary))' }}>Confidence Score: {pct}%</p>
                                                </div>
                                                <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
                                                <GradeBadge grade={sub.grade} />
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between gap-6 items-center" style={{ borderColor: 'rgb(var(--border))' }}>
                                            {!isPublished ? (
                                                <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'rgb(var(--text-muted))' }}>
                                                   <i className="fas fa-info-circle text-amber-500" /> Pending institutional verification by faculty.
                                                </p>
                                            ) : (
                                                <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'rgb(var(--text-muted))' }}>
                                                   <i className="fas fa-check-double text-emerald-500" /> Pedagogical review complete.
                                                </p>
                                            )}
                                            
                                            {isPublished && (
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : sub._id)}
                                                    className="btn-primary"
                                                >
                                                    {isExpanded ? 'Compress Records' : 'Examine Results'}
                                                    <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-right'} ml-2`} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contextual Deep Analysis */}
                                    {isExpanded && isPublished && (
                                        <div className="p-8 border-t space-y-8 animate-fadeUp" style={{ background: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))' }}>
                                            
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {(sub.aiFeedbackBreakdown?.overallFeedback || sub.feedback) && (
                                                    <div className="card p-6 border-l-4" style={{ borderLeftColor: 'rgb(var(--primary))' }}>
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgb(var(--primary))' }}>
                                                            <i className="fas fa-robot mr-2" /> AI Semantic Analysis
                                                        </h4>
                                                        <p className="text-sm font-medium leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }}>
                                                           {sub.aiFeedbackBreakdown?.overallFeedback || sub.feedback}
                                                        </p>
                                                    </div>
                                                )}
                                                {sub.teacherFeedback && (
                                                    <div className="card p-6 border-l-4" style={{ borderLeftColor: '#10b981' }}>
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#10b981' }}>
                                                            <i className="fas fa-user-tie mr-2" /> Faculty Feedback
                                                        </h4>
                                                        <p className="text-sm font-black leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }}>
                                                           {sub.teacherFeedback}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-6">
                                                <h4 className="font-black text-lg uppercase tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>Micro-Performance Breakdown</h4>
                                                <div className="space-y-6">
                                                    {breakdown.map((b, i) => {
                                                        const q = a?.questions?.find(origQ => (origQ.id === b.questionId || origQ._id === b.questionId)) || a?.questions?.[b.questionIndex - 1];
                                                        const isCorrect = (b.pointsAwarded || 0) === (b.maxPoints || 1);
                                                        const isPartial = (b.pointsAwarded || 0) > 0 && !isCorrect;
                                                        
                                                        let studentAnsDisplay = sub.answers?.[q?.id] || '(No Response Provided)';
                                                        let correctAnsDisplay = b.referenceAnswer || q?.expectedAnswer || '—';

                                                        if (q?.type === 'MCQ') {
                                                            const sIdx = Number(studentAnsDisplay);
                                                            studentAnsDisplay = q.options && !isNaN(sIdx) ? `${String.fromCharCode(65 + sIdx)}. ${q.options[sIdx]}` : studentAnsDisplay;
                                                            const cIdx = Number(q.correctOptionIndex);
                                                            correctAnsDisplay = q.options && !isNaN(cIdx) ? `${String.fromCharCode(65 + cIdx)}. ${q.options[cIdx]}` : correctAnsDisplay;
                                                        }

                                                        return (
                                                            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border))' }}>
                                                                <div className="flex justify-between items-start gap-6 mb-8">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">Item {b.questionIndex}</span>
                                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                                                                              isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 
                                                                              isPartial ? 'bg-amber-500/10 text-amber-600' : 
                                                                              'bg-rose-500/10 text-rose-600'
                                                                            }`}>
                                                                                {isCorrect ? 'Criterion Met' : isPartial ? 'Partially Met' : 'Met Failed'}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xl font-black leading-snug" style={{ color: 'rgb(var(--text-primary))' }}>{q?.prompt}</p>
                                                                    </div>
                                                                    <div className="text-right p-4 rounded-xl border shrink-0" style={{ background: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))' }}>
                                                                        <p className={`text-2xl font-black ${isCorrect ? 'text-emerald-500' : isPartial ? 'text-amber-500' : 'text-rose-500'}`}>
                                                                            {b.pointsAwarded}<span className="text-sm opacity-30 ml-1">/{b.maxPoints}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                 <div className="grid md:grid-cols-2 gap-8 mb-8">
                                                                     <div className="p-6 rounded-2xl border flex flex-col gap-3" style={{ background: 'rgb(var(--bg-surface))', borderColor: 'rgb(var(--border))' }}>
                                                                         <div className="flex items-center justify-between">
                                                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Scholar Record</p>
                                                                            {q?.type === 'MCQ' && (
                                                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                                                                    {isCorrect ? 'MATCH' : 'MISMATCH'}
                                                                                </span>
                                                                            )}
                                                                         </div>
                                                                         <p className="font-bold text-lg leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }}>
                                                                            {q?.type === 'MCQ' && <i className={`fas ${isCorrect ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-rose-500'} mr-2`} />}
                                                                            {studentAnsDisplay}
                                                                         </p>
                                                                     </div>
                                                                     <div className="p-6 rounded-2xl border bg-emerald-500/5 flex flex-col gap-3" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                                                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Golden Reference</p>
                                                                         <p className="font-black text-lg text-emerald-900 dark:text-emerald-400 leading-relaxed">{correctAnsDisplay}</p>
                                                                     </div>
                                                                 </div>

                                                                 {/* Key Points for Credit */}
                                                                 {q?.type === 'DESCRIPTIVE' && (q.keyPoints?.length > 0) && (
                                                                    <div className="mb-8 p-6 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/30" style={{ borderColor: 'rgb(var(--border))' }}>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50 flex items-center gap-2">
                                                                            <i className="fas fa-key"></i> Key Concepts Evaluated
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {q.keyPoints.map((kp, kpi) => (
                                                                                <span key={kpi} className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-xl">
                                                                                    {kp}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                 )}

                                                                {b.feedback && (
                                                                    <div className="mt-8 p-6 rounded-2xl" style={{ background: 'rgb(var(--primary-bg))' }}>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgb(var(--primary))' }}>
                                                                            Annotated Intelligence
                                                                        </p>
                                                                        <p className="text-base font-medium leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{b.feedback}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentResults;
