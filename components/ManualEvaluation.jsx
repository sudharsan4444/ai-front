
import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

const ManualEvaluation = ({ submission, assessment, onBack, onUpdate }) => {
    if (!assessment || !submission) {
        return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
                    <i className="fas fa-spinner fa-spin text-indigo-600 text-4xl mb-4"></i>
                    <p className="text-slate-600 font-bold">Synchronizing Evaluation Data...</p>
                    <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold">Back</button>
                </div>
            </div>
        );
    }

    const studentName = submission.studentId?.name || 'Unknown Student';
    const rollNumber  = submission.studentId?.rollNumber || 'N/A';
    const maxScore    = submission.maxScore || assessment.questions.reduce((s, q) => s + (q.maxPoints || 1), 0);

    // ── Breakdown helpers (memoized to prevent infinite re-renders) ──
    const rawBreakdown = useMemo(() => {
        return Array.isArray(submission.aiFeedbackBreakdown?.breakdown)
            ? submission.aiFeedbackBreakdown.breakdown
            : (Array.isArray(submission.breakdown) ? submission.breakdown : []);
    }, [submission._id, submission.aiFeedbackBreakdown, submission.breakdown]);

    // ── State ────────────────────────────────────────────────────────
    const [marks, setMarks]           = useState({});           // { [qId]: number }
    const [aiFeedbacks, setAiFeedbacks] = useState({});         // { [qId]: string } — editable AI feedback per question
    const [overallAiFeedback, setOverallAiFeedback] = useState(
        submission.aiFeedbackBreakdown?.overallFeedback || submission.feedback || ''
    );
    const [teacherFeedback, setTeacherFeedback] = useState(submission.teacherFeedback || '');
    const [saving, setSaving]         = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [confirmBack, setConfirmBack] = useState(false);
    const [hasChanges, setHasChanges]   = useState(false);

    // ── Initialise from AI results ────────────────────────────────────
    useEffect(() => {
        const initialMarks = {};
        const initialFeedbacks = {};

        assessment.questions.forEach((q, i) => {
            const fb = rawBreakdown.find(b =>
                (q.id && b.questionId === q.id) || b.questionIndex === i + 1
            ) || {};
            const key = q.id || `idx_${i}`;
            initialMarks[key]     = fb.pointsAwarded ?? fb.points ?? 0;
            initialFeedbacks[key] = fb.feedback || '';
        });

        setMarks(initialMarks);
        setAiFeedbacks(initialFeedbacks);
    }, [submission._id, assessment._id, rawBreakdown]);

    const calculatedTotal = Object.values(marks).reduce((s, v) => s + (parseFloat(v) || 0), 0);

    const handleMarkChange = (qKey, value, maxPts) => {
        // Allow empty string so user can clear input and type
        if (value === '') {
            setMarks(prev => ({ ...prev, [qKey]: '' }));
            setHasChanges(true);
            return;
        }

        let val = parseFloat(value);
        if (isNaN(val)) return; // Don't update for invalid chars

        // Clamp values
        if (val < 0) val = 0;
        if (val > maxPts) val = maxPts;
        
        setMarks(prev => ({ ...prev, [qKey]: val }));
        setHasChanges(true);
    };

    const handleAiFeedbackChange = (qKey, val) => {
        setAiFeedbacks(prev => ({ ...prev, [qKey]: val }));
        setHasChanges(true);
    };

    // ── Save ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            // Build updated breakdown with edited marks & AI feedbacks
            const updatedBreakdown = assessment.questions.map((q, i) => {
                const qKey = q.id || `idx_${i}`;
                const existing = rawBreakdown.find(b =>
                    (q.id && b.questionId === q.id) || b.questionIndex === i + 1
                ) || {};
                return {
                    ...existing,
                    questionId: q.id,
                    questionIndex: i + 1,
                    pointsAwarded: parseFloat(marks[qKey]) || 0,
                    maxPoints: q.maxPoints || 1,
                    feedback: aiFeedbacks[qKey] || existing.feedback || ''
                };
            });

            const res = await api.put(`/submissions/${submission._id}`, {
                teacherOverrideScore: parseFloat(calculatedTotal),
                teacherFeedback,
                aiFeedbackBreakdown: {
                    breakdown: updatedBreakdown,
                    overallFeedback: overallAiFeedback
                }
            });

            setHasChanges(false);
            if (onUpdate) onUpdate(res.data);
            onBack();
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    // ── Download PDF ──────────────────────────────────────────────────
    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const res = await api.get(`/submissions/${submission._id}/report`, { responseType: 'arraybuffer' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url  = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href  = url;
            link.download = `${studentName.replace(/\s+/g,'_')}_${assessment.title.replace(/\s+/g,'_')}_Report.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('PDF download failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setDownloading(false);
        }
    };

    // ── Back guard ────────────────────────────────────────────────────
    const handleBack = () => {
        if (hasChanges) { setConfirmBack(true); } else { onBack(); }
    };

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-3 md:p-6 transition-all duration-500">
            {/* Unsaved Changes Modal */}
            {confirmBack && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[160] flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-amber-500 text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Unsaved Progress</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8 font-medium">You have pending mark adjustments. Are you sure you wish to discard them?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmBack(false)} className="flex-1 py-4 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                Stay
                            </button>
                            <button onClick={onBack} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black shadow-lg shadow-rose-500/20">
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Modal */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[94vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8 duration-500">

                {/* ── Header ── */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="w-10 h-10 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight line-clamp-1">{assessment.title}</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Override & Insights Forge</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-file-pdf'} text-rose-500`}></i>
                            {downloading ? 'Forging...' : 'Report'}
                        </button>
                        <div className="border-l border-slate-100 dark:border-slate-800 pl-4 text-right">
                            <p className="font-black text-slate-900 dark:text-white text-sm line-clamp-1">{studentName}</p>
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">{rollNumber}</p>
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-8 no-scrollbar">

                    {/* AI Pedagogical Analysis — Editable */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-50 dark:border-indigo-900/20 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-50 dark:border-indigo-900/20 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <i className="fas fa-brain text-white text-sm"></i>
                            </div>
                            <div>
                                <p className="font-black text-indigo-900 dark:text-indigo-300 text-[10px] uppercase tracking-widest">Pedagogical Core</p>
                                <p className="text-xs text-indigo-500 font-bold">Deep context synthesis — auto-evaluated</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={overallAiFeedback}
                                onChange={e => { setOverallAiFeedback(e.target.value); setHasChanges(true); }}
                                rows={4}
                                className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 resize-none outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-all leading-relaxed font-medium"
                                placeholder="Awaiting intelligence stream..."
                            />
                        </div>
                    </div>

                    {/* Per-Question Evaluation */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                             <i className="fas fa-list-ol"></i> Concept Breakdown
                        </h3>
                        {assessment.questions.map((q, i) => {
                            const qKey        = q.id || `idx_${i}`;
                            const studentAns  = submission.answers?.[q.id];
                            const maxPts      = q.maxPoints || 1;
                            const currentMark = marks[qKey] ?? 0;
                            const aiFb        = aiFeedbacks[qKey] ?? '';

                            const studentAnswerDisplay = q.type === 'MCQ'
                                ? (studentAns !== undefined && studentAns !== null && q.options
                                    ? `${String.fromCharCode(65 + parseInt(studentAns))}. ${q.options[parseInt(studentAns)] || 'Unknown'}`
                                    : '— Unresponsive —')
                                : (studentAns || '— Unresponsive —');

                            const correctAnswerDisplay = q.type === 'MCQ'
                                ? (q.options ? `${String.fromCharCode(65 + q.correctOptionIndex)}. ${q.options[q.correctOptionIndex]}` : 'N/A')
                                : (q.expectedAnswer || 'View assessment keys');

                            const pct = Math.round((parseFloat(currentMark) / maxPts) * 100);
                            const isCorrect = q.type === 'MCQ'
                                ? String(studentAns) === String(q.correctOptionIndex)
                                : pct >= 50;

                            return (
                                <div key={qKey} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                    {/* Question Header */}
                                    <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-4 flex-1">
                                            <span className="w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                                                        {q.type}
                                                    </span>
                                                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 rounded-lg px-2 py-1">{q.difficulty || 'CORE'}</span>
                                                </div>
                                                <p className="text-sm md:text-base font-bold text-slate-800 dark:text-white leading-relaxed">{q.prompt}</p>
                                            </div>
                                        </div>

                                        {/* Marks Selector */}
                                        <div className="shrink-0 w-full md:w-auto flex items-center md:items-end justify-between md:flex-col gap-2 bg-white dark:bg-slate-900 p-3 md:p-0 rounded-2xl md:bg-transparent">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkChange(qKey, (parseFloat(currentMark)||0) - 0.5, maxPts)}
                                                    className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold transition-all"
                                                >−</button>
                                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 transition-all">
                                                   <input
                                                       type="number"
                                                       value={currentMark}
                                                       onChange={e => handleMarkChange(qKey, e.target.value, maxPts)}
                                                       className="w-10 text-center font-black text-base text-indigo-700 dark:text-indigo-400 outline-none bg-transparent"
                                                       step="0.5" min="0" max={maxPts}
                                                   />
                                                   <span className="text-slate-400 font-bold text-[10px]">/ {maxPts}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkChange(qKey, (parseFloat(currentMark)||0) + 0.5, maxPts)}
                                                    className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold transition-all"
                                                >+</button>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                pct >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' :
                                                pct >= 40 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800' :
                                                'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800'
                                            }`}>{pct}% Correct</div>
                                        </div>
                                    </div>

                                    {/* Evaluation Matrix */}
                                    <div className="p-6 space-y-6">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            {/* Scholar Input */}
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <i className="fas fa-id-card text-indigo-300"></i> Scholar Input
                                                    </p>
                                                    {q.type === 'MCQ' && (
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {isCorrect ? 'MATCH' : 'MISMATCH'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={`text-sm rounded-2xl border-2 px-5 py-4 leading-relaxed h-full min-h-[100px] font-medium transition-colors ${
                                                    q.type === 'MCQ'
                                                        ? (isCorrect ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20 text-rose-800 dark:text-rose-300')
                                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {q.type === 'MCQ' && (
                                                        <i className={`fas ${isCorrect ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-rose-500'} mr-3`}></i>
                                                    )}
                                                    {studentAnswerDisplay}
                                                </div>
                                            </div>

                                            {/* Ground Truth */}
                                            <div className="flex flex-col gap-3">
                                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                                    <i className="fas fa-check-double"></i> Ground Truth Reference
                                                </p>
                                                <div className="text-sm bg-emerald-50/30 dark:bg-emerald-900/5 border-2 border-emerald-100/50 dark:border-emerald-900/10 text-emerald-800 dark:text-emerald-300 rounded-2xl px-5 py-4 leading-relaxed h-full min-h-[100px] font-bold">
                                                    {correctAnswerDisplay}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Key Concepts (For Descriptive) */}
                                        {q.type === 'DESCRIPTIVE' && (q.keyPoints?.length > 0 || assessment.answerKey?.find(ak => ak.questionId === q.id)?.keyPoints?.length > 0) && (
                                            <div className="bg-emerald-50/20 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl p-5">
                                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <i className="fas fa-key"></i> Key Concepts for Credit
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(q.keyPoints || assessment.answerKey?.find(ak => ak.questionId === q.id)?.keyPoints || []).map((kp, kpi) => (
                                                        <span key={kpi} className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg">
                                                            {kp}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* AI Granular Feedback */}
                                    <div className="px-6 pb-6 pt-0">
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                                           <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                                               <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                   <i className="fas fa-bolt text-amber-500"></i> Precision Feedback
                                               </p>
                                               <span className="text-[9px] text-slate-400 font-bold italic">Override enabled</span>
                                           </div>
                                           <textarea
                                               value={aiFb}
                                               onChange={e => handleAiFeedbackChange(qKey, e.target.value)}
                                               rows={2}
                                               className="w-full text-xs font-bold text-slate-600 dark:text-slate-400 bg-transparent resize-none outline-none focus:text-slate-900 dark:focus:text-white transition-colors"
                                               placeholder="Synthesizing response analysis..."
                                           />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Final Teacher Comments */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        <div className="px-6 py-5 bg-slate-900 dark:bg-slate-800 border-b border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <i className="fas fa-pen-nib text-white text-sm"></i>
                            </div>
                            <div>
                                <p className="font-black text-white text-[10px] uppercase tracking-widest">Faculty Directives</p>
                                <p className="text-xs text-slate-400 font-bold">Summative guidance & future focus</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={teacherFeedback}
                                onChange={e => { setTeacherFeedback(e.target.value); setHasChanges(true); }}
                                rows={5}
                                className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 resize-none outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all leading-relaxed font-bold"
                                placeholder="Final thoughts to inspire growth..."
                            />
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Yield</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                                {calculatedTotal}
                                <span className="text-slate-400 dark:text-slate-600 font-bold text-lg ml-2">/ {maxScore}</span>
                            </p>
                        </div>
                        {hasChanges && (
                            <div className="hidden md:flex items-center gap-2 text-amber-500 animate-pulse">
                               <i className="fas fa-circle-notch fa-spin text-xs"></i>
                               <span className="text-[10px] font-black uppercase tracking-widest">Pending Sync</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleBack}
                            className="w-full sm:w-auto px-8 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Abandon
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary w-full sm:w-auto px-10"
                        >
                            {saving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-check-circle mr-2"></i>}
                            {saving ? 'Saving...' : 'Finalize Marks'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualEvaluation;
