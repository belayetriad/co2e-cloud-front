// src/components/AuditShell.tsx
"use client";

export default function AuditShell(props: {
  dept: string;
  sectionId: string | null;
  t: Record<string, string>;
  currentLang: string;
  SECTIONS: any;
  QUESTIONS: any;
  deptValues: Record<string, any>;
  onChangeSection: (id: string) => void;
  onBack: () => void;
  onSetField: (fieldId: string, value: any) => void;
  onOpenCompanyInfo: () => void;
  onOpenAuditManager: () => void;
  onGenerateReport: () => void;
}) {
  const sections = props.SECTIONS[props.dept] ?? {};
  const sectionKeys = Object.keys(sections);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button onClick={props.onBack}>← Back</button>

        <div className="sidebar-nav">
          {sectionKeys.map((key) => (
            <button
              key={key}
              className={props.sectionId === key ? "active" : ""}
              onClick={() => props.onChangeSection(key)}
            >
              {sections[key]?.title ?? key}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <button onClick={props.onOpenCompanyInfo}>🏢 Company Info</button>
          <button onClick={props.onOpenAuditManager}>📋 Audit Manager</button>
          <button onClick={props.onGenerateReport}>
            📄 Generate Final Report
          </button>
        </div>
      </aside>

      <main className="content">
        <SectionRenderer
          dept={props.dept}
          sectionId={props.sectionId}
          SECTIONS={props.SECTIONS}
          QUESTIONS={props.QUESTIONS}
          values={props.deptValues}
          onSetField={props.onSetField}
        />
      </main>
    </div>
  );
}

function SectionRenderer(props: {
  dept: string;
  sectionId: string | null;
  SECTIONS: any;
  QUESTIONS: any;
  values: Record<string, any>;
  onSetField: (fieldId: string, value: any) => void;
}) {
  if (!props.sectionId) return null;

  const section = props.SECTIONS[props.dept]?.[props.sectionId];
  if (!section) return null;

  // Convert your HTML “loadSection/renderSection” logic into React rendering here.
  // The key rule: field IDs must stay identical (so storage + calculations match).

  const questions = section.questions as string[];

  return (
    <div>
      <h2>{section.title}</h2>

      {questions.map((qid: string) => {
        const q = props.QUESTIONS[qid];
        if (!q) return null;

        // Render based on q.type like your HTML
        // Example: input number/text/select/textarea/radio etc.
        return (
          <div key={qid} className="question-card">
            <label>{q.label}</label>

            {q.type === "text" && (
              <input
                id={q.id}
                type="text"
                value={props.values[q.id] ?? ""}
                onChange={(e) => props.onSetField(q.id, e.target.value)}
              />
            )}

            {q.type === "number" && (
              <input
                id={q.id}
                type="number"
                value={props.values[q.id] ?? ""}
                onChange={(e) => props.onSetField(q.id, e.target.value)}
              />
            )}

            {/* Repeat other types exactly as in HTML */}
          </div>
        );
      })}
    </div>
  );
}
