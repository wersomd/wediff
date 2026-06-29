// Mood scale 1..5 with emoji + label, used across the journal UI and stats.
export const MOOD_EMOJI: Record<number, string> = {
  1: "😣",
  2: "🙁",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export const MOOD_LABEL: Record<number, string> = {
  1: "Плохо",
  2: "Так себе",
  3: "Нормально",
  4: "Хорошо",
  5: "Отлично",
};

export const MOODS = [1, 2, 3, 4, 5] as const;
