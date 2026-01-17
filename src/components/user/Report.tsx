export function generateFinalReport() {
  const companyInfo = JSON.parse(localStorage.getItem("company_info") || "{}");
  const auditDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
  const departmentAudits: any[] = [];
  let totalCO2e = 0,
    totalKwh = 0,
    completedDepts = 0;

  departments.forEach((dept) => {
    const saved = localStorage.getItem(`audit_${dept}`);
    if (saved) {
      const data = JSON.parse(saved);
      const filledFields = Object.values(data).filter(
        (v: any) => v && v !== "" && v !== "0"
      ).length;
      const totalFields = Object.keys(data).length;
      const completionPct =
        totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

      const emissions = calculateDepartmentEmissions(dept, data);
      departmentAudits.push({
        dept,
        deptLabel:
          dept.charAt(0).toUpperCase() + dept.slice(1).replace(/_/g, " "),
        completion: completionPct,
        filledFields,
        totalFields,
        co2e_tons: emissions.co2e_tons,
        kwh: emissions.kwh,
        highlights: emissions.highlights,
      });

      totalCO2e += emissions.co2e_tons;
      totalKwh += emissions.kwh;
      if (completionPct > 0) completedDepts++;
    }
  });

  departmentAudits.sort((a, b) => b.completion - a.completion);
  const totalPages = 3 + departmentAudits.length;

  let deptPagesHtml = "";
  departmentAudits.forEach((a, idx) => {
    const pageNum = 4 + idx;
    deptPagesHtml += `<div class="page dept-page"><div class="page-header"><div class="page-number">Page ${pageNum} of ${totalPages}</div></div><div class="page-content"><h2 class="dept-title">${
      a.deptLabel
    }</h2><div class="dept-details"><div class="detail-row"><span class="label">Completion Status:</span><span class="value">${
      a.completion
    }%</span></div><div class="detail-row"><span class="label">Fields Completed:</span><span class="value">${
      a.filledFields
    } of ${
      a.totalFields
    }</span></div></div><div class="metrics-section"><h3>Emissions & Energy Data</h3><div class="metrics-grid"><div class="metric-card"><div class="metric-title">CO₂e Emissions</div><div class="metric-large">${a.co2e_tons.toFixed(
      2
    )}</div><div class="metric-unit">metric tons/year</div></div><div class="metric-card"><div class="metric-title">Annual Energy</div><div class="metric-large">${(
      a.kwh / 1000
    ).toFixed(
      1
    )}</div><div class="metric-unit">MWh/year</div></div></div></div>${
      a.highlights.length > 0
        ? `<div class="highlights-section"><h3>Key Metrics</h3><ul class="highlights-list">${a.highlights
            .map((h: string) => `<li>${h}</li>`)
            .join("")}</ul></div>`
        : ""
    }</div><div class="page-footer"><div class="page-number">Page ${pageNum} of ${totalPages}</div></div></div>`;
  });

  const reportHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>CO2ePortal Audit Report</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}body{font-family:'Segoe UI',sans-serif;color:#1f2937;background:#f5f5f5;line-height:1.6}.page{width:8.5in;height:11in;margin:0.5in auto;padding:0;background:white;box-shadow:0 0 10px rgba(0,0,0,0.1);display:flex;flex-direction:column;page-break-after:always;break-after:page}.page-header{padding:0.5in;border-bottom:2px solid #0d9488}.page-footer{padding:0.5in;border-top:2px solid #0d9488;margin-top:auto;text-align:center;font-size:10px;color:#64748b}.page-content{padding:0.75in;flex:1;overflow:hidden}.page-number{font-size:10px;color:#64748b;text-align:right}.cover-page{background:linear-gradient(180deg,#000000 0%,#0d9488 100%);color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:1in}.cover-title{font-size:48px;font-weight:800;margin-bottom:20px}.cover-subtitle{font-size:24px;opacity:0.9;margin-bottom:10px}.cover-edition{font-size:16px;opacity:0.8;margin:20px 0}.cover-date{font-size:18px;font-weight:600;margin:40px 0}.company-page h2{color:#047857;font-size:28px;margin-bottom:30px;border-bottom:3px solid #0d9488;padding-bottom:15px}.company-section{margin-bottom:40px}.company-section h3{color:#059669;font-size:14px;font-weight:700;text-transform:uppercase;margin-bottom:15px;letter-spacing:1px}.company-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px 30px}.company-item{display:flex;flex-direction:column}.company-label{color:#0d9488;font-weight:700;font-size:11px;text-transform:uppercase;margin-bottom:5px;letter-spacing:0.5px}.company-value{color:#1f2937;font-size:14px;font-weight:500}.exec-page h2{color:#1e40af;font-size:28px;margin-bottom:25px;border-bottom:3px solid #0d9488;padding-bottom:15px}.summary-text{color:#1f2937;font-size:14px;line-height:1.8;margin-bottom:30px}.metrics-summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:30px}.metric-summary-box{background:#eff6ff;border:2px solid #93c5fd;border-radius:8px;padding:20px;text-align:center}.metric-summary-label{color:#1e40af;font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:10px}.metric-summary-value{color:#0d9488;font-size:32px;font-weight:800;line-height:1}.metric-summary-unit{color:#64748b;font-size:11px;margin-top:8px}.findings-section h3{color:#059669;font-size:14px;font-weight:700;text-transform:uppercase;margin:20px 0 15px 0;letter-spacing:0.5px}.findings-list{list-style:none;padding-left:0}.findings-list li{padding-left:25px;margin-bottom:10px;position:relative;color:#1f2937;font-size:13px}.findings-list li:before{content:"→";position:absolute;left:0;color:#0d9488;font-weight:700}.dept-page .page-header{background:#f0fdf4;border-bottom:3px solid #0d9488}.dept-title{color:#047857;font-size:24px;font-weight:800;margin-bottom:25px;border-bottom:2px solid #86efac;padding-bottom:15px}.dept-details{background:#f9fafb;border-left:4px solid #0d9488;padding:15px;margin-bottom:25px;border-radius:4px}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb}.detail-row:last-child{border-bottom:none}.detail-row .label{color:#64748b;font-weight:600;font-size:12px}.detail-row .value{color:#1f2937;font-weight:700;font-size:13px}.metrics-section h3{color:#059669;font-size:14px;font-weight:700;text-transform:uppercase;margin-bottom:15px;letter-spacing:0.5px}.metrics-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:25px}.metric-card{background:#eff6ff;border:2px solid #93c5fd;border-radius:8px;padding:15px;text-align:center}.metric-title{color:#1e40af;font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:8px;letter-spacing:0.5px}.metric-large{color:#0d9488;font-size:28px;font-weight:800}.metric-unit{color:#64748b;font-size:10px;margin-top:5px}.highlights-section h3{color:#059669;font-size:14px;font-weight:700;text-transform:uppercase;margin:20px 0 12px 0;letter-spacing:0.5px}.highlights-list{list-style:none;padding-left:0}.highlights-list li{padding-left:20px;margin-bottom:8px;position:relative;color:#1f2937;font-size:12px}.highlights-list li:before{content:"•";position:absolute;left:0;color:#047857;font-weight:700}.print-button{position:fixed;top:20px;right:20px;padding:12px 24px;background:#0d9488;color:white;border:none;border-radius:6px;font-weight:600;cursor:pointer;z-index:100;font-size:14px}.print-button:hover{background:#059669}@media print{body{background:white;margin:0;padding:0}.page{width:8.5in;height:11in;margin:0;padding:0;box-shadow:none;page-break-after:always;break-after:page}.print-button{display:none}.page-header{padding:0.4in}.page-content{padding:0.6in}.page-footer{padding:0.3in}}</style></head><body><button class="print-button" onclick="window.print()">🖨️ Print / Save as PDF</button><div class="page cover-page"><img src="co2portal01.png" alt="Company Logo" style="width:360px;height:360px;object-fit:contain;border-radius:8px;"><div class="cover-title">CO2e<span style="color:#2dd4bf">Portal</span></div><div class="cover-subtitle">Multi-Department Audit Report</div><div class="cover-edition">Professional Edition • GHG PROTOCOL & ISO 14064 Compatible</div><div class="cover-date">${auditDate}</div><div class="cover-pagenum">1 of ${totalPages}</div></div><div class="page company-page"><div class="page-header"><div class="page-number">Page 2 of ${totalPages}</div></div><div class="page-content"><h2>🏢 Company & Contact Information</h2><div class="company-section"><h3>Company Details</h3><div class="company-grid"><div class="company-item"><div class="company-label">Company Name</div><div class="company-value">${
    companyInfo.name || "Not Provided"
  }</div></div><div class="company-item"><div class="company-label">Address</div><div class="company-value">${
    companyInfo.address || "Not Provided"
  }</div></div><div class="company-item"><div class="company-label">City</div><div class="company-value">${
    companyInfo.city || "Not Provided"
  }</div></div><div class="company-item"><div class="company-label">Postal Code</div><div class="company-value">${
    companyInfo.postal || "Not Provided"
  }</div></div><div class="company-item"><div class="company-label">Country</div><div class="company-value">${
    companyInfo.country || "Not Provided"
  }</div></div><div class="company-item"><div class="company-label">Website</div><div class="company-value">${
    companyInfo.website || "Not Provided"
  }</div></div></div></div><div class="company-section"><h3>Contact Information</h3><div class="company-grid"><div class="company-item"><div class="company-label">Contact Name</div><div class="company-value">${
    companyInfo.contact_name || "Not Provided"
  }</div></div><div class="company-item"><div class="company-label">Phone</div><div class="company-value">${
    companyInfo.contact_phone || "Not Provided"
  }</div></div><div class="company-item" style="grid-column:1/-1"><div class="company-label">Email</div><div class="company-value">${
    companyInfo.contact_email || "Not Provided"
  }</div></div></div></div></div><div class="page-footer"><div class="page-number">Page 2 of ${totalPages}</div></div></div><div class="page exec-page"><div class="page-header"><div class="page-number">Page 3 of ${totalPages}</div></div><div class="page-content"><h2>📋 Executive Summary</h2><p class="summary-text">This comprehensive multi-department audit report presents a detailed analysis of carbon emissions and energy consumption across your organization. The report captures data from ${completedDepts} department(s) and provides actionable insights for emissions reduction and sustainability improvements aligned with ISO 14064 standards.</p><div class="metrics-summary"><div class="metric-summary-box"><div class="metric-summary-label">Total CO₂e Emissions</div><div class="metric-summary-value">${totalCO2e.toFixed(
    2
  )}</div><div class="metric-summary-unit">metric tons/year</div></div><div class="metric-summary-box"><div class="metric-summary-label">Total Energy Consumption</div><div class="metric-summary-value">${(
    totalKwh / 1000
  ).toFixed(
    1
  )}</div><div class="metric-summary-unit">MWh/year</div></div><div class="metric-summary-box"><div class="metric-summary-label">Audit Coverage</div><div class="metric-summary-value">${completedDepts}</div><div class="metric-summary-unit">of ${
    departments.length
  } departments</div></div></div><div class="findings-section"><h3>Key Findings</h3><ul class="findings-list"><li>Total organizational carbon footprint is <strong>${totalCO2e.toFixed(
    2
  )} metric tons CO₂e per year</strong></li><li><strong>${completedDepts} department${
    completedDepts !== 1 ? "s have" : " has"
  }</strong> completed audit assessment</li><li>Energy consumption totals <strong>${(
    totalKwh / 1000
  ).toFixed(
    1
  )} MWh annually</strong></li><li>Department-specific emissions profiles detailed in subsequent sections</li><li>Recommendations for each department included in respective audit sections</li></ul></div></div><div class="page-footer"><div class="page-number">Page 3 of ${totalPages}</div></div></div>${deptPagesHtml}</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(reportHtml);
  w.document.close();
}

export function calculateDepartmentEmissions(dept: string, data: any) {
  let co2e_tons = 0,
    kwh = 0;
  const highlights: string[] = [];

  if (dept === "office" || dept === "warehouse" || dept === "manufacturing") {
    const elec = parseFloat(data.annual_electricity) || 0;
    const gas = parseFloat(data.annual_natural_gas) || 0;
    kwh = elec;
    co2e_tons = (elec * 0.42 + gas * 2.04) / 1000;
    if (elec > 0)
      highlights.push(`${elec.toLocaleString()} kWh annual electricity`);
    if (gas > 0)
      highlights.push(`${gas.toLocaleString()} m³ natural gas annually`);
  }

  if (dept === "it") {
    const sc = parseFloat(data.it_servers_count) || 0;
    const sw = parseFloat(data.it_servers_watts) || 0;
    const sh = parseFloat(data.it_servers_hours) || 0;
    const dc = parseFloat(data.it_desktops_count) || 0;
    const dw = parseFloat(data.it_desktops_watts) || 0;
    const dh = parseFloat(data.it_desktops_hours) || 0;
    const gf = parseFloat(data.it_grid_factor) || 0.42;
    const rp = parseFloat(data.it_renewable_pct) || 0;
    const af = gf * (1 - rp / 100);

    const skwh = (sw * sh * 365 * sc) / 1000;
    const dkwh = (dw * dh * 365 * dc) / 1000;
    kwh = skwh + dkwh;
    co2e_tons = (kwh * af) / 1000;

    if (sc > 0)
      highlights.push(
        `${sc} servers consuming ${(skwh / 1000).toFixed(1)} MWh/year`
      );
    if (dc > 0)
      highlights.push(
        `${dc} desktops consuming ${(dkwh / 1000).toFixed(1)} MWh/year`
      );
  }

  if (!highlights.length && data.annual_electricity) {
    const elec = parseFloat(data.annual_electricity) || 0;
    kwh = elec;
    co2e_tons = (elec * 0.42) / 1000;
    if (elec > 0)
      highlights.push(`${elec.toLocaleString()} kWh annual consumption`);
  }

  return {
    co2e_tons: Math.max(co2e_tons, 0),
    kwh: Math.max(kwh, 0),
    highlights,
  };
}
