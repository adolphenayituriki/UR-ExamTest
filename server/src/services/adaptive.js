import { ExamSession } from '../models/ExamSession.js';
import { clamp, round1 } from '../utils/math.js';

const DIFFICULTY_VALUE = { easy: 0, medium: 1, hard: 2 };

export async function estimateAbility(studentId) {
  const sessions = await ExamSession.find({
    student: studentId,
    status: { $in: ['submitted', 'expired'] },
  })
    .select('percentage')
    .sort({ submittedAt: -1 })
    .limit(20)
    .lean();

  if (!sessions.length) {
    return { ability: -0.25, average: 0, samples: 0, confidence: 0 };
  }

  const average = sessions.reduce((sum, session) => sum + (session.percentage || 0), 0) / sessions.length;
  const ability = clamp((average / 100) * 4 - 2, -2, 2);
  return {
    ability,
    average: round1(average),
    samples: sessions.length,
    confidence: round1(clamp(sessions.length / 8)),
  };
}

function weightedSample(items, count) {
  const pool = [...items];
  const chosen = [];
  while (pool.length && chosen.length < count) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i += 1) {
      roll -= pool[i].weight;
      if (roll <= 0) {
        index = i;
        break;
      }
    }
    chosen.push(pool[index].item);
    pool.splice(index, 1);
  }
  return chosen;
}

export function selectAdaptiveQuestions(bank, count, ability = 0) {
  if (!bank.length) return [];

  const target = clamp((Number(ability) + 2) / 4, 0, 1) * 2;
  const weighted = bank.map((question) => {
    const difficulty = DIFFICULTY_VALUE[question.difficulty] ?? 1;
    const distance = Math.abs(difficulty - target);
    const focus = 1 / (1 + distance * distance);
    return {
      item: question,
      weight: focus + Math.random() * 0.35,
    };
  });

  return weightedSample(weighted, Math.min(count, bank.length));
}

export async function buildAdaptivePlan(studentId, bank, count) {
  const estimate = await estimateAbility(studentId);
  const selected = selectAdaptiveQuestions(bank, count, estimate.ability);
  return { selected, estimate };
}
