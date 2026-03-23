
import { adToBs, getTodayBS } from './src/utils/nepaliDate.js';

// March 23, 2026 AD should be Chaitra 09, 2082 BS (2082-12-09)
const testDate = new Date('2026-03-23T00:00:00Z');
console.log('Test Date (2026-03-23):', adToBs(testDate));

// Current Date
console.log('Today BS:', getTodayBS());
