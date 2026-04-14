import { supabase } from "./supabase";
import { dateConfigMap } from "nepali-date-converter";
import NepaliDate from "nepali-date-converter";

// ── Employees CRUD ──

export async function getEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addEmployee(employeeData) {
  const { data, error } = await supabase
    .from("employees")
    .insert([employeeData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEmployee(id) {
  // Cascading delete handles advances & absences
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ── Employee Detail (with advances & absences for a month) ──

export async function getEmployeeById(id) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getAdvancesForMonth(employeeId, year, month) {
  const daysInMonth = getDaysInNepaliMonth(year, month);
  // month is 1-indexed, build date range for the Nepali month
  const monthStr = String(month).padStart(2, "0");
  const prefix = `${year}-${monthStr}`;
  const startDate = `${prefix}-01`;
  const endDate = `${prefix}-${String(daysInMonth).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("employee_advances")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPaymentsForMonth(employeeId, year, month) {
  const daysInMonth = getDaysInNepaliMonth(year, month);
  const monthStr = String(month).padStart(2, "0");
  const prefix = `${year}-${monthStr}`;
  const startDate = `${prefix}-01`;
  const endDate = `${prefix}-${String(daysInMonth).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("employee_payments")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getAllAdvances(employeeId) {
  const { data, error } = await supabase
    .from("employee_advances")
    .select("*")
    .eq("employee_id", employeeId)
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addAdvance(employeeId, amount, note, date) {
  const { data, error } = await supabase
    .from("employee_advances")
    .insert([{ employee_id: employeeId, amount, note: note || null, date }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAdvance(id) {
  const { error } = await supabase.from("employee_advances").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function addPayment(employeeId, amount, note, date) {
  const { data, error } = await supabase
    .from("employee_payments")
    .insert([{ employee_id: employeeId, amount, note: note || null, date }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePayment(id) {
  const { error } = await supabase.from("employee_payments").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ── Absences ──

export async function getAbsencesForMonth(employeeId, year, month) {
  const daysInMonth = getDaysInNepaliMonth(year, month);
  const monthStr = String(month).padStart(2, "0");
  const prefix = `${year}-${monthStr}`;
  const startDate = `${prefix}-01`;
  const endDate = `${prefix}-${String(daysInMonth).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("employee_absences")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getAllAbsences(employeeId) {
  const { data, error } = await supabase
    .from("employee_absences")
    .select("*")
    .eq("employee_id", employeeId)
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addAbsence(employeeId, date, reason) {
  const { data, error } = await supabase
    .from("employee_absences")
    .insert([{ employee_id: employeeId, date, reason: reason || null }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addMultipleAbsences(absencesData) {
  const { data, error } = await supabase
    .from("employee_absences")
    .insert(absencesData)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteAbsence(id) {
  const { error } = await supabase.from("employee_absences").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ── Payments ──

// (Removed duplicates)

// ── Salary Calculation (pure function) ──

export function calcSalary(dailyWage, absentDays, totalAdvances, totalPayments, daysInMonth = 30, openingBalance = 0) {
  const daysWorked = daysInMonth - absentDays;
  const grossSalary = daysWorked * dailyWage;
  const thisMonthNet = grossSalary - totalAdvances;
  const totalPayable = openingBalance + thisMonthNet;
  const remainingDue = totalPayable - totalPayments;
  
  return {
    openingBalance,
    totalDays: daysInMonth,
    absentDays,
    daysWorked,
    grossSalary,
    totalAdvances,
    thisMonthNet,
    totalPayments,
    totalPayable,
    remainingDue,
  };
}

// ── Nepali month helpers ──

export const NEPALI_MONTHS = [
  "Baisakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Asoj",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

export function getDaysInNepaliMonth(year, month) {
  const yearData = dateConfigMap[year];
  if (!yearData) return 30; // fallback assumption
  const daysArray = Object.values(yearData);
  return daysArray[month - 1] || 30;
}

export function getCurrentNepaliYearMonth() {
  const now = new Date();
  const enYear = now.getFullYear();
  const enMonth = now.getMonth();
  const nepaliMonth = ((enMonth - 3 + 12) % 12) + 1;
  const nepaliYear = enMonth >= 3 ? enYear + 57 : enYear + 56;
  return { year: nepaliYear, month: nepaliMonth };
}

// ── Strict 30-Day Cycle Payroll Logic ──

export function getCycleDateRange(joiningDateStr, cycleIndex) {
  if (!joiningDateStr) return null;
  try {
    const jNd = new NepaliDate(joiningDateStr);
    const jJs = jNd.toJsDate();
    const jUtc = Date.UTC(jJs.getFullYear(), jJs.getMonth(), jJs.getDate());
    
    const startUtc = jUtc + (cycleIndex * 30 * 24 * 60 * 60 * 1000);
    const endUtc = startUtc + (29 * 24 * 60 * 60 * 1000);
    
    const startJs = new Date(startUtc);
    const endJs = new Date(endUtc);
    
    const startNd = new NepaliDate(startJs);
    const endNd = new NepaliDate(endJs);
    
    return {
      startDateStr: startNd.format('YYYY-MM-DD'),
      endDateStr: endNd.format('YYYY-MM-DD'),
      startNd,
      endNd
    };
  } catch (e) {
    return null;
  }
}

export async function getAdvancesForDateRange(employeeId, startDateStr, endDateStr) {
  const { data, error } = await supabase
    .from("employee_advances")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("date", startDateStr)
    .lte("date", endDateStr)
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPaymentsForDateRange(employeeId, startDateStr, endDateStr) {
  const { data, error } = await supabase
    .from("employee_payments")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("date", startDateStr)
    .lte("date", endDateStr)
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getAbsencesForDateRange(employeeId, startDateStr, endDateStr) {
  const { data, error } = await supabase
    .from("employee_absences")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("date", startDateStr)
    .lte("date", endDateStr)
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getCycleHistoricalBalance(employeeId, joiningDateStr, cycleIndex, dailyWage) {
  if (!joiningDateStr || cycleIndex <= 0) return 0;
  
  const range = getCycleDateRange(joiningDateStr, cycleIndex);
  if (!range) return 0;
  const { startDateStr } = range;
  
  const { data: absData } = await supabase
    .from("employee_absences")
    .select("id")
    .eq("employee_id", employeeId)
    .lt("date", startDateStr);
    
  const { data: advData } = await supabase
    .from("employee_advances")
    .select("amount")
    .eq("employee_id", employeeId)
    .lt("date", startDateStr);
    
  const { data: payData } = await supabase
    .from("employee_payments")
    .select("amount")
    .eq("employee_id", employeeId)
    .lt("date", startDateStr);
    
  const absencesCount = absData ? absData.length : 0;
  const totalAdvances = (advData || []).reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalPayments = (payData || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  
  const totalHistoricallyElapsedDays = cycleIndex * 30;
  const daysWorked = totalHistoricallyElapsedDays - absencesCount;
  const grossEarned = daysWorked * Number(dailyWage);
  
  return grossEarned - totalAdvances - totalPayments;
}

export async function getHistoricalBalance(employeeId, joiningDateStr, year, month, dailyWage) {
  if (!joiningDateStr) return 0;
  
  const monthStr = String(month).padStart(2, "0");
  const cutOffDateStr = `${year}-${monthStr}-01`;
  
  let totalElapsedDays = 0;
  try {
    const jNd = new NepaliDate(joiningDateStr);
    const cNd = new NepaliDate(year, month - 1, 1);
    const tNd = new NepaliDate(); // today
    
    const jJs = jNd.toJsDate();
    const cJs = cNd.toJsDate();
    const tJs = tNd.toJsDate();
    
    const jUtc = Date.UTC(jJs.getFullYear(), jJs.getMonth(), jJs.getDate());
    const cUtc = Date.UTC(cJs.getFullYear(), cJs.getMonth(), cJs.getDate());
    const tUtc = Date.UTC(tJs.getFullYear(), tJs.getMonth(), tJs.getDate());
    
    const diffFromJoin = Math.floor((tUtc - jUtc) / (1000 * 60 * 60 * 24));
    const currentCycleIndex = diffFromJoin >= 0 ? Math.floor(diffFromJoin / 30) : -1;
    
    let diff = Math.floor((cUtc - jUtc) / (1000 * 60 * 60 * 24));
    
    if (currentCycleIndex >= 0) {
      const maxAllowedValidDays = (currentCycleIndex + 1) * 30;
      if (diff > maxAllowedValidDays) diff = maxAllowedValidDays;
    } else {
      diff = 0; // employee hasn't joined physically based on today timestamp
    }
    
    totalElapsedDays = diff > 0 ? diff : 0;
  } catch (e) {
    totalElapsedDays = 0;
  }
  
  if (totalElapsedDays <= 0) return 0;

  const { data: absData } = await supabase
    .from("employee_absences")
    .select("id")
    .eq("employee_id", employeeId)
    .lt("date", cutOffDateStr);
    
  const { data: advData } = await supabase
    .from("employee_advances")
    .select("amount")
    .eq("employee_id", employeeId)
    .lt("date", cutOffDateStr);
    
  const { data: payData } = await supabase
    .from("employee_payments")
    .select("amount")
    .eq("employee_id", employeeId)
    .lt("date", cutOffDateStr);
    
  const absencesCount = absData ? absData.length : 0;
  const totalAdvances = (advData || []).reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalPayments = (payData || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  
  const daysWorked = totalElapsedDays - absencesCount;
  const grossEarned = daysWorked * Number(dailyWage);
  const openingBalance = grossEarned - totalAdvances - totalPayments;
  
  return openingBalance;
}
