
// Month lengths for 2080 to 2085 BS - EXACTLY from @sbmdkl/nepali-datepicker-reactjs library source
const bsData = {
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [30, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30]
};

// Reference point from library: 2000-01-01 BS = 1943-04-14 AD
const AD_REFERENCE = new Date('1943-04-14T00:00:00Z');
const BS_YEAR_REFERENCE = 2000;

// All years sum from 2000 to 2079 (Pre-calculated to avoid long loops)
// Based on library's bs array sum for these years.
const DAYS_BEFORE_2080 = 29220; 

/**
 * Converts a Gregorian Date to a Nepali Date string (YYYY-MM-DD)
 */
export function adToBs(adDate) {
  // Use UTC to avoid timezone shifts
  const targetDate = new Date(adDate);
  const diffTime = targetDate.getTime() - AD_REFERENCE.getTime();
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "2080-01-01"; 

  // Start from 2080 to save iterations
  let year = 2080;
  diffDays -= DAYS_BEFORE_2080;

  // If we went too far back (before 2080), reset to reference
  if (diffDays < 0) {
      year = 2000;
      diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
  const now = new Date();
  // Get midnight today in Nepal timezone for consistency
  const nepalOffset = 5.75 * 60 * 60 * 1000;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const nepalTime = new Date(utc + nepalOffset);
  
  // Strip time for conversion
  nepalTime.setUTCHours(0, 0, 0, 0);
  
  // Important: the library's adToBs uses local time difference.
  // We'll pass the local Date object but ensure it's calculated relative to reference.
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
      day = bsData[year] ? bsData[year][month] : 30; // Fallback to 30 if outside range
    }
  }

  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}
