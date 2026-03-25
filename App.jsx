
import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import Navigation from './components/Navigation';
import AIChat from './components/AIChat';

import authService from './services/authService';
import api from './services/api';

const App = () => {
  const [user, setUser] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isQuizActive, setIsQuizActive] = useState(false);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      setUser(prevUser => ({ ...prevUser, ...res.data }));
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const fetchData = async () => {
    if (!authService.getCurrentUser()) return;
    try {
      const isStudent = authService.getCurrentUser()?.role === 'STUDENT';
      const [assRes, subRes] = await Promise.all([
        api.get('/assessments'),
        isStudent ? api.get('/submissions/my') : api.get('/submissions')
      ]);
      setAssessments(assRes.data);
      setSubmissions(subRes.data);
      if (isStudent) fetchUserProfile();
    } catch (error) {
      console.error("Failed to fetch data:", error);
      if (error.response?.status === 401) {
        handleLogout();
        window.location.reload(); // Force refresh to clear UI state
      }
    }
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchData();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      const interval = setInterval(fetchData, 120000); // 2 minutes
      return () => clearInterval(interval);
    }
  }, [user?.role]); // Only re-run if role changes (which shouldn't happen often)

  const handleLogin = (u) => {
    setUser(u);
    fetchData();
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setAssessments([]);
    setSubmissions([]);
  };

  const addAssessment = async (a) => {
    try {
      const res = await api.post('/assessments', a);
      setAssessments([res.data, ...assessments]);
    } catch (err) {
      console.error("Failed to create assessment", err);
      alert("Failed to save assessment");
    }
  };

  const addSubmission = async () => {
    await fetchData();
  };

  const updateSubmission = async () => {
    await fetchData();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) {
    return <Landing onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark' : ''}`}
         style={{ background: 'rgb(var(--bg-card))' }}>
      
      {user && !isQuizActive && (
        <Navigation
          user={user}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleDark={toggleDarkMode}
        />
      )}

      <main className="w-full">
        <div className="w-full max-w-[1440px] mx-auto">
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <AdminDashboard
                  user={user}
                  assessments={assessments}
                  submissions={submissions}
                  onLogout={handleLogout}
                  onRefresh={fetchData}
                  onUpdateSubmission={updateSubmission}
                />
              )}
              {user.role === 'TEACHER' && (
                <TeacherDashboard
                  user={user}
                  assessments={assessments}
                  submissions={submissions}
                  onAddAssessment={addAssessment}
                  onUpdateSubmission={updateSubmission}
                  onLogout={handleLogout}
                  onRefresh={fetchData}
                />
              )}
              {user.role === 'STUDENT' && (
                <StudentDashboard
                  user={user}
                  assessments={assessments}
                  submissions={submissions}
                  onStartQuiz={addSubmission}
                  onQuizStateChange={setIsQuizActive}
                  onRefresh={fetchData}
                  onLogout={handleLogout}
                />
              )}
            </>
          ) : (
            <Landing onLogin={handleLogin} />
          )}
        </div>
      </main>

      {/* AI Chat Bot - visible for students when not in a quiz */}
      {user && user.role === 'STUDENT' && !isQuizActive && (
        <AIChat user={user} />
      )}

      <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed -top-32 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
    </div>
  );
};

export default App;
