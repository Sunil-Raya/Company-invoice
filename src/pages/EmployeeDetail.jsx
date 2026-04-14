import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft, FiPhone, FiCalendar, FiDollarSign,
  FiChevronLeft, FiChevronRight, FiPlus, FiTrash2, FiX
} from "react-icons/fi";
import PageTransition from "../components/PageTransition";
import VectorLoader from "../components/VectorLoader";
import { useToast } from "../contexts/ToastContext";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import NepaliDate from "nepali-date-converter";
import {
  getEmployeeById,
  getAdvancesForMonth,
  getAbsencesForMonth,
  addAdvance,
  deleteAdvance,
  addAbsence,
  addMultipleAbsences,
  deleteAbsence,
  calcSalary,
  NEPALI_MONTHS,
  getCurrentNepaliYearMonth,
  getDaysInNepaliMonth,
  getHistoricalBalance,
  getAdvancesForDateRange,
  getPaymentsForDateRange,
  getAbsencesForDateRange,
  getCycleHistoricalBalance,
  getCycleDateRange,
  addPayment,
  deletePayment,
} from "../services/employeesService";
import "../styles/employees.css";

function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [employee, setEmployee] = useState(null);
  const [advances, setAdvances] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cycleAbsences, setCycleAbsences] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState(0);

  // Current Nepali month selector
  const current = getCurrentNepaliYearMonth();
  const [selectedYear, setSelectedYear] = useState(current.year);
  const [selectedMonth, setSelectedMonth] = useState(current.month);

  const daysInMonth = useMemo(() => getDaysInNepaliMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  const cycleInfo = useMemo(() => {
    if (!employee || !employee.joining_date) return null;
    try {
      const jNd = new NepaliDate(employee.joining_date);
      const tNd = new NepaliDate(); // today

      const jJs = jNd.toJsDate();
      const tJs = tNd.toJsDate();

      const jUtc = Date.UTC(jJs.getFullYear(), jJs.getMonth(), jJs.getDate());
      const tUtc = Date.UTC(tJs.getFullYear(), tJs.getMonth(), tJs.getDate());

      const diffFromJoin = Math.floor((tUtc - jUtc) / (1000 * 60 * 60 * 24));
      const currentCycleIndex = diffFromJoin >= 0 ? Math.floor(diffFromJoin / 30) : -1;

      return { jUtc, currentCycleIndex };
    } catch (e) {
      return null;
    }
  }, [employee]);

  const getDayCycleStatus = (day) => {
    if (!cycleInfo) return { inactive: false, activeCycle: false };
    try {
      const cellNd = new NepaliDate(selectedYear, selectedMonth - 1, day);
      const cellJs = cellNd.toJsDate();
      const cellUtc = Date.UTC(cellJs.getFullYear(), cellJs.getMonth(), cellJs.getDate());
      const diffDays = Math.floor((cellUtc - cycleInfo.jUtc) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { inactive: true, activeCycle: false };
      
      const cycleIndex = Math.floor(diffDays / 30);
      return {
        inactive: cycleIndex > cycleInfo.currentCycleIndex,
        activeCycle: cycleIndex === cycleInfo.currentCycleIndex
      };
    } catch (e) {
      return { inactive: true, activeCycle: false };
    }
  };

  // Advance form
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceNote, setAdvanceNote] = useState("");
  const [advanceDate, setAdvanceDate] = useState("");
  const [advanceLoading, setAdvanceLoading] = useState(false);

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Absence form
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [absenceDay, setAbsenceDay] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceLoading, setAbsenceLoading] = useState(false);

  useEffect(() => {
    loadEmployee();
  }, [id]);

  useEffect(() => {
    if (cycleInfo && cycleInfo.currentCycleIndex >= 0) {
      setSelectedCycle(cycleInfo.currentCycleIndex);
    }
  }, [cycleInfo]);

  useEffect(() => {
    if (employee) loadMonthData();
  }, [employee, selectedYear, selectedMonth]);
  
  useEffect(() => {
    if (employee) loadCycleData();
  }, [employee, selectedCycle]);

  async function loadEmployee() {
    try {
      const data = await getEmployeeById(id);
      setEmployee(data);
    } catch (err) {
      addToast("Failed to load employee.", "error");
      navigate("/employees");
    } finally {
      setLoading(false);
    }
  }

  async function loadMonthData() {
    try {
      const abs = await getAbsencesForMonth(id, selectedYear, selectedMonth);
      setAbsences(abs);
    } catch (err) {
      console.error("Failed to load month data:", err);
    }
  }

  async function loadCycleData() {
    if (!employee || !employee.joining_date || selectedCycle === null) return;
    try {
      const range = getCycleDateRange(employee.joining_date, selectedCycle);
      if (!range) return;
      const [adv, pay, abs, bal] = await Promise.all([
        getAdvancesForDateRange(id, range.startDateStr, range.endDateStr),
        getPaymentsForDateRange(id, range.startDateStr, range.endDateStr),
        getAbsencesForDateRange(id, range.startDateStr, range.endDateStr),
        getCycleHistoricalBalance(id, employee.joining_date, selectedCycle, employee.daily_wage)
      ]);
      setAdvances(adv);
      setPayments(pay);
      setCycleAbsences(abs);
      setOpeningBalance(bal);
    } catch (err) {
      console.error("Failed to load cycle data:", err);
    }
  }

  // Month navigation
  function prevMonth() {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  }

  // Salary calculation decoupled implicitly to explicit 30 day cycle bounds
  const salaryInfo = useMemo(() => {
    if (!employee) return null;
    const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return calcSalary(Number(employee.daily_wage), cycleAbsences.length, totalAdvances, totalPayments, 30, openingBalance);
  }, [employee, advances, cycleAbsences, payments, openingBalance]);

  const formattedCycleRange = useMemo(() => {
    if (!employee || !employee.joining_date) return "";
    const range = getCycleDateRange(employee.joining_date, selectedCycle);
    if (!range) return "";
    const sNd = range.startNd;
    const eNd = range.endNd;
    return `${NEPALI_MONTHS[sNd.getMonth()]} ${sNd.getDate()} - ${NEPALI_MONTHS[eNd.getMonth()]} ${eNd.getDate()}`;
  }, [employee, selectedCycle]);

  // Add advance
  async function handleAddAdvance(e) {
    e.preventDefault();
    if (!advanceAmount || Number(advanceAmount) <= 0) {
      addToast("Enter a valid amount.", "error");
      return;
    }
    if (!advanceDate) {
      addToast("Select a date.", "error");
      return;
    }
    setAdvanceLoading(true);
    try {
      await addAdvance(employee.id, parseFloat(advanceAmount), advanceNote, advanceDate);
      setAdvanceAmount("");
      setAdvanceNote("");
      setAdvanceDate("");
      setShowAdvanceForm(false);
      loadCycleData(); // reload cyclical tracking natively
      addToast("Advance added.", "success");
    } catch (err) {
      addToast("Failed to add advance.", "error");
    } finally {
      setAdvanceLoading(false);
    }
  }

  async function handleDeleteAdvance(advId) {
    try {
      await deleteAdvance(advId);
      setAdvances((prev) => prev.filter((a) => a.id !== advId));
      loadCycleData();
      addToast("Advance removed.", "info");
    } catch (err) {
      addToast("Failed to remove advance.", "error");
    }
  }

  // Add payments
  async function handleAddPayment(e) {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!paymentAmount || amountNum <= 0) {
      addToast("Enter a valid amount.", "error");
      return;
    }
    if (!paymentDate) {
      addToast("Select a date.", "error");
      return;
    }
    setPaymentLoading(true);
    try {
      await addPayment(employee.id, amountNum, paymentNote, paymentDate);
      setPaymentAmount("");
      setPaymentNote("");
      setPaymentDate("");
      setShowPaymentForm(false);
      loadCycleData();
      addToast("Payment recorded successfully.", "success");
    } catch (err) {
      addToast("Failed to add payment.", "error");
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleDeletePayment(payId) {
    try {
      await deletePayment(payId);
      setPayments((prev) => prev.filter((p) => p.id !== payId));
      loadCycleData();
      addToast("Payment removed.", "info");
    } catch (err) {
      addToast("Failed to remove payment.", "error");
    }
  }

  // Add absence (supports comma-separated multiple days)
  async function handleAddAbsence(e) {
    e.preventDefault();
    if (!absenceDay) {
      addToast("Enter at least one day.", "error");
      return;
    }

    // Parse comma-separated days
    const parsedDays = absenceDay
      .split(",")
      .map(d => d.trim())
      .filter(d => d !== "")
      .map(d => Number(d));

    const invalidDays = parsedDays.filter(d => isNaN(d) || d < 1 || d > daysInMonth);
    if (invalidDays.length > 0) {
      addToast(`Enter valid days between 1 and ${daysInMonth} (e.g., 2, 5, 10).`, "error");
      return;
    }

    const inactiveDays = parsedDays.filter(d => getDayCycleStatus(d).inactive);
    if (inactiveDays.length > 0) {
      addToast(`Cannot mark absent on days before joining or in future cycles (${inactiveDays.join(", ")}).`, "error");
      return;
    }

    if (parsedDays.length === 0) return;

    const monthStr = String(selectedMonth).padStart(2, "0");
    const newAbsencesToInsert = [];
    let duplicates = 0;

    parsedDays.forEach(day => {
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
      
      // Check duplicate
      if (absences.some((a) => a.date === dateStr)) {
        duplicates++;
      } else {
        newAbsencesToInsert.push({
          employee_id: id,
          date: dateStr,
          reason: absenceReason || null
        });
      }
    });

    if (newAbsencesToInsert.length === 0 && duplicates > 0) {
      addToast("All specified days are already marked absent.", "error");
      return;
    }

    setAbsenceLoading(true);
    try {
      const addedData = await addMultipleAbsences(newAbsencesToInsert);
      setAbsences((prev) => [...prev, ...addedData].sort((a, b) => a.date.localeCompare(b.date)));
      setAbsenceDay("");
      setAbsenceReason("");
      setShowAbsenceForm(false);
      
      if (duplicates > 0) {
        addToast(`Marked ${addedData.length} days absent (${duplicates} skipped duplicates).`, "success");
      } else {
        addToast(`Marked ${addedData.length} day(s) absent.`, "success");
      }
      loadCycleData(); // Add this line to refresh payroll calculation
    } catch (err) {
      addToast("Failed to mark absences.", "error");
    } finally {
      setAbsenceLoading(false);
    }
  }

  async function handleDeleteAbsence(absId) {
    try {
      await deleteAbsence(absId);
      setAbsences((prev) => prev.filter((a) => a.id !== absId));
      setCycleAbsences((prev) => prev.filter((a) => a.id !== absId));
      loadCycleData();
      addToast("Absence removed.", "info");
    } catch (err) {
      addToast("Failed to remove absence.", "error");
    }
  }

  // Build absence day set for calendar
  const absentDaySet = useMemo(() => {
    const set = new Set();
    absences.forEach((a) => {
      const day = parseInt(a.date.split("-")[2], 10);
      set.add(day);
    });
    return set;
  }, [absences]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-gray-50">
        <VectorLoader />
        <div className="text-gray-500 text-sm font-bold tracking-wider">Loading Employee...</div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <PageTransition>
      <div className="emp-detail-container">
        {/* Back button + header */}
        <div className="emp-detail-top">
          <button className="emp-back-btn" onClick={() => navigate("/employees")}>
            <FiArrowLeft /> Back
          </button>
        </div>

        {/* Employee info header */}
        <div className="emp-info-header">
          <div className="emp-info-left">
            <h2 className="emp-info-name">{employee.name}</h2>
            <div className="emp-info-tags">
              {employee.phone && (
                <span className="emp-tag"><FiPhone size={12} /> {employee.phone}</span>
              )}
              <span className="emp-tag">
                <FiCalendar size={12} /> Joined {employee.joining_date}
              </span>
              <span className="emp-tag">
                <FiDollarSign size={12} /> Rs. {Number(employee.daily_wage).toLocaleString()}/day
              </span>
            </div>
          </div>
        </div>

        {/* Month selector */}
        <div className="emp-month-selector">
          <button className="emp-month-btn" onClick={prevMonth}><FiChevronLeft /></button>
          <span className="emp-month-label">
            {NEPALI_MONTHS[selectedMonth - 1]} {selectedYear}
          </span>
          <button className="emp-month-btn" onClick={nextMonth}><FiChevronRight /></button>
        </div>

        {/* Salary Cycle Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', marginTop: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Payroll Cycle Summary</h3>
          {employee && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', border: '1px solid #e5e7eb', padding: '6px 14px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <button onClick={() => setSelectedCycle(c => Math.max(0, c - 1))} style={{ border: 'none', background: '#f3f4f6', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiChevronLeft size={16}/></button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Cycle {selectedCycle + 1}</span>
                <span style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{formattedCycleRange}</span>
              </div>
              <button onClick={() => setSelectedCycle(c => c + 1)} style={{ border: 'none', background: '#f3f4f6', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiChevronRight size={16}/></button>
            </div>
          )}
        </div>

        {/* Salary summary cards */}
        {salaryInfo && (
          <div className="emp-salary-grid">
            <div className="emp-salary-card">
              <div className="emp-salary-card-label">Previous Balance</div>
              <div className="emp-salary-card-value" style={{ color: salaryInfo.openingBalance > 0 ? '#10b981' : '#374151' }}>
                Rs. {salaryInfo.openingBalance.toLocaleString()}
              </div>
            </div>
            <div className="emp-salary-card">
              <div className="emp-salary-card-label">Absences / Net</div>
              <div className="emp-salary-card-value" style={{ color: '#374151', fontSize: '15px' }}>
                {salaryInfo.absentDays} days / Rs. {salaryInfo.thisMonthNet.toLocaleString()}
              </div>
            </div>
            <div className="emp-salary-card">
              <div className="emp-salary-card-label">Advances</div>
              <div className="emp-salary-card-value" style={{ color: salaryInfo.totalAdvances > 0 ? '#f59e0b' : '#374151' }}>
                - Rs. {salaryInfo.totalAdvances.toLocaleString()}
              </div>
            </div>
            <div className="emp-salary-card">
              <div className="emp-salary-card-label">Total Payable</div>
              <div className="emp-salary-card-value" style={{ color: '#10b981' }}>
                Rs. {salaryInfo.totalPayable.toLocaleString()}
              </div>
            </div>
            <div className="emp-salary-card">
              <div className="emp-salary-card-label">Payments Made</div>
              <div className="emp-salary-card-value" style={{ color: salaryInfo.totalPayments > 0 ? '#3b82f6' : '#374151' }}>
                - Rs. {salaryInfo.totalPayments.toLocaleString()}
              </div>
            </div>
            <div className="emp-salary-card emp-salary-card--net">
              <div className="emp-salary-card-label">Amount Due</div>
              <div
                className="emp-salary-card-value"
                style={{
                  color: salaryInfo.remainingDue < 0 ? '#ef4444' : '#10b981',
                  fontSize: '22px',
                }}
              >
                {salaryInfo.remainingDue < 0
                  ? `- Rs. ${Math.abs(salaryInfo.remainingDue).toLocaleString()}`
                  : `Rs. ${salaryInfo.remainingDue.toLocaleString()}`}
              </div>
            </div>
          </div>
        )}

        {/* Two-column: Absence Calendar + Advances/Payments */}
        <div className="emp-detail-columns">
          {/* Absence Calendar */}
          <div className="emp-section-card">
            <div className="emp-section-header">
              <h3 className="emp-section-title">Attendance ({daysInMonth} days)</h3>
              <button className="emp-add-btn" onClick={() => setShowAbsenceForm(!showAbsenceForm)}>
                {showAbsenceForm ? <FiX /> : <FiPlus />}
                {showAbsenceForm ? "Cancel" : "Mark Absent"}
              </button>
            </div>

            {/* Absence form */}
            <AnimatePresence>
              {showAbsenceForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddAbsence}
                  className="emp-inline-form"
                >
                  <div className="emp-inline-form-row">
                    <div className="emp-inline-field">
                      <label>Days (Comma sep.)</label>
                      <input
                        type="text"
                        value={absenceDay}
                        onChange={(e) => setAbsenceDay(e.target.value)}
                        placeholder="e.g. 2, 5, 12"
                        required
                      />
                    </div>
                    <div className="emp-inline-field" style={{ flex: 2 }}>
                      <label>Reason (optional)</label>
                      <input
                        type="text"
                        value={absenceReason}
                        onChange={(e) => setAbsenceReason(e.target.value)}
                        placeholder="e.g. Sick leave"
                      />
                    </div>
                    <button type="submit" className="emp-inline-submit" disabled={absenceLoading}>
                      {absenceLoading ? "..." : "Add"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Calendar grid */}
            <div className="emp-calendar-grid">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const isAbsent = absentDaySet.has(day);
                const absRecord = absences.find(
                  (a) => parseInt(a.date.split("-")[2], 10) === day
                );

                const cycleStatus = getDayCycleStatus(day);
                let dayClass = "";
                if (cycleStatus.inactive) {
                  dayClass = "inactive";
                } else if (cycleStatus.activeCycle) {
                  dayClass = "active-cycle";
                }

                return (
                  <div
                    key={day}
                    className={`emp-calendar-day ${isAbsent ? "absent" : "present"} ${dayClass}`}
                    title={
                      isAbsent
                        ? `Absent${absRecord?.reason ? `: ${absRecord.reason}` : ""}`
                        : `Day ${day}`
                    }
                  >
                    <span className="emp-calendar-day-num">{day}</span>
                    {isAbsent && (
                      <button
                        className="emp-calendar-day-remove"
                        onClick={() => absRecord && handleDeleteAbsence(absRecord.id)}
                        title="Remove absence"
                      >
                        <FiX size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {absences.length > 0 && (
              <div className="emp-absence-summary">
                {absences.length} day{absences.length !== 1 ? "s" : ""} absent •
                Deduction: Rs. {(absences.length * Number(employee.daily_wage)).toLocaleString()}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Advances */}
          <div className="emp-section-card">
            <div className="emp-section-header">
              <h3 className="emp-section-title">Advances</h3>
              <button className="emp-add-btn" onClick={() => setShowAdvanceForm(!showAdvanceForm)}>
                {showAdvanceForm ? <FiX /> : <FiPlus />}
                {showAdvanceForm ? "Cancel" : "Add Advance"}
              </button>
            </div>

            {/* Advance form */}
            <AnimatePresence>
              {showAdvanceForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddAdvance}
                  className="emp-inline-form"
                >
                  <div className="emp-inline-form-row">
                    <div className="emp-inline-field">
                      <label>Amount (Rs.)</label>
                      <input
                        type="number"
                        min="1"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        placeholder="Amount"
                        required
                      />
                    </div>
                    <div className="emp-inline-field">
                      <label>Date</label>
                      <Calendar
                        onChange={({ bsDate }) => setAdvanceDate(bsDate)}
                        theme="default"
                        language="en"
                        hideDefaultValue={true}
                        placeholder="Select Date"
                        className="emp-calendar-input-adv"
                      />
                      <style>{`
                        .emp-calendar-input-adv {
                          width: 100%;
                          padding: 8px 10px;
                          border: 1.5px solid #e5e7eb;
                          border-radius: 8px;
                          font-size: 13px;
                          outline: none;
                          transition: border-color 0.2s;
                          font-family: inherit;
                          background: #f9fafb;
                          color: #111;
                          height: 37px;
                        }
                        .emp-calendar-input-adv:focus {
                          border-color: #a5b4fc;
                          background: #fff;
                        }
                      `}</style>
                    </div>
                    <div className="emp-inline-field">
                      <label>Note</label>
                      <input
                        type="text"
                        value={advanceNote}
                        onChange={(e) => setAdvanceNote(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <button type="submit" className="emp-inline-submit" disabled={advanceLoading}>
                      {advanceLoading ? "..." : "Add"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Advances list */}
            {advances.length === 0 ? (
              <div className="emp-empty-state">No advances this month.</div>
            ) : (
              <div className="emp-advances-list">
                {advances.map((adv) => (
                  <div key={adv.id} className="emp-advance-row">
                    <div className="emp-advance-info">
                      <span className="emp-advance-amount">Rs. {Number(adv.amount).toLocaleString()}</span>
                      <span className="emp-advance-meta">
                        {adv.date} {adv.note && `• ${adv.note}`}
                      </span>
                    </div>
                    <button
                      className="emp-advance-delete"
                      onClick={() => handleDeleteAdvance(adv.id)}
                      title="Remove advance"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="emp-advances-total">
                  Total: Rs. {advances.reduce((s, a) => s + Number(a.amount || 0), 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="emp-section-card">
            <div className="emp-section-header">
              <h3 className="emp-section-title">Salary Payments</h3>
              <button
                className="emp-add-btn"
                onClick={() => setShowPaymentForm(!showPaymentForm)}
              >
                <FiPlus /> Record Payment
              </button>
            </div>

            <AnimatePresence>
              {showPaymentForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddPayment}
                  className="emp-inline-form"
                >
                  <div className="emp-inline-form-row">
                    <div className="emp-inline-field">
                      <label>Amount (Rs.)</label>
                      <input
                        type="number"
                        min="1"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Amount"
                        required
                      />
                    </div>
                    <div className="emp-inline-field">
                      <label>Date</label>
                      <Calendar
                        onChange={({ bsDate }) => setPaymentDate(bsDate)}
                        theme="default"
                        language="en"
                        hideDefaultValue={true}
                        placeholder="Select Date"
                        className="emp-calendar-input-adv"
                      />
                    </div>
                    <div className="emp-inline-field">
                      <label>Note</label>
                      <input
                        type="text"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <button type="submit" className="emp-inline-submit" disabled={paymentLoading}>
                      {paymentLoading ? "..." : "Add"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Payments list */}
            {payments.length === 0 ? (
              <div className="emp-empty-state">No payments this month.</div>
            ) : (
              <div className="emp-advances-list">
                {payments.map((pay) => (
                  <div key={pay.id} className="emp-advance-row" style={{ borderColor: '#bfdbfe', background: '#eff6ff' }}>
                    <div className="emp-advance-info">
                      <span className="emp-advance-amount" style={{ color: '#3b82f6' }}>
                        Rs. {Number(pay.amount).toLocaleString()}
                      </span>
                      <span className="emp-advance-meta">
                        {pay.date} {pay.note && `• ${pay.note}`}
                      </span>
                    </div>
                    <button
                      className="emp-advance-delete"
                      onClick={() => handleDeletePayment(pay.id)}
                      title="Remove payment"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="emp-advances-total" style={{ background: '#dbeafe', color: '#1e3a8a' }}>
                  Total Paid: Rs. {payments.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default EmployeeDetail;
