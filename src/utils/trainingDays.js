export const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function defaultSchedule(count) {
  const schedules = {
    1: [2],
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 5],
    5: [0, 1, 2, 4, 5],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return schedules[count] || [];
}

export function trainingDayIndexes(trainingDays = []) {
  return (trainingDays || [])
    .map((day) => weekDays.indexOf(day))
    .filter((index) => index !== -1);
}
