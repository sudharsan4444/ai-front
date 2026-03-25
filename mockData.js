// Mock data for testing frontend without backend

export const mockUsers = {
    admin: {
        _id: 'admin-001',
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'ADMIN',
        token: 'mock-token-admin-001'
    },
    teacher: {
        _id: 'teacher-001',
        name: 'Teacher Demo',
        email: 'teacher@test.com',
        password: 'teacher123',
        role: 'TEACHER',
        token: 'mock-token-teacher-001'
    },
    student: {
        _id: 'student-001',
        name: 'Student Demo',
        email: 'student@test.com',
        password: 'student123',
        role: 'STUDENT',
        token: 'mock-token-student-001'
    }
};

export const mockAssessments = [
    {
        _id: 'assessment-001',
        title: 'Introduction to Photosynthesis',
        topic: 'Biology',
        questions: [
            {
                id: 'q1',
                type: 'MCQ',
                prompt: 'What is the primary product of photosynthesis?',
                options: ['Oxygen', 'Carbon Dioxide', 'Water', 'Nitrogen'],
                correctOptionIndex: 0,
                difficulty: 'Easy',
                maxPoints: 10
            },
            {
                id: 'q2',
                type: 'MCQ',
                prompt: 'Which organelle is responsible for photosynthesis?',
                options: ['Mitochondria', 'Chloroplast', 'Nucleus', 'Ribosome'],
                correctOptionIndex: 1,
                difficulty: 'Medium',
                maxPoints: 10
            },
            {
                id: 'q3',
                type: 'DESCRIPTIVE',
                prompt: 'Explain the role of chlorophyll in photosynthesis.',
                difficulty: 'Medium',
                maxPoints: 15
            }
        ],
        createdBy: 'teacher-001',
        materialId: null,
        createdAt: new Date('2024-02-10').toISOString(),
        dueDate: new Date('2024-02-20').toISOString(),
        status: 'PUBLISHED'
    },
    {
        _id: 'assessment-002',
        title: 'Ancient Rome History Quiz',
        topic: 'History',
        questions: [
            {
                id: 'q1',
                type: 'MCQ',
                prompt: 'Who was the first emperor of Rome?',
                options: ['Julius Caesar', 'Augustus', 'Nero', 'Caligula'],
                correctOptionIndex: 1,
                difficulty: 'Medium',
                maxPoints: 10
            },
            {
                id: 'q2',
                type: 'MCQ',
                prompt: 'In which year did the Western Roman Empire fall?',
                options: ['476 AD', '410 AD', '509 BC', '27 BC'],
                correctOptionIndex: 0,
                difficulty: 'Hard',
                maxPoints: 15
            }
        ],
        createdBy: 'teacher-001',
        createdAt: new Date('2024-02-08').toISOString(),
        dueDate: new Date('2024-02-18').toISOString(),
        status: 'PUBLISHED'
    },
    {
        _id: 'assessment-003',
        title: 'Basic Calculus Concepts',
        topic: 'Mathematics',
        questions: [
            {
                id: 'q1',
                type: 'MCQ',
                prompt: 'What is the derivative of x²?',
                options: ['x', '2x', 'x³', '2x²'],
                correctOptionIndex: 1,
                difficulty: 'Easy',
                maxPoints: 10
            }
        ],
        createdBy: 'teacher-001',
        createdAt: new Date('2024-02-12').toISOString(),
        dueDate: new Date('2024-02-25').toISOString(),
        status: 'PUBLISHED'
    }
];

export const mockSubmissions = [
    {
        _id: 'submission-001',
        assessmentId: 'assessment-001',
        studentId: 'student-001',
        answers: {
            'q1': 'Oxygen',
            'q2': 'Chloroplast',
            'q3': 'Chlorophyll absorbs light energy to convert carbon dioxide and water into glucose and oxygen.'
        },
        score: 32,
        maxScore: 35,
        feedback: 'Excellent work! You demonstrated a strong understanding of photosynthesis. Your explanation of chlorophyll was particularly clear and comprehensive.',
        submittedAt: new Date('2024-02-11').toISOString(),
        status: 'GRADED'
    },
    {
        _id: 'submission-002',
        assessmentId: 'assessment-002',
        studentId: 'student-001',
        answers: {
            'q1': 'Augustus',
            'q2': '476 AD'
        },
        score: 25,
        maxScore: 25,
        feedback: 'Perfect score! You have excellent knowledge of Ancient Roman history. Keep up the great work!',
        submittedAt: new Date('2024-02-09').toISOString(),
        status: 'GRADED'
    }
];

// Mock authentication service
export const mockAuth = {
    login: async (email, password) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find matching user
        const user = Object.values(mockUsers).find(u =>
            u.email === email && u.password === password
        );

        if (user) {
            const userData = { ...user };
            delete userData.password; // Don't return password
            localStorage.setItem('user', JSON.stringify(userData));
            return userData;
        }

        throw new Error('Invalid credentials');
    },

    register: async (userData) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const newUser = {
            _id: `user-${Date.now()}`,
            ...userData,
            token: `mock-token-${Date.now()}`
        };

        delete newUser.password; // Don't return password
        localStorage.setItem('user', JSON.stringify(newUser));
        return newUser;
    }
};
