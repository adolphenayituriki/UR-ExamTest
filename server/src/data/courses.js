export const courses = [
  {
    code: 'SE1101',
    title: 'Programming Fundamentals',
    description:
      'Introduction to structured programming using Python: variables, control flow, functions, and basic data structures.',
    program: 'BSc Software Engineering',
    yearOfStudy: 1,
    credits: 10,
    semester: 'I',
    accent: '#2563eb',
    topics: [
      { key: 'fundamentals', title: 'Variables, Types & Operators' },
      { key: 'control-flow', title: 'Control Flow & Loops' },
      { key: 'functions', title: 'Functions & Modularity' },
      { key: 'data-structures', title: 'Lists, Tuples & Dictionaries' },
    ],
  },
  {
    code: 'MTH1101',
    title: 'Calculus I',
    description:
      'Limits, continuity, differentiation and integration with engineering applications.',
    program: 'BSc Software Engineering',
    yearOfStudy: 1,
    credits: 10,
    semester: 'I',
    accent: '#0891b2',
    topics: [
      { key: 'limits', title: 'Limits & Continuity' },
      { key: 'derivatives', title: 'Derivatives' },
      { key: 'integrals', title: 'Integration' },
    ],
  },
  {
    code: 'SE2101',
    title: 'Object-Oriented Programming',
    description:
      'Classes, objects, inheritance, polymorphism and exception handling with a modern object-oriented language.',
    program: 'BSc Software Engineering',
    yearOfStudy: 2,
    credits: 10,
    semester: 'I',
    accent: '#7c3aed',
    topics: [
      { key: 'classes', title: 'Classes & Objects' },
      { key: 'inheritance', title: 'Inheritance' },
      { key: 'polymorphism', title: 'Polymorphism' },
      { key: 'exceptions', title: 'Exception Handling' },
    ],
  },
  {
    code: 'SE2102',
    title: 'Data Structures & Algorithms',
    description:
      'Linear and non-linear data structures, algorithm analysis and foundational algorithm design techniques.',
    program: 'BSc Software Engineering',
    yearOfStudy: 2,
    credits: 10,
    semester: 'I',
    accent: '#db2777',
    topics: [
      { key: 'complexity', title: 'Algorithm Complexity' },
      { key: 'linear', title: 'Arrays, Stacks & Queues' },
      { key: 'linked', title: 'Linked Lists' },
      { key: 'trees', title: 'Trees & Graphs' },
      { key: 'sorting', title: 'Searching & Sorting' },
    ],
  },
  {
    code: 'SE2103',
    title: 'Database Systems',
    description:
      'Relational modelling, SQL, normalization, transactions and the principles of database design.',
    program: 'BSc Software Engineering',
    yearOfStudy: 2,
    credits: 10,
    semester: 'II',
    accent: '#059669',
    topics: [
      { key: 'relational', title: 'Relational Model' },
      { key: 'sql', title: 'SQL & Querying' },
      { key: 'normalization', title: 'Normalization' },
      { key: 'transactions', title: 'Transactions & ACID' },
    ],
  },
  {
    code: 'SE3101',
    title: 'Software Engineering Principles',
    description:
      'Software development life cycles, requirements engineering, design, testing and quality management.',
    program: 'BSc Software Engineering',
    yearOfStudy: 3,
    credits: 10,
    semester: 'I',
    accent: '#ea580c',
    topics: [
      { key: 'sdlc', title: 'Software Development Life Cycle' },
      { key: 'requirements', title: 'Requirements Engineering' },
      { key: 'design', title: 'Software Design' },
      { key: 'testing', title: 'Testing Strategies' },
    ],
  },
  {
    code: 'SE3102',
    title: 'Operating Systems',
    description:
      'Processes, threads, CPU scheduling, memory management, deadlocks and file systems.',
    program: 'BSc Software Engineering',
    yearOfStudy: 3,
    credits: 10,
    semester: 'II',
    accent: '#4338ca',
    topics: [
      { key: 'processes', title: 'Processes & Threads' },
      { key: 'scheduling', title: 'CPU Scheduling' },
      { key: 'memory', title: 'Memory Management' },
      { key: 'deadlocks', title: 'Deadlocks' },
    ],
  },
  {
    code: 'SE4101',
    title: 'Artificial Intelligence',
    description:
      'Search, knowledge representation, machine learning foundations and intelligent systems.',
    program: 'BSc Software Engineering',
    yearOfStudy: 4,
    credits: 10,
    semester: 'I',
    accent: '#0d9488',
    topics: [
      { key: 'search', title: 'Search Algorithms' },
      { key: 'learning', title: 'Machine Learning' },
      { key: 'neural', title: 'Neural Networks' },
      { key: 'ethics', title: 'AI Ethics & Society' },
    ],
  },
  {
    code: 'SE4103',
    title: 'Cybersecurity',
    description:
      'Cryptography, authentication, secure systems, vulnerability analysis and defence in depth.',
    program: 'BSc Software Engineering',
    yearOfStudy: 4,
    credits: 10,
    semester: 'II',
    accent: '#b91c1c',
    topics: [
      { key: 'cryptography', title: 'Cryptography' },
      { key: 'authentication', title: 'Authentication & Authorization' },
      { key: 'attacks', title: 'Attack Vectors' },
      { key: 'defence', title: 'Defence in Depth' },
    ],
  },
  {
    code: 'IT1101',
    title: 'Introduction to Information Technology',
    description:
      'Foundations of information technology, hardware, software, networks and professional ethics.',
    program: 'BSc Information Technology',
    yearOfStudy: 1,
    credits: 10,
    semester: 'I',
    accent: '#0284c7',
    topics: [
      { key: 'hardware', title: 'Hardware & Software' },
      { key: 'networks', title: 'Networking Basics' },
      { key: 'ethics', title: 'IT Ethics' },
    ],
  },
  {
    code: 'IT4101',
    title: 'Cloud Computing',
    description:
      'Service models, virtualization, deployment strategies and cloud security governance.',
    program: 'BSc Information Technology',
    yearOfStudy: 4,
    credits: 10,
    semester: 'I',
    accent: '#6d28d9',
    topics: [
      { key: 'models', title: 'Cloud Service Models' },
      { key: 'virtualization', title: 'Virtualization' },
      { key: 'security', title: 'Cloud Security' },
    ],
  },
];

export const assessmentBlueprints = [
  {
    mode: 'practice',
    title: 'Practice Track',
    description:
      'Guided practice with Socratic hints and instant explanations. Perfect for concept mastery.',
    durationMinutes: 25,
    maxQuestions: 4,
    hintsAllowed: true,
    passMark: 50,
    order: 1,
  },
  {
    mode: 'mock',
    title: 'Mock Assessment',
    description:
      'Timed simulation of continuous assessment conditions. No hints, full integrity monitoring.',
    durationMinutes: 40,
    maxQuestions: 5,
    hintsAllowed: false,
    passMark: 50,
    order: 2,
  },
  {
    mode: 'exam',
    title: 'Final Examination Simulation',
    description:
      'Full-length timed examination using the complete question bank for this module.',
    durationMinutes: 60,
    maxQuestions: 6,
    hintsAllowed: false,
    passMark: 50,
    order: 3,
  },
];
