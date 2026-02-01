import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { userRepository, quizRepository } from './repositories';
import { CreateQuestionInput } from '@shared/types/quiz';

const BCRYPT_ROUNDS = 10;

const TEST_USER = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'password123',
};

function buildGeographyQuestions(): CreateQuestionInput[] {
  return [
    {
      id: uuidv4(),
      text: 'What is the capital of France?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 0,
      answers: [
        { id: uuidv4(), text: 'Paris', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'London', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'Berlin', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'Madrid', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'Which ocean is the largest?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 1,
      answers: [
        { id: uuidv4(), text: 'Pacific', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'Atlantic', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'Indian', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'Arctic', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'What country has the most people?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 2,
      answers: [
        { id: uuidv4(), text: 'China', isCorrect: false, orderIndex: 0 },
        { id: uuidv4(), text: 'India', isCorrect: true, orderIndex: 1 },
        { id: uuidv4(), text: 'USA', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'Indonesia', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'What is the longest river?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 3,
      answers: [
        { id: uuidv4(), text: 'Nile', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'Amazon', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'Mississippi', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'Yangtze', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'Which continent is the Sahara Desert in?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 4,
      answers: [
        { id: uuidv4(), text: 'Africa', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'Asia', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'Australia', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'South America', isCorrect: false, orderIndex: 3 },
      ],
    },
  ];
}

function buildScienceQuestions(): CreateQuestionInput[] {
  return [
    {
      id: uuidv4(),
      text: 'What planet is closest to the Sun?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 0,
      answers: [
        { id: uuidv4(), text: 'Mercury', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'Venus', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'Earth', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'Mars', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'What gas do plants absorb?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 1,
      answers: [
        { id: uuidv4(), text: 'CO2', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'Oxygen', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'Nitrogen', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'Hydrogen', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'How many bones in the human body?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 2,
      answers: [
        { id: uuidv4(), text: '206', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: '196', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: '216', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: '186', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'What is H2O?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 3,
      answers: [
        { id: uuidv4(), text: 'Water', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'Oxygen', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'Hydrogen', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'Helium', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'What force keeps us on the ground?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 4,
      answers: [
        { id: uuidv4(), text: 'Gravity', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'Magnetism', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'Friction', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'Inertia', isCorrect: false, orderIndex: 3 },
      ],
    },
  ];
}

function buildPopCultureQuestions(): CreateQuestionInput[] {
  return [
    {
      id: uuidv4(),
      text: 'Who painted the Mona Lisa?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 0,
      answers: [
        { id: uuidv4(), text: 'Da Vinci', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'Michelangelo', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'Picasso', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'Van Gogh', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'What year did the first iPhone launch?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 1,
      answers: [
        { id: uuidv4(), text: '2007', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: '2005', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: '2008', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: '2010', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'What is the most-watched YouTube video?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 2,
      answers: [
        { id: uuidv4(), text: 'Baby Shark', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'Despacito', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'Gangnam Style', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'See You Again', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      id: uuidv4(),
      text: 'Who wrote Harry Potter?',
      timeLimit: 20,
      points: 1000,
      orderIndex: 3,
      answers: [
        { id: uuidv4(), text: 'J.K. Rowling', isCorrect: true, orderIndex: 0 },
        { id: uuidv4(), text: 'Stephen King', isCorrect: false, orderIndex: 1 },
        { id: uuidv4(), text: 'J.R.R. Tolkien', isCorrect: false, orderIndex: 2 },
        { id: uuidv4(), text: 'George R.R. Martin', isCorrect: false, orderIndex: 3 },
      ],
    },
  ];
}

export async function seedDatabase(): Promise<void> {
  // Check if seed data already exists
  const existingUser = await userRepository.findByEmail(TEST_USER.email);
  if (existingUser) {
    console.log('[seed] Seed data already exists (test user found). Skipping.');
    return;
  }

  console.log('[seed] Seeding database...');

  // --- Create test user ---
  const passwordHash = await bcrypt.hash(TEST_USER.password, BCRYPT_ROUNDS);
  const user = await userRepository.create({
    email: TEST_USER.email,
    username: TEST_USER.username,
    passwordHash,
  });
  console.log(`[seed] Created test user: ${user.email} (id: ${user.id})`);

  // --- Quiz 1: World Geography ---
  const geographyQuiz = await quizRepository.create({
    title: 'World Geography',
    description: 'Test your knowledge of world geography with these fun questions!',
    hostId: user.id,
  });
  await quizRepository.replaceQuestions(geographyQuiz.id, buildGeographyQuestions());
  await quizRepository.update(geographyQuiz.id, { isPublished: true });
  console.log(`[seed] Created quiz: "${geographyQuiz.title}" (5 questions)`);

  // --- Quiz 2: Science Basics ---
  const scienceQuiz = await quizRepository.create({
    title: 'Science Basics',
    description: 'A quick quiz on fundamental science concepts.',
    hostId: user.id,
  });
  await quizRepository.replaceQuestions(scienceQuiz.id, buildScienceQuestions());
  await quizRepository.update(scienceQuiz.id, { isPublished: true });
  console.log(`[seed] Created quiz: "${scienceQuiz.title}" (5 questions)`);

  // --- Quiz 3: Pop Culture ---
  const popCultureQuiz = await quizRepository.create({
    title: 'Pop Culture',
    description: 'How well do you know movies, music, and more?',
    hostId: user.id,
  });
  await quizRepository.replaceQuestions(popCultureQuiz.id, buildPopCultureQuestions());
  await quizRepository.update(popCultureQuiz.id, { isPublished: true });
  console.log(`[seed] Created quiz: "${popCultureQuiz.title}" (4 questions)`);

  console.log('[seed] Database seeded successfully!');
}
