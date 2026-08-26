export const calculateSLA = (priority: string): Date => {
  const now = new Date()

  let hoursToAdd = 0

  switch (priority) {
    case "HIGH":
      hoursToAdd = 4
      break
    case "MEDIUM":
      hoursToAdd = 8
      break
    case "LOW":
      hoursToAdd = 24
      break
    default:
      hoursToAdd = 8
  }

  const deadline = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000)

  return deadline
}

export const getSLAStatus = (
  slaDeadline: Date,
  now: Date = new Date()
) => {
  const diff = slaDeadline.getTime() - now.getTime()

  const hoursLeft = diff / (1000 * 60 * 60)

  if (diff <= 0) return "BREACHED"

  if (hoursLeft <= 2) return "AT_RISK"

  return "ON_TRACK"
}