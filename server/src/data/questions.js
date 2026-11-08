const mcq = (course, topic, difficulty, prompt, options, correctAnswer, explanation, marks = 2) => ({
  course,
  type: 'mcq',
  topic,
  difficulty,
  prompt,
  options,
  correctAnswer,
  explanation,
  marks,
});

const tf = (course, topic, difficulty, prompt, correctAnswer, explanation, marks = 2) => ({
  course,
  type: 'truefalse',
  topic,
  difficulty,
  prompt,
  correctAnswer: correctAnswer ? 'true' : 'false',
  explanation,
  marks,
  options: [
    { key: 'true', text: 'True' },
    { key: 'false', text: 'False' },
  ],
});

const numeric = (
  course,
  topic,
  difficulty,
  prompt,
  variables,
  answerFormula,
  explanation,
  marks = 3
) => ({
  course,
  type: 'numeric',
  topic,
  difficulty,
  prompt,
  variables,
  answerFormula,
  correctAnswer: '',
  explanation,
  marks,
});

const short = (course, topic, difficulty, prompt, modelAnswer, keywords, explanation, marks = 5) => ({
  course,
  type: 'short',
  topic,
  difficulty,
  prompt,
  correctAnswer: modelAnswer,
  rubric: { modelAnswer, keywords, guidance: '', minWords: 20 },
  explanation,
  marks,
});

const essay = (course, topic, difficulty, prompt, modelAnswer, keywords, explanation, marks = 10) => ({
  course,
  type: 'essay',
  topic,
  difficulty,
  prompt,
  correctAnswer: modelAnswer,
  rubric: {
    modelAnswer,
    keywords,
    guidance: 'Award marks for accurate concepts, structure and relevant examples.',
    minWords: 80,
  },
  explanation,
  marks,
});

export const questions = [
  // ---------------- SE1101 Programming Fundamentals ----------------
  mcq(
    'SE1101',
    'fundamentals',
    'easy',
    'Which Python data type is used to store a sequence of characters?',
    [
      { key: 'A', text: 'str' },
      { key: 'B', text: 'int' },
      { key: 'C', text: 'float' },
      { key: 'D', text: 'bool' },
    ],
    'A',
    "'str' stores text. 'int', 'float' and 'bool' store numeric or boolean values."
  ),
  mcq(
    'SE1101',
    'fundamentals',
    'easy',
    'What is the output of print(10 // 3) in Python?',
    [
      { key: 'A', text: '3' },
      { key: 'B', text: '3.33' },
      { key: 'C', text: '4' },
      { key: 'D', text: '1' },
    ],
    'A',
    'The // operator performs floor division, so 10 // 3 = 3.'
  ),
  tf(
    'SE1101',
    'control-flow',
    'easy',
    'In Python, the = operator assigns a value while the == operator compares two values.',
    true,
    'Assignment uses =, while comparison uses ==.'
  ),
  numeric(
    'SE1101',
    'control-flow',
    'medium',
    'A loop runs from i = 1 to i = {n} inclusive. How many iterations does it perform?',
    [{ name: 'n', min: 5, max: 15, step: 1 }],
    'n',
    'Inclusive iteration over 1..n performs exactly n iterations.',
    3
  ),
  short(
    'SE1101',
    'control-flow',
    'medium',
    'Explain the difference between a while loop and a for loop in Python.',
    'A for loop iterates over a known sequence such as a list or range, whereas a while loop repeats as long as a condition remains true and is suited to an unknown number of iterations.',
    ['condition', 'iteration', 'sequence', 'known', 'unknown'],
    'Focus on when the number of iterations is known versus condition-driven repetition.'
  ),
  essay(
    'SE1101',
    'functions',
    'medium',
    'Discuss how functions improve code quality and maintainability in large programs.',
    'Functions decompose a program into small, named, single-purpose units. This improves readability, enables reuse, isolates testing, reduces duplication and makes maintenance safer because a change is localised.',
    ['reuse', 'modular', 'read', 'test', 'maintain', 'duplication'],
    'Strong answers cover modularity, reuse, testing and maintainability with examples.'
  ),

  // ---------------- MTH1101 Calculus I ----------------
  mcq(
    'MTH1101',
    'derivatives',
    'easy',
    'What is the derivative of f(x) = x²?',
    [
      { key: 'A', text: '2x' },
      { key: 'B', text: 'x' },
      { key: 'C', text: 'x²' },
      { key: 'D', text: '2' },
    ],
    'A',
    'Using the power rule, d/dx(x²) = 2x.'
  ),
  mcq(
    'MTH1101',
    'limits',
    'medium',
    'What is lim(x→0) sin(x)/x?',
    [
      { key: 'A', text: '0' },
      { key: 'B', text: '1' },
      { key: 'C', text: '∞' },
      { key: 'D', text: 'undefined' },
    ],
    'B',
    'This is a standard limit and equals 1.'
  ),
  numeric(
    'MTH1101',
    'derivatives',
    'medium',
    "Given f(x) = {a}x² + {b}x, find f'({c}).",
    [
      { name: 'a', min: 2, max: 5, step: 1 },
      { name: 'b', min: 1, max: 9, step: 1 },
      { name: 'c', min: 1, max: 4, step: 1 },
    ],
    '2*a*c + b',
    "First differentiate term by term to get f'(x) = 2ax + b, then substitute x = c.",
    3
  ),
  numeric(
    'MTH1101',
    'integrals',
    'hard',
    'Evaluate the definite integral of {a}x from x = 0 to x = {b}.',
    [
      { name: 'a', min: 2, max: 6, step: 1 },
      { name: 'b', min: 2, max: 5, step: 1 },
    ],
    'a * b * b / 2',
    'The antiderivative of ax is ax²/2; evaluate from 0 to b.',
    3
  ),
  short(
    'MTH1101',
    'derivatives',
    'medium',
    'Explain the derivative as an instantaneous rate of change.',
    'The derivative measures how a function changes as its input changes by an infinitesimal amount. Geometrically it is the slope of the tangent line at a point.',
    ['rate', 'change', 'tangent', 'instantaneous', 'slope'],
    'Mention limits, rate of change and the tangent line interpretation.'
  ),

  // ---------------- SE2101 Object-Oriented Programming ----------------
  mcq(
    'SE2101',
    'inheritance',
    'easy',
    'Which object-oriented pillar allows a subclass to reuse the behaviour of a parent class?',
    [
      { key: 'A', text: 'Encapsulation' },
      { key: 'B', text: 'Inheritance' },
      { key: 'C', text: 'Abstraction' },
      { key: 'D', text: 'Composition' },
    ],
    'B',
    'Inheritance lets a subclass extend and reuse a parent class.'
  ),
  mcq(
    'SE2101',
    'classes',
    'easy',
    'What is the primary purpose of encapsulation?',
    [
      { key: 'A', text: 'To bundle state and behaviour while restricting direct access' },
      { key: 'B', text: 'To allow classes to inherit from one another' },
      { key: 'C', text: 'To execute multiple methods at the same time' },
      { key: 'D', text: 'To remove the need for constructors' },
    ],
    'A',
    'Encapsulation groups data and methods and protects internal state through access control.'
  ),
  tf(
    'SE2101',
    'polymorphism',
    'medium',
    'Method overloading and method overriding describe the same mechanism.',
    false,
    'Overloading uses the same method name with different signatures; overriding replaces a superclass method with a subclass implementation.'
  ),
  mcq(
    'SE2101',
    'exceptions',
    'medium',
    'What is the main purpose of a try/catch block?',
    [
      { key: 'A', text: 'To define a new class' },
      { key: 'B', text: 'To handle exceptions and prevent abnormal program termination' },
      { key: 'C', text: 'To compile the program faster' },
      { key: 'D', text: 'To hide all errors from the user' },
    ],
    'B',
    'try/catch lets a program recover gracefully from runtime exceptions.'
  ),
  short(
    'SE2101',
    'polymorphism',
    'medium',
    'Explain polymorphism and give a short object-oriented example.',
    'Polymorphism allows the same method call to behave differently depending on the runtime type of the object. For example, both Car and Bike implement move(), but a Car.move() drives while a Bike.move() pedals.',
    ['same', 'method', 'different', 'type', 'runtime', 'override'],
    'Use a concrete example of one interface or method with multiple implementations.'
  ),
  essay(
    'SE2101',
    'design',
    'hard',
    'Compare abstract classes and interfaces, discussing when each is preferable.',
    'Abstract classes provide partial implementation and shared state and can enforce template methods. Interfaces define contracts without implementation and support multiple inheritance of behaviour contracts. Use an abstract class when subclasses share implementation; use an interface when only a contract is needed or when several unrelated types must conform.',
    ['abstract', 'interface', 'implementation', 'contract', 'shared', 'multiple'],
    'Compare implementation, state, inheritance rules and typical use cases.'
  ),

  // ---------------- SE2102 Data Structures & Algorithms ----------------
  mcq(
    'SE2102',
    'complexity',
    'easy',
    'What is the time complexity of binary search on a sorted array of n elements?',
    [
      { key: 'A', text: 'O(n)' },
      { key: 'B', text: 'O(log n)' },
      { key: 'C', text: 'O(n log n)' },
      { key: 'D', text: 'O(1)' },
    ],
    'B',
    'Each step halves the search space, giving O(log n) comparisons.'
  ),
  mcq(
    'SE2102',
    'linear',
    'easy',
    'Which data structure follows the First-In-First-Out (FIFO) principle?',
    [
      { key: 'A', text: 'Stack' },
      { key: 'B', text: 'Queue' },
      { key: 'C', text: 'Binary tree' },
      { key: 'D', text: 'Hash table' },
    ],
    'B',
    'A queue removes elements in the same order they were inserted.'
  ),
  tf(
    'SE2102',
    'linked',
    'medium',
    'A singly linked list supports O(1) random access by index.',
    false,
    'Random access requires traversal and is O(n); only insertion/removal at a known node is O(1).'
  ),
  numeric(
    'SE2102',
    'complexity',
    'hard',
    'At most how many comparisons does binary search need for {n} sorted elements? (Use ceil(log2(n)).)',
    [{ name: 'n', min: 8, max: 64, step: 8 }],
    'ceil(log2(n))',
    'The search space halves each iteration, so the worst case is ceil(log2(n)).',
    3
  ),
  short(
    'SE2102',
    'linked',
    'medium',
    'Compare an array and a linked list in terms of access and insertion.',
    'Arrays offer O(1) index access but insertion or deletion in the middle costs O(n). Linked lists offer O(1) insertion or deletion at a known node but O(n) access by position and require extra memory for links.',
    ['array', 'linked', 'access', 'insert', 'memory'],
    'Contrast random access with link manipulation and mention memory overhead.'
  ),
  essay(
    'SE2102',
    'trees',
    'hard',
    'Compare breadth-first search and depth-first search, including when each is appropriate.',
    'BFS explores level by level using a queue and finds shortest paths in unweighted graphs, but can consume large memory. DFS explores deeply using a stack or recursion, uses less memory on deep graphs and is useful for cycle detection, topological sorting and backtracking. Choose BFS for shortest paths and DFS for exhaustive traversal or structural analysis.',
    ['breadth', 'depth', 'queue', 'stack', 'shortest', 'memory'],
    'Cover traversal order, data structures used, memory and typical applications.'
  ),

  // ---------------- SE2103 Database Systems ----------------
  mcq(
    'SE2103',
    'normalization',
    'medium',
    'Which normal form eliminates transitive dependencies?',
    [
      { key: 'A', text: '1NF' },
      { key: 'B', text: '2NF' },
      { key: 'C', text: '3NF' },
      { key: 'D', text: 'BCNF' },
    ],
    'C',
    'Third normal form removes transitive functional dependencies.'
  ),
  mcq(
    'SE2103',
    'sql',
    'easy',
    'Which SQL clause is used to retrieve rows from a table?',
    [
      { key: 'A', text: 'SELECT' },
      { key: 'B', text: 'INSERT' },
      { key: 'C', text: 'UPDATE' },
      { key: 'D', text: 'DELETE' },
    ],
    'A',
    'SELECT retrieves rows; INSERT, UPDATE and DELETE modify them.'
  ),
  tf(
    'SE2103',
    'relational',
    'easy',
    'A primary key may contain duplicate values.',
    false,
    'A primary key must be unique and non-null by definition.'
  ),
  numeric(
    'SE2103',
    'relational',
    'easy',
    'A relation has {n} rows and {m} columns. How many cells does the relation contain?',
    [
      { name: 'n', min: 8, max: 20, step: 1 },
      { name: 'm', min: 3, max: 6, step: 1 },
    ],
    'n * m',
    'The number of cells is rows multiplied by columns.'
  ),
  short(
    'SE2103',
    'transactions',
    'medium',
    'Explain the ACID properties of database transactions.',
    'Atomicity means all-or-nothing execution, Consistency preserves valid database state, Isolation prevents concurrent transactions from interfering, and Durability guarantees committed changes survive failures.',
    ['atomic', 'consistency', 'isolation', 'durability', 'all', 'failure'],
    'Name all four properties and explain each in one sentence.'
  ),
  essay(
    'SE2103',
    'normalization',
    'hard',
    'Discuss the benefits and trade-offs of database normalization, with examples.',
    'Normalization reduces redundancy and update anomalies by structuring relations according to functional dependencies (1NF, 2NF, 3NF). It improves consistency and integrity, but highly normalized schemas can require more joins and complex queries. Denormalization may be chosen for read performance in reporting systems, at the cost of redundancy.',
    ['redundan', 'anomal', 'normal form', 'integrity', 'join', 'performance'],
    'Balance data integrity benefits against join and performance trade-offs.'
  ),

  // ---------------- SE3101 Software Engineering Principles ----------------
  mcq(
    'SE3101',
    'sdlc',
    'easy',
    'Which phase normally comes first in the software development life cycle?',
    [
      { key: 'A', text: 'Requirements analysis' },
      { key: 'B', text: 'Coding' },
      { key: 'C', text: 'Deployment' },
      { key: 'D', text: 'Maintenance' },
    ],
    'A',
    'Requirements analysis establishes what the system must do before design and coding.'
  ),
  mcq(
    'SE3101',
    'testing',
    'easy',
    'Testing individual functions or classes in isolation is called:',
    [
      { key: 'A', text: 'Integration testing' },
      { key: 'B', text: 'Unit testing' },
      { key: 'C', text: 'System testing' },
      { key: 'D', text: 'Acceptance testing' },
    ],
    'B',
    'Unit testing targets the smallest testable pieces of software.'
  ),
  tf(
    'SE3101',
    'requirements',
    'medium',
    'Non-functional requirements describe qualities such as performance, security and usability.',
    true,
    'Non-functional requirements constrain how well the system performs its functions.'
  ),
  short(
    'SE3101',
    'requirements',
    'medium',
    'Distinguish functional requirements from non-functional requirements.',
    'Functional requirements define specific behaviours or services the system must provide. Non-functional requirements define quality attributes and constraints such as performance, security, reliability and usability.',
    ['behaviour', 'function', 'quality', 'performance', 'security', 'constraint'],
    'Give one concrete example of each category.'
  ),
  essay(
    'SE3101',
    'requirements',
    'hard',
    'Why is requirements elicitation critical to project success? Discuss consequences of poor elicitation.',
    'Elicitation discovers the real needs of stakeholders. Poor elicitation leads to scope creep, rework, missed acceptance criteria, cost overruns and failed systems. Techniques include interviews, observation, prototypes and workshops, followed by validation and traceability.',
    ['stakeholder', 'scope', 'rework', 'cost', 'validation', 'trace'],
    'Link elicitation quality to rework, acceptance and cost.'
  ),
  mcq(
    'SE3101',
    'design',
    'medium',
    'Which design principle best reduces the ripple effect of changes?',
    [
      { key: 'A', text: 'High coupling and low cohesion' },
      { key: 'B', text: 'Low coupling and high cohesion' },
      { key: 'C', text: 'Maximum global state' },
      { key: 'D', text: 'Duplicating logic across modules' },
    ],
    'B',
    'Low coupling limits dependencies between modules and high cohesion keeps related responsibilities together.'
  ),

  // ---------------- SE3102 Operating Systems ----------------
  mcq(
    'SE3102',
    'scheduling',
    'easy',
    'Which CPU scheduling algorithm selects the process with the shortest next CPU burst?',
    [
      { key: 'A', text: 'FCFS' },
      { key: 'B', text: 'Round Robin' },
      { key: 'C', text: 'SJF' },
      { key: 'D', text: 'Priority with aging only' },
    ],
    'C',
    'Shortest Job First (SJF) chooses the shortest burst, minimising average waiting time.'
  ),
  mcq(
    'SE3102',
    'memory',
    'medium',
    'Thrashing in an operating system is primarily caused by:',
    [
      { key: 'A', text: 'Excessive paging due to insufficient frames' },
      { key: 'B', text: 'Too many CPU cores' },
      { key: 'C', text: 'A large disk capacity' },
      { key: 'D', text: 'Using a queue data structure' },
    ],
    'A',
    'When processes lack enough frames, page faults dominate and useful work stalls.'
  ),
  tf(
    'SE3102',
    'deadlocks',
    'medium',
    'Deadlock requires mutual exclusion, hold-and-wait, no preemption and circular wait.',
    true,
    'These are the four Coffman conditions; all must hold simultaneously for deadlock.'
  ),
  numeric(
    'SE3102',
    'memory',
    'easy',
    'A system has {n} frames and a page size of {s} KB. What is the total memory in KB?',
    [
      { name: 'n', min: 8, max: 32, step: 4 },
      { name: 's', min: 2, max: 8, step: 2 },
    ],
    'n * s',
    'Total memory equals the number of frames multiplied by page size.'
  ),
  short(
    'SE3102',
    'processes',
    'medium',
    'Explain the difference between a process and a thread.',
    'A process is an independent execution unit with its own address space and resources. A thread is a lighter execution unit within a process that shares code, data and open files, enabling cheaper communication but requiring synchronisation.',
    ['process', 'thread', 'address', 'share', 'resource', 'synchron'],
    'Focus on address space, resource sharing and context-switch cost.'
  ),
  essay(
    'SE3102',
    'deadlocks',
    'hard',
    'Discuss strategies for preventing or avoiding deadlocks in an operating system.',
    'Prevention removes one Coffman condition, for example by requesting all resources at once or imposing ordering. Avoidance uses algorithms such as Banker’s algorithm to keep the system in a safe state. Detection and recovery allow deadlocks to occur, then detect cycles and preempt resources. Each approach trades off resource utilisation and overhead.',
    ['prevent', 'avoid', 'coffman', 'safe', 'detect', 'recover'],
    'Cover prevention, avoidance, detection and the trade-offs involved.'
  ),

  // ---------------- SE4101 Artificial Intelligence ----------------
  mcq(
    'SE4101',
    'search',
    'medium',
    'In A* search, an admissible heuristic must:',
    [
      { key: 'A', text: 'Never overestimate the true cost to the goal' },
      { key: 'B', text: 'Always equal the true cost' },
      { key: 'C', text: 'Always overestimate the true cost' },
      { key: 'D', text: 'Ignore the cost already travelled' },
    ],
    'A',
    'Admissibility guarantees the heuristic never exceeds the true remaining cost.'
  ),
  mcq(
    'SE4101',
    'learning',
    'easy',
    'Which learning paradigm uses labelled training examples?',
    [
      { key: 'A', text: 'Unsupervised learning' },
      { key: 'B', text: 'Supervised learning' },
      { key: 'C', text: 'Reinforcement learning' },
      { key: 'D', text: 'Clustering' },
    ],
    'B',
    'Supervised learning maps inputs to known target labels.'
  ),
  tf(
    'SE4101',
    'learning',
    'medium',
    'Overfitting means a model performs better on unseen data than on training data.',
    false,
    'Overfitting means excellent training performance but poor generalisation to unseen data.'
  ),
  numeric(
    'SE4101',
    'learning',
    'hard',
    'A classifier produces {tp} true positives and {fp} false positives. What is its precision? (TP / (TP + FP))',
    [
      { name: 'tp', min: 20, max: 80, step: 10 },
      { name: 'fp', min: 5, max: 30, step: 5 },
    ],
    'tp / (tp + fp)',
    'Precision is the proportion of predicted positives that are actually positive.',
    3
  ),
  short(
    'SE4101',
    'learning',
    'medium',
    'Distinguish classification from regression in machine learning.',
    'Classification predicts a discrete class label such as spam or not-spam. Regression predicts a continuous numeric value such as price or temperature. Both are supervised tasks but differ in output type and evaluation metrics.',
    ['class', 'label', 'continuous', 'numeric', 'supervised', 'predict'],
    'Focus on the output type and give an example of each.'
  ),
  essay(
    'SE4101',
    'ethics',
    'hard',
    'Discuss the ethical risks of using AI in education and propose safeguards.',
    'Risks include bias in grading or admission, invasion of privacy through data collection, over-reliance that erodes critical thinking, opaque decision-making and unequal access. Safeguards include human oversight, transparent models, bias audits, data minimisation, student consent, explainability and appeal mechanisms.',
    ['bias', 'privacy', 'transparen', 'oversight', 'access', 'consent'],
    'Address bias, privacy, transparency and human oversight with concrete safeguards.'
  ),

  // ---------------- SE4103 Cybersecurity ----------------
  mcq(
    'SE4103',
    'cryptography',
    'easy',
    'Which of the following is a symmetric-key encryption algorithm?',
    [
      { key: 'A', text: 'RSA' },
      { key: 'B', text: 'AES' },
      { key: 'C', text: 'Diffie-Hellman' },
      { key: 'D', text: 'ECDSA' },
    ],
    'B',
    'AES uses the same secret key for encryption and decryption.'
  ),
  mcq(
    'SE4103',
    'attacks',
    'easy',
    'Phishing is best classified as which type of attack?',
    [
      { key: 'A', text: 'Social engineering' },
      { key: 'B', text: 'Denial of service' },
      { key: 'C', text: 'Brute force' },
      { key: 'D', text: 'SQL injection' },
    ],
    'A',
    'Phishing manipulates people into revealing credentials or taking unsafe actions.'
  ),
  tf(
    'SE4103',
    'cryptography',
    'medium',
    'Cryptographic hashing is reversible, so a hash can be decrypted back to the original message.',
    false,
    'Hashes are one-way functions; they cannot be decrypted, only verified by re-hashing.'
  ),
  numeric(
    'SE4103',
    'cryptography',
    'medium',
    'A symmetric cipher uses a key of {b} bits. How many possible keys exist? (2^b)',
    [{ name: 'b', min: 4, max: 12, step: 2 }],
    '2 ** b',
    'The key space size is 2 raised to the number of key bits.',
    3
  ),
  short(
    'SE4103',
    'authentication',
    'medium',
    'Explain the difference between authentication and authorization.',
    'Authentication verifies who a user is (for example by password or token). Authorization decides what an authenticated user is permitted to do, based on roles or policies. Authentication precedes authorization.',
    ['identity', 'who', 'permission', 'access', 'role', 'policy'],
    'Clearly separate identity verification from permission enforcement.'
  ),
  essay(
    'SE4103',
    'defence',
    'hard',
    'Discuss the principle of defence in depth and give examples of layered security.',
    'Defence in depth combines independent controls so that failure of one layer does not compromise the whole system. Layers include network firewalls and segmentation, authentication and least privilege, input validation, encryption, logging and monitoring, backups and incident response. Redundancy and diversity reduce single points of failure.',
    ['layer', 'firewall', 'authentication', 'privilege', 'encryption', 'monitor'],
    'Emphasise independent layers, least privilege and monitoring.'
  ),

  // ---------------- IT1101 Introduction to IT ----------------
  mcq(
    'IT1101',
    'hardware',
    'easy',
    'Which component of the CPU performs arithmetic and logical operations?',
    [
      { key: 'A', text: 'Control Unit' },
      { key: 'B', text: 'ALU' },
      { key: 'C', text: 'Cache' },
      { key: 'D', text: 'Registers' },
    ],
    'B',
    'The Arithmetic Logic Unit (ALU) performs calculations and logical comparisons.'
  ),
  mcq(
    'IT1101',
    'networks',
    'easy',
    'Which device routes packets between different networks?',
    [
      { key: 'A', text: 'Hub' },
      { key: 'B', text: 'Switch' },
      { key: 'C', text: 'Router' },
      { key: 'D', text: 'Repeater' },
    ],
    'C',
    'Routers forward packets between networks using IP addresses.'
  ),
  tf(
    'IT1101',
    'ethics',
    'easy',
    'Sharing copyrighted software without permission is acceptable for academic work.',
    false,
    'Software licensing applies in academic settings too; unauthorised sharing violates copyright and institutional policy.'
  ),
  short(
    'IT1101',
    'hardware',
    'medium',
    'Explain the difference between RAM and ROM.',
    'RAM is volatile working memory that stores data and programs currently in use and loses contents when power is removed. ROM is non-volatile memory that holds firmware or startup instructions and retains its contents.',
    ['volatile', 'memory', 'temporary', 'permanent', 'power', 'firmware'],
    'Contrast volatility, purpose and typical contents.'
  ),
  mcq(
    'IT1101',
    'networks',
    'easy',
    'What is the default port number for HTTP?',
    [
      { key: 'A', text: '21' },
      { key: 'B', text: '25' },
      { key: 'C', text: '80' },
      { key: 'D', text: '443' },
    ],
    'C',
    'HTTP uses port 80 by default; HTTPS uses 443.'
  ),

  // ---------------- IT4101 Cloud Computing ----------------
  mcq(
    'IT4101',
    'models',
    'easy',
    'Which cloud service model provides virtualized computing infrastructure such as servers and storage?',
    [
      { key: 'A', text: 'IaaS' },
      { key: 'B', text: 'PaaS' },
      { key: 'C', text: 'SaaS' },
      { key: 'D', text: 'DaaS' },
    ],
    'A',
    'Infrastructure as a Service provides raw compute, storage and networking resources.'
  ),
  mcq(
    'IT4101',
    'models',
    'easy',
    'Which of these is an example of Software as a Service (SaaS)?',
    [
      { key: 'A', text: 'Google Workspace' },
      { key: 'B', text: 'Amazon EC2' },
      { key: 'C', text: 'Heroku runtime' },
      { key: 'D', text: 'A physical server' },
    ],
    'A',
    'Google Workspace is a ready-to-use application delivered over the internet.'
  ),
  tf(
    'IT4101',
    'security',
    'medium',
    'In the cloud shared responsibility model, the provider is responsible for every security control.',
    false,
    'Security is shared: the provider secures the cloud infrastructure while the customer secures data, identities and configurations.'
  ),
  short(
    'IT4101',
    'security',
    'medium',
    'Explain the cloud shared responsibility model.',
    'The provider is responsible for security of the cloud such as physical datacentres, hardware and managed platform patching. The customer is responsible for security in the cloud such as data classification, identity management, access control and application configuration.',
    ['provider', 'customer', 'infrastructure', 'data', 'identity', 'responsib'],
    'Clearly separate provider infrastructure duties from customer data duties.'
  ),
  essay(
    'IT4101',
    'models',
    'hard',
    'Compare IaaS, PaaS and SaaS and give an example of each.',
    'IaaS rents raw infrastructure and leaves OS and application management to the customer, for example AWS EC2. PaaS provides a managed runtime and middleware so developers focus on code, for example Heroku or Azure App Service. SaaS delivers a complete application managed by the provider, for example Google Workspace. Control decreases and convenience increases from IaaS to SaaS.',
    ['iaas', 'paas', 'saas', 'infrastructure', 'runtime', 'application'],
    'Compare management responsibility, control and examples across the three models.'
  ),
];
