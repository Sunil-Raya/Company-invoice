
// Month lengths for 2081 to 2083 BS
const calendarData = {
  2081: [31, 31, 31, 32, 31, 30, 30, 30, 30, 29, 30, 30],
  2082: [30, 31, 31, 32, 31, 30, 30, 30, 30, 29, 30, 31],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 30, 29, 30, 30]
};

// Start point: 2081-01-01 BS = 2024-04-13 AD
const AD_REFERENCE = new Date('2024-04-13');
const BS_YEAR_REFERENCE = 2081;

/**
 * Converts a Gregorian Date to a Nepali Date string (YYYY-MM-DD)
 */
export function adToBs(adDate) {
  let diffTime = adDate.getTime() - AD_REFERENCE.getTime();
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "2081-01-01"; // Fallback for very old dates

  let year = BS_YEAR_REFERENCE;
  let month = 0; // 0-indexed (Baishakh)
  let day = 1;

  while (diffDays > 0) {
    const daysInMonth = calendarData[year][month];
    if (diffDays >= daysInMonth) {
      diffDays -= daysInMonth;
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    } else {
      day += diffDays;
      diffDays = 0;
    }
  }

  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function getTodayBS() {
  // Use Nepal Time (UTC+5:45)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const nepalTime = new Date(utc + (3600000 * 5.75));
  return adToBs(nepalTime);
}

/**
 * Subtracts days from a BS date string (YYYY-MM-DD)
 */
export function subtractDays(bsDateStr, daysToSubtract) {
  let [year, month, day] = bsDateStr.split('-').map(Number);
  month -= 1; // 0-indexed

  while (daysToSubtract > 0) {
    if (day > daysToSubtract) {
      day -= daysToSubtract;
      daysToSubtract = 0;
    } else {
      daysToSubtract -= day;
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
      day = calendarData[year][month];
    }
  }

  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}
