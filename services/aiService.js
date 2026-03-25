import api from './api';

export const generateQuestions = async (topic, count, difficulty) => {
  const response = await api.post('/ai/generate-quiz', {
    topic,
    count,
    difficulty
  });
  return response.data;
};

export const evaluateSubmission = async (assessmentTitle, questions, studentAnswers) => {
  return { score: 0, feedback: "Grading will be done by server" };
};

export const chatWithAI = async (message, materialId = null) => {
  const response = await api.post('/ai/chat', { message, materialId });
  return response.data.reply;
};
