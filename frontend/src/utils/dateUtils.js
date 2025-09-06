import { format, parseISO, isToday, isTomorrow, isYesterday, addDays, startOfDay, endOfDay } from 'date-fns'

export const formatDate = (date, formatStr = 'PPP') => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

export const formatTime = (time) => {
  if (!time) return ''
  return format(parseISO(`2000-01-01T${time}`), 'h:mm a')
}

export const formatDateTime = (date, time) => {
  if (!date || !time) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const timeObj = parseISO(`2000-01-01T${time}`)
  const combined = new Date(dateObj)
  combined.setHours(timeObj.getHours(), timeObj.getMinutes())
  return format(combined, 'PPP p')
}

export const isDateToday = (date) => {
  if (!date) return false
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isToday(dateObj)
}

export const isDateTomorrow = (date) => {
  if (!date) return false
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isTomorrow(dateObj)
}

export const isDateYesterday = (date) => {
  if (!date) return false
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isYesterday(dateObj)
}

export const getRelativeDate = (date) => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (isToday(dateObj)) return 'Today'
  if (isTomorrow(dateObj)) return 'Tomorrow'
  if (isYesterday(dateObj)) return 'Yesterday'
  
  return formatDate(dateObj, 'MMM d, yyyy')
}

export const getDateRange = (startDate, endDate) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  
  return {
    start: startOfDay(start),
    end: endOfDay(end)
  }
}

export const getNextNDays = (n = 7) => {
  const days = []
  const today = new Date()
  
  for (let i = 0; i < n; i++) {
    days.push(addDays(today, i))
  }
  
  return days
}

export const isSlotTimePassed = (date, time) => {
  const slotDateTime = new Date(date)
  const [hours, minutes] = time.split(':')
  slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  
  return slotDateTime < new Date()
}

export const canBookSlot = (date, time) => {
  const slotDateTime = new Date(date)
  const [hours, minutes] = time.split(':')
  slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  
  const now = new Date()
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  
  return slotDateTime > twoHoursFromNow
}
