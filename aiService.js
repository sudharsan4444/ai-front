import api from './services/api';

export const generateQuestions = async (topic, count, difficulty) => {
  const response = await api.post('/ai/generate-quiz', {
    topic,
    count,
    difficulty
  });
  return response.data;
};

export const evaluateSubmission = async (assessmentTitle, questions, studentAnswers) => {
  // We can let the backend handle the submission grading entirely via the /submissions/:id/submit endpoint
  // But if the frontend needs a "dry run" or if the logic is split, we keep this.
  // Actually, looking at the backend implementation, the grading happens on submit.
  // So this function might be redundant OR we can repurpose it to call a specific evaluation endpoint
  // if we want immediate feedback before saving.
  // However, the current frontend calls this, then creates a submission object.
  // We should change the frontend flow to just "submit" to the backend.
  // For now, to minimize refactoring impact on TeacherDashboard (which generates questions),
  // we keep generateQuestions. 

  // For evaluation, the backend `submission.js` handles it. 
  // But `QuizTaking.jsx` calls this. We will deprecated this on the frontend
  // and move the logic to `onSubmit` in `QuizTaking`.
  // Wait, `QuizTaking.jsx` calls `evaluateSubmission` then `onSubmit`.
  // We should change `QuizTaking.jsx` to just call `onSubmit` which calls the backend.

  // Checking `QuizTaking.jsx`:
  // const result = await evaluateSubmission(...);
  // const submission = { ... score: result.score ... };
  // onSubmit(submission);

  // We will change this flow in QuizTaking.
  return { score: 0, feedback: "Grading will be done by server" };
};

export const chatWithAI = async (message) => {
  const response = await api.post('/ai/chat', { message });
  return response.data.reply;
};
