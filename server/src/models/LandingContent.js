import mongoose from 'mongoose';

const heroSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, default: 'University of Rwanda · ExamLab' },
    title: { type: String, default: 'Practise like it&apos;s exam day.' },
    lede: { type: String, default: 'Past papers, timed mock exams and instant feedback, built for UR students.' },
    badges: [
      {
        text: String,
        variant: { type: String, enum: ['glass', 'solid', 'outline'], default: 'glass' },
      },
    ],
  },
  { _id: false }
);

const trustItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    icon: { type: String, required: true },
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    bgColor: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const featureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    text: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const supportItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    text: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    bgColor: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const demoAccountSchema = new mongoose.Schema(
  {
    reg: { type: String },
    email: { type: String },
    password: { type: String, required: true },
    name: { type: String, required: true },
    detail: { type: String, required: true },
    note: { type: String, required: true },
    avatar: { type: String, required: true },
    userType: { type: String, enum: ['student', 'staff'], required: true },
    blocked: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    eyebrow: { type: String, required: true },
    title: { type: String, required: true },
    lede: { type: String, required: true },
    altBackground: { type: Boolean, default: false },
  },
  { _id: false }
);

const footerSchema = new mongoose.Schema(
  {
    brandText: { type: String, default: 'University of Rwanda · ExamLab' },
    brandSubtext: { type: String, default: 'For students · 2025/2026' },
    links: [
      {
        label: String,
        href: String,
      },
    ],
    legal: [
      {
        text: String,
      },
    ],
    bottomText: { type: String, default: 'Server-timed · AI-assisted · Integrity monitored' },
  },
  { _id: false }
);

const landingContentSchema = new mongoose.Schema(
  {
    hero: { type: heroSchema, default: () => ({}) },
    trust: { type: [trustItemSchema], default: [] },
    steps: { type: [stepSchema], default: [] },
    features: { type: [featureSchema], default: [] },
    support: { type: [supportItemSchema], default: [] },
    demoAccounts: { type: [demoAccountSchema], default: [] },
    sections: { type: [sectionSchema], default: [] },
    footer: { type: footerSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

landingContentSchema.index({ isActive: 1 });

export const LandingContent = mongoose.model('LandingContent', landingContentSchema);