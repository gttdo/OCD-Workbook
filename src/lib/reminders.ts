/**
 * Practice reminders.
 *
 * Reminders are the one engagement mechanic with evidence behind it — the 2026
 * JAMA Psychiatry review of 79 app trials found attrition lower where trials
 * offered reminders, human contact, and *no* gamification. So they are worth
 * having, and they are not streaks in disguise.
 *
 * They are delivered as a calendar event rather than a push notification, for
 * a plain reason: a PWA cannot reliably fire a scheduled local notification.
 * Waking a service worker on a schedule needs either a push server — which
 * would mean shipping practice times to a backend — or Notification Triggers,
 * which is not broadly available. A calendar entry is reliable, works offline,
 * needs no permission prompt, and lives in a system the person already trusts
 * and already checks.
 *
 * Choosing the time in advance is also the point. It mirrors the technique of
 * scheduling a compulsion rather than obeying it the moment it arrives, and it
 * means the app never surprises anyone into thinking about their symptoms.
 */

export interface ReminderPreference {
  /** 0 = Sunday, matching Date#getDay. */
  days: number[]
  /** "18:30", local wall-clock time. */
  time: string
}

const KEY = 'ocd-workbook.reminder'

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

export function loadReminder(): ReminderPreference | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ReminderPreference) : null
  } catch {
    return null
  }
}

export function saveReminder(pref: ReminderPreference | null): void {
  if (pref) localStorage.setItem(KEY, JSON.stringify(pref))
  else localStorage.removeItem(KEY)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * A floating-time recurring event — no timezone, no Z. That is deliberate:
 * "practise at half six" should mean half six wherever the person is, not an
 * instant fixed to the timezone they happened to set it in.
 */
export function buildIcs(pref: ReminderPreference): string {
  const [hh, mm] = pref.time.split(':').map(Number)
  const now = new Date()

  // First occurrence: today if the time has not passed, otherwise tomorrow.
  const start = new Date(now)
  start.setHours(hh ?? 18, mm ?? 30, 0, 0)
  if (start <= now) start.setDate(start.getDate() + 1)

  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  const dtstart = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(start.getHours())}${pad(start.getMinutes())}00`
  const byday = pref.days.map((d) => ICS_DAYS[d]).join(',')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OCD Workbook//Practice reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:practice-${stamp}@ocd-workbook`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtstart}`,
    `DURATION:PT30M`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byday}`,
    'SUMMARY:Exposure practice',
    // Deliberately plain. This lands in a shared calendar sometimes, and on a
    // lock screen often — it should not announce a diagnosis to a room.
    'DESCRIPTION:Time you set aside to practise.',
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Exposure practice',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(pref: ReminderPreference): void {
  const blob = new Blob([buildIcs(pref)], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'practice-reminder.ics'
  a.click()
  URL.revokeObjectURL(url)
}
