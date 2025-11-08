// src/modals/InProgressRemarkModal.jsx
import { useEffect, useState } from "react";

export default function InProgressRemarkModal({
  open,
  defaultRemark = "",
  onClose,
  onSave,        // async(text: string)
}) {
  const [text, setText] = useState(defaultRemark);

  useEffect(() => {
    if (open) setText(defaultRemark || "");
  }, [open, defaultRemark]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 720 }}>
        <h4 className="mb-2">Remark in progress</h4>

        <div className="mb-2">
          <label className="mr-label">Remark in progress</label>
          <input
            type="text"
            className="mr-line text-primary w-100"
            value={text}
            onChange={(e) => setText(e.target.value.toUpperCase())}
            placeholder="พิมพ์หมายเหตุ..."
          />
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              const val = (text ?? "").toString().toUpperCase().trim();
              await onSave?.(val);
            }}
          >
            Save Remark in progress
          </button>
        </div>
      </div>
    </div>
  );
}
