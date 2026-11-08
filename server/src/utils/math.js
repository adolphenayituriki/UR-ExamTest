export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const round1 = (value) => Math.round(Number(value) * 10) / 10;
