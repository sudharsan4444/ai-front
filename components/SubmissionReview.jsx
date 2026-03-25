import React, { useState } from 'react';
import api from '../services/api';

const SubmissionReview = ({ assessment, submissions, onBack, onUpdateSubmission, onEvaluate }) => {
    const [editMap, setEditMap] = useState({});
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(assessment.status === 'PUBLISHED');
    const [showAnswerKey, setShowAnswerKey] = useState(false);
    const [expandedStudent, setExpandedStudent] = useState(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const relevantSubs = submissions.filter(s =>
        (s.assessmentId?._id || s.assessmentId) === assessment._id && s.status !== 'IN_PROGRESS'
    );

    const getEdit = (subId) => editMap[subId] || {};

    const startEdit = (sub) => {
        setEditMap(prev => ({
            ...prev,
            [sub._id]: {
                score: sub.teacherOverrideScore ?? sub.score ?? 0,
                feedback: sub.teacherFeedback || sub.feedback || '',
                editing: true
            }
        }));
    };

    const saveEdit = async (sub) => {
        const edit = getEdit(sub._id);
        setEditMap(prev => ({ ...prev, [sub._id]: { ...edit, saving: true } }));
        try {
            await api.put(`/submissions/${sub._id}`, {
                score: parseFloat(edit.score),
                feedback: edit.feedback
            });
            setEditMap(prev => ({ ...prev, [sub._id]: { ...edit, editing: false, saving: false } }));
            if (onUpdateSubmission) onUpdateSubmission();
        } catch (e) {
            alert('Error saving: ' + (e.response?.data?.message || e.message));
            setEditMap(prev => ({ ...prev, [sub._id]: { ...edit, saving: false } }));
        }
    };

    const cancelEdit = (subId) => {
        setEditMap(prev => ({ ...prev, [subId]: { editing: false } }));
    };

    const handlePublish = async () => {
        if (!window.confirm('Publish results to all students? This will update student dashboards and GPAs.')) return;
        setPublishing(true);
        try {
            await api.patch(`/assessments/${assessment._id}/status`, { status: 'PUBLISHED' });
            setIsPublished(true);
            if (onUpdateSubmission) onUpdateSubmission();
        } catch (e) {
            alert('Failed to publish: ' + (e.response?.data?.message || e.message));
        } finally {
            setPublishing(false);
        }
    };

    const downloadAnswerKey = async () => {
        setDownloadingPdf(true);
        try {
            const res = await api.get(`/files/assessment/${assessment._id}/answer-key`, { responseType: 'arraybuffer' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `answer-key-${assessment.title.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Download failed: ' + (e.response?.data?.message || e.message));
        } finally {
            setDownloadingPdf(false);
        }
    };

    const totalMarks = assessment.questions?.reduce((sum, q) => sum + (q.maxPoints || 1), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-600 transition-colors"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{assessment.title}</h2>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {relevantSubs.length} submission{relevantSubs.length !== 1 ? 's' : ''} &nbsp;·&nbsp; {totalMarks} total marks
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={downloadAnswerKey}
                            disabled={downloadingPdf}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                        >
                            <i className={`fas ${downloadingPdf ? 'fa-spinner fa-spin' : 'fa-file-pdf'} text-red-500`}></i>
                            {downloadingPdf ? 'Downloading...' : 'Download Answer Key PDF'}
                        </button>

                        <button
                            onClick={() => setShowAnswerKey(!showAnswerKey)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                                showAnswerKey
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <i className="fas fa-book-open"></i>
                            Reference Key
                        </button>

                        {!isPublished ? (
                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
                            >
                                <i className={`fas ${publishing ? 'fa-spinner fa-spin' : 'fa-bullhorn'}`}></i>
                                {publishing ? 'Publishing...' : 'Publish Results'}
                            </button>
                        ) : (
                            <span className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <i className="fas fa-check-circle"></i> Published
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Answer Key Panel */}
            {showAnswerKey && (
                <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between transition-all">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <i className="fas fa-shield-alt text-indigo-500"></i> Benchmarked Answer Repository
                        </h3>
                        <button 
                            onClick={() => setShowAnswerKey(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            title="Close Reference Key"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {assessment.questions?.map((q, i) => (
                            <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                                <p className="font-semibold text-slate-800 mb-3 text-sm leading-snug">
                                    <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md px-2 py-0.5 mr-2">Q{i + 1}</span>
                                    {q.prompt}
                                </p>
                                <div className="space-y-2">
                                    {q.type === 'MCQ' ? (
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Correct Answer</p>
                                            <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                                                <i className="fas fa-check mr-2 text-emerald-500"></i>
                                                {String.fromCharCode(65 + q.correctOptionIndex)}. {q.options?.[q.correctOptionIndex]}
                                            </p>
                                            <div className="mt-2 space-y-1">
                                                {q.options?.map((opt, oi) => (
                                                    <p key={oi} className={`text-xs px-2 py-1 rounded ${oi === q.correctOptionIndex ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                                                        {String.fromCharCode(65 + oi)}. {opt}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Expected Answer / AI Reference</p>
                                            <p className="text-sm text-slate-700 bg-white border border-slate-100 rounded-lg px-3 py-2 leading-relaxed italic">
                                                {q.expectedAnswer || 'No reference answer set.'}
                                            </p>
                                            {q.keyPoints?.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-slate-400 font-medium mb-1">Key Points:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {q.keyPoints.map((kp, j) => (
                                                            <span key={j} className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md px-2 py-0.5 font-medium">{kp}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-400 font-medium pt-1">
                                        Marks: <span className="font-bold text-slate-600">{q.maxPoints || 1}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submissions Table */}
            {relevantSubs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
                    <i className="fas fa-inbox text-4xl text-slate-200 block mb-4"></i>
                    <p className="text-slate-400 font-semibold">No submissions yet for this assessment</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Score</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Feedback</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {relevantSubs.map(sub => {
                                const edit = getEdit(sub._id);
                                // Use teacherOverrideScore if set, else fall back to AI score
                                const score = parseFloat(sub.teacherOverrideScore ?? sub.score) || 0;
                                const maxScore = sub.maxScore || totalMarks || 1;
                                const pct = Math.min(100, Math.round((score / maxScore) * 100));
                                const isMalpractice = sub.malpractice;

                                // Get breakdown — try both paths
                                const breakdown = sub.aiFeedbackBreakdown?.breakdown || sub.breakdown || [];

                                return (
                                    <React.Fragment key={sub._id}>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            {/* Student */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${isMalpractice ? 'bg-red-500' : 'bg-slate-800'}`}>
                                                        {(sub.studentId?.name || 'S')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm">{sub.studentId?.name || 'Unknown Student'}</p>
                                                        <p className="text-xs text-slate-400">{sub.studentId?.rollNumber || sub.studentId?.email || ''}</p>
                                                        {isMalpractice && (
                                                            <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-md px-1.5 py-0.5 mt-0.5">
                                                                Malpractice Flagged
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Score */}
                                            <td className="px-4 py-4 text-center">
                                                {edit.editing ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <input
                                                            type="number"
                                                            value={edit.score}
                                                            onChange={e => setEditMap(prev => ({ ...prev, [sub._id]: { ...edit, score: e.target.value } }))}
                                                            className="w-20 p-2 border-2 border-indigo-400 bg-white rounded-lg font-bold text-center outline-none text-lg"
                                                            step="0.5" min="0" max={maxScore}
                                                        />
                                                        <span className="text-xs text-slate-400">/ {maxScore}</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-2xl font-bold text-slate-900">{score}</p>
                                                        <p className="text-xs text-slate-400">/ {maxScore}</p>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Percentage Badge */}
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${
                                                    pct >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    pct >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-red-50 text-red-600 border-red-200'
                                                }`}>
                                                    {pct}%
                                                </span>
                                            </td>

                                            {/* Feedback */}
                                            <td className="px-4 py-4 max-w-xs">
                                                {edit.editing ? (
                                                    <textarea
                                                        value={edit.feedback}
                                                        onChange={e => setEditMap(prev => ({ ...prev, [sub._id]: { ...edit, feedback: e.target.value } }))}
                                                        className="w-full p-2 border border-slate-200 bg-slate-50 rounded-lg text-sm resize-none h-20 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                                        placeholder="Add feedback..."
                                                    />
                                                ) : (
                                                    <p className="text-sm text-slate-500 italic line-clamp-2">
                                                        {sub.teacherFeedback || sub.feedback || 'No feedback yet'}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => setExpandedStudent(expandedStudent === sub._id ? null : sub._id)}
                                                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                                                            expandedStudent === sub._id
                                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                                        }`}
                                                    >
                                                        <i className={`fas ${expandedStudent === sub._id ? 'fa-chevron-up' : 'fa-eye'}`}></i>
                                                        {expandedStudent === sub._id ? 'Close' : 'Answer Sheet'}
                                                    </button>
                                                    <button
                                                        onClick={() => onEvaluate ? onEvaluate(sub) : startEdit(sub)}
                                                        className="px-3 py-2 bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-sm"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                        <span>Evaluate</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Answer Sheet */}
                                        {expandedStudent === sub._id && (
                                            <tr className="bg-slate-50/70">
                                                <td colSpan={5} className="px-6 py-6">
                                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                        {/* Sheet Header */}
                                                        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <i className="fas fa-clipboard-list text-slate-300"></i>
                                                                <div>
                                                                    <p className="font-bold text-sm">{sub.studentId?.name}'s Answer Sheet</p>
                                                                    <p className="text-xs text-slate-400">{assessment.title}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xl font-bold">{score} / {maxScore}</p>
                                                                <p className="text-xs text-slate-400">{pct}% Score</p>
                                                            </div>
                                                        </div>

                                                        {/* AI Pedagogical Analysis Summary */}
                                                        {(sub.aiFeedbackBreakdown?.overallFeedback || sub.feedback) && (
                                                            <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4">
                                                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                                    <i className="fas fa-brain"></i> AI Pedagogical Analysis
                                                                </p>
                                                                <p className="text-sm text-indigo-900 leading-relaxed font-medium italic">
                                                                    {sub.aiFeedbackBreakdown?.overallFeedback || sub.feedback}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Questions */}
                                                        <div className="divide-y divide-slate-100">
                                                            {assessment.questions?.map((q, qi) => {
                                                                const answer = sub.answers?.[q.id];
                                                                // Look up AI evaluation data for this question
                                                                const evalData = breakdown.find(b =>
                                                                    b.questionId === q.id ||
                                                                    b.questionIndex === qi + 1
                                                                ) || {};
                                                                const pointsAwarded = evalData.pointsAwarded ?? evalData.points ?? 0;
                                                                const maxPts = q.maxPoints || 1;
                                                                const isCorrect = q.type === 'MCQ'
                                                                    ? String(answer) === String(q.correctOptionIndex)
                                                                    : evalData.correct;

                                                                const studentAnswerText = q.type === 'MCQ'
                                                                    ? (answer !== undefined && answer !== null && q.options
                                                                        ? `${String.fromCharCode(65 + parseInt(answer))}. ${q.options[parseInt(answer)]}`
                                                                        : 'No answer')
                                                                    : (answer || 'No answer provided');

                                                                const correctAnswerText = q.type === 'MCQ'
                                                                    ? `${String.fromCharCode(65 + q.correctOptionIndex)}. ${q.options?.[q.correctOptionIndex]}`
                                                                    : (q.expectedAnswer || evalData.referenceAnswer || 'See answer key');

                                                                return (
                                                                    <div key={qi} className="px-6 py-5">
                                                                        {/* Question Header */}
                                                                        <div className="flex items-start justify-between gap-3 mb-4">
                                                                            <div className="flex items-start gap-3 flex-1">
                                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs shrink-0 mt-0.5">
                                                                                    {qi + 1}
                                                                                </span>
                                                                                <p className="text-sm font-semibold text-slate-800 leading-snug">{q.prompt}</p>
                                                                            </div>
                                                                            <div className="shrink-0 flex items-center gap-2">
                                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                                                                                    q.type === 'MCQ'
                                                                                        ? (isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')
                                                                                        : 'bg-slate-100 text-slate-600'
                                                                                }`}>
                                                                                    <i className={`fas ${isCorrect ? 'fa-check' : (q.type === 'MCQ' ? 'fa-times' : 'fa-pencil')}`}></i>
                                                                                    {pointsAwarded} / {maxPts} marks
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Side by Side Answers */}
                                                                        <div className={`grid gap-4 ${q.type === 'DESCRIPTIVE' ? 'md:grid-cols-2' : ''}`}>
                                                                            {/* Student Answer */}
                                                                            <div>
                                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                                                                    <i className="fas fa-user mr-1.5"></i> Student's Answer
                                                                                </p>
                                                                                <div className={`text-sm rounded-lg border px-4 py-3 ${
                                                                                    q.type === 'MCQ'
                                                                                        ? (isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800')
                                                                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                                                                } leading-relaxed`}>
                                                                                    {q.type === 'MCQ' && (
                                                                                        <i className={`fas ${isCorrect ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-red-500'} mr-2`}></i>
                                                                                    )}
                                                                                    {studentAnswerText}
                                                                                </div>
                                                                            </div>

                                                                            {/* Correct / Reference Answer */}
                                                                            <div>
                                                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1.5">
                                                                                    <i className="fas fa-check-circle mr-1.5"></i> Correct / Reference Answer
                                                                                </p>
                                                                                <div className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3 leading-relaxed">
                                                                                    {correctAnswerText}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* AI Feedback for descriptive */}
                                                                        {q.type === 'DESCRIPTIVE' && evalData.feedback && (
                                                                            <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                                                                                <p className="text-xs font-bold text-indigo-500 mb-1">
                                                                                    <i className="fas fa-robot mr-1.5"></i> AI Evaluation Feedback
                                                                                </p>
                                                                                <p className="text-xs text-indigo-700 leading-relaxed">{evalData.feedback}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Teacher Feedback */}
                                                        {(sub.teacherFeedback || sub.feedback) && (
                                                            <div className="bg-amber-50 border-t border-amber-100 px-6 py-4">
                                                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                                                                    <i className="fas fa-comment-alt mr-1.5"></i> Faculty Feedback
                                                                </p>
                                                                <p className="text-sm text-amber-900">{sub.teacherFeedback || sub.feedback}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SubmissionReview;
