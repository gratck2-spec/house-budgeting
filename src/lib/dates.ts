import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const JAKARTA_TZ = 'Asia/Jakarta';

export function todayJakarta(): string {
  return formatInTimeZone(new Date(), JAKARTA_TZ, 'yyyy-MM-dd');
}

export function dateToJakarta(date: Date): string {
  return formatInTimeZone(date, JAKARTA_TZ, 'yyyy-MM-dd');
}

export function jakartaToDate(dateStr: string): Date {
  return toZonedTime(`${dateStr}T00:00:00`, JAKARTA_TZ);
}

export function getWeekRange(dateStr: string, weekStart: number = 1): { start: string; end: string } {
  const date = jakartaToDate(dateStr);
  const day = date.getDay();
  const diffToStart = (day - weekStart + 7) % 7;
  const start = new Date(date);
  start.setDate(start.getDate() - diffToStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 5);
  return {
    start: dateToJakarta(start),
    end: dateToJakarta(end),
  };
}

export function formatDateIndo(dateStr: string): string {
  const date = jakartaToDate(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: JAKARTA_TZ,
  });
}