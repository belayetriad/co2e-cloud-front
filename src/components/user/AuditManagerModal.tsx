// src/components/AuditManagerModal.tsx
"use client";

import { useMemo } from "react";

export default function AuditManagerModal(props: {
  open: boolean;
  currentLang: string;
  onClose: () => void;
  onResume: (dept: string) => void;
  onDelete: (dept: string) => void;
}) {
  const audits = useMemo(() => {
    if (typeof window === "undefined") return [];
    const departments = [
      "manufacturing",
      "warehouse",
      "office",
      "it",
      "kitchen",
      "retail",
      "maintenance",
      "transportation",
      "cold_storage",
      "laboratory",
      "showroom",
    ];

    const out: any[] = [];

    departments.forEach((dept) => {
      const saved = localStorage.getItem(`audit_${dept}`);
      if (!saved) return;

      const data = JSON.parse(saved);
      const filledFields = Object.values(data).filter(
        (v: any) => v && v !== "" && v !== "0"
      ).length;
      const totalFields = Object.keys(data).length;
      const completionPct =
        totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

      out.push({
        dept,
        deptLabel:
          dept.charAt(0).toUpperCase() + dept.slice(1).replace(/_/g, " "),
        completion: completionPct,
        fieldsFilled: filledFields,
        totalFields,
      });
    });

    return out;
  }, [props.open]);

  if (!props.open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 900 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>📋 Audit Manager - Saved Audits</h2>
          <button
            onClick={props.onClose}
            style={{ fontSize: 28, background: "none", border: "none" }}
          >
            ×
          </button>
        </div>

        {audits.length === 0 ? (
          <div
            style={{
              background: "#fef3c7",
              padding: 20,
              borderRadius: 8,
              marginTop: 20,
            }}
          >
            <p style={{ margin: 0 }}>
              No audits saved yet. Start an audit by selecting a department.
            </p>
          </div>
        ) : (
          <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
            {audits.map((a) => (
              <div
                key={a.dept}
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 15,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 8px 0" }}>{a.deptLabel}</h4>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <strong>{a.fieldsFilled}</strong> of{" "}
                    <strong>{a.totalFields}</strong> fields completed
                  </p>
                  <div
                    style={{
                      marginTop: 8,
                      background: "#e5e7eb",
                      height: 8,
                      borderRadius: 4,
                      width: 200,
                    }}
                  >
                    <div
                      style={{
                        background: "#10b981",
                        height: "100%",
                        width: `${a.completion}%`,
                      }}
                    />
                  </div>
                  <p style={{ margin: "5px 0 0 0", fontSize: 12 }}>
                    <strong>{a.completion}%</strong> complete
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => props.onResume(a.dept)}
                    style={{ padding: "8px 16px" }}
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => props.onDelete(a.dept)}
                    style={{ padding: "8px 16px" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 25 }}>
          <button onClick={props.onClose} style={{ padding: "10px 30px" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
