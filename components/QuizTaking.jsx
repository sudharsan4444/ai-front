import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const MALPRACTICE_REASONS = {
  tabSwitch: 'Tab switching detected.',
  fullscreenExit: 'Fullscreen mode was exited.',
  printScreen: 'Screen capture shortcut detected.',
};

// ─── Phase Enum ───────────────────────────────────────────
const PHASE = { READY: 'ready', CONFIRM: 'confirm', QUIZ: 'quiz', SUBMIT_CONFIRM: 'submit_confirm', DONE: 'done' };

const QuizTaking = ({ user, assessment, submissionId, onSubmit, onCancel, onQuizStart, onQuizEnd }) => {
  const [phase, setPhase] = useState(PHASE.READY);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [failReason, setFailReason] = useState(null);
  const timerRef = useRef(null);
  const quizStarted = useRef(false);

  const totalTime = assessment.questions.length * 2 * 60; // 2 min per question

  // ─── Anti-Cheat Enforcement ───────────────────────────────
  const autoFail = useCallback(async (reason) => {
    if (!quizStarted.current) return;
    quizStarted.current = false;
    clearInterval(timerRef.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setFailReason(reason);
    onQuizEnd?.();
    try {
      await api.post(`/submissions/${submissionId}/submit`, {
        answers,
        malpractice: true,
        malpracticeReason: reason
      });
    } catch (e) { console.error('Auto-fail submit error:', e); }
    onSubmit({ malpractice: true, reason });
  }, [answers, submissionId, onSubmit, onQuizEnd]);

  useEffect(() => {
    if (phase !== PHASE.QUIZ) return;

    // Tab visibility change
    const onVisibility = () => {
      if (document.hidden) autoFail(MALPRACTICE_REASONS.tabSwitch);
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Fullscreen exit
    const onFullscreen = () => {
      if (!document.fullscreenElement && quizStarted.current) {
        autoFail(MALPRACTICE_REASONS.fullscreenExit);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreen);

    // PrintScreen / screen capture — catches:
    //   PrintScreen, Alt+PrintScreen, Ctrl+PrintScreen,
    //   Win+Shift+S (Windows Snipping Tool),
    //   Cmd+Shift+3/4/5 (macOS), Ctrl+P (print)
    const onKeyDown = (e) => {
      // PrintScreen key (with any modifier)
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        autoFail(MALPRACTICE_REASONS.printScreen);
        return;
      }
      // Windows Snipping Tool: Win+Shift+S
      if (e.shiftKey && e.metaKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        autoFail(MALPRACTICE_REASONS.printScreen);
        return;
      }
      // macOS screenshots: Cmd+Shift+3/4/5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        autoFail(MALPRACTICE_REASONS.printScreen);
        return;
      }
      // Ctrl+P (print page — can also be used to capture)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        autoFail(MALPRACTICE_REASONS.printScreen);
        return;
      }
      // Disable copy/paste shortcuts
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    // Window blur — detects when screenshot tools (e.g. Snipping Tool) steal focus
    const onWindowBlur = () => {
      if (quizStarted.current && !document.hidden) {
        autoFail(MALPRACTICE_REASONS.printScreen);
      }
    };
    window.addEventListener('blur', onWindowBlur);

    // Disable right-click
    const onContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', onContextMenu);

    // Copy/paste events
    const noop = (e) => e.preventDefault();
    document.addEventListener('copy', noop);
    document.addEventListener('cut', noop);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', noop);
      document.removeEventListener('cut', noop);
    };
  }, [phase, autoFail]);

  // ─── Timer ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== PHASE.QUIZ) return;
    setTimeLeft(totalTime);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit(true); // auto-submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ─── Fullscreen Request ───────────────────────────────────
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.warn('Fullscreen not supported, proceeding anyway');
    }
  };

  const startQuiz = async () => {
    await enterFullscreen();
    quizStarted.current = true;
    onQuizStart?.();
    setPhase(PHASE.QUIZ);
  };

  // ─── Submit ───────────────────────────────────────────────
  const handleFinalSubmit = async (timeout = false) => {
    clearInterval(timerRef.current);
    quizStarted.current = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setIsSubmitting(true);
    onQuizEnd?.();
    try {
      const timeTaken = totalTime - (timeLeft || 0);
      const response = await api.post(`/submissions/${submissionId}/submit`, { answers, timeTaken });
      onSubmit(response.data);
    } catch (error) {
      console.error(error);
      alert('Error submitting. Please try again.');
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQ = assessment.questions.length;
  const currentQ = assessment.questions[currentIdx];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── PHASE: READY (Instructions) ─────────────────────────
  if (phase === PHASE.READY) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full p-1 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-white p-8 space-y-6 rounded-[2.4rem]">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200 rotate-3">
                <i className="fas fa-shield-halved text-2xl"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{assessment.title}</h2>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Academic Integrity Protocol • {totalQ} Items • {Math.round(totalTime / 60)}m</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-3">
              <p className="font-black text-indigo-600 text-[10px] uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                <i className="fas fa-microchip"></i> System Constraints
              </p>
              {[
                'Active Fullscreen Environment required.',
                'Cross-tab activity triggers immediate failure.',
                'Manual exit results in Grade F automation.',
                'Screenshots & Print Screen are blocked — triggers auto-fail.',
                'All capture & input buffers are restricted.',
                'AI Assistant support is deactivated.',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-3 p-1.5 rounded-xl">
                  <i className="fas fa-check-circle text-emerald-500 mt-0.5 shrink-0 text-xs"></i>
                  <p className="text-sm text-slate-600 font-bold leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={onCancel} className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-500 font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button onClick={() => setPhase(PHASE.CONFIRM)} className="flex-[2] py-4 rounded-xl bg-indigo-600 text-white font-black text-base hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2">
                <i className="fas fa-lock"></i> Initialize Security
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: CONFIRM ───────────────────────────────────────
  if (phase === PHASE.CONFIRM) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full p-1 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-white p-10 text-center space-y-6 rounded-[2.4rem]">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <i className="fas fa-bolt-lightning text-emerald-500 text-3xl animate-pulse"></i>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Environment Lock</h2>
              <p className="text-slate-500 font-medium text-sm">The browser will now transition to secure assessment mode.</p>
            </div>
            <button onClick={startQuiz} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-base hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3">
               Start Assessment
            </button>
            <button onClick={() => setPhase(PHASE.READY)} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">
              Adjust Parameters
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: SUBMIT CONFIRM ────────────────────────────────
  if (phase === PHASE.SUBMIT_CONFIRM) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[210] flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full p-1 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-white p-10 text-center space-y-8 rounded-[2.4rem]">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto border border-indigo-100">
              <i className="fas fa-cloud-arrow-up text-indigo-600 text-3xl"></i>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Sync Progress</h2>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mx-auto w-fit px-10">
                <p className="text-4xl font-black text-slate-900">{answeredCount}<span className="text-slate-300 text-xl font-bold"> / {totalQ}</span></p>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Packets Prepared</p>
              </div>
            </div>
            {answeredCount < totalQ && (
              <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50 p-3 rounded-xl border border-amber-100">
                <i className="fas fa-exclamation-triangle mr-2"></i> {totalQ - answeredCount} items are incomplete.
              </p>
            )}
            <button onClick={() => handleFinalSubmit()} disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-base hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group">
              {isSubmitting ? <><i className="fas fa-circle-notch fa-spin mr-2"></i>Uploading...</> : <><i className="fas fa-check-circle mr-2 group-hover:scale-110 transition-transform"></i> Finalize Submission</>}
            </button>
            <button onClick={() => setPhase(PHASE.QUIZ)} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">
              Return to Editor
            </button>
          </div>
        </div>
      </div>
    );
  }


  // ─── PHASE: QUIZ ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col font-sans" style={{ userSelect: 'none' }}>
      {/* Header */}
      <div className="bg-white border-b-2 border-slate-300 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <i className="fas fa-edit text-lg"></i>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Examination Portal</p>
            <h2 className="text-base sm:text-lg font-black text-slate-900 truncate max-w-[200px] sm:max-w-md">{assessment.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="hidden md:block text-right">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">Completion Status</p>
            <p className="font-black text-lg text-slate-900">{answeredCount}<span className="text-slate-300"> / {totalQ}</span></p>
          </div>
          <div className={`flex flex-col items-center justify-center px-4 sm:px-6 py-2 rounded-2xl border-2 ${timeLeft < 60 ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'bg-slate-900 border-slate-700 text-white shadow-lg'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Time Remaining</p>
            <p className="font-black text-xl sm:text-2xl font-mono leading-none">{formatTime(timeLeft || 0)}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 shrink-0">
        <div className="h-full bg-indigo-600 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]" style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}></div>
      </div>

      {/* Question Area */}
      <div className="flex-1 overflow-y-auto pt-6 sm:pt-10 pb-16 px-4 flex items-start justify-center">
        <div className="w-full max-w-3xl animate-in slide-in-from-bottom-4 duration-500">
          {/* Question info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">Question {currentIdx + 1}</span>
              <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${currentQ.type === 'MCQ' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                {currentQ.type}
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <i className="fas fa-award mr-1.5 text-amber-400"></i>
              Value: {currentQ.maxPoints} {currentQ.maxPoints === 1 ? 'Credit' : 'Credits'}
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-8 tracking-tight">{currentQ.prompt}</h3>

          {currentQ.type === 'MCQ' ? (
            <div className="grid gap-4">
              {currentQ.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: idx }))}
                  className={`group w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 font-bold text-base ${
                    answers[currentQ.id] === idx
                      ? 'border-indigo-600 bg-white text-indigo-700 shadow-xl shadow-indigo-100 -translate-y-1'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-black transition-colors ${answers[currentQ.id] === idx ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'border-slate-100 text-slate-300 group-hover:border-slate-300'}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {answers[currentQ.id] === idx && <i className="fas fa-check-circle text-indigo-600 text-xl animate-in zoom-in duration-300"></i>}
                </button>
              ))}
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-100 to-sky-100 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
              <textarea
                className="relative w-full h-48 sm:h-56 p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 placeholder:text-slate-300 font-bold text-base focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
                placeholder="Type your comprehensive analysis here..."
                value={answers[currentQ.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
              />
            </div>
          )}

          {/* Navigation Grid */}
          <div className="mt-10 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Quick Navigator</p>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-600"></div><span className="text-[10px] font-black text-slate-400 uppercase">Current</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black text-slate-400 uppercase">Answered</span></div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {assessment.questions.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentIdx(i)}
                  className={`w-10 h-10 rounded-xl text-sm font-black transition-all border-2 ${
                    i === currentIdx 
                      ? 'bg-white text-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 scale-110 z-10'
                      : answers[q.id] !== undefined 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-white text-slate-300 border-slate-50 hover:border-slate-200 hover:text-slate-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white/80 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between shrink-0 border-t border-slate-100 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-900 hover:bg-slate-50 disabled:opacity-20 transition-all"
        >
          <i className="fas fa-arrow-left text-xs"></i>
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Progress</p>
             <p className="text-sm font-black text-slate-400">Packet {currentIdx + 1} <span className="text-slate-200">/ {totalQ}</span></p>
          </div>
          {currentIdx === totalQ - 1 ? (
            <button
              onClick={() => setPhase(PHASE.SUBMIT_CONFIRM)}
              className="bg-indigo-600 text-white px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-base shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-3 group"
            >
              <i className="fas fa-paper-plane text-sm group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i> 
              <span className="hidden sm:inline">Complete Process</span>
              <span className="sm:hidden">Submit</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx(Math.min(totalQ - 1, currentIdx + 1))}
              className="bg-slate-900 text-white px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-base hover:bg-black transition-all flex items-center gap-3 group shadow-xl shadow-slate-200"
            >
              Continue
              <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTaking;
