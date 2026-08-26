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

  const diffMs = deadline.getTime() - currentDate.getTime();

  if (diffMs <= 0) return "BREACHED";

  const remainingHours = diffMs / (1000 * 60 * 60);

  let totalHours = 8;
  if (priority === "LOW") totalHours = 24;
  else if (priority === "MEDIUM") totalHours = 8;
  else if (priority === "HIGH") totalHours = 2;

  const thresholdHours = Math.max(1, totalHours * 0.25);

  if (remainingHours <= thresholdHours) return "AT_RISK";

  return "ON_TRACK";
};