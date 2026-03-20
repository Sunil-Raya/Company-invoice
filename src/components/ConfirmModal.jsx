import { HiXMark, HiExclamationTriangle } from "react-icons/hi2";

function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDanger = false, loading = false, children }) {
  return (
    <div className="modal-backdrop" onClick={!loading ? onCancel : undefined}>
      <div className="modal-box confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className={`modal-icon ${isDanger ? 'modal-icon-danger' : ''}`}>
              <HiExclamationTriangle />
            </div>
            <div>
              <h2 className="modal-title">{title}</h2>
            </div>
          </div>
          <button className="modal-close" onClick={onCancel} disabled={loading}>
            <HiXMark />
          </button>
        </div>

        <div className="confirm-body">
          <p>{message}</p>
          {children && <div className="modal-children">{children}</div>}
        </div>

        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button 
            className={`modal-btn-submit ${isDanger ? 'btn-danger' : ''}`} 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
