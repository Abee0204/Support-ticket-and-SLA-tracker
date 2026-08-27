function adjustToWorkingHours(date: Date): Date {
  const current = new Date(date);

  const day = current.getDay();
  if (day === 6) {
    current.setDate(current.getDate() + 2);
    current.setHours(9, 0, 0, 0);
  } else if (day === 0) {
    current.setDate(current.getDate() + 1);
    current.setHours(9, 0, 0, 0);
  } else {
    const hours = current.getHours();
    if (hours < 9) {
      current.setHours(9, 0, 0, 0);
    } else if (hours >= 18) {
      current.setDate(current.getDate() + 1);
      current.setHours(9, 0, 0, 0);
      if (current.getDay() === 6) {
        current.setDate(current.getDate() + 2);
      } else if (current.getDay() === 0) {
        current.setDate(current.getDate() + 1);
      }
    }
  }

  return current;
}

export const calculateSLA = (
  priority: string,
  startDate: Date = new Date()
): Date => {
  let hoursToAdd = 8;
  switch (priority) {
    case "HIGH":
      hoursToAdd = 2;
      break;
    case "MEDIUM":
      hoursToAdd = 8;
      break;
    case "LOW":
      hoursToAdd = 24;
      break;
    default:
      hoursToAdd = 8;
  }

  let current = adjustToWorkingHours(startDate);
  let remainingMinutes = hoursToAdd * 60;

  while (remainingMinutes > 0) {
    const endOfDay = new Date(current);
    endOfDay.setHours(18, 0, 0, 0);

    const availableMinutesToday = Math.max(
      0,
      (endOfDay.getTime() - current.getTime()) / (1000 * 60)
    );

    if (remainingMinutes <= availableMinutesToday) {
      current = new Date(current.getTime() + remainingMinutes * 60 * 1000);
      remainingMinutes = 0;
    } else {
      remainingMinutes -= availableMinutesToday;
      current.setDate(current.getDate() + 1);
      current.setHours(9, 0, 0, 0);
      current = adjustToWorkingHours(current);
    }
  }

  return current;
};

export function calculateBusinessMinutesBetween(start: Date, end: Date): number {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (startDate >= endDate) return 0;

  let totalMinutes = 0;
  let current = new Date(startDate);

  while (current < endDate) {
    const day = current.getDay();

    if (day !== 0 && day !== 6) {
      const workStart = new Date(current);
      workStart.setHours(9, 0, 0, 0);

      const workEnd = new Date(current);
      workEnd.setHours(18, 0, 0, 0);

      const effectiveStart = current > workStart ? current : workStart;
      const effectiveEnd = endDate < workEnd ? endDate : workEnd;

      if (effectiveStart < effectiveEnd) {
        totalMinutes += (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60);
      }
    }

    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0, 0);
  }

  return totalMinutes;
}

export const getSLAStatus = (
  slaDeadline: Date | string,
  priorityOrNow?: string | Date,
  now: Date = new Date()
) => {
  if (!slaDeadline) return "ON_TRACK";

  let priority: string | undefined;
  let currentDate = now;

  if (priorityOrNow instanceof Date) {
    currentDate = priorityOrNow;
  } else if (typeof priorityOrNow === "string") {
    priority = priorityOrNow;
  }

  const deadline = new Date(slaDeadline);
  if (isNaN(deadline.getTime())) return "ON_TRACK";

  const remainingMinutes = calculateBusinessMinutesBetween(currentDate, deadline);

  if (remainingMinutes <= 0) return "BREACHED";

  let totalMinutes = 480;
  if (priority === "LOW") totalMinutes = 1440;
  else if (priority === "MEDIUM") totalMinutes = 480;
  else if (priority === "HIGH") totalMinutes = 120;

  const threshold = totalMinutes * 0.25;

  if (remainingMinutes <= threshold) return "AT_RISK";

  return "ON_TRACK";
};