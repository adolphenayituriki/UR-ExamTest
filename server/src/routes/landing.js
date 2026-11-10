import express from 'express';
import { LandingContent } from '../models/LandingContent.js';
import { asyncHandler } from '../utils/errors.js';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const content = await LandingContent.findOne({ isActive: true }).lean();
    if (!content) {
      return res.json({
        hero: {
          eyebrow: 'University of Rwanda · ExamLab',
          title: "Practise like it's exam day.",
          lede: 'Past papers, timed mock exams and instant feedback, built for UR students.',
          badges: [
            { text: 'Student access', variant: 'glass' },
            { text: '2025/2026', variant: 'glass' },
            { text: 'Secure & Verified', variant: 'glass' },
          ],
        },
        trust: [
          { label: 'Timed practice', icon: 'FaClock' },
          { label: 'Instant marks', icon: 'FaCheckDouble' },
          { label: 'Revision focus', icon: 'FaBook' },
        ],
        steps: [
          {
            step: '01',
            title: 'Choose a course',
            text: 'Browse modules for your year and programme. Past papers and practice exams are organised by department.',
            icon: 'FaGraduationCap',
            color: 'var(--brand)',
            bgColor: 'var(--brand-soft)',
            order: 1,
          },
          {
            step: '02',
            title: 'Practise or take a mock',
            text: 'Timed questions with instant marking. AI-powered hints guide your method without giving answers.',
            icon: 'FaClock',
            color: 'var(--accent)',
            bgColor: 'var(--accent-soft)',
            order: 2,
          },
          {
            step: '03',
            title: 'Fix weak topics',
            text: 'Review detailed feedback and focus your revision. Track progress across attempts and topics.',
            icon: 'FaBook',
            color: 'var(--green)',
            bgColor: 'var(--green-soft)',
            order: 3,
          },
        ],
        features: [
          {
            title: 'Server-timed exams',
            text: 'Clock runs on the server — no client-side manipulation possible.',
            icon: 'FaClock',
            color: 'var(--brand)',
            order: 1,
          },
          {
            title: 'Integrity monitoring',
            text: 'Tab-switch detection with configurable strikes before auto-submit.',
            icon: 'FaShield',
            color: 'var(--red)',
            order: 2,
          },
          {
            title: 'AI-powered grading',
            text: 'Essay and short-answer responses graded by LLM with rubric alignment.',
            icon: 'FaBrain',
            color: 'var(--accent)',
            order: 3,
          },
          {
            title: 'Instant certificates',
            text: 'Verifiable completion badges and PDF certificates for literacy tracks.',
            icon: 'FaAward',
            color: 'var(--green)',
            order: 4,
          },
          {
            title: 'Offline-ready PWA',
            text: 'Install as an app. Past papers and literacy lessons cached for offline study.',
            icon: 'FaBolt',
            color: 'var(--purple)',
            order: 5,
          },
          {
            title: 'Accessibility first',
            text: 'WCAG 2.1 AA compliant. Keyboard navigation, screen readers, high contrast.',
            icon: 'FaUserGraduate',
            color: 'var(--ink)',
            order: 6,
          },
        ],
        support: [
          {
            title: 'Guided hints',
            text: 'Get a nudge without the answer. Socratic AI hints explain the method and next step.',
            icon: 'FaLightbulb',
            color: 'var(--accent)',
            bgColor: 'var(--accent-soft)',
            order: 1,
          },
          {
            title: 'Weak spot detection',
            text: 'See which topics need more work. Analytics highlight low-scoring areas across attempts.',
            icon: 'FaUsers',
            color: 'var(--brand)',
            bgColor: 'var(--brand-soft)',
            order: 2,
          },
          {
            title: 'Fresh questions',
            text: 'New numbers each attempt, so you learn the method — not just memorise answers.',
            icon: 'FaBrain',
            color: 'var(--green)',
            bgColor: 'var(--green-soft)',
            order: 3,
          },
        ],
        demoAccounts: [
          {
            reg: '223452022',
            password: 'DemoPass1',
            name: 'NAYITURIKI Adolphe',
            detail: 'Software Engineering · Year 4',
            note: 'Full history and results',
            avatar: 'NA',
            userType: 'student',
            blocked: false,
            order: 1,
          },
          {
            reg: '233462023',
            password: 'DemoPass2',
            name: 'MUKAMANA Alice',
            detail: 'Software Engineering · Year 3',
            note: 'Year 3 dashboard',
            avatar: 'MA',
            userType: 'student',
            blocked: false,
            order: 2,
          },
          {
            reg: '243472024',
            password: 'DemoPass3',
            name: 'HABIMANA Eric',
            detail: 'Software Engineering · Year 2',
            note: 'Practice and mocks',
            avatar: 'HE',
            userType: 'student',
            blocked: false,
            order: 3,
          },
          {
            reg: '990012020',
            password: 'DemoPass6',
            name: 'KAMIKAZI Claudine',
            detail: 'Inactive enrollment',
            note: 'Shows an inactive record',
            avatar: 'KC',
            userType: 'student',
            blocked: true,
            order: 4,
          },
          {
            email: 'jean.uwizeyimana@ur.ac.rw',
            password: 'StaffPass1',
            name: 'Dr. UWIZEYIMANA Jean',
            detail: 'Lecturer · Computer Science',
            note: 'Manage courses & assessments',
            avatar: 'UJ',
            userType: 'staff',
            blocked: false,
            order: 5,
          },
          {
            email: 'grace.mukeshimana@ur.ac.rw',
            password: 'StaffPass2',
            name: 'Prof. MUKESHIMANA Grace',
            detail: 'Senior Lecturer · Software Engineering',
            note: 'Review student analytics',
            avatar: 'MG',
            userType: 'staff',
            blocked: false,
            order: 6,
          },
        ],
        sections: [
          {
            id: 'how-it-works',
            eyebrow: 'How it works',
            title: 'Three steps to better results.',
            lede: 'From choosing your course to mastering weak topics — a streamlined path to exam readiness.',
            altBackground: false,
          },
          {
            id: 'features',
            eyebrow: 'Platform features',
            title: 'Built for integrity, speed and learning.',
            lede: 'Every feature designed around real exam conditions and pedagogical best practices.',
            altBackground: true,
          },
          {
            id: 'support',
            eyebrow: 'Study support',
            title: 'Help when you need it.',
            lede: 'Smart tools that guide your revision without doing the work for you.',
            altBackground: false,
          },
          {
            id: 'demo',
            eyebrow: 'Try it',
            title: 'Open a demo {userType}.',
            lede: 'Jump straight in with a sample account — no registration needed.',
            altBackground: true,
          },
        ],
        footer: {
          brandText: 'University of Rwanda · ExamLab',
          brandSubtext: 'For students · 2025/2026',
          links: [
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Features', href: '#features' },
            { label: 'Demo accounts', href: '#demo' },
            { label: 'Support', href: '#support' },
          ],
          legal: [
            { text: '© 2025 University of Rwanda' },
            { text: 'Secure examination environment' },
          ],
          bottomText: 'Server-timed · AI-assisted · Integrity monitored',
        },
      });
    }
    res.json(content);
  })
);

export default router;