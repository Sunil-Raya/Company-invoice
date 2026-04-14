import React, { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select an option...",
  className = "",
  containerStyle = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} style={{ position: 'relative', width: '100%', ...containerStyle }} ref={dropdownRef}>
      <div 
        style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          cursor: 'pointer', background: '#fff', padding: '10px 14px', 
          border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '42px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearchTerm("");
        }}
      >
        <span style={{ color: selectedOption ? '#111827' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown color="#6b7280" />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          marginTop: '4px', background: '#fff', borderRadius: '8px', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb', maxHeight: '250px', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '10px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiSearch color="#9ca3af" />
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
            />
          </div>
          <div style={{ overflowY: 'auto', padding: '4px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>No matches</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '14px',
                    background: value === opt.value ? '#eff6ff' : 'transparent',
                    color: value === opt.value ? '#1d4ed8' : '#374151',
                    fontWeight: value === opt.value ? '600' : '400',
                  }}
                  onMouseEnter={(e) => { if(value !== opt.value) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { if(value !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
