// src/components/Landing.tsx
"use client";

import { Lang } from "@/data/i18n";

export default function Landing(props: {
  DEPARTMENTS: any[];
  t: Record<string, string>;
  currentLang: Lang;
  onChangeLang: (l: Lang) => void;
  onStartAudit: (dept: string) => void;
  onOpenAuditManager: () => void;
  onOpenCompanyInfo: () => void;
}) {
  const { DEPARTMENTS, t, currentLang, onChangeLang } = props;

  return (
    <div className="landing-container">
      {/* Convert your landing HTML here 1:1.
          Keep same buttons and labels, just replace onclick with props calls. */}

      <div style={{ display: "flex", gap: 8 }}>
        <select
          value={currentLang}
          onChange={(e) => onChangeLang(e.target.value as any)}
        >
          <option value="en">EN</option>
          <option value="fr">FR</option>
          <option value="es">ES</option>
        </select>

        <button onClick={props.onOpenCompanyInfo}>🏢 Company Info</button>
        <button onClick={props.onOpenAuditManager}>📋 Audit Manager</button>
      </div>

      <div className="department-grid">
        {DEPARTMENTS.map((d) => (
          <button key={d.id} onClick={() => props.onStartAudit(d.id)}>
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
