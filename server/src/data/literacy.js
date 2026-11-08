const opt = (...texts) =>
  texts.map((text, index) => ({ key: String.fromCharCode(65 + index), text }));

export const literacyLessons = [
  {
    track: 'files',
    slug: 'organise-your-digital-files',
    title: 'Organise files and folders like a professional',
    summary:
      'Build a folder structure you can navigate in seconds, use consistent names and stop losing documents.',
    level: 'beginner',
    durationMinutes: 15,
    order: 1,
    objectives: [
      'Create a clear top-level folder structure',
      'Apply a consistent file-naming convention',
      'Use search and recent files effectively',
    ],
    sections: [
      {
        heading: 'Start with three levels, not thirty',
        body:
          'A workable structure usually has a top level for areas (for example Work, Study, Personal), a second level for projects or years, and a third level for documents, data and drafts. If a folder needs more than three clicks to reach, it is probably too deep.',
        tips: [
          'Use one folder per active project or academic year.',
          'Keep a single "Archive" folder for finished work.',
          'Avoid folders named "Misc" or "New folder".',
        ],
      },
      {
        heading: 'Name files so they sort themselves',
        body:
          'Use a predictable pattern such as YYYY-MM-DD_project_document_v02. Dates sort correctly, the project groups related files, and version numbers prevent accidental overwrites.',
        tips: [
          'Never use "final", "final2" or "latest" as a version.',
          'Replace spaces with hyphens or underscores for portability.',
          'Keep names under about 80 characters.',
        ],
      },
      {
        heading: 'Find faster with search',
        body:
          'Modern systems index file contents, not only names. Learn the search shortcut on your operating system, filter by date or type, and use recent files when you were working on something minutes ago.',
        tips: [
          'On Windows press the Windows key and type the file name.',
          'Filter by "This week" when you know the timeframe.',
          'Pin the two or three folders you use every day.',
        ],
      },
    ],
    practiceTask:
      'Create a folder structure for this academic year with one folder per module, a Drafts subfolder and an Archive folder. Rename three existing files using the date_project_document pattern.',
    quiz: [
      {
        prompt: 'Which file name is easiest to sort and identify?',
        options: opt('final final.docx', '2025-03-14_SE2103_notes_v02.docx', 'notes new.docx', 'Document1.docx'),
        correctAnswer: 'B',
        explanation: 'A date-first name with project and version sorts chronologically and identifies the content.',
      },
      {
        prompt: 'Why should you avoid a folder named "Misc"?',
        options: opt(
          'It hides everything that has not been classified',
          'It uses too much disk space',
          'It cannot be searched',
          'It breaks file permissions'
        ),
        correctAnswer: 'A',
        explanation: 'A catch-all folder becomes a dumping ground and makes retrieval slow.',
      },
    ],
  },
  {
    track: 'documents',
    slug: 'professional-documents',
    title: 'Produce professional documents in Word',
    summary:
      'Use styles, consistent formatting and page setup so reports look clean and are easy to edit.',
    level: 'beginner',
    durationMinutes: 18,
    order: 2,
    objectives: [
      'Apply heading styles instead of manual bold text',
      'Set consistent margins, spacing and page numbers',
      'Use tables and captions correctly',
    ],
    sections: [
      {
        heading: 'Styles are the backbone',
        body:
          'Apply Heading 1, Heading 2 and Normal styles rather than formatting each paragraph by hand. Styles give you a consistent look, a working navigation pane and an automatic table of contents.',
        tips: [
          'Modify the style once instead of fixing every heading.',
          'Use the navigation pane to check document structure.',
          'Insert a table of contents after applying headings.',
        ],
      },
      {
        heading: 'Page setup and readability',
        body:
          'Use generous margins, 1.15 to 1.5 line spacing and a readable font size (11–12 pt). Add page numbers in the footer and use section breaks only when the layout genuinely changes.',
        tips: [
          'Keep body text left-aligned; avoid full justification on narrow columns.',
          'Use the same spacing before and after headings.',
          'Check the document in print preview before submitting.',
        ],
      },
      {
        heading: 'Tables and visuals',
        body:
          'Use tables for structured comparisons, not for layout. Add a caption to every table and figure and refer to it in the text. Keep colours accessible and avoid relying on colour alone to carry meaning.',
        tips: [
          'Caption tables above and figures below, consistently.',
          'Do not paste screenshots of tables when a real table is possible.',
          'Use alt text for images that carry information.',
        ],
      },
    ],
    practiceTask:
      'Take a recent assignment, apply Heading styles, insert a table of contents and page numbers, and fix any manually formatted headings.',
    quiz: [
      {
        prompt: 'What is the main advantage of using Word heading styles?',
        options: opt(
          'They enable navigation and automatic tables of contents',
          'They make the file smaller',
          'They prevent editing',
          'They automatically translate the text'
        ),
        correctAnswer: 'A',
        explanation: 'Heading styles create structure that Word can use for navigation and contents pages.',
      },
      {
        prompt: 'Which practice improves readability most?',
        options: opt(
          'Consistent spacing and a readable font size',
          'Writing whole paragraphs in capitals',
          'Using ten different fonts',
          'Cramming text to the page edges'
        ),
        correctAnswer: 'A',
        explanation: 'Consistency and readable sizing reduce cognitive load for the reader.',
      },
    ],
  },
  {
    track: 'presentations',
    slug: 'clean-presentations',
    title: 'Build clean, persuasive presentations',
    summary:
      'Design slides that support your message: one idea per slide, readable text and a clear visual hierarchy.',
    level: 'beginner',
    durationMinutes: 15,
    order: 3,
    objectives: [
      'Apply the one-idea-per-slide rule',
      'Use readable type sizes and contrast',
      'Present data with simple, labelled charts',
    ],
    sections: [
      {
        heading: 'Slides support you, not replace you',
        body:
          'A slide should make one point easy to grasp. Put the full explanation in your speech, not on the screen. If a slide needs a paragraph of reading, split it or turn it into a handout.',
        tips: [
          'Use a clear title that states the takeaway.',
          'Limit bullets to about six words each.',
          'Aim for one idea per slide.',
        ],
      },
      {
        heading: 'Type, contrast and space',
        body:
          'Use at least 24 pt for body text and 32–40 pt for titles. Keep strong contrast between text and background, and leave white space so the eye can rest.',
        tips: [
          'Dark text on light backgrounds is safest for projectors.',
          'Use no more than two font families.',
          'Align elements to an invisible grid.',
        ],
      },
      {
        heading: 'Charts that tell the truth',
        body:
          'Choose the chart type that matches the question: bars for comparison, lines for trends, pie charts only for parts of a whole. Label axes and units, and never truncate a bar axis to exaggerate differences.',
        tips: [
          'Highlight the one data point that matters.',
          'Remove decorative gridlines and 3D effects.',
          'State the source and date below the chart.',
        ],
      },
    ],
    practiceTask:
      'Take a five-slide presentation and reduce each slide to one message, then rebuild one chart with clear labels and no 3D effects.',
    quiz: [
      {
        prompt: 'What is the best use of a slide title?',
        options: opt(
          'State the main takeaway of the slide',
          'Repeat the word "Introduction"',
          'List every detail in the slide',
          'Leave it empty'
        ),
        correctAnswer: 'A',
        explanation: 'A takeaway title tells the audience what to conclude before they read the detail.',
      },
      {
        prompt: 'Which chart best shows a trend over time?',
        options: opt('A line chart', 'A pie chart', 'A 3D exploded pie', 'A word cloud'),
        correctAnswer: 'A',
        explanation: 'Line charts show direction and change across time clearly.',
      },
    ],
  },
  {
    track: 'spreadsheets',
    slug: 'excel-essential-formulas',
    title: 'Essential Excel formulas and tables',
    summary:
      'Use SUM, AVERAGE, IF, COUNTIF and structured tables to turn raw data into reliable answers.',
    level: 'intermediate',
    durationMinutes: 22,
    order: 4,
    objectives: [
      'Write basic arithmetic and aggregation formulas',
      'Use IF and COUNTIF for decisions and counts',
      'Convert a range into a table for filtering and totals',
    ],
    sections: [
      {
        heading: 'Reference cells, do not retype numbers',
        body:
          'A formula such as =B2*C2 recalculates automatically when inputs change. Use SUM and AVERAGE over ranges (=SUM(D2:D100)) and keep raw data on one sheet, calculations on another.',
        tips: [
          'Start every formula with = and use cell references.',
          'Use $ to lock a reference when copying (for example $B$2).',
          'Never hard-code a total that could be calculated.',
        ],
      },
      {
        heading: 'IF and COUNTIF',
        body:
          'IF returns one value when a condition is true and another when false: =IF(E2>=50,"Pass","Fail"). COUNTIF counts matching rows: =COUNTIF(B2:B100,"Software Engineering"). SUMIF adds matching values.',
        tips: [
          'Keep conditions simple and test with a few rows first.',
          'Use COUNTIFS or SUMIFS for multiple conditions.',
          'Check for stray spaces before comparing text.',
        ],
      },
      {
        heading: 'Tables, filters and totals',
        body:
          'Convert a range with Ctrl+T to create a table. Tables expand automatically, support filter buttons and let you reference columns by name, which makes formulas easier to read and maintain.',
        tips: [
          'Give each column a clear, unique header.',
          'Use the Total Row for counts and sums.',
          'Avoid merged cells inside data tables.',
        ],
      },
    ],
    practiceTask:
      'Create a 20-row student marks table, add a Pass/Fail column with IF, count passes with COUNTIF and convert the range into a filterable table.',
    quiz: [
      {
        prompt: 'Which formula adds the values in cells D2 to D10?',
        options: opt('=ADD(D2:D10)', '=SUM(D2:D10)', '=TOTAL(D2;D10)', '=D2+D10'),
        correctAnswer: 'B',
        explanation: 'SUM adds all values in the specified range.',
      },
      {
        prompt: 'What does =COUNTIF(B2:B50,"Kigali") return?',
        options: opt(
          'The number of rows in B2:B50 equal to "Kigali"',
          'The sum of values in B2:B50',
          'The first Kigali value',
          'The average of B2:B50'
        ),
        correctAnswer: 'A',
        explanation: 'COUNTIF counts cells that match the given criterion.',
      },
    ],
  },
  {
    track: 'cloud',
    slug: 'safe-cloud-sharing',
    title: 'Share safely with Google Drive and OneDrive',
    summary:
      'Share files with the right people, the right permission and an expiry date — without exposing private data.',
    level: 'beginner',
    durationMinutes: 16,
    order: 5,
    objectives: [
      'Choose viewer, commenter or editor permissions deliberately',
      'Use links and expiry dates safely',
      'Recognise the risks of public links',
    ],
    sections: [
      {
        heading: 'Least privilege applies to sharing',
        body:
          'Share with named people and give the minimum permission needed. A reviewer usually needs view or comment access, not edit. Avoid "anyone with the link" unless the content is genuinely public.',
        tips: [
          'Prefer named accounts over link sharing.',
          'Review shared-with lists periodically.',
          'Remove access when a project ends.',
        ],
      },
      {
        heading: 'Links, expiry and passwords',
        body:
          'A public link is effectively a password. Use expiry dates and, where available, a link password. Never post a share link in a public group or on social media.',
        tips: [
          'Set an expiry date for temporary sharing.',
          'Use the organisation account, not a personal one, for work files.',
          'Check the link preview before sending it.',
        ],
      },
      {
        heading: 'Version history is a safety net',
        body:
          'Cloud tools keep version history. If a file is accidentally overwritten or edited by the wrong person, restore an earlier version instead of recreating the document.',
        tips: [
          'Name and describe major versions.',
          'Use "available offline" only for files you need.',
          'Check sharing settings before uploading sensitive data.',
        ],
      },
    ],
    practiceTask:
      'Create a test document in Drive or OneDrive, share it with a classmate as commenter only, set an expiry date and then remove their access.',
    quiz: [
      {
        prompt: 'A classmate only needs to read your notes. Which permission should you grant?',
        options: opt('Viewer', 'Editor', 'Owner', 'Full control'),
        correctAnswer: 'A',
        explanation: 'Viewer access follows least privilege for read-only needs.',
      },
      {
        prompt: 'Why is "anyone with the link" risky for private files?',
        options: opt(
          'The link can be forwarded or leaked to anyone',
          'It makes the file larger',
          'It deletes version history',
          'It prevents editing forever'
        ),
        correctAnswer: 'A',
        explanation: 'A public link behaves like a shareable key and can spread beyond the intended audience.',
      },
    ],
  },
  {
    track: 'email',
    slug: 'professional-email-and-meetings',
    title: 'Professional email and meeting tools',
    summary:
      'Write clear emails, manage calendars and run meetings that finish with decisions and owners.',
    level: 'beginner',
    durationMinutes: 15,
    order: 6,
    objectives: [
      'Write a clear subject line and structured email',
      'Use CC, BCC and reply-all correctly',
      'Plan and follow up a meeting with minutes',
    ],
    sections: [
      {
        heading: 'A clear email in four lines',
        body:
          'State the purpose in the subject, greet the reader, give the context and request in two or three short paragraphs, then close with a specific next step and deadline.',
        tips: [
          'Use a subject such as "Action needed: submit marks by Friday".',
          'Put the request before the background.',
          'Use BCC for large external lists to protect addresses.',
        ],
      },
      {
        heading: 'Reply, CC and BCC',
        body:
          'Reply to the sender when only they need to act. Use reply-all only when everyone must stay informed. CC is for visibility; BCC protects recipients who should not see each other’s addresses.',
        tips: [
          'Do not use CC to pressure someone publicly.',
          'Remove unnecessary recipients before replying all.',
          'Never send passwords or sensitive files by plain email.',
        ],
      },
      {
        heading: 'Meetings that produce decisions',
        body:
          'Send an agenda with objectives and timings, keep notes of decisions and owners, and circulate minutes within a day. Cancel or shorten meetings when an email would do.',
        tips: [
          'Every agenda item should have an owner.',
          'Record decisions, actions and deadlines.',
          'End with a recap of who does what by when.',
        ],
      },
    ],
    practiceTask:
      'Write an email requesting a deadline extension with a clear subject, two-line context, a specific request and a proposed date. Then draft a five-line agenda for the follow-up meeting.',
    quiz: [
      {
        prompt: 'When should you use BCC?',
        options: opt(
          'When recipients should not see each other’s email addresses',
          'To hide a mistake from your manager',
          'To send an urgent action to the whole team',
          'To replace the subject line'
        ),
        correctAnswer: 'A',
        explanation: 'BCC protects recipient privacy in large or external distributions.',
      },
      {
        prompt: 'What should meeting minutes always include?',
        options: opt(
          'Decisions, actions, owners and deadlines',
          'A full transcript of every sentence',
          'Only the attendee list',
          'Personal opinions without attribution'
        ),
        correctAnswer: 'A',
        explanation: 'Minutes are useful when they capture decisions and accountable next steps.',
      },
    ],
  },
  {
    track: 'security',
    slug: 'online-safety-essentials',
    title: 'Online safety essentials',
    summary:
      'Protect your accounts and data with strong passwords, phishing awareness and safe browsing habits.',
    level: 'beginner',
    durationMinutes: 18,
    order: 7,
    objectives: [
      'Create and store strong, unique passwords',
      'Recognise phishing and verify suspicious requests',
      'Protect personal data and devices',
    ],
    sections: [
      {
        heading: 'Passwords and multi-factor authentication',
        body:
          'Use a long passphrase or a password manager to generate unique passwords for every account. Turn on multi-factor authentication wherever it is offered, especially for email and banking.',
        tips: [
          'Length matters more than complex symbols.',
          'Never reuse a work password on a personal site.',
          'Store passwords in a reputable manager, not in a notebook.',
        ],
      },
      {
        heading: 'Spot phishing before you click',
        body:
          'Check the sender address, hover over links to see the real destination, and treat urgency and fear as warning signs. Verify unusual requests through a separate known channel.',
        tips: [
          'Do not open unexpected attachments.',
          'Report suspicious messages instead of forwarding them.',
          'Type the official website address yourself.',
        ],
      },
      {
        heading: 'Data minimisation and devices',
        body:
          'Share only the personal data that is necessary. Lock your devices, install updates promptly, encrypt sensitive storage and back up important files in more than one place.',
        tips: [
          'Use a screen lock and automatic updates.',
          'Avoid sensitive work on public Wi-Fi without a trusted connection.',
          'Review app permissions and remove unused apps.',
        ],
      },
    ],
    practiceTask:
      'Review your three most important accounts, enable multi-factor authentication, replace any reused password and practise identifying the real destination of a link before clicking it.',
    quiz: [
      {
        prompt: 'Which password practice is strongest?',
        options: opt(
          'A long unique passphrase stored in a password manager',
          'The same strong password on every account',
          'A short password with symbols',
          'Your date of birth plus your name'
        ),
        correctAnswer: 'A',
        explanation: 'Long, unique passwords managed securely limit the impact of any single breach.',
      },
      {
        prompt: 'You receive an urgent email asking you to confirm your password. What should you do?',
        options: opt(
          'Verify through the official channel and report the message',
          'Reply with your password',
          'Click the link to check',
          'Forward it to colleagues'
        ),
        correctAnswer: 'A',
        explanation: 'Legitimate organisations do not ask for passwords by email; verify out-of-band and report phishing.',
      },
    ],
  },
];
