
// Month lengths for 2080 to 2085 BS, checked against the published Hamro Patro calendar.
// Keep in step with patches/@sbmdkl+nepali-datepicker-reactjs+*.patch, which corrects the picker's own table.
const bsData = {
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30]
};

const DAY_MS = 24 * 60 * 60 * 1000;
const NEPAL_OFFSET_MS = 5.75 * 60 * 60 * 1000; // Nepal is UTC+5:45 all year (no DST)

// Reference point from library: 2000-01-01 BS = 1943-04-14 AD
const AD_REFERENCE = new Date('1943-04-14T00:00:00Z');
const BS_YEAR_REFERENCE = 2000;

// All years sum from 2000 to 2079 (Pre-calculated to avoid long loops)
// Based on library's bs array sum for these years.
const DAYS_BEFORE_2080 = 29220; 

/**
 * Converts an instant to the BS date (YYYY-MM-DD) it falls on in Nepal,
 * whatever timezone the browser is in.
 */
export function adToBs(adDate) {
  const targetDate = new Date(adDate);
  const diffTime = targetDate.getTime() + NEPAL_OFFSET_MS - AD_REFERENCE.getTime();
  let diffDays = Math.floor(diffTime / DAY_MS);

  if (diffDays < 0) return "2080-01-01";

  // Start from 2080 to save iterations
  let year = 2080;
  diffDays -= DAYS_BEFORE_2080;

  // If we went too far back (before 2080), reset to reference
  if (diffDays < 0) {
      year = 2000;
      diffDays = Math.floor(diffTime / DAY_MS);
  }

  let month = 0; // 0-indexed (Baishakh)
  let day = 1;

  while (diffDays > 0) {
    const daysInMonth = (year < 2080 || year > 2085) ? 30 : bsData[year][month];
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
  return adToBs(new Date());
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
      day = bsData[year] ? bsData[year][month] : 30; // Fallback to 30 if outside range
    }
  }

  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}
