const FUNCTION_MAP = {
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  abs: Math.abs,
  sqrt: Math.sqrt,
  log2: Math.log2,
  pow: Math.pow,
  min: Math.min,
  max: Math.max,
};

export function formatNumber(value) {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function pickNumericValue(variable) {
  const min = Number(variable.min);
  const max = Number(variable.max);
  const step = Number(variable.step) || 1;
  const buckets = Math.max(0, Math.floor((max - min) / step));
  const index = Math.floor(Math.random() * (buckets + 1));
  return min + index * step;
}

export function evaluateFormula(expression, variables) {
  if (!expression) return null;
  const template = String(expression).trim();
  if (!/^[0-9a-zA-Z_+\-*/%()., \s]+$/.test(template)) {
    throw new Error(`Unsafe answer formula rejected: ${template}`);
  }

  const identifiers = template.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
  const allowedFunctions = identifiers.filter((name) => FUNCTION_MAP[name]);
  for (const identifier of identifiers) {
    if (variables[identifier] === undefined && !FUNCTION_MAP[identifier]) {
      throw new Error(`Unknown symbol in answer formula: ${identifier}`);
    }
  }

  const argNames = Object.keys(variables);
  const fnNames = [...new Set(allowedFunctions)];
  const fn = new Function(
    ...argNames,
    ...fnNames,
    `"use strict"; return (${template});`
  );

  const result = fn(
    ...argNames.map((name) => variables[name]),
    ...fnNames.map((name) => FUNCTION_MAP[name])
  );

  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new Error(`Answer formula did not produce a finite number: ${template}`);
  }
  return result;
}

export function renderQuestion(question) {
  const source = typeof question.toObject === 'function' ? question.toObject() : question;
  const variables = source.variables || [];
  const values = {};
  for (const variable of variables) {
    values[variable.name] = pickNumericValue(variable);
  }

  let prompt = source.prompt;
  let answer = source.correctAnswer;

  if (source.scenarios?.length) {
    const scenario = source.scenarios[Math.floor(Math.random() * source.scenarios.length)];
    prompt = prompt.replaceAll('{context}', scenario);
  }

  for (const [name, value] of Object.entries(values)) {
    prompt = prompt.replaceAll(`{${name}}`, formatNumber(value));
    if (source.type === 'numeric' && source.answerFormula) {
      answer = formatNumber(evaluateFormula(source.answerFormula, values));
    }
  }

  return {
    prompt,
    correctAnswer: answer,
    mutated: variables.length > 0 || Boolean(source.scenarios?.length),
    variableValues: values,
  };
}
