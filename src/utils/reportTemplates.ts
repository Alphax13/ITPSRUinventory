// src/utils/reportTemplates.ts
// เวอร์ชันพิธีการมาก (Official) พร้อมตราสถาบัน ชุดสไตล์สำหรับงานราชการไทย

/* ====================== ค่าคงที่ / Utilities ====================== */

/** URL ตราสถาบัน (PNG หรือ SVG) */
export const EMBLEM_URL =
  'https://sdd.psru.ac.th/wp-content/uploads/2025/06/image-1.png';

/** วันที่ไทยแบบราชการ (พ.ศ.) */
export function formatThaiDate(input?: string | number | Date): string {
  const d = input ? new Date(input) : new Date();
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** วันที่+เวลาไทยแบบราชการ (พ.ศ.) */
export function formatThaiDateTime(input?: string | number | Date): string {
  const d = input ? new Date(input) : new Date();
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** สีสถานะ (โทนสุภาพ เหมาะกับเอกสารราชการ) */
function getStatusColor(status: string): string {
  switch (status) {
    case 'หมด':
      return '#B91C1C'; // แดงสุภาพ
    case 'สต็อกต่ำ':
      return '#92400E'; // น้ำตาลส้มสุภาพ
    case 'ปกติ':
      return '#166534'; // เขียวสุภาพ
    default:
      return '#334155'; // เทาเข้ม
  }
}
function getStatusBgColor(status: string): string {
  switch (status) {
    case 'หมด':
      return '#FEE2E2';
    case 'สต็อกต่ำ':
      return '#FEF3C7';
    case 'ปกติ':
      return '#DCFCE7';
    default:
      return '#F1F5F9';
  }
}
function getRequestStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return '#92400E';
    case 'APPROVED':
      return '#166534';
    case 'REJECTED':
      return '#B91C1C';
    default:
      return '#334155';
  }
}
function getStatusTextThai(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'รอพิจารณา';
    case 'APPROVED':
      return 'อนุมัติ';
    case 'REJECTED':
      return 'ไม่อนุมัติ';
    default:
      return status;
  }
}

/* ====================== ส่วนหัวเอกสารแบบพิธีการมาก ====================== */

type OfficialHeaderOpts = {
  title: string;
  orgLines: string[]; // เช่น ['สาขาวิชาเทคโนโลยีสารสนเทศ','มหาวิทยาลัยราชภัฏพิบูลสงคราม']
  emblemUrl: string; // PNG/SVG/หรือ data URI
  docMeta?: string; // บรรทัดเมตา เช่น ช่วงรายงาน / พิมพ์เมื่อ
  monochrome?: boolean; // ขาวดำเพื่อการพิมพ์จำนวนมาก
  emblemWidthMM?: number; // ขนาดตรา (มม.) เริ่มต้น 28
};

/** สร้าง HTML ส่วนหัวทางการพร้อมตราสถาบันกึ่งกลาง */
export function buildOfficialHeaderHTML(opts: OfficialHeaderOpts): string {
  const {
    title,
    orgLines,
    emblemUrl,
    docMeta,
    monochrome = false,
    emblemWidthMM = 28,
  } = opts;

  const style = `
    <style>
      .official-header { text-align:center; margin-top:2mm; margin-bottom:10mm; }
      .official-emblem {
        width:${emblemWidthMM}mm; height:auto; display:block; margin:0 auto 6mm auto;
        ${monochrome ? 'filter:grayscale(100%);' : ''}
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .official-title { font-size:22px; font-weight:700; letter-spacing:.2px; margin-bottom:2mm; }
      .official-org { color:#374151; line-height:1.35; }
      .official-meta { margin-top:3mm; color:#4B5563; font-size:13.5px; }
      .official-divider { margin-top:5mm; border-bottom:1.5px solid #1F2937; }
    </style>
  `;
  const orgHTML = orgLines.map((l) => `<div>${l}</div>`).join('');

  return `
    ${style}
    <div class="official-header">
      <img class="official-emblem" src="${emblemUrl}" alt="ตราสถาบัน" />
      <div class="official-title">${title}</div>
      <div class="official-org">${orgHTML}</div>
      ${docMeta ? `<div class="official-meta">${docMeta}</div>` : ''}
      <div class="official-divider"></div>
    </div>
  `;
}

/* ====================== 1) รายงานสต็อกวัสดุ ====================== */

export function generateStockReportHTML(data: any[]): string {
  const printedAt = formatThaiDateTime();

  const rows = data
    .map(
      (item, index) => `
    <tr>
      <td class="t-center">${index + 1}</td>
      <td>${item.name}</td>
      <td class="t-center">${item.category}</td>
      <td class="t-center">${item.currentStock}</td>
      <td class="t-center">${item.minStock}</td>
      <td class="t-center">${item.unit}</td>
      <td class="t-center">${item.location || '-'}</td>
      <td class="t-center">
        <span class="chip" style="
          color:${getStatusColor(item.status)};
          background:${getStatusBgColor(item.status)};
          border:1px solid #CBD5E1;">
          ${item.status}
        </span>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<title>รายงานสต็อกวัสดุ</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'TH Sarabun New','Sarabun',system-ui,-apple-system,'Segoe UI',sans-serif;
    font-size: 14.5px; color:#111827; line-height:1.55;
  }
  .summary {
    border:1px solid #E5E7EB; background:#F9FAFB; padding:10px 12px; margin:14px 0; display:flex; justify-content:space-between;
  }
  .summary .value { font-weight:700; }
  table { width:100%; border-collapse:collapse; }
  thead th {
    border:1px solid #D1D5DB; background:#F3F4F6;
    padding:8px; font-weight:700; text-align:center;
  }
  tbody td { border:1px solid #E5E7EB; padding:7px 8px; vertical-align:top; }
  .t-center { text-align:center; }
  .chip { display:inline-block; padding:2px 8px; border-radius:4px; font-weight:600; }
  .signatures { margin-top:18mm; display:flex; gap:14mm; page-break-inside: avoid; }
  .sig-box { flex:1; text-align:center; }
  .sig-line { margin:26mm 6mm 4mm; border-top:1px solid #111827; }
  .sig-label { color:#374151; }
  .foot { margin-top:10mm; color:#6B7280; font-size:12.5px; text-align:center; }
</style>
</head>
<body>

  ${buildOfficialHeaderHTML({
    title: 'รายงานสต็อกวัสดุสิ้นเปลือง',
    orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
    emblemUrl: EMBLEM_URL,
    docMeta: `พิมพ์เมื่อ: ${printedAt}`,
    monochrome: false
  })}

  <div class="summary">
    <div><strong>จำนวนรายการทั้งหมด</strong></div>
    <div class="value">${data.length} รายการ</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:52px;">ลำดับ</th>
        <th>ชื่อวัสดุ</th>
        <th style="width:140px;">หมวดหมู่</th>
        <th style="width:90px;">คงเหลือ</th>
        <th style="width:90px;">ขั้นต่ำ</th>
        <th style="width:80px;">หน่วย</th>
        <th style="width:130px;">ตำแหน่งจัดเก็บ</th>
        <th style="width:110px;">สถานะ</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">ผู้จัดทำ (ลงชื่อ)</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">ผู้ตรวจสอบ</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">ผู้อนุมัติ</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
  </div>

  <div class="foot">ระบบจัดการครุภัณฑ์และวัสดุสิ้นเปลือง – สาขาวิชาเทคโนโลยีสารสนเทศ</div>
</body>
</html>
  `;
}

/* ====================== 2) รายงานการเบิก-จ่าย ====================== */

export function generateTransactionReportHTML(
  data: any[],
  startDate: string,
  endDate: string
): string {
  const printedAt = formatThaiDateTime();

  const rows = data
    .map(
      (item, index) => `
    <tr>
      <td class="t-center">${index + 1}</td>
      <td class="t-center">${formatThaiDate(item.date)}</td>
      <td>${item.materialName}</td>
      <td class="t-center">
        <span class="chip" style="
          color:${item.type === 'IN' ? '#166534' : '#B91C1C'};
          background:${item.type === 'IN' ? '#DCFCE7' : '#FEE2E2'};
          border:1px solid #CBD5E1;">
          ${item.type === 'IN' ? 'นำเข้า' : 'เบิกจ่าย'}
        </span>
      </td>
      <td class="t-center">${item.quantity}</td>
      <td class="t-center">${item.unit}</td>
      <td>${item.userName}</td>
      <td>${item.department || '-'}</td>
      <td>${item.note || '-'}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<title>รายงานการเบิก-จ่ายวัสดุ</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 18mm; }
  body {
    font-family: 'TH Sarabun New','Sarabun',system-ui,-apple-system,'Segoe UI',sans-serif;
    font-size: 14.5px; color:#111827; line-height:1.55;
  }
  .summary { border:1px solid #E5E7EB; background:#F9FAFB; padding:10px 12px; margin:14px 0; display:flex; justify-content:space-between; }
  .summary .value { font-weight:700; }
  table { width:100%; border-collapse:collapse; }
  thead th { border:1px solid #D1D5DB; background:#F3F4F6; padding:8px; text-align:center; font-weight:700; }
  tbody td { border:1px solid #E5E7EB; padding:7px 8px; vertical-align:top; }
  .t-center { text-align:center; }
  .chip { display:inline-block; padding:2px 8px; border-radius:4px; font-weight:600; }
  .signatures { margin-top:18mm; display:flex; gap:14mm; page-break-inside: avoid; }
  .sig-box { flex:1; text-align:center; }
  .sig-line { margin:26mm 6mm 4mm; border-top:1px solid #111827; }
  .sig-label { color:#374151; }
  .foot { margin-top:10mm; color:#6B7280; font-size:12.5px; text-align:center; }
</style>
</head>
<body>

  ${buildOfficialHeaderHTML({
    title: 'รายงานการเบิก-จ่ายวัสดุสิ้นเปลือง',
    orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
    emblemUrl: EMBLEM_URL,
    docMeta: `ช่วงรายงาน: ${formatThaiDate(startDate)} – ${formatThaiDate(
      endDate
    )} | พิมพ์เมื่อ: ${printedAt}`,
    monochrome: false
  })}

  <div class="summary">
    <div><strong>จำนวนรายการทั้งหมด</strong></div>
    <div class="value">${data.length} รายการ</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:48px;">ลำดับ</th>
        <th style="width:96px;">วันที่</th>
        <th>รายการวัสดุ</th>
        <th style="width:90px;">ประเภท</th>
        <th style="width:80px;">จำนวน</th>
        <th style="width:80px;">หน่วย</th>
        <th style="width:140px;">ผู้ทำรายการ</th>
        <th style="width:140px;">หน่วยงาน</th>
        <th style="width:180px;">หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">ผู้จัดทำ</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">ผู้ตรวจสอบ</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">ผู้อนุมัติ</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
  </div>

  <div class="foot">ระบบจัดการครุภัณฑ์และวัสดุสิ้นเปลือง – สาขาวิชาเทคโนโลยีสารสนเทศ</div>
</body>
</html>
  `;
}

/* ====================== 3) รายงานคำขอซื้อ ====================== */

export function generatePurchaseRequestReportHTML(data: any[]): string {
  const printedAt = formatThaiDateTime();

  const rows = data
    .map((item, index) => {
      let items: any[] = [];
      try {
        items = JSON.parse(item.items);
      } catch {
        items = [];
      }
      const itemsList = (items || [])
        .map((i: any) => `${i?.name || 'ไม่ระบุ'} (${i?.quantity || 0} ${i?.unit || ''})`)
        .join(', ');

      return `
      <tr>
        <td class="t-center">${index + 1}</td>
        <td class="t-center">${formatThaiDate(item.requestDate)}</td>
        <td>${item.requesterName}</td>
        <td>${item.department || '-'}</td>
        <td>${itemsList || '-'}</td>
        <td>${item.reason || '-'}</td>
        <td class="t-center">
          <span class="chip" style="
            color:${getRequestStatusColor(item.status)};
            background:#F3F4F6; border:1px solid #CBD5E1;">
            ${getStatusTextThai(item.status)}
          </span>
        </td>
      </tr>
    `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<title>รายงานคำขอซื้อวัสดุ</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 18mm; }
  body {
    font-family: 'TH Sarabun New','Sarabun',system-ui,-apple-system,'Segoe UI',sans-serif;
    font-size: 14.5px; color:#111827; line-height:1.55;
  }
  .summary { border:1px solid #E5E7EB; background:#F9FAFB; padding:10px 12px; margin:14px 0; display:flex; justify-content:space-between; }
  .summary .value { font-weight:700; }
  table { width:100%; border-collapse:collapse; }
  thead th { border:1px solid #D1D5DB; background:#F3F4F6; padding:8px; text-align:center; font-weight:700; }
  tbody td { border:1px solid #E5E7EB; padding:7px 8px; vertical-align:top; }
  .t-center { text-align:center; }
  .chip { display:inline-block; padding:2px 8px; border-radius:4px; font-weight:600; }
  .signatures { margin-top:18mm; display:flex; gap:14mm; page-break-inside: avoid; }
  .sig-box { flex:1; text-align:center; }
  .sig-line { margin:26mm 6mm 4mm; border-top:1px solid #111827; }
  .sig-label { color:#374151; }
  .foot { margin-top:10mm; color:#6B7280; font-size:12.5px; text-align:center; }
</style>
</head>
<body>

  ${buildOfficialHeaderHTML({
    title: 'รายงานคำขอซื้อวัสดุ',
    orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
    emblemUrl: EMBLEM_URL,
    docMeta: `พิมพ์เมื่อ: ${printedAt}`,
    monochrome: false
  })}

  <div class="summary">
    <div><strong>จำนวนคำขอทั้งหมด</strong></div>
    <div class="value">${data.length} รายการ</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:48px;">ลำดับ</th>
        <th style="width:96px;">วันที่ขอ</th>
        <th style="width:140px;">ผู้ขอ</th>
        <th style="width:140px;">หน่วยงาน</th>
        <th>รายการที่ขอซื้อ</th>
        <th style="width:180px;">เหตุผล</th>
        <th style="width:96px;">สถานะ</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">ผู้จัดทำรายงาน</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">หัวหน้างานพัสดุ</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">ผู้มีอำนาจอนุมัติ</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
  </div>

  <div class="foot">ระบบจัดการครุภัณฑ์และวัสดุสิ้นเปลือง – สาขาวิชาเทคโนโลยีสารสนเทศ</div>
</body>
</html>
  `;
}

/* ====================== 4) แบบฟอร์มยืม-คืนครุภัณฑ์ ====================== */

export function generateBorrowFormHTML(data: {
  borrowId: string;
  assetNumber: string;
  assetName: string;
  borrower: string;
  department: string;
  purpose: string;
  borrowDate: string;
  expectedReturnDate: string;
  condition: string; // 'GOOD' | 'BROKEN' ฯลฯ
  note?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<title>แบบฟอร์มยืม-คืนครุภัณฑ์</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 18mm; }
  body {
    font-family: 'TH Sarabun New','Sarabun',system-ui,-apple-system,'Segoe UI',sans-serif;
    font-size: 15px; color:#111827; line-height:1.6;
  }
  .section { border:1px solid #E5E7EB; background:#FFFFFF; padding:12px 14px; border-radius:4px; margin-top:12px; }
  .sec-title { font-weight:700; margin-bottom:8px; }
  .row { display:flex; gap:12px; margin-bottom:6px; }
  .label { min-width:160px; color:#374151; }
  .value { flex:1; border-bottom:1px dotted #CBD5E1; padding-bottom:2px; }
  .return-card { margin-top:16px; border:1px dashed #9CA3AF; padding:12px; border-radius:4px; page-break-inside: avoid; }
  .signatures { margin-top:18mm; display:flex; gap:14mm; }
  .sig-box { flex:1; text-align:center; }
  .sig-line { margin:26mm 6mm 4mm; border-top:1px solid #111827; }
  .sig-label { color:#374151; }
</style>
</head>
<body>

  ${buildOfficialHeaderHTML({
    title: 'แบบฟอร์มยืม-คืนครุภัณฑ์',
    orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
    emblemUrl: EMBLEM_URL,
    monochrome: true
  })}

  <div class="section">
    <div class="sec-title">ข้อมูลการยืม</div>
    <div class="row"><div class="label">เลขที่ใบยืม:</div><div class="value">${data.borrowId}</div></div>
    <div class="row"><div class="label">วันที่ยืม:</div><div class="value">${formatThaiDate(data.borrowDate)}</div></div>
    <div class="row"><div class="label">กำหนดคืน:</div><div class="value">${formatThaiDate(data.expectedReturnDate)}</div></div>
  </div>

  <div class="section">
    <div class="sec-title">ข้อมูลผู้ยืม</div>
    <div class="row"><div class="label">ชื่อผู้ยืม:</div><div class="value">${data.borrower}</div></div>
    <div class="row"><div class="label">หน่วยงาน/ภาควิชา:</div><div class="value">${data.department}</div></div>
    <div class="row"><div class="label">วัตถุประสงค์:</div><div class="value">${data.purpose}</div></div>
  </div>

  <div class="section">
    <div class="sec-title">ข้อมูลครุภัณฑ์</div>
    <div class="row"><div class="label">หมายเลขครุภัณฑ์:</div><div class="value"><strong>${data.assetNumber}</strong></div></div>
    <div class="row"><div class="label">ชื่อครุภัณฑ์:</div><div class="value">${data.assetName}</div></div>
    <div class="row"><div class="label">สภาพขณะยืม:</div><div class="value">${data.condition === 'GOOD' ? 'ปกติ' : 'ชำรุด'}</div></div>
    ${data.note ? `<div class="row"><div class="label">หมายเหตุ:</div><div class="value">${data.note}</div></div>` : ''}
  </div>

  <div class="section return-card">
    <div class="sec-title">บันทึกการคืนครุภัณฑ์</div>
    <div class="row"><div class="label">วันที่คืนจริง:</div><div class="value">&nbsp;</div></div>
    <div class="row"><div class="label">สภาพขณะคืน:</div><div class="value">&nbsp;</div></div>
    <div class="row"><div class="label">หมายเหตุ:</div><div class="value">&nbsp;</div></div>
    <div class="row" style="margin-top:10mm; justify-content:flex-end;"><div class="label">ผู้รับคืน:</div><div class="value" style="max-width:220px;">&nbsp;</div></div>
    <div class="row" style="justify-content:flex-end;"><div class="label">วันที่:</div><div class="value" style="max-width:220px;">&nbsp;</div></div>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">ผู้ยืม (ลงชื่อ) (${data.borrower})</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">เจ้าหน้าที่ผู้อนุมัติ</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
  </div>
</body>
</html>
  `;
}

/* ====================== 5) ใบเบิกวัสดุสิ้นเปลือง ====================== */

export function generateWithdrawFormHTML(data: {
  transactionId: string;
  withdrawDate: string;
  requester: string;
  department: string;
  items: Array<{
    materialName: string;
    quantity: number;
    unit: string;
  }>;
  note?: string;
  purpose?: string;
}): string {
  const itemRows = data.items
    .map(
      (item, index) => `
    <tr>
      <td class="t-center">${index + 1}</td>
      <td>${item.materialName}</td>
      <td class="t-center">${item.quantity}</td>
      <td class="t-center">${item.unit}</td>
      <td></td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<title>ใบเบิกวัสดุสิ้นเปลือง</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 18mm; }
  body {
    font-family: 'TH Sarabun New','Sarabun',system-ui,-apple-system,'Segoe UI',sans-serif;
    font-size: 15px; color:#111827; line-height:1.6;
  }
  .section { border:1px solid #E5E7EB; background:#FFFFFF; padding:12px 14px; border-radius:4px; margin-top:12px; }
  .row { display:flex; gap:12px; margin-bottom:6px; }
  .label { min-width:150px; color:#374151; }
  .value { flex:1; border-bottom:1px dotted #CBD5E1; padding-bottom:2px; }
  table { width:100%; border-collapse:collapse; margin-top:10px; }
  thead th { border:1px solid #D1D5DB; background:#F3F4F6; padding:8px; text-align:center; font-weight:700; }
  tbody td { border:1px solid #E5E7EB; padding:7px 8px; vertical-align:top; }
  .t-center { text-align:center; }
  .signatures { margin-top:18mm; display:flex; gap:14mm; }
  .sig-box { flex:1; text-align:center; border:1px solid #E5E7EB; padding:12px; border-radius:4px; }
  .sig-line { margin:22mm 6mm 4mm; border-top:1px solid #111827; }
  .sig-title { font-weight:700; margin-bottom:6px; color:#1F2937; }
  .sig-label { color:#374151; }
</style>
</head>
<body>

  ${buildOfficialHeaderHTML({
    title: 'ใบเบิกวัสดุสิ้นเปลือง',
    orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
    emblemUrl: EMBLEM_URL,
    monochrome: true
  })}

  <div class="section">
    <div class="row"><div class="label">เลขที่เอกสาร:</div><div class="value">${data.transactionId}</div></div>
    <div class="row"><div class="label">วันที่เบิก:</div><div class="value">${formatThaiDate(data.withdrawDate)}</div></div>
    <div class="row"><div class="label">ชื่อผู้เบิก:</div><div class="value"><strong>${data.requester}</strong></div></div>
    <div class="row"><div class="label">หน่วยงาน/ภาควิชา:</div><div class="value">${data.department}</div></div>
    ${data.purpose ? `<div class="row"><div class="label">วัตถุประสงค์:</div><div class="value">${data.purpose}</div></div>` : ''}
    ${data.note ? `<div class="row"><div class="label">หมายเหตุ:</div><div class="value">${data.note}</div></div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:60px;">ลำดับ</th>
        <th>รายการวัสดุ</th>
        <th style="width:100px;">จำนวน</th>
        <th style="width:90px;">หน่วย</th>
        <th style="width:170px;">หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-title">ผู้เบิก (ผู้รับของ)</div>
      <div class="sig-line"></div>
      <div class="sig-label">(${data.requester})</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">เจ้าหน้าที่ (ผู้จ่ายของ)</div>
      <div class="sig-line"></div>
      <div class="sig-label">(ลงชื่อ)</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">ผู้อนุมัติ</div>
      <div class="sig-line"></div>
      <div class="sig-label">(ลงชื่อ)</div>
      <div class="sig-label">วันที่ ________/________/________</div>
    </div>
  </div>
</body>
</html>
  `;
}
