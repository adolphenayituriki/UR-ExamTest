import { env } from '../config/env.js';
import { clamp } from '../utils/math.js';
import { countWords, keywordCoverage, normalizeText } from './grading.js';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'by', 'for', 'from', 'has',
  'have', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'their', 'this',
  'to', 'was', 'were', 'which', 'with', 'can', 'will', 'not', 'using', 'used',
]);

function semanticTokens(text) {
  return normalizeText(text)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function termFrequency(tokens) {
  const map = new Map();
  for (const token of tokens) map.set(token, (map.get(token) || 0) + 1);
  return map;
}

export function cosineSimilarity(leftText, rightText) {
  const left = termFrequency(semanticTokens(leftText));
  const right = termFrequency(semanticTokens(rightText));
  if (!left.size || !right.size) return 0;

  let dot = 0;
  for (const [term, count] of left) {
    if (right.has(term)) dot += count * right.get(term);
  }
  const leftNorm = Math.sqrt([...left.values()].reduce((sum, n) => sum + n * n, 0));
  const rightNorm = Math.sqrt([...right.values()].reduce((sum, n) => sum + n * n, 0));
  if (!leftNorm || !rightNorm) return 0;
  return dot / (leftNorm * rightNorm);
}

export const llmEnabled = Boolean(env.aiApiKey || env.aiBaseUrl);

function llmBaseUrl() {
  return (env.aiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
}

function isGemini() {
  return Boolean(env.aiBaseUrl && /generativelanguage\.googleapis\.com/.test(env.aiBaseUrl));
}

function messagesToText(messages) {
  return messages
    .map((message) => {
      const role = message.role === 'system' ? 'System instruction:' : message.role === 'user' ? 'User:' : 'Assistant:';
      return `${role}\n${message.content}`;
    })
    .join('\n\n');
}

async function callGemini(messages, { maxTokens = 500, temperature = 0.3 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const text = messagesToText(messages);
    const response = await fetch(
      `${llmBaseUrl()}/models/${env.aiModel}:generateContent?key=${env.aiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        }),
      }
    );
    if (!response.ok) throw new Error(`Gemini responded with ${response.status}`);
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (error) {
    console.warn('[ai] gemini unavailable, using local engine:', error.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(messages, { maxTokens = 500, temperature = 0.3 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (env.aiApiKey) headers.Authorization = `Bearer ${env.aiApiKey}`;
    const response = await fetch(`${llmBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: env.aiModel,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (!response.ok) throw new Error(`LLM responded with ${response.status}`);
    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.warn('[ai] provider unavailable, using local engine:', error.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callLLM(messages, options = {}) {
  if (!llmEnabled) return null;
  return isGemini() ? callGemini(messages, options) : callOpenAI(messages, options);
}

function localHint(question, hintLevel) {
  const topic = question.topicTitle || question.topic;
  const level = Math.max(0, Math.min(Number(hintLevel) || 0, 2));
  const type = question.type;

  const prompts = {
    mcq: [
      `Start by restating the question in your own words and identify exactly what is being asked about ${topic}. Which two options seem most plausible, and why?`,
      `Eliminate options that contradict a core definition from ${topic}. Look for qualifiers such as "always", "never" or "most" — they often change correctness.`,
      `Compare your final two options against a concrete example. If you apply each option to a small scenario, which one produces a consistent result?`,
    ],
    truefalse: [
      `Identify the single claim in the statement and recall the precise definition from ${topic}. Is any word too absolute or reversed?`,
      `Try to construct one counter-example. If you can find a valid case where the statement fails, it is likely false.`,
      `Rewrite the statement in your own words and check each condition from ${topic} one by one. If any condition is missing or inverted, the answer changes.`,
    ],
    numeric: [
      `List the quantities you were given and the quantity you must find. Which relationship from ${topic} connects them?`,
      `Set up the equation before calculating. Keep units consistent and resist substituting numbers too early.`,
      `Sanity-check your result: is the magnitude reasonable, and does the sign match the physical or logical situation? Recompute one step at a time.`,
    ],
    short: [
      `Frame your answer around the core distinction the question asks about in ${topic}. Aim for a definition, then one concrete example.`,
      `Use precise terminology from ${topic} and explicitly compare both sides of the distinction rather than describing only one.`,
      `Structure your answer as: definition → key difference → example → why it matters. Check that you have addressed every part of the prompt.`,
    ],
    essay: [
      `Before writing, outline three or four main arguments linked to ${topic}. Each paragraph should make one claim and support it with an example.`,
      `Take a position and show trade-offs. Strong essays in ${topic} compare alternatives and justify a recommendation.`,
      `Check your structure: introduction, one idea per paragraph, evidence or examples, and a conclusion that answers the prompt directly. Avoid unsupported generalisations.`,
    ],
  };

  const set = prompts[type] || prompts.short;
  return set[level];
}

export async function generateHint({ question, studentValue = '', hintLevel = 0 }) {
  const base = localHint(question, hintLevel);
  if (!llmEnabled) {
    return { hint: base, source: 'local', hintLevel: Number(hintLevel) || 0 };
  }

  const content = await callLLM(
    [
      {
        role: 'system',
        content:
          'You are a Socratic tutor at the University of Rwanda. Guide the student with questions and methodology. NEVER state or hint the final answer, never reveal option keys, and never write the complete solution. Keep the reply under 90 words.',
      },
      {
        role: 'user',
        content: [
          `Topic: ${question.topicTitle || question.topic}`,
          `Question type: ${question.type}`,
          `Question: ${question.prompt}`,
          `Student's current answer: ${studentValue ? String(studentValue).slice(0, 400) : '(none)'}`,
          `Hint depth: ${hintLevel} of 2.`,
          'Give one focused Socratic hint that moves the student forward without revealing the answer.',
        ].join('\n'),
      },
    ],
    { maxTokens: 180, temperature: 0.5 }
  );

  if (!content) return { hint: base, source: 'local', hintLevel: Number(hintLevel) || 0 };
  return { hint: content, source: 'llm', hintLevel: Number(hintLevel) || 0 };
}

function heuristicEssayScore({ prompt, rubric, text }) {
  const minWords = rubric.minWords || 80;
  const words = countWords(text);
  const coverage = keywordCoverage(text, rubric.keywords || []);
  const similarity = cosineSimilarity(text, rubric.modelAnswer || '');
  const promptSimilarity = cosineSimilarity(text, prompt || '');
  const lengthScore = clamp(words / minWords);

  const score = clamp(
    coverage.ratio * 0.4 + similarity * 0.35 + promptSimilarity * 0.1 + lengthScore * 0.15,
    0,
    1
  );

  const feedbackParts = [];
  feedbackParts.push(
    score >= 0.75
      ? 'Strong response: the key concepts are present and clearly connected.'
      : score >= 0.5
        ? 'Reasonable response, but some syllabus concepts need fuller development.'
        : 'The response needs more accurate subject-specific detail and structure.'
  );
  if (coverage.matched.length) {
    feedbackParts.push(`You addressed: ${coverage.matched.slice(0, 6).join(', ')}.`);
  }
  if (coverage.missing.length) {
    feedbackParts.push(
      `Expand on: ${coverage.missing.slice(0, 6).join(', ')}. Use a concrete example for each.`
    );
  }
  if (words < minWords) {
    feedbackParts.push(`Length: ${words} words; aim for at least ${minWords}.`);
  }
  return { score, feedback: feedbackParts.join(' '), semanticSimilarity: similarity };
}

export async function gradeEssay({ prompt, rubric = {}, text = '', marks = 10 }) {
  const local = heuristicEssayScore({ prompt, rubric, text });

  if (llmEnabled && text.trim()) {
    const raw = await callLLM(
      [
        {
          role: 'system',
          content:
            'You are an exam marker at the University of Rwanda. Grade qualitatively against the marking scheme. Return ONLY compact JSON: {"score": <0-100>, "feedback": "<two sentences>"}.',
        },
        {
          role: 'user',
          content: [
            `Question: ${prompt}`,
            `Marking scheme keywords: ${(rubric.keywords || []).join(', ')}`,
            `Model answer: ${rubric.modelAnswer || ''}`,
            `Student answer: ${String(text).slice(0, 4000)}`,
          ].join('\n'),
        },
      ],
      { maxTokens: 300, temperature: 0.2 }
    );

    if (raw) {
      try {
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const score = clamp(Number(parsed.score) / 100, 0, 1);
        if (Number.isFinite(score)) {
          return {
            score,
            feedback: String(parsed.feedback || local.feedback),
            source: 'llm',
            semanticSimilarity: local.semanticSimilarity,
          };
        }
      } catch {
        console.warn('[ai] could not parse essay grade JSON; using heuristic score');
      }
    }
  }

  return { ...local, source: 'local' };
}

export async function generateDiagnosticNarrative(weakTopics, strongTopics) {
  const weakest = weakTopics.slice(0, 3).map((topic) => topic.title).join(', ');
  const fallback = weakTopics.length
    ? `Your attempts show the greatest accuracy gap in ${weakest}. Schedule a guided practice track for these topics first, then re-test with a mock assessment to confirm the improvement.`
    : 'Not enough graded attempts yet. Complete a practice track so the diagnostic engine can map your strengths and weaknesses.';

  if (!llmEnabled) return { narrative: fallback, source: 'local' };

  const content = await callLLM(
    [
      {
        role: 'system',
        content:
          'You are an academic coach at the University of Rwanda. Be concise, specific and encouraging. Do not invent scores. Max 110 words.',
      },
      {
        role: 'user',
        content: `Weak topics: ${weakTopics
          .map((t) => `${t.title} (${Math.round(t.accuracy * 100)}%)`)
          .join('; ') || 'none'}.\nStrong topics: ${
          strongTopics.map((t) => t.title).join(', ') || 'none'
        }.\nWrite a short study plan recommendation.`,
      },
    ],
    { maxTokens: 200, temperature: 0.4 }
  );

  return content
    ? { narrative: content, source: 'llm' }
    : { narrative: fallback, source: 'local' };
}
