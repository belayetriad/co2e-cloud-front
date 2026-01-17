// src/components/CompanyInfoModal.tsx
"use client";

import { useEffect, useState } from "react";

type CompanyInfo = {
  name?: string;
  address?: string;
  city?: string;
  postal?: string;
  country?: string;
  website?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
};

export default function CompanyInfoModal(props: {
  open: boolean;
  onClose: () => void;
  value: CompanyInfo;
  onSave: (v: CompanyInfo) => void;
}) {
  const [draft, setDraft] = useState<CompanyInfo>({});

  useEffect(() => {
    setDraft(props.value ?? {});
  }, [props.value, props.open]);

  if (!props.open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>🏢 Company & Contact Information</h2>

        <div className="grid">
          <input
            placeholder="Company Name"
            value={draft.name ?? ""}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            placeholder="Address"
            value={draft.address ?? ""}
            onChange={(e) =>
              setDraft((p) => ({ ...p, address: e.target.value }))
            }
          />
          <input
            placeholder="City"
            value={draft.city ?? ""}
            onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))}
          />
          <input
            placeholder="Postal Code"
            value={draft.postal ?? ""}
            onChange={(e) =>
              setDraft((p) => ({ ...p, postal: e.target.value }))
            }
          />
          <input
            placeholder="Country"
            value={draft.country ?? ""}
            onChange={(e) =>
              setDraft((p) => ({ ...p, country: e.target.value }))
            }
          />
          <input
            placeholder="Website"
            value={draft.website ?? ""}
            onChange={(e) =>
              setDraft((p) => ({ ...p, website: e.target.value }))
            }
          />

          <input
            placeholder="Contact Name"
            value={draft.contact_name ?? ""}
            onChange={(e) =>
              setDraft((p) => ({ ...p, contact_name: e.target.value }))
            }
          />
          <input
            placeholder="Phone"
            value={draft.contact_phone ?? ""}
            onChange={(e) =>
              setDraft((p) => ({ ...p, contact_phone: e.target.value }))
            }
          />
          <input
            placeholder="Email"
            value={draft.contact_email ?? ""}
            onChange={(e) =>
              setDraft((p) => ({ ...p, contact_email: e.target.value }))
            }
          />
        </div>

        <div className="actions">
          <button onClick={props.onClose}>Cancel</button>
          <button onClick={() => props.onSave(draft)}>Save</button>
        </div>
      </div>
    </div>
  );
}
