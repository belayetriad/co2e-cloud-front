"use client";

import { generateFinalReport } from "@/components/user/Report";
import {
  FORM_SECTIONS,
  i18n,
  QUESTIONS,
  SECTION_GROUPS,
} from "@/data/auditData";
import { Lang } from "@/data/i18n";
import apiRequest from "@/lib/axios";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Converted from your HTML + inline JS to TSX.
 * - No feature changes (same logic, same DOM ids, same HTML rendering).
 * - Uses `any` for undefined globals (i18n, SECTION_GROUPS, FORM_SECTIONS, QUESTIONS, window.storage, etc.)
 * - Keeps dynamic HTML building via dangerouslySetInnerHTML (so your existing string templates keep working).
 */

declare global {
  interface Window {
    storage?: any; // ✅ per your request
  }
}

export default function CO2ePortalAuditTSX() {
  // ====== "undefined variables" kept as any ======
  // You likely define these elsewhere (or will paste them in the same file).
  // ✅ Include "it" because QUESTIONS uses dept:"it"
  const DEPARTMENTS = [
    "building_facilities",
    "operations_equipment",
    "transportation_logistics",
    "procurement_waste",
    "administrative",
    "it",
  ];

  // ===============================================================
  // ========== CENTRALIZED QUESTION BANK (133 questions) ==========
  // ===============================================================

  // ====== React state mirrors your JS globals ======
  const [currentDept, setCurrentDept] = useState<string>("");
  const [currentSection, setCurrentSection] = useState<string>("");
  const [currentLang, setCurrentLang] = useState<Lang>("en");

  // UI visibility
  const [showLanding, setShowLanding] = useState(true);
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [showDeptBadge, setShowDeptBadge] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);

  // dynamic html strings (sidebar + content)
  const [sidebarHtml, setSidebarHtml] = useState<string>("");
  const [formHtml, setFormHtml] = useState<string>("");

  // company status text
  const [companyInfoStatus, setCompanyInfoStatus] =
    useState<string>("Click to Set");

  // refs for modal inputs (keep IDs too; refs help avoid querySelector where possible)
  const companyModalRef = useRef<HTMLDivElement | null>(null);

  // ✅ AUDIT API INTEGRATION (state/refs)
  const [auditIdByDept, setAuditIdByDept] = useState<Record<string, string>>(
    {}
  );
  const autosaveTimer = useRef<any>(null);

  // ====== helpers (same as your JS) ======
  function t(key: string) {
    if (i18n?.[currentLang]?.[key]) return i18n[currentLang][key];
    if (i18n?.en?.[key]) return i18n.en[key];
    return key;
  }

  function showNotification(message: string) {
    const notif = document.createElement("div");
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 400px;
      font-size: 14px;
      color: #1f2937;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 4000);
  }

  function testStorageAPI() {
    // same logic
    // eslint-disable-next-line no-console
    console.log("=== Testing window.storage API ===");
    // eslint-disable-next-line no-console
    console.log("window.storage available:", !!window.storage);
    if (!window.storage) {
      // eslint-disable-next-line no-console
      console.error(
        "❌ window.storage NOT available - this form will NOT save data!"
      );
      alert(
        "⚠️  Storage API not available. Audits cannot be saved in this environment."
      );
      return false;
    }
    // eslint-disable-next-line no-console
    console.log("✅ window.storage is available");
    // eslint-disable-next-line no-console
    console.log(
      "Methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(window.storage))
    );
    return true;
  }

  // ✅ AUDIT API INTEGRATION (helpers)
  function getCompanyId(): string {
    return String(localStorage.getItem("company_id") || "");
  }

  function collectDeptFormData(): Record<string, any> {
    const data: any = {};
    const fields = document.querySelectorAll(
      "#form_content input, #form_content select, #form_content textarea"
    ) as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

    fields.forEach((el: any) => {
      if (el.id)
        data[el.id] = el.type == "number" ? Number(el.value) : el.value;
    });

    // ✅ collect all multi-select fieldIds (so unselected still becomes [])
    const multiFieldIds = new Set<string>();
    document
      .querySelectorAll("#form_content input.multi-select")
      .forEach((el) => {
        const cb = el as HTMLInputElement;
        const fieldId = cb.getAttribute("data-field");
        if (fieldId) multiFieldIds.add(fieldId);
      });

    // checked boxes -> array by fieldId
    document
      .querySelectorAll("#form_content input.multi-select:checked")
      .forEach((el) => {
        const cb = el as HTMLInputElement;
        const fieldId = cb.getAttribute("data-field");
        if (!fieldId) return;
        if (!Array.isArray(data[fieldId])) data[fieldId] = [];
        data[fieldId].push(cb.value);
      });

    // ✅ ensure unselected multi-selects are still []
    multiFieldIds.forEach((fieldId) => {
      if (!Array.isArray(data[fieldId])) data[fieldId] = [];
    });

    // custom badges text (kept)
    document
      .querySelectorAll('#form_content div[id^="selected_"]')
      .forEach((wrap) => {
        const id = (wrap as HTMLElement).id; // selected_FIELDID
        const fieldId = id.replace("selected_", "");
        const values: string[] = [];
        wrap.querySelectorAll("div").forEach((badge) => {
          const text = (badge as HTMLElement).innerText
            ?.replace("×", "")
            .trim();
          if (text) values.push(text);
        });
        if (values.length) {
          const existing = Array.isArray(data[fieldId]) ? data[fieldId] : [];
          data[fieldId] = Array.from(new Set([...existing, ...values]));
        } else {
          // ✅ if badge container exists but empty, still keep []
          if (!Array.isArray(data[fieldId])) data[fieldId] = [];
        }
      });

    return data;
  }

  function computeCompletionFromData(data: Record<string, any>) {
    const keys = Object.keys(data || {});
    const totalFields = keys.length;

    const filledFields = keys.filter((k) => {
      const v = (data as any)[k];
      if (Array.isArray(v)) return v.length > 0;
      return (
        v !== null &&
        v !== undefined &&
        String(v).trim() !== "" &&
        String(v) !== "0"
      );
    }).length;

    const completionPct =
      totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    return { completionPct, filledFields, totalFields };
  }

  function hydrateDeptForm(data: Record<string, any>) {
    try {
      Object.keys(data || {}).forEach((k) => {
        const v = (data as any)[k];
        const el = document.getElementById(k) as any;

        // primitive fields
        if (el && (typeof v !== "object" || v === null)) {
          el.value = v;
        }
      });

      // restore multi-select arrays
      Object.keys(data || {}).forEach((k) => {
        const v = (data as any)[k];
        if (!Array.isArray(v)) return;

        v.forEach((val: string) => {
          const cb = document.querySelector(
            `#form_content input.multi-select[data-field="${k}"][value="${CSS.escape(
              val
            )}"]`
          ) as HTMLInputElement | null;
          if (cb) cb.checked = true;
        });

        updateMultiSelect(k);
      });

      if (currentSection === "sec_boundary") {
        setTimeout(() => generateCompliantJustification(), 100);
      }
      updateScore();
    } catch (e) {
      console.error("Hydrate failed:", e);
    }
  }

  async function apiFetchAuditByDept(companyId: string, department: string) {
    // ✅ endpoint: GET /audit/by-department?companyId=...&department=...
    const res = await apiRequest.get(`/audit`, {
      params: { companyId, department },
    });
    return res.data;
  }

  async function apiUpsertAudit(payload: Record<string, any>) {
    // ✅ endpoint: POST /audit/upsert
    const res = await apiRequest.post(`/audit`, payload);
    return res.data;
  }

  async function apiFetchAuditSummary(companyId: string) {
    // ✅ endpoint: GET /audit/summary?companyId=...
    const res = await apiRequest.get(`/audit`, {
      params: { companyId },
    });
    return (res.data || []) as Array<{
      _id: string;
      department: string;
      completionPct: number;
      filledFields: number;
      totalFields: number;
      updatedAt?: string;
    }>;
  }

  async function apiDeleteAuditById(auditId: string) {
    // ✅ endpoint: DELETE /audit/:id
    const res = await apiRequest.delete(`/audit/${auditId}`);
    return res.data;
  }

  async function restoreDeptFromAPI() {
    const companyId = getCompanyId();
    if (!companyId || !currentDept) return;

    try {
      const doc = await apiFetchAuditByDept(companyId, currentDept);
      if (!doc || !doc.data) return;

      if (doc._id) {
        setAuditIdByDept((p) => ({ ...p, [currentDept]: String(doc._id) }));
      }

      hydrateDeptForm(doc.data || {});
    } catch (e) {
      // fallback to old restore if you still want
      console.error("API restore failed:", e);
      restoreData(); // fallback (kept same behavior)
    }
  }

  function scheduleDeptAutosave(ms = 800) {
    if (!currentDept) return;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    // autosaveTimer.current = setTimeout(async () => {
    //   const companyId = getCompanyId();
    //   if (!companyId || !currentDept) {
    //     // fallback old autosave if companyId missing
    //     autoSaveAudit().catch(() => {});
    //     return;
    //   }

    //   try {
    //     const data = collectDeptFormData();
    //     const { completionPct, filledFields, totalFields } =
    //       computeCompletionFromData(data);

    //     const doc = await apiUpsertAudit({
    //       companyId,
    //       department: currentDept,
    //       ...data,
    //       completionPct,
    //       filledFields,
    //       totalFields,
    //     });

    //     if (doc?._id) {
    //       setAuditIdByDept((p) => ({ ...p, [currentDept]: String(doc._id) }));
    //     }
    //   } catch (e) {
    //     console.error("Autosave API failed:", e);
    //     // fallback to your storage
    //     autoSaveAudit().catch(() => {});
    //   }
    // }, ms);
  }

  // ====== Sidebar rendering (string same as your JS) ======
  function renderSidebar() {
    const navGroups = SECTION_GROUPS ? Object.keys(SECTION_GROUPS) : [];
    let html = "";

    navGroups.forEach((groupId: string) => {
      const group = SECTION_GROUPS?.[groupId];
      if (!group || !Array.isArray(group.sections)) return;

      // ✅ open group if it contains currentSection
      const groupHasActive =
        !!currentSection && group.sections.includes(currentSection);

      const isOpen = groupHasActive || (!currentSection && groupId === "g1");
      const translatedGroupTitle = t(groupId);

      html += `
      <div class="nav-group">
        <div class="nav-header ${
          isOpen ? "active" : ""
        }" data-toggle-group="${groupId}">
          <span id="nav_${groupId}">${translatedGroupTitle}</span>
          <span>▼</span>
        </div>
        <div class="nav-sublist" id="list_${groupId}" style="${
        isOpen ? "" : "display: none;"
      }">
          ${group.sections
            .map((secId: string) => {
              const translatedSecTitle = t(secId);
              const isActive = secId === currentSection;
              return `<div class="nav-item ${
                isActive ? "active-page" : ""
              }" data-section="${secId}">${translatedSecTitle}</div>`;
            })
            .join("")}
        </div>
      </div>
    `;
    });

    setSidebarHtml(html);
  }

  function toggleNav(groupId: string) {
    const sidebarRoot = document.getElementById("sidebar_nav");
    if (!sidebarRoot) return;

    const safe = CSS.escape(groupId);

    const list = sidebarRoot.querySelector(
      `#list_${safe}`
    ) as HTMLElement | null;
    const header = sidebarRoot.querySelector(
      `[data-toggle-group="${safe}"]`
    ) as HTMLElement | null;

    if (!list || !header) return;

    const isHidden =
      list.style.display === "none" ||
      getComputedStyle(list).display === "none";

    list.style.display = isHidden ? "block" : "none";
    header.classList.toggle("active", isHidden);
  }

  function wireSidebarEvents() {
    const sidebarRoot = document.getElementById("sidebar_nav");
    if (!sidebarRoot) return;

    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Toggle group
      const header = target.closest(
        "[data-toggle-group]"
      ) as HTMLElement | null;
      if (header) {
        const gid = header.getAttribute("data-toggle-group");
        if (gid) toggleNav(gid);
        return;
      }

      // Navigate to section
      const item = target.closest(".nav-item") as HTMLElement | null;
      if (item) {
        const secId = item.getAttribute("data-section");
        if (secId) loadSection(secId);
      }
    };

    // prevent duplicates
    const anyRoot = sidebarRoot as any;
    if (anyRoot.__sidebarClickHandler) {
      sidebarRoot.removeEventListener("click", anyRoot.__sidebarClickHandler);
    }
    anyRoot.__sidebarClickHandler = handler;

    sidebarRoot.addEventListener("click", handler);
  }

  function loadFirstSection() {
    const firstSectionId = SECTION_GROUPS?.g1?.sections?.[0];
    if (!firstSectionId) return;

    setTimeout(() => {
      // ✅ scope to sidebar only
      const firstNavItem = document.querySelector(
        "#sidebar_nav .nav-item"
      ) as HTMLElement | null;

      if (firstNavItem) {
        loadSection(firstSectionId);
        firstNavItem.classList.add("active-page");
      }
    }, 50);
  }

  function openCompanyInfoModal() {
    setCompanyModalOpen(true);
    setTimeout(() => restoreCompanyInfo(), 0);
  }

  function closeCompanyInfoModal() {
    setCompanyModalOpen(false);
  }

  async function saveCompanyInfo() {
    const companyData = {
      name:
        (document.getElementById("company_name") as HTMLInputElement | null)
          ?.value || "",
      address:
        (document.getElementById("company_address") as HTMLInputElement | null)
          ?.value || "",
      city:
        (document.getElementById("company_city") as HTMLInputElement | null)
          ?.value || "",
      postal:
        (document.getElementById("company_postal") as HTMLInputElement | null)
          ?.value || "",
      country:
        (document.getElementById("company_country") as HTMLSelectElement | null)
          ?.value || "",
      contact_name:
        (document.getElementById("contact_name") as HTMLInputElement | null)
          ?.value || "",
      contact_phone:
        (document.getElementById("contact_phone") as HTMLInputElement | null)
          ?.value || "",
      contact_email:
        (document.getElementById("contact_email") as HTMLInputElement | null)
          ?.value || "",
      website:
        (document.getElementById("company_website") as HTMLInputElement | null)
          ?.value || "",
    };

    if (
      !companyData.name ||
      !companyData.address ||
      !companyData.city ||
      !companyData.country ||
      !companyData.contact_name ||
      !companyData.contact_phone ||
      !companyData.contact_email
    ) {
      alert("Please fill in all required fields (marked with *)");
      return;
    }

    const payload = {
      company_name: companyData.name,
      company_address: companyData.address,
      company_city: companyData.city,
      company_postal: companyData.postal,
      company_country: companyData.country,
      contact_name: companyData.contact_name,
      contact_phone: companyData.contact_phone,
      contact_email: companyData.contact_email,
      company_website: companyData.website || undefined,
    };

    await apiRequest
      .post(`/companies`, payload)
      .then((res) => {
        // Keep local storage too (useful for client-side restore)
        localStorage.setItem("company_info", JSON.stringify(res.data));

        setCompanyInfoStatus("✓ Saved: " + res.data.company_name);
        closeCompanyInfoModal();

        // Optional: store backend id if returned
        if (res.data?.["_id"]) {
          localStorage.setItem("company_id", String(res.data?.["_id"]));
        }
      })
      .catch((error) => {
        let msg = `Request failed (${error.status})`;

        const err = error.json();
        msg = err?.message
          ? Array.isArray(err.message)
            ? err.message.join(", ")
            : err.message
          : msg;
        alert(msg || "Failed to save company. Please try again.");
      });
  }

  function restoreCompanyInfo() {
    const saved = localStorage.getItem("company_info");
    if (!saved) return;
    const data = JSON.parse(saved);

    const setVal = (id: string, v: any) => {
      const el = document.getElementById(id) as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
      if (el) (el as any).value = v || "";
    };

    setVal("company_name", data.name);
    setVal("company_address", data.address);
    setVal("company_city", data.city);
    setVal("company_postal", data.postal);
    setVal("company_country", data.country);
    setVal("contact_name", data.contact_name);
    setVal("contact_phone", data.contact_phone);
    setVal("contact_email", data.contact_email);
    setVal("company_website", data.website);
  }

  function backToLanding() {
    setCurrentDept("");
    setCurrentSection("");
    setShowLanding(true);
    setShowAuditForm(false);
    setShowDeptBadge(false);
  }

  function startAudit(dept: string) {
    console.log(dept);

    setCurrentDept(dept);
    setShowLanding(false);
    setShowAuditForm(true);
    setShowDeptBadge(true);

    // Wait for React to paint audit layout, then build sidebar + open first section
    requestAnimationFrame(() => {
      renderSidebar();
      requestAnimationFrame(() => loadFirstSection());
    });
  }

  // ====== Data save/restore (kept same) ======
  async function autoSaveAudit() {
    if (!currentDept) return;

    const data: any = {};
    const fields = document.querySelectorAll(
      "#form_content input, #form_content select, #form_content textarea"
    ) as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

    // eslint-disable-next-line no-console
    console.log(
      "Auto-save: Found",
      fields.length,
      "fields for dept:",
      currentDept
    );

    fields.forEach((el) => {
      if ((el as any).id) data[(el as any).id] = (el as any).value;
    });

    const fieldCount = Object.keys(data).length;
    // eslint-disable-next-line no-console
    console.log("Auto-save: Collected", fieldCount, "fields with data");

    if (fieldCount === 0) {
      // eslint-disable-next-line no-console
      console.warn("Auto-save: No data collected!");
      throw new Error("No data found to save");
    }

    if (!window.storage) throw new Error("window.storage not available");

    const key = `audit_${currentDept}`;
    const value = JSON.stringify(data);
    // eslint-disable-next-line no-console
    console.log(
      "Auto-save: Saving",
      fieldCount,
      "fields to key:",
      key,
      "Size:",
      value.length,
      "bytes"
    );

    await window.storage.set(key, value, false);
    // eslint-disable-next-line no-console
    console.log("Auto-save: Success! Data saved for", currentDept);
  }

  async function restoreData() {
    try {
      const key = `audit_${currentDept}`;
      // eslint-disable-next-line no-console
      console.log("Restore: Attempting to restore from key:", key);

      if (!window.storage) {
        // eslint-disable-next-line no-console
        console.warn("Restore: window.storage not available");
        return;
      }

      const saved = await window.storage.get(key, false);
      if (!saved || !saved.value) {
        // eslint-disable-next-line no-console
        console.log("Restore: No saved data found for", currentDept);
        return;
      }

      // eslint-disable-next-line no-console
      console.log(
        "Restore: Found saved data, size:",
        saved.value.length,
        "bytes"
      );

      const data = JSON.parse(saved.value);
      const keys = Object.keys(data);

      // eslint-disable-next-line no-console
      console.log("Restore: Loaded", keys.length, "fields");

      let restored = 0;
      keys.forEach((k) => {
        const el = document.getElementById(k) as any;
        if (el) {
          el.value = data[k];
          restored++;
        }
      });

      // eslint-disable-next-line no-console
      console.log(
        "Restore: Successfully restored",
        restored,
        "of",
        keys.length,
        "fields"
      );

      if (currentSection === "sec_boundary") {
        setTimeout(() => generateCompliantJustification(), 100);
      }
      updateScore();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("Restore failed:", err);
    }
  }

  async function saveCurrentAudit() {
    if (!currentDept) {
      showNotification("Please select a department first");
      return;
    }

    try {
      await autoSaveAudit();
    } catch (e) {
      // ignore, because you still want "create" API even if local fails
    }

    // ✅ API CREATE ONLY
    const companyId = String(localStorage.getItem("company_id") || "");
    if (!companyId) {
      showNotification("Please save Company Information first");
      return;
    }

    try {
      // collect fields exactly like your autoSaveAudit does (no feature change)
      // const data: any = {};
      // const fields = document.querySelectorAll(
      //   "#form_content input, #form_content select, #form_content textarea"
      // ) as NodeListOf<
      //   HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      // >;

      // fields.forEach((el: any) => {
      //   if (el.id)
      //     data[el.id] = el.type == "number" ? Number(el.value) : el.value;
      // });

      const data = collectDeptFormData();

      // ✅ only create (POST), no upsert/update
      await apiRequest.post(`/audit`, {
        companyId,
        department: currentDept,
        ...data,
      });

      const msg =
        currentLang === "en"
          ? "✅ Audit saved successfully"
          : currentLang === "fr"
          ? "✅ Audit enregistré avec succès"
          : "✅ Auditoría guardada exitosamente";

      showNotification(msg);
    } catch (err) {
      console.error("Create audit failed:", err);

      const errMsg =
        currentLang === "en"
          ? "❌ Save failed"
          : currentLang === "fr"
          ? "❌ Échec de l'enregistrement"
          : "❌ Error al guardar";

      showNotification(errMsg);
    }
  }

  function exportCurrentAudit() {
    if (!currentDept) {
      showNotification("Please select a department first");
      return;
    }
    const message =
      currentLang === "en"
        ? `Export audit for ${currentDept} - Use browser Print to PDF`
        : currentLang === "fr"
        ? `Exporter l'audit pour ${currentDept} - Utilisez Imprimer en PDF`
        : `Exportar auditoría para ${currentDept} - Use Imprimir a PDF`;
    showNotification(message);
  }

  // ====== Section loader (string-based exactly like your JS) ======
  function loadSection(secId: string) {
    setCurrentSection(secId);

    setTimeout(() => renderSidebar(), 0);

    const sec = FORM_SECTIONS?.[secId];
    const containerId = "form_content";

    // update active nav item classes (same)
    document.querySelectorAll("#sidebar_nav .nav-item").forEach((item) => {
      const el = item as HTMLElement;
      if (el.getAttribute("data-section") === secId)
        el.classList.add("active-page");
      else el.classList.remove("active-page");
    });

    const translatedSecTitle = t(secId);

    let html = `
      <div class="section-header">
        <h2>${translatedSecTitle}</h2>
        <p>${sec?.desc ?? ""}</p>
      </div>
    `;

    (sec?.cards || []).forEach((card: any) => {
      const filteredQuestions = (card.questions || []).filter((qId: any) => {
        const q = QUESTIONS?.[qId];
        if (!q) return false;
        if (q.dept && q.dept !== currentDept) return false;
        return true;
      });

      if (filteredQuestions.length === 0) return;

      html += `<div class="card"><h4>${card.title}</h4>`;

      filteredQuestions.forEach((qId: any) => {
        const q = QUESTIONS?.[qId];
        if (!q) return;

        html += `<div class="field">`;
        html += `<label>${q.label}</label>`;

        if (q.type === "select") {
          html += `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f9fafb;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 12px; margin-bottom: 12px;">
                ${(q.options || [])
                  .map(
                    (opt: string) => `
                    <label style="display: flex; align-items: center; cursor: pointer; font-weight: 400; margin: 0; padding: 6px 8px; border-radius: 4px; transition: background 0.2s;">
                      <input type="checkbox" class="multi-select" data-field="${
                        q.id
                      }" value="${opt}" style="width: 18px; height: 18px; cursor: pointer; margin: 0; flex-shrink: 0;">
                      <span style="margin-left: 10px; font-size: 0.9rem; line-height: 1.4;">${String(
                        opt
                      ).replace(/_/g, " ")}</span>
                    </label>
                  `
                  )
                  .join("")}
              </div>
              <div id="selected_${
                q.id
              }" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; min-height: 30px;"></div>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="${q.id}" name="${
            q.id
          }" placeholder="Add custom option" style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem;">
                <button type="button" data-add-custom="${
                  q.id
                }" style="padding: 10px 16px; background: #9333ea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.85rem; white-space: nowrap;">+ Add</button>
              </div>
            </div>
          `;
        } else if (q.type === "textarea") {
          html += `<textarea id="${q.id}" rows="${q.rows || 3}"${
            q.readonly ? " readonly" : ""
          } placeholder="${q.placeholder || ""}"></textarea>`;
        } else {
          const attrs: string[] = [];
          if (q.readonly) attrs.push("readonly");
          if (q.min !== undefined) attrs.push(`min="${q.min}"`);
          if (q.max !== undefined) attrs.push(`max="${q.max}"`);
          if (q.step) attrs.push(`step="${q.step}"`);
          const attrStr = attrs.length ? " " + attrs.join(" ") : "";
          html += `<input type="${q.type}" id="${
            q.id
          }"${attrStr} placeholder="${q.placeholder || ""}">`;
        }

        html += `</div>`;
      });

      html += `</div>`;
    });

    setFormHtml(html);

    // after html injected, restore saved values + attach listeners
    setTimeout(() => {
      wireDynamicEvents(containerId);

      // ✅ AUDIT API INTEGRATION (restore dept from API)
      restoreDeptFromAPI();

      // Keep your IT auto calc trigger exactly
      if (
        currentDept === "it" &&
        (secId === "sec_calc" ||
          secId === "sec_assets" ||
          secId === "sec_hvac" ||
          secId === "sec_utility")
      ) {
        setTimeout(() => calcITEmissions(), 300);
      }
    }, 0);
  }

  useEffect(() => {
    setTimeout(() => {
      wireSidebarEvents(); // sidebar delegation (stable)
      wireDynamicEvents("form_content"); // form inputs only
    }, 0);

    // cleanup sidebar handler on rerender/unmount
    return () => {
      const sidebarRoot = document.getElementById("sidebar_nav") as any;
      if (sidebarRoot?.__sidebarClickHandler) {
        sidebarRoot.removeEventListener(
          "click",
          sidebarRoot.__sidebarClickHandler
        );
        sidebarRoot.__sidebarClickHandler = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarHtml, formHtml]);

  // ====== wire events for injected HTML ======
  function wireDynamicEvents(containerId: string) {
    const root = document.getElementById(containerId);
    if (!root) return;

    // // nav group toggles
    // document.querySelectorAll("[data-toggle-group]").forEach((el) => {
    //   const gid = (el as HTMLElement).getAttribute("data-toggle-group");
    //   (el as HTMLElement).onclick = () => {
    //     if (gid) toggleNav(gid);
    //   };
    // });

    // // nav items
    // document.querySelectorAll(".nav-item").forEach((el) => {
    //   const secId = (el as HTMLElement).getAttribute("data-section");
    //   (el as HTMLElement).onclick = () => {
    //     if (secId) loadSection(secId);
    //   };
    // });

    // inputs change -> updateScore (and any special IT handlers can stay computed by calcITEmissions)
    root
      .querySelectorAll(
        "input:not([readonly]):not(.multi-select), select, textarea"
      )
      .forEach((el) => {
        (el as any).oninput = () => updateScore();
        (el as any).onchange = () => updateScore();
      });

    // multi-select change
    root.querySelectorAll("input.multi-select").forEach((el) => {
      (el as HTMLInputElement).onchange = () => {
        const fieldId = (el as HTMLInputElement).getAttribute("data-field");
        if (fieldId) updateMultiSelect(fieldId);
        updateScore();
      };
    });

    // add custom option buttons
    root.querySelectorAll("[data-add-custom]").forEach((btn) => {
      const fieldId = (btn as HTMLElement).getAttribute("data-add-custom");
      (btn as HTMLElement).onclick = () => {
        if (fieldId) addCustomOption(fieldId);
      };
    });
  }

  // ====== multi select / custom (same) ======
  function addCustomOption(fieldId: string) {
    const input = document.getElementById(
      `${fieldId}`
    ) as HTMLInputElement | null;
    if (!input) return;
    const customValue = input.value.trim();
    if (!customValue) return;

    const container = document.getElementById(`selected_${fieldId}`);
    if (!container) return;

    const badge = document.createElement("div");
    badge.style.cssText =
      "display: flex; align-items: center; gap: 6px; background: #ede9fe; border: 1px solid #d8b4fe; padding: 6px 10px; border-radius: 4px; font-size: 0.85rem; color: #7c3aed;";
    badge.innerHTML = `${customValue} <button type="button" style="background: none; border: none; color: #7c3aed; cursor: pointer; font-weight: 600; font-size: 1rem; padding: 0;">×</button>`;

    const xBtn = badge.querySelector("button") as HTMLButtonElement | null;
    if (xBtn) {
      xBtn.onclick = () => {
        badge.remove();
        updateScore();
      };
    }

    container.appendChild(badge);
    input.value = "";
    updateScore();
  }

  function updateMultiSelect(fieldId: string) {
    const checkboxes = document.querySelectorAll(
      `input.multi-select[data-field="${fieldId}"]:checked`
    ) as NodeListOf<HTMLInputElement>;
    const container = document.getElementById(`selected_${fieldId}`);
    if (!container) return;

    container.innerHTML = "";

    checkboxes.forEach((cb) => {
      const badge = document.createElement("div");
      badge.style.cssText =
        "display: flex; align-items: center; gap: 6px; background: #dcfce7; border: 1px solid #86efac; padding: 6px 10px; border-radius: 4px; font-size: 0.85rem; color: #059669;";
      badge.innerHTML = `${cb.value} <button type="button" style="background: none; border: none; color: #059669; cursor: pointer; font-weight: 600; font-size: 1rem; padding: 0;">×</button>`;

      const xBtn = badge.querySelector("button") as HTMLButtonElement | null;
      if (xBtn) {
        xBtn.onclick = () => {
          const target = document.querySelector(
            `input.multi-select[data-field='${fieldId}'][value='${CSS.escape(
              cb.value
            )}']`
          ) as HTMLInputElement | null;
          if (target) target.checked = false;
          updateMultiSelect(fieldId);
          updateScore();
        };
      }

      container.appendChild(badge);
    });
  }

  // ====== score (same) ======
  function updateScore() {
    const inputs = document.querySelectorAll(
      "#form_content input:not([readonly]):not(.multi-select), #form_content select, #form_content textarea"
    ) as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
    const multiSelects = document.querySelectorAll(
      "#form_content input.multi-select:checked"
    );
    const customBadges = document.querySelectorAll(
      '#form_content div[id^="selected_"] > div'
    );

    let filled = 0;
    inputs.forEach((i: any) => {
      if (i.value && i.value !== "0" && i.value !== "") filled++;
    });

    multiSelects.forEach(() => filled++);
    customBadges.forEach(() => filled++);

    const totalFields =
      inputs.length +
      (document.querySelectorAll("#form_content input.multi-select").length > 0
        ? 1
        : 0);
    const pct = totalFields ? Math.round((filled / totalFields) * 100) : 0;

    const scoreEl = document.getElementById("globalScore");
    if (scoreEl) scoreEl.innerText = pct + "%";

    generateKeyNotes();

    // ✅ AUDIT API INTEGRATION (debounced autosave to API)
    scheduleDeptAutosave(800);
  }

  // ====== notes/justification (same) ======
  function generateKeyNotes() {
    const consolidation =
      (document.getElementById("consolidation") as any)?.value || "";
    const facilities =
      (document.getElementById("facility_count") as any)?.value || "";
    const employees =
      (document.getElementById("total_employees") as any)?.value || "";
    const primaryLocation =
      (document.getElementById("primary_location") as any)?.value || "";
    const notesField = document.getElementById("key_notes") as any;

    if (!notesField) return;

    let notes = "";
    const parts: string[] = [];

    if (consolidation)
      parts.push(
        `Consolidation: ${
          consolidation.charAt(0).toUpperCase() + consolidation.slice(1)
        }`
      );
    if (facilities) parts.push(`Facilities: ${facilities}`);
    if (employees) parts.push(`Employees: ${employees}`);
    if (primaryLocation) parts.push(`Location: ${primaryLocation}`);

    if (parts.length > 0) {
      notes = parts.join(" | ");
      notes += ". Review and adjust these notes as needed for completeness.";
    } else {
      notes =
        "Fill in Consolidation Approach, Facilities, Employees, and Location to auto-generate notes here.";
    }

    notesField.value = notes;
  }

  function generateCompliantJustification() {
    const consolidationSelect = document.getElementById("consolidation") as any;
    const responsibleNameInput = document.getElementById(
      "consolidation_responsible_name"
    ) as any;
    const personRoleInput = document.getElementById(
      "consolidation_person_role"
    ) as any;
    const justificationField = document.getElementById("justification") as any;

    if (
      !consolidationSelect ||
      !responsibleNameInput ||
      !personRoleInput ||
      !justificationField
    )
      return;

    const approach = consolidationSelect.value;
    const name = String(responsibleNameInput.value || "").trim();
    const role = String(personRoleInput.value || "").trim();

    if (!approach || !name || !role) {
      justificationField.value = "";
      return;
    }

    let justificationText = "";

    if (approach === "equity") {
      justificationText = `The organization's designated responsible person, ${name}, acting in the role of ${role}, selected the Equity Share consolidation approach to account for greenhouse gas emissions in proportion to the organization's ownership interests in relevant entities. This approach reflects the organization's share of risks and benefits associated with its equity investments, in accordance with the GHG Protocol Corporate Standard.`;
    } else if (approach === "control") {
      justificationText = `The organization's designated responsible person, ${name}, acting in the role of ${role}, selected the Operational Control consolidation approach to account for greenhouse gas emissions from all entities over which it has operational control, regardless of ownership percentage. This approach aligns with the organization's management structure and operational decision-making authority, in accordance with the GHG Protocol Corporate Standard.`;
    } else if (approach === "financial") {
      justificationText = `The organization's designated responsible person, ${name}, acting in the role of ${role}, selected the Financial Control consolidation approach to account for greenhouse gas emissions from all entities over which it has financial control, typically those in which it has majority ownership or voting rights. This approach reflects the organization's financial consolidation methodology used in corporate accounting and reporting practices.`;
    }

    justificationField.value = justificationText;
    generateKeyNotes();
  }

  // ====== IT calc (same, variables any ok) ======
  function calcITEmissions() {
    if (currentDept !== "it") return;

    const getNum = (id: string, fallback = 0) =>
      parseFloat((document.getElementById(id) as any)?.value) || fallback;
    const getVal = (id: string, fallback = "") =>
      String((document.getElementById(id) as any)?.value || fallback);

    const servers_count = getNum("it_servers_count");
    const servers_watts = getNum("it_servers_watts");
    const servers_hours = getNum("it_servers_hours");

    const desktops_count = getNum("it_desktops_count");
    const desktops_watts = getNum("it_desktops_watts");
    const desktops_hours = getNum("it_desktops_hours");

    const laptops_count = getNum("it_laptops_count");
    const laptops_watts = getNum("it_laptops_watts");
    const laptops_hours = getNum("it_laptops_hours");

    const monitors_count = getNum("it_monitors_count");
    const monitors_watts = getNum("it_monitors_watts");
    const monitors_hours = getNum("it_monitors_hours");

    const network_count = getNum("it_network_count");
    const network_watts = getNum("it_network_watts");
    const network_hours = getNum("it_network_hours");

    const servers_kwh =
      (servers_watts * servers_hours * 365 * servers_count) / 1000;
    const desktops_kwh =
      (desktops_watts * desktops_hours * 365 * desktops_count) / 1000;
    const laptops_kwh =
      (laptops_watts * laptops_hours * 365 * laptops_count) / 1000;
    const monitors_kwh =
      (monitors_watts * monitors_hours * 365 * monitors_count) / 1000;
    const network_kwh =
      (network_watts * network_hours * 365 * network_count) / 1000;

    const total_onprem_kwh =
      servers_kwh + desktops_kwh + laptops_kwh + monitors_kwh + network_kwh;

    let grid_factor = getNum("it_grid_factor", 0.42);
    const renewable_pct = getNum("it_renewable_pct");
    const adjusted_grid_factor = grid_factor * (1 - renewable_pct / 100);

    const onprem_co2e_kg = total_onprem_kwh * adjusted_grid_factor;

    const cloud_provider = getVal("it_cloud_provider", "none") || "none";
    const cloud_compute_hours = getNum("it_cloud_compute_hours");
    const cloud_storage_gb = getNum("it_cloud_storage_gb");
    const cloud_transfer_gb = getNum("it_cloud_transfer_gb");

    const cloud_factors: any = {
      aws: { compute: 0.000063, storage: 0.00000001, transfer: 0.00000225 },
      azure: { compute: 0.000052, storage: 0.00000001, transfer: 0.00000175 },
      gcp: { compute: 0.000039, storage: 0.00000001, transfer: 0.00000125 },
      other: { compute: 0.00006, storage: 0.00000001, transfer: 0.000002 },
      none: { compute: 0, storage: 0, transfer: 0 },
    };

    const cloud_factor = cloud_factors[cloud_provider] || cloud_factors.other;
    const cloud_compute_kwh = cloud_compute_hours * 0.1;
    const cloud_co2e_kg =
      cloud_compute_kwh * adjusted_grid_factor +
      cloud_storage_gb * cloud_factor.storage +
      cloud_transfer_gb * cloud_factor.transfer;

    let cooling_co2e_kg = 0;
    const it_cooling_location = getVal("it_cooling_location", "shared_office");
    const it_cooling_hvac_pct = getNum("it_cooling_hvac_pct");

    if (
      it_cooling_location === "shared_office" ||
      it_cooling_location === "hybrid"
    ) {
      const total_building_kwh = getNum("annual_electricity");
      const hvac_pct_of_building = it_cooling_hvac_pct / 100;
      const it_cooling_kwh = total_building_kwh * hvac_pct_of_building;
      cooling_co2e_kg = it_cooling_kwh * adjusted_grid_factor;
    }

    const security_overhead_pct = 10;
    const security_overhead_co2e =
      (onprem_co2e_kg + cloud_co2e_kg) * (security_overhead_pct / 100);

    let remote_overhead_co2e = 0;
    const it_remote_workforce_pct = getNum("it_remote_workforce_pct");
    const it_remote_overhead_kwh = getNum("it_remote_overhead_kwh");
    if (it_remote_workforce_pct > 0 && it_remote_overhead_kwh > 0) {
      remote_overhead_co2e = it_remote_overhead_kwh * 12 * adjusted_grid_factor;
    }

    const it_is_submetered = getVal("it_is_submetered", "no");
    let allocated_it_kwh = total_onprem_kwh;

    if (it_is_submetered === "yes") {
      const it_actual_kwh = getNum("it_actual_kwh");
      if (it_actual_kwh > 0) allocated_it_kwh = it_actual_kwh * 12;
    } else {
      const it_allocated_pct = getNum("it_allocated_pct");
      const total_building_kwh = getNum("annual_electricity");
      if (total_building_kwh > 0 && it_allocated_pct > 0)
        allocated_it_kwh = total_building_kwh * (it_allocated_pct / 100);
    }

    const total_it_co2e_kg =
      onprem_co2e_kg +
      cloud_co2e_kg +
      cooling_co2e_kg +
      security_overhead_co2e +
      remote_overhead_co2e;
    const total_it_co2e_tons = total_it_co2e_kg / 1000;

    const resultsHtml = `
      <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; margin-top: 20px;">
        <h4 style="color: #047857; margin-bottom: 15px;">📊 IT CO₂ Emissions Results</h4>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #0d9488;">
            <div style="font-size: 0.75rem; color: #047857; font-weight: 800; text-transform: uppercase;">Total Energy (kWh/year)</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #047857;">${allocated_it_kwh.toLocaleString(
              "en-US",
              { maximumFractionDigits: 0 }
            )}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #047857;">
            <div style="font-size: 0.75rem; color: #047857; font-weight: 800; text-transform: uppercase;">Total CO₂e</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #047857;">${total_it_co2e_tons.toFixed(
              2
            )} tons</div>
          </div>
        </div>

        <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 0.9rem; color: #047857;">
          <strong>✓ Centralized Question Bank Status:</strong><br>
          133 questions organized, ${
            Object.keys(QUESTIONS || {}).length
          } questions loaded, department-specific filtering applied
        </div>
      </div>
    `;

    const formContent = document.getElementById("form_content");
    if (!formContent) return;

    let resultsDiv = document.getElementById("it_emissions_results");
    if (!resultsDiv) {
      resultsDiv = document.createElement("div");
      resultsDiv.id = "it_emissions_results";
      formContent.appendChild(resultsDiv);
    }
    resultsDiv.innerHTML = resultsHtml;

    updateScore();
  }

  // ====== audit manager (uses localStorage same as your code) ======
  async function showAuditManager() {
    // ✅ AUDIT API INTEGRATION (manager reads from API summary when possible)
    const companyId = getCompanyId();

    // If no companyId, keep your old localStorage behavior (unchanged)
    if (!companyId) {
      const audits: any[] = [];
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

      departments.forEach((dept) => {
        const saved = localStorage.getItem(`audit_${dept}`);
        if (saved) {
          const data = JSON.parse(saved);
          const filledFields = Object.values(data).filter(
            (v: any) => v && v !== "" && v !== "0"
          ).length;
          const totalFields = Object.keys(data).length;
          const completionPct =
            totalFields > 0
              ? Math.round((filledFields / totalFields) * 100)
              : 0;

          audits.push({
            dept,
            deptLabel:
              dept.charAt(0).toUpperCase() + dept.slice(1).replace(/_/g, " "),
            completion: completionPct,
            fieldsFilled: filledFields,
            totalFields,
            _id: "",
          });
        }
      });

      renderAuditManagerModal(audits);
      return;
    }

    try {
      const list = await apiFetchAuditSummary(companyId);

      const audits = list.map((a) => ({
        dept: a.department,
        deptLabel:
          a.department.charAt(0).toUpperCase() +
          a.department.slice(1).replace(/_/g, " "),
        completion: a.completionPct || 0,
        fieldsFilled: a.filledFields || 0,
        totalFields: a.totalFields || 0,
        _id: a._id,
      }));

      renderAuditManagerModal(audits);
    } catch (e) {
      console.error("Audit manager API failed, fallback to localStorage", e);

      // fallback to your existing localStorage behavior
      const audits: any[] = [];
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

      departments.forEach((dept) => {
        const saved = localStorage.getItem(`audit_${dept}`);
        if (saved) {
          const data = JSON.parse(saved);
          const filledFields = Object.values(data).filter(
            (v: any) => v && v !== "" && v !== "0"
          ).length;
          const totalFields = Object.keys(data).length;
          const completionPct =
            totalFields > 0
              ? Math.round((filledFields / totalFields) * 100)
              : 0;

          audits.push({
            dept,
            deptLabel:
              dept.charAt(0).toUpperCase() + dept.slice(1).replace(/_/g, " "),
            completion: completionPct,
            fieldsFilled: filledFields,
            totalFields,
            _id: "",
          });
        }
      });

      renderAuditManagerModal(audits);
    }
  }

  function renderAuditManagerModal(audits: any[]) {
    const modalHtml = `
      <div id="audit_manager_modal" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; overflow-y: auto;">
        <div style="max-width: 900px; margin: 50px auto; background: white; border-radius: 12px; padding: 40px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <h2>📋 Audit Manager - Saved Audits</h2>
            <button id="close_audit_manager_btn" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: #64748b;">&times;</button>
          </div>

          ${
            audits.length === 0
              ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="color: #92400e; margin: 0;">No audits saved yet. Start an audit by selecting a department.</p>
            </div>
          `
              : `
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #047857; margin: 0;"><strong>${
                audits.length
              }</strong> department audit(s) saved</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
              ${audits
                .map(
                  (audit) => `
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <h4 style="margin: 0 0 8px 0; color: #1f2937;">${
                      audit.deptLabel
                    }</h4>
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b;">
                      <strong>${audit.fieldsFilled}</strong> of <strong>${
                    audit.totalFields
                  }</strong> fields completed
                    </p>
                    <div style="margin-top: 8px; background: #e5e7eb; height: 8px; border-radius: 4px; width: 200px; overflow: hidden;">
                      <div style="background: #10b981; height: 100%; width: ${
                        audit.completion
                      }%;"></div>
                    </div>
                    <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #6b7280;"><strong>${
                      audit.completion
                    }%</strong> complete</p>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button data-resume="${
                      audit.dept
                    }" style="padding: 8px 16px; background: #9333ea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Resume</button>
                    <button data-delete="${audit.dept}" data-audit-id="${
                    audit._id || ""
                  }" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Delete</button>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          `
          }

          <div style="text-align: center; margin-top: 30px;">
            <button id="close_audit_manager_btn2" type="button" style="padding: 10px 30px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Close</button>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById("audit_manager_modal");
    if (existing) existing.remove();

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const close1 = document.getElementById(
      "close_audit_manager_btn"
    ) as HTMLElement | null;
    const close2 = document.getElementById(
      "close_audit_manager_btn2"
    ) as HTMLElement | null;
    close1 && (close1.onclick = closeAuditManager);
    close2 && (close2.onclick = closeAuditManager);

    document.querySelectorAll("[data-resume]").forEach((btn) => {
      const dept = (btn as HTMLElement).getAttribute("data-resume");
      (btn as HTMLElement).onclick = () => {
        if (dept) resumeAudit(dept);
      };
    });

    document.querySelectorAll("[data-delete]").forEach((btn) => {
      const dept = (btn as HTMLElement).getAttribute("data-delete");
      const auditId = (btn as HTMLElement).getAttribute("data-audit-id") || "";
      (btn as HTMLElement).onclick = () => {
        if (dept) deleteAudit(dept, auditId);
      };
    });
  }

  function closeAuditManager() {
    const modal = document.getElementById("audit_manager_modal");
    if (modal) modal.remove();
  }

  function resumeAudit(dept: string) {
    closeAuditManager();
    startAudit(dept);
  }

  // ✅ AUDIT API INTEGRATION (delete uses API if auditId exists)
  async function deleteAudit(dept: string, auditId?: string) {
    if (
      confirm(
        `Are you sure you want to delete the ${dept} audit? This cannot be undone.`
      )
    ) {
      try {
        if (auditId) {
          await apiDeleteAuditById(auditId);
        } else if (auditIdByDept?.[dept]) {
          await apiDeleteAuditById(auditIdByDept[dept]);
        } else {
          // fallback local
          localStorage.removeItem(`audit_${dept}`);
        }

        showAuditManager();
        const msg =
          currentLang === "en"
            ? `✅ ${dept} audit deleted`
            : currentLang === "fr"
            ? `✅ audit ${dept} supprimé`
            : `✅ auditoría ${dept} eliminada`;
        showNotification(msg);
      } catch (e) {
        // fallback local
        localStorage.removeItem(`audit_${dept}`);
        showAuditManager();
        const msg =
          currentLang === "en"
            ? `✅ ${dept} audit deleted`
            : currentLang === "fr"
            ? `✅ audit ${dept} supprimé`
            : `✅ auditoría ${dept} eliminada`;
        showNotification(msg);
      }
    }
  }

  // ====== language switching ======
  function setLang(lang: Lang) {
    setCurrentLang(lang);
    setTimeout(() => {
      renderSidebar();
      if (currentDept && currentSection) loadSection(currentSection);
    }, 0);
  }

  // ====== effects ======
  useEffect(() => {
    setLang("en");
    testStorageAPI();

    // ✅ Attach sidebar click delegation once (works even when innerHTML changes)
    setTimeout(() => wireSidebarEvents(), 0);

    const handler = (event: any) => {
      const modal = companyModalRef.current;
      if (modal && event.target === modal) closeCompanyInfoModal();
    };

    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // whenever dept changes, update dept badge name (same behavior)
  const deptDisplayName = useMemo(() => {
    if (!currentDept) return "-";
    return currentDept.charAt(0).toUpperCase() + currentDept.slice(1);
  }, [currentDept]);

  // whenever sidebar html changes, wire its events
  // useEffect(() => {
  //   setTimeout(() => wireDynamicEvents("form_content"), 0);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [sidebarHtml, formHtml]);

  return (
    <div className="container">
      {/* HEADER */}
      <div className="header">
        <div>
          <h1>
            CO2e<span>Portal</span> Multi-Department Audit System
          </h1>
          <p id="txt_subtitle">
            Professional Edition • ISO 14064 Compatible • Centralized Question
            Bank
          </p>
        </div>

        <div className="header-controls">
          <div
            className={`dept-badge ${showDeptBadge ? "" : "hidden"}`}
            id="current_dept_badge"
          >
            <div className="dept-label">Current Department</div>
            <div className="dept-name" id="current_dept_name">
              {deptDisplayName}
            </div>
          </div>

          <div>
            <button
              className={`lang-btn ${currentLang === "en" ? "active" : ""}`}
              data-lang="en"
              onClick={() => setLang("en")}
            >
              EN
            </button>
            <button
              className={`lang-btn ${currentLang === "fr" ? "active" : ""}`}
              data-lang="fr"
              onClick={() => setLang("fr")}
            >
              FR
            </button>
            <button
              className={`lang-btn ${currentLang === "es" ? "active" : ""}`}
              data-lang="es"
              onClick={() => setLang("es")}
            >
              ES
            </button>
          </div>

          <div className="score-box">
            <div className="score-label" id="txt_scoreLabel">
              Audit Score
            </div>
            <div className="score-val" id="globalScore">
              0%
            </div>
          </div>
        </div>
      </div>

      {/* COMPANY INFO MODAL */}
      {companyModalOpen && (
        <div
          id="company_info_modal"
          ref={companyModalRef}
          style={{
            display: "block",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              maxWidth: 800,
              margin: "50px auto",
              background: "white",
              borderRadius: 12,
              padding: 40,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 30,
              }}
            >
              <h2>Company Information</h2>
              <button
                onClick={closeCompanyInfoModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "2rem",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                &times;
              </button>
            </div>

            <div className="card">
              <h4>Company Details</h4>
              <div className="field">
                <label>Company Name *</label>
                <input
                  type="text"
                  id="company_name"
                  placeholder="e.g., ABC Manufacturing Ltd."
                  required
                />
              </div>
              <div className="field">
                <label>Address *</label>
                <input
                  type="text"
                  id="company_address"
                  placeholder="e.g., 123 Industrial Blvd."
                  required
                />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>City *</label>
                  <input
                    type="text"
                    id="company_city"
                    placeholder="e.g., Montreal"
                    required
                  />
                </div>
                <div className="field">
                  <label>Zip/Postal Code *</label>
                  <input
                    type="text"
                    id="company_postal"
                    placeholder="e.g., H3B 2Y5"
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label>Country *</label>
                <select id="company_country" required>
                  <option value="">-- Select --</option>
                  <option value="Canada">Canada</option>
                  <option value="United States">United States</option>
                  <option value="Mexico">Mexico</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="card">
              <h4>Contact Information</h4>
              <div className="field">
                <label>Contact Name *</label>
                <input
                  type="text"
                  id="contact_name"
                  placeholder="e.g., John Smith"
                  required
                />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    id="contact_phone"
                    placeholder="e.g., +1 514-555-0123"
                    required
                  />
                </div>
                <div className="field">
                  <label>Email *</label>
                  <input
                    type="email"
                    id="contact_email"
                    placeholder="e.g., john.smith@company.com"
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label>Website</label>
                <input
                  type="url"
                  id="company_website"
                  placeholder="e.g., www.company.com"
                />
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 30 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeCompanyInfoModal}
                style={{ marginRight: 10 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveCompanyInfo}
                style={{ padding: "15px 50px" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LANDING SCREEN */}
      <div
        className={`landing-screen ${showLanding ? "" : "hidden"}`}
        id="landing_screen"
      >
        <h2 data-i18n="landing_title">{t("landing_title")}</h2>
        <p data-i18n="landing_subtitle">{t("landing_subtitle")}</p>

        <div className="dept-grid">
          {/* COMPANY INFO CARD */}
          <div
            className="dept-card"
            id="company_info_card"
            onClick={openCompanyInfoModal}
            style={{
              background: "linear-gradient(135deg, #0d9488 10%, #059669 100%)",
              color: "white",
              border: "3px solid #0d9488",
              cursor: "pointer",
            }}
          >
            <div className="dept-icon">🏢</div>
            <h3 style={{ color: "white" }}>Company Information</h3>
            <p
              className="dept-status"
              style={{ color: "#d1fae5", fontWeight: 600 }}
            >
              <span id="company_info_status">{companyInfoStatus}</span>
            </p>
          </div>

          <div
            className="dept-card"
            onClick={() => startAudit("building_facilities")}
          >
            <div className="dept-icon">🏗️</div>
            <h3 data-i18n="dept_building_facilities">Building & Facilities</h3>
            <p className="dept-status" id="status_building_facilities">
              Not Started
            </p>
          </div>

          <div
            className="dept-card"
            onClick={() => startAudit("operations_equipment")}
          >
            <div className="dept-icon">⚙️</div>
            <h3 data-i18n="dept_operations_equipment">
              Operations & Equipment
            </h3>
            <p className="dept-status" id="status_operations_equipment">
              Not Started
            </p>
          </div>

          <div
            className="dept-card"
            onClick={() => startAudit("transportation_logistics")}
          >
            <div className="dept-icon">🚛</div>
            <h3 data-i18n="dept_transportation_logistics">
              Transportation & Logistics
            </h3>
            <p className="dept-status" id="status_transportation_logistics">
              Not Started
            </p>
          </div>

          <div
            className="dept-card"
            onClick={() => startAudit("procurement_waste")}
          >
            <div className="dept-icon">♻️</div>
            <h3 data-i18n="dept_procurement_waste">Procurement & Waste</h3>
            <p className="dept-status" id="status_procurement_waste">
              Not Started
            </p>
          </div>

          <div
            className="dept-card"
            onClick={() => startAudit("administrative")}
          >
            <div className="dept-icon">📋</div>
            <h3 data-i18n="dept_administrative">Administrative</h3>
            <p className="dept-status" id="status_administrative">
              Not Started
            </p>
          </div>
        </div>

        <div className="btn-group" style={{ justifyContent: "center" }}>
          <button
            className="btn btn-success"
            onClick={showAuditManager}
            data-i18n="btn_view_audits"
          >
            📊 View All Audits
          </button>
          <button
            className="btn btn-primary"
            onClick={generateFinalReport}
            data-i18n="btn_final_report"
          >
            📄 Generate Final Report
          </button>
        </div>
      </div>

      {/* MAIN BODY (Audit Form) */}
      <div
        className={`app-body ${showAuditForm ? "" : "hidden"}`}
        id="audit_form"
      >
        {/* SIDEBAR */}
        <div className="sidebar">
          <div style={{ marginBottom: 20 }}>
            <button
              className="btn btn-secondary"
              onClick={backToLanding}
              style={{ width: "100%" }}
              data-i18n="btn_back"
            >
              ← Back to Departments
            </button>
          </div>

          <h3 id="txt_navTitle">Audit Sections</h3>

          {/* Sidebar injected */}
          <div
            id="sidebar_nav"
            dangerouslySetInnerHTML={{ __html: sidebarHtml }}
          />

          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              className="btn btn-success"
              onClick={saveCurrentAudit}
              style={{ width: "100%", marginBottom: 10 }}
              data-i18n="btn_save"
            >
              💾 Save Audit
            </button>
            <button
              className="btn btn-secondary"
              onClick={exportCurrentAudit}
              style={{ width: "100%" }}
              data-i18n="btn_export"
            >
              📥 Export Department Report
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div
          className="main-content"
          id="form_content"
          dangerouslySetInnerHTML={{ __html: formHtml }}
        />
      </div>
    </div>
  );
}
