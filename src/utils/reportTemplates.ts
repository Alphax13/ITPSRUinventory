// src/utils/reportTemplates.ts
// Templates สำหรับเอกสารราชการของมหาวิทยาลัย

/* ====================== ค่าคงที่ / Types / Utilities ====================== */

/** URL ตรามหาวิทยาลัย */
export const EMBLEM_URL = '/logo.png';

type OfficialHeaderOpts = {
  title: string;
  orgLines?: string[];
  emblemUrl?: string;
  docMeta?: string;
  monochrome?: boolean;
  emblemWidthMM?: number;
};

type SignatureSectionItem = {
  title: string;
};

type TableColumn = {
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
};

type RenderDocumentOpts = {
  title: string;
  body: string;
  pageMargin?: string;
};

/** สร้างข้อความปลอดภัยสำหรับ HTML */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** แปลงข้อความให้รองรับหลายบรรทัด */
function toHtmlText(value: unknown, fallback = '-'): string {
  const text = String(value ?? '').trim();
  if (!text) {
    return escapeHtml(fallback);
  }
  return escapeHtml(text).replace(/\r?\n/g, '<br/>');
}

/** วันที่ไทยแบบราชการ */
export function formatThaiDate(input?: string | number | Date): string {
  const date = input ? new Date(input) : new Date();
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(date);
}

/** วันที่และเวลาไทยแบบราชการ */
export function formatThaiDateTime(input?: string | number | Date): string {
  const date = input ? new Date(input) : new Date();
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(date);
}

/** สถานะวัสดุแบบข้อความ */
function getStockStatusText(status: string): string {
  switch (status) {
    case 'หมด':
      return 'หมด';
    case 'สต็อกต่ำ':
      return 'สต็อกต่ำ';
    case 'ปกติ':
      return 'ปกติ';
    default:
      return status || '-';
  }
}

/** สถานะคำขอซื้อแบบข้อความ */
function getRequestStatusText(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'รอพิจารณา';
    case 'APPROVED':
      return 'อนุมัติ';
    case 'REJECTED':
      return 'ไม่อนุมัติ';
    default:
      return status || '-';
  }
}

/** ประเภทการเคลื่อนไหวแบบข้อความ */
function getTransactionTypeText(type: string): string {
  return type === 'IN' ? 'รับเข้า' : 'เบิกจ่าย';
}

/** อ่าน JSON array อย่างปลอดภัย */
function parseJsonArray(value: unknown): any[] {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** ช่องข้อมูลเส้นประ */
function buildDottedField(label: string, value = ''): string {
  return `
    <div class="dotted-field">
      <div class="dotted-field__label">${escapeHtml(label)}</div>
      <div class="dotted-field__value">${value ? toHtmlText(value) : '&nbsp;'}</div>
    </div>
  `;
}

/* ====================== CSS กลาง ====================== */

/** CSS กลางสำหรับทุกเอกสาร */
export function baseStyles(pageMargin = '16mm'): string {
  return `
    @page {
      size: A4;
      margin: ${pageMargin};
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
    }

    body {
      font-family: 'TH Sarabun New', 'Sarabun', 'Angsana New', 'Cordia New', serif;
      font-size: 16pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    * {
      box-sizing: border-box;
    }

    .report-page {
      width: 100%;
    }

    .section-title {
      font-size: 18pt;
      font-weight: 700;
      margin: 4mm 0 2mm;
      color: #000000;
    }

    .dotted-field {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4mm;
      align-items: baseline;
      margin-bottom: 2.5mm;
    }

    .dotted-field__label {
      white-space: nowrap;
      color: #000000;
    }

    .dotted-field__value {
      min-height: 7mm;
      border-bottom: 1px dotted #666666;
      padding-bottom: 0.8mm;
      word-break: break-word;
    }

    .section-rule {
      border-top: 1px solid #000000;
      margin: 4mm 0;
    }

    .checkbox {
      display: inline-block;
      width: 4.5mm;
      height: 4.5mm;
      border: 1px solid #666666;
      vertical-align: middle;
      margin-right: 1.5mm;
    }

    .official-table,
    .form-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 0;
    }

    .official-table th,
    .official-table td,
    .form-table th,
    .form-table td {
      border: 1px solid #000000;
      padding: 2.2mm 2.5mm;
      vertical-align: top;
      font-size: 16pt;
      line-height: 1.2;
      word-break: break-word;
    }

    .official-table thead th,
    .form-table thead th {
      background: #e5e5e5;
      font-weight: 700;
      text-align: center;
    }

    .official-table__center,
    .check-cell {
      text-align: center;
    }

    .official-table__right {
      text-align: right;
    }

    .summary-section {
      margin: 4mm 0 6mm;
    }

    .summary-section__title {
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 2mm;
      color: #000000;
    }

    .summary-section__line {
      font-size: 16pt;
      line-height: 1.35;
      color: #000000;
    }

    .summary-section__line + .summary-section__line {
      margin-top: 1mm;
    }

    .official-header {
      text-align: center;
      margin-bottom: 4mm;
    }

    .official-header__emblem {
      display: block;
      width: 26mm;
      height: auto;
      margin: 0 auto 2.5mm;
    }

    .official-header__title {
      font-size: 22pt;
      font-weight: 700;
      line-height: 1.2;
      margin: 0;
    }

    .official-header__org {
      margin-top: 1mm;
      font-size: 16pt;
      line-height: 1.28;
      color: #000000;
    }

    .official-header__meta {
      margin-top: 2mm;
      font-size: 16pt;
      line-height: 1.2;
      color: #000000;
    }

    .official-header__divider {
      margin-top: 4mm;
      border-top: 1px solid #000000;
    }

    .official-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 8mm;
      margin-top: 8mm;
      padding-top: 2mm;
      border-top: 1px solid #000000;
      font-size: 16pt;
      line-height: 1.2;
      color: #000000;
    }

    .official-footer__org {
      line-height: 1.2;
    }

    .official-footer__page-slot {
      min-width: 25mm;
      text-align: right;
    }

    .signature-section {
      margin-top: 10mm;
      page-break-inside: avoid;
    }

    .signature-section__title {
      text-align: center;
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 5mm;
      color: #000000;
    }

    .signature-grid {
      display: grid;
      gap: 8mm;
      align-items: start;
    }

    .signature-box {
      text-align: center;
      color: #000000;
    }

    .signature-role {
      font-size: 16pt;
      font-weight: 700;
      margin-bottom: 4mm;
      color: #000000;
    }

    .signature-line,
    .signature-name,
    .signature-position,
    .signature-date {
      font-size: 16pt;
      line-height: 1.2;
    }

    .form-block {
      margin-top: 4mm;
    }

    .form-block__section {
      margin-top: 4mm;
    }

    .form-block__section-title {
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 2mm;
      color: #000000;
    }

    .form-row {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4mm;
      align-items: baseline;
      margin-bottom: 2.5mm;
    }

    .form-row__label {
      white-space: nowrap;
      color: #000000;
    }

    .form-row__value {
      min-height: 7mm;
      border-bottom: 1px dotted #666666;
      padding-bottom: 0.8mm;
      word-break: break-word;
    }
  `;
}

/** CSS ส่วนหัวเอกสาร */
export function headerStyles(): string {
  return '';
}

/** CSS ส่วนท้ายเอกสาร */
export function footerStyles(): string {
  return '';
}

/** CSS ตารางมาตรฐานราชการ */
export function officialTableStyles(): string {
  return '';
}

/** CSS ลายเซ็นมาตรฐาน */
export function signatureStyles(): string {
  return '';
}

/** CSS เพิ่มเติมสำหรับแบบฟอร์ม */
function formStyles(): string {
  return '';
}

/* ====================== ตัวช่วยสร้าง HTML กลาง ====================== */

/** สร้างส่วนหัวเอกสารราชการ */
export function buildOfficialHeader(opts: OfficialHeaderOpts): string {
  const {
    title,
    orgLines = ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
    emblemUrl = EMBLEM_URL,
    docMeta,
    monochrome = false,
    emblemWidthMM = 26,
  } = opts;

  return `
    <div class="official-header">
      <img
        class="official-header__emblem"
        src="${escapeHtml(emblemUrl)}"
        alt="ตรามหาวิทยาลัย"
        style="width:${emblemWidthMM}mm;${monochrome ? 'filter:grayscale(100%);' : ''}"
      />
      <div class="official-header__title">${escapeHtml(title)}</div>
      <div class="official-header__org">
        ${orgLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
      </div>
      ${docMeta ? `<div class="official-header__meta">${escapeHtml(docMeta)}</div>` : ''}
      <div class="official-header__divider"></div>
    </div>
  `;
}

/** ความเข้ากันได้กับโค้ดเดิม */
export function buildOfficialHeaderHTML(opts: OfficialHeaderOpts): string {
  return buildOfficialHeader(opts);
}

/** สร้างส่วนท้ายเอกสารราชการ */
export function buildOfficialFooter(): string {
  return `
    <div class="official-footer">
      <div class="official-footer__org">
        <div>สาขาวิชาเทคโนโลยีสารสนเทศ</div>
        <div>มหาวิทยาลัยราชภัฏพิบูลสงคราม</div>
      </div>
      <div class="official-footer__page-slot" aria-hidden="true"></div>
    </div>
  `;
}

/** สร้างสรุปข้อมูลแบบข้อความธรรมดา */
export function buildSummary(lines: Array<{ label: string; value: string }>): string {
  return `
    <div class="summary-section">
      <div class="summary-section__title">ข้อมูลสรุป</div>
      ${lines
        .map(
          (line) => `
            <div class="summary-section__line">
              ${escapeHtml(line.label)} ${escapeHtml(line.value)}
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

/** สร้างหัวตารางแบบราชการ */
export function buildTableHeader(columns: TableColumn[]): string {
  return `
    <thead>
      <tr>
        ${columns
          .map((column) => {
            const styles: string[] = [];
            if (column.width) {
              styles.push(`width:${column.width};`);
            }
            if (column.align) {
              styles.push(`text-align:${column.align};`);
            }
            const styleAttr = styles.length ? ` style="${styles.join(' ')}"` : '';
            return `<th${styleAttr}>${escapeHtml(column.label)}</th>`;
          })
          .join('')}
      </tr>
    </thead>
  `;
}

/** สร้างส่วนลายเซ็นมาตรฐาน */
export function buildSignatureSection(signers: SignatureSectionItem[]): string {
  const columns = Math.min(Math.max(signers.length, 2), 4);

  return `
    <div class="signature-section">
      <div class="signature-grid" style="grid-template-columns: repeat(${columns}, minmax(0, 1fr));">
        ${signers
          .map(
            (signer) => `
              <div class="signature-box">
                <div class="signature-role">${escapeHtml(signer.title)}</div>
                <div class="signature-line">ลงชื่อ............................................</div>
                <div class="signature-name">(...........................................)</div>
                <div class="signature-position">ตำแหน่ง......................................</div>
                <div class="signature-date">วันที่........../........../..........</div>
              </div>
            `
          )
          .join('')}
      </div>
    </div>
  `;
}

/** สร้างโครงเอกสาร HTML มาตรฐาน */
function buildHtmlDocument(opts: RenderDocumentOpts): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Language" content="th" />
  <title>${escapeHtml(opts.title)}</title>
  <style>
${baseStyles(opts.pageMargin ?? '16mm')}
${formStyles()}
  </style>
</head>
<body>
  <div class="report-page">
${opts.body}
  </div>
</body>
</html>
  `;
}

/* ====================== 1) รายงานสต็อกวัสดุสิ้นเปลือง ====================== */

export function generateStockReportHTML(data: any[]): string {
  const rows = data
    .map(
      (item, index) => `
        <tr>
          <td class="official-table__center">${index + 1}</td>
          <td>${toHtmlText(item.name)}</td>
          <td class="official-table__center">${toHtmlText(item.category)}</td>
          <td class="official-table__center">${toHtmlText(item.currentStock)}</td>
          <td class="official-table__center">${toHtmlText(item.unit)}</td>
          <td>${toHtmlText(item.location || '-')}</td>
          <td class="official-table__center">${escapeHtml(getStockStatusText(item.status))}</td>
        </tr>
      `
    )
    .join('');

  const body = `
    ${buildOfficialHeader({
      title: 'รายงานสต็อกวัสดุสิ้นเปลือง',
      orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
      emblemUrl: EMBLEM_URL,
      docMeta: `วันที่พิมพ์ ${formatThaiDateTime()}`,
    })}

    ${buildSummary([{ label: 'จำนวนรายการ', value: `${data.length} รายการ` }])}

    <table class="official-table">
      ${buildTableHeader([
        { label: 'ลำดับ', width: '8%' },
        { label: 'รายการวัสดุ', width: '24%' },
        { label: 'ประเภทวัสดุ', width: '18%' },
        { label: 'จำนวนคงเหลือ', width: '12%' },
        { label: 'หน่วยนับ', width: '10%' },
        { label: 'สถานที่จัดเก็บ', width: '18%' },
        { label: 'สถานะ', width: '10%' },
      ])}
      <tbody>${rows}</tbody>
    </table>

    ${buildSignatureSection([
      { title: 'ผู้จัดทำรายงาน' },
      { title: 'หัวหน้างาน' },
      { title: 'ผู้อนุมัติ' },
    ])}

    ${buildOfficialFooter()}
  `;

  return buildHtmlDocument({
    title: 'รายงานสต็อกวัสดุสิ้นเปลือง',
    body,
  });
}

/* ====================== 2) รายงานการเบิกจ่ายวัสดุ ====================== */

export function generateTransactionReportHTML(
  data: any[],
  startDate: string,
  endDate: string
): string {
  const rows = data
    .map(
      (item, index) => `
        <tr>
          <td class="official-table__center">${index + 1}</td>
          <td class="official-table__center">${escapeHtml(formatThaiDate(item.date))}</td>
          <td>${toHtmlText(item.materialName)}</td>
          <td class="official-table__center">${escapeHtml(getTransactionTypeText(item.type))}</td>
          <td class="official-table__center">${toHtmlText(item.quantity)}</td>
          <td class="official-table__center">${toHtmlText(item.unit)}</td>
          <td>${toHtmlText(item.userName)}</td>
          <td>${toHtmlText(item.department || '-')}</td>
          <td>${toHtmlText(item.note || '-')}</td>
        </tr>
      `
    )
    .join('');

  const body = `
    ${buildOfficialHeader({
      title: 'รายงานการเบิกจ่ายวัสดุ',
      orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
      emblemUrl: EMBLEM_URL,
      docMeta: `ช่วงรายงาน ${formatThaiDate(startDate)} ถึง ${formatThaiDate(endDate)} | วันที่พิมพ์ ${formatThaiDateTime()}`,
    })}

    ${buildSummary([{ label: 'จำนวนรายการ', value: `${data.length} รายการ` }])}

    <table class="official-table">
      ${buildTableHeader([
        { label: 'ลำดับ', width: '7%' },
        { label: 'วันที่', width: '11%' },
        { label: 'รายการวัสดุ', width: '24%' },
        { label: 'ประเภท', width: '10%' },
        { label: 'จำนวน', width: '8%' },
        { label: 'หน่วย', width: '8%' },
        { label: 'ผู้ดำเนินการ', width: '15%' },
        { label: 'หน่วยงาน', width: '12%' },
        { label: 'หมายเหตุ', width: '15%' },
      ])}
      <tbody>${rows}</tbody>
    </table>

    ${buildSignatureSection([
      { title: 'ผู้จัดทำรายงาน' },
      { title: 'หัวหน้างานพัสดุ' },
      { title: 'ผู้อนุมัติ' },
    ])}

    ${buildOfficialFooter()}
  `;

  return buildHtmlDocument({
    title: 'รายงานการเบิกจ่ายวัสดุ',
    body,
  });
}

/* ====================== 3) รายงานคำขอซื้อ ====================== */

export function generatePurchaseRequestReportHTML(data: any[]): string {
  const rows = data
    .map((item, index) => {
      const items = parseJsonArray(item.items);
      const itemsList = items.length
        ? items
            .map((entry: any) => {
              const quantity = entry?.quantity ?? 0;
              const unit = entry?.unit ? ` ${entry.unit}` : '';
              return `${escapeHtml(entry?.name || 'ไม่ระบุ')} (${escapeHtml(String(quantity))}${escapeHtml(unit)})`;
            })
            .join('<br/>')
        : '-';

      return `
        <tr>
          <td class="official-table__center">${index + 1}</td>
          <td class="official-table__center">${escapeHtml(formatThaiDate(item.requestDate))}</td>
          <td>${toHtmlText(item.requesterName)}</td>
          <td>${toHtmlText(item.department || '-')}</td>
          <td>${itemsList}</td>
          <td>${toHtmlText(item.reason || '-')}</td>
          <td class="official-table__center">${escapeHtml(getRequestStatusText(item.status))}</td>
        </tr>
      `;
    })
    .join('');

  const body = `
    ${buildOfficialHeader({
      title: 'รายงานคำขอซื้อวัสดุ',
      orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
      emblemUrl: EMBLEM_URL,
      docMeta: `วันที่พิมพ์ ${formatThaiDateTime()}`,
    })}

    ${buildSummary([{ label: 'จำนวนรายการ', value: `${data.length} รายการ` }])}

    <table class="official-table">
      ${buildTableHeader([
        { label: 'ลำดับ', width: '7%' },
        { label: 'วันที่', width: '11%' },
        { label: 'ผู้ขอ', width: '16%' },
        { label: 'หน่วยงาน', width: '16%' },
        { label: 'รายการวัสดุ', width: '28%' },
        { label: 'เหตุผลความจำเป็น', width: '16%' },
        { label: 'ผลการพิจารณา', width: '10%' },
      ])}
      <tbody>${rows}</tbody>
    </table>

    ${buildSignatureSection([
      { title: 'ผู้จัดทำรายงาน' },
      { title: 'หัวหน้างานพัสดุ' },
      { title: 'ผู้มีอำนาจอนุมัติ' },
    ])}

    ${buildOfficialFooter()}
  `;

  return buildHtmlDocument({
    title: 'รายงานคำขอซื้อวัสดุ',
    body,
  });
}

/* ====================== 4) แบบฟอร์มยืมคืนครุภัณฑ์ ====================== */

export function generateBorrowFormHTML(data: {
  borrowId: string;
  assetNumber: string;
  assetName: string;
  borrower: string;
  department: string;
  purpose: string;
  borrowDate: string;
  expectedReturnDate: string;
  condition: string;
  note?: string;
  studentName?: string;
  studentId?: string;
  borrowOnBehalfOf?: string;
  borrowerType?: string;
  adminName?: string;
}): string {
  const bType = data.borrowerType || (data.studentName ? 'STUDENT' : 'LECTURER');

  // ชื่อผู้ยืมจริงและป้ายกำกับตามประเภท
  const getBorrowerInfo = () => {
    switch (bType) {
      case 'STUDENT':
        return {
          label: 'ชื่อผู้ยืม (นักศึกษา)',
          name: data.studentName || data.borrower,
          extra: [
            buildDottedField('รหัสนักศึกษา', data.studentId || ''),
            buildDottedField('อาจารย์/เจ้าหน้าที่ผู้รับรอง', data.borrower),
            buildDottedField('หน่วยงาน', data.department),
          ].join(''),
        };
      case 'LECTURER':
        return {
          label: 'ชื่ออาจารย์ผู้ยืม',
          name: data.borrower,
          extra: buildDottedField('หน่วยงาน/ภาควิชา', data.department),
        };
      case 'FACULTY':
        return {
          label: 'ผู้รับผิดชอบ (คณะ)',
          name: data.borrower,
          extra: [
            buildDottedField('ยืมในนามของ', data.borrowOnBehalfOf || ''),
            buildDottedField('หน่วยงาน', data.department),
          ].join(''),
        };
      case 'STAFF':
        return {
          label: 'ชื่อเจ้าหน้าที่ผู้ยืม',
          name: data.borrower,
          extra: buildDottedField('หน่วยงาน', data.department),
        };
      default:
        return {
          label: 'ชื่อผู้ยืม',
          name: data.studentName || data.borrower,
          extra: buildDottedField('หน่วยงาน', data.department),
        };
    }
  };

  const borrowerInfo = getBorrowerInfo();
  const displayName = bType === 'STUDENT' ? (data.studentName || data.borrower) : data.borrower;

  // ป้ายลายเซ็นที่สองตามประเภทผู้ยืม
  const secondSignTitle = bType === 'STUDENT' ? 'อาจารย์/เจ้าหน้าที่ผู้รับรอง' : 'ผู้อนุมัติ';

  const body = `
    ${buildOfficialHeader({
      title: 'แบบฟอร์มยืมคืนครุภัณฑ์',
      orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
      emblemUrl: EMBLEM_URL,
      monochrome: true,
      docMeta: `วันที่พิมพ์ ${formatThaiDateTime()}`,
    })}

    <div class="form-block">
      <div class="form-block__section">
        <div class="form-block__section-title">1. ข้อมูลการยืม</div>
        ${buildDottedField('เลขที่เอกสาร', data.borrowId)}
        ${buildDottedField('วันที่ยืม', formatThaiDate(data.borrowDate))}
        ${buildDottedField('กำหนดวันคืน', formatThaiDate(data.expectedReturnDate))}
      </div>

      <div class="section-rule"></div>

      <div class="form-block__section">
        <div class="form-block__section-title">2. ข้อมูลผู้ยืม</div>
        ${buildDottedField(borrowerInfo.label, borrowerInfo.name)}
        ${borrowerInfo.extra}
        ${buildDottedField('วัตถุประสงค์ในการยืม', data.purpose)}
      </div>

      <div class="section-rule"></div>

      <div class="form-block__section">
        <div class="form-block__section-title">3. ข้อมูลครุภัณฑ์</div>
        ${buildDottedField('หมายเลขครุภัณฑ์', data.assetNumber)}
        ${buildDottedField('ชื่อครุภัณฑ์', data.assetName)}
        ${buildDottedField('สภาพขณะยืม', data.condition === 'GOOD' ? 'ปกติ ครบถ้วน' : 'ชำรุด/บกพร่อง')}
        ${buildDottedField('หมายเหตุ', data.note || '')}
      </div>

      <div class="section-rule"></div>

      <div class="form-block__section">
        <div class="form-block__section-title">4. บันทึกการคืน</div>
        ${buildDottedField('วันที่คืนจริง', '')}
        <div class="form-row">
          <div class="form-row__label">สภาพครุภัณฑ์ขณะคืน</div>
          <div class="form-row__value">
            <span class="checkbox"></span> ปกติ ครบถ้วน
            <span style="display:inline-block; width:8mm;"></span>
            <span class="checkbox"></span> ชำรุด/เสียหาย
          </div>
        </div>
        ${buildDottedField('รายละเอียดความเสียหาย', '')}
        ${buildDottedField('หมายเหตุเพิ่มเติม', '')}
      </div>
    </div>

    ${buildSignatureSection([
      { title: 'ผู้ยืม' },
      { title: secondSignTitle },
      { title: 'เจ้าหน้าที่พัสดุผู้ส่งมอบ' },
    ])}

    <div class="section-rule"></div>

    <div class="signature-section">
      <div class="signature-section__title">บันทึกการคืนครุภัณฑ์</div>
      <div style="display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4mm 8mm;">
        ${buildDottedField('ผู้คืนครุภัณฑ์', displayName)}
        ${buildDottedField('เจ้าหน้าที่พัสดุผู้ตรวจรับ', '')}
      </div>
    </div>

    ${buildOfficialFooter()}
  `;

  return buildHtmlDocument({
    title: 'แบบฟอร์มยืมคืนครุภัณฑ์',
    body,
    pageMargin: '16mm',
  });
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
          <td class="official-table__center">${index + 1}</td>
          <td>${toHtmlText(item.materialName)}</td>
          <td class="official-table__center">${toHtmlText(item.quantity)}</td>
          <td class="official-table__center">${toHtmlText(item.unit)}</td>
          <td></td>
        </tr>
      `
    )
    .join('');

  const body = `
    ${buildOfficialHeader({
      title: 'ใบเบิกวัสดุสิ้นเปลือง',
      orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
      emblemUrl: EMBLEM_URL,
      monochrome: true,
      docMeta: `วันที่พิมพ์ ${formatThaiDateTime()}`,
    })}

    <div class="form-block">
      <div class="form-block__section">
        <div class="form-block__section-title">ข้อมูลเอกสาร</div>
        ${buildDottedField('เลขที่เอกสาร', data.transactionId)}
        ${buildDottedField('วันที่เบิก', formatThaiDate(data.withdrawDate))}
        ${buildDottedField('ชื่อผู้เบิก', data.requester)}
        ${buildDottedField('หน่วยงาน/ภาควิชา', data.department)}
        ${data.purpose ? buildDottedField('วัตถุประสงค์', data.purpose) : ''}
        ${data.note ? buildDottedField('หมายเหตุ', data.note) : ''}
      </div>
    </div>

    <table class="form-table">
      ${buildTableHeader([
        { label: 'ลำดับ', width: '10%' },
        { label: 'รายการวัสดุ', width: '42%' },
        { label: 'จำนวน', width: '14%' },
        { label: 'หน่วย', width: '12%' },
        { label: 'หมายเหตุ', width: '22%' },
      ])}
      <tbody>${itemRows}</tbody>
    </table>

    ${buildSignatureSection([
      { title: 'ผู้เบิก' },
      { title: 'เจ้าหน้าที่ผู้จ่าย' },
      { title: 'ผู้อนุมัติ' },
    ])}

    ${buildOfficialFooter()}
  `;

  return buildHtmlDocument({
    title: 'ใบเบิกวัสดุสิ้นเปลือง',
    body,
  });
}

/* ====================== 6) แบบฟอร์มยืมคืนครุภัณฑ์หลายรายการ ====================== */

export function generateMultiBorrowFormHTML(data: {
  borrowId: string;
  borrower: string;
  department: string;
  purpose: string;
  borrowDate: string;
  expectedReturnDate: string;
  studentName?: string;
  studentId?: string;
  borrowOnBehalfOf?: string;
  borrowerType?: string;
  note?: string;
  adminName?: string;
  assets: Array<{
    assetNumber: string;
    assetName: string;
    condition: string;
    note?: string;
  }>;
}): string {
  const assetRows = data.assets
    .map(
      (asset, index) => `
        <tr>
          <td class="official-table__center">${index + 1}</td>
          <td class="official-table__center"><strong>${toHtmlText(asset.assetNumber)}</strong></td>
          <td>${toHtmlText(asset.assetName)}</td>
          <td class="official-table__center">${escapeHtml(asset.condition === 'GOOD' ? 'ปกติ' : 'ชำรุด')}</td>
          <td>${toHtmlText(asset.note || '-')}</td>
          <td class="check-cell"><span class="checkbox"></span></td>
        </tr>
      `
    )
    .join('');

  const bType = data.borrowerType || (data.studentName ? 'STUDENT' : 'LECTURER');

  const getBorrowerSection = () => {
    switch (bType) {
      case 'STUDENT':
        return [
          buildDottedField('ชื่อผู้ยืม (นักศึกษา)', data.studentName || data.borrower),
          buildDottedField('รหัสนักศึกษา', data.studentId || ''),
          buildDottedField('อาจารย์/เจ้าหน้าที่ผู้รับรอง', data.borrower),
          buildDottedField('หน่วยงาน', data.department),
        ].join('');
      case 'LECTURER':
        return [
          buildDottedField('ชื่ออาจารย์ผู้ยืม', data.borrower),
          buildDottedField('หน่วยงาน/ภาควิชา', data.department),
        ].join('');
      case 'FACULTY':
        return [
          buildDottedField('ผู้รับผิดชอบ (คณะ)', data.borrower),
          buildDottedField('ยืมในนามของ', data.borrowOnBehalfOf || ''),
          buildDottedField('หน่วยงาน', data.department),
        ].join('');
      case 'STAFF':
        return [
          buildDottedField('ชื่อเจ้าหน้าที่ผู้ยืม', data.borrower),
          buildDottedField('หน่วยงาน', data.department),
        ].join('');
      default:
        return [
          buildDottedField('ชื่อผู้ยืม', data.studentName || data.borrower),
          buildDottedField('หน่วยงาน', data.department),
        ].join('');
    }
  };

  const body = `
    ${buildOfficialHeader({
      title: 'แบบฟอร์มยืมคืนครุภัณฑ์หลายรายการ',
      orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
      emblemUrl: EMBLEM_URL,
      monochrome: true,
      docMeta: `วันที่พิมพ์ ${formatThaiDateTime()}`,
    })}

    <div class="form-block">
      <div class="form-block__section">
        <div class="form-block__section-title">1. ข้อมูลการยืม</div>
        ${buildDottedField('เลขที่เอกสาร', data.borrowId)}
        ${buildDottedField('วันที่ยืม', formatThaiDate(data.borrowDate))}
        ${buildDottedField('กำหนดวันคืน', formatThaiDate(data.expectedReturnDate))}
      </div>

      <div class="section-rule"></div>

      <div class="form-block__section">
        <div class="form-block__section-title">2. ข้อมูลผู้ยืม</div>
        ${getBorrowerSection()}
        ${buildDottedField('วัตถุประสงค์', data.purpose)}
        ${data.note ? buildDottedField('หมายเหตุ', data.note) : ''}
      </div>

      <div class="section-rule"></div>

      <div class="form-block__section">
        <div class="form-block__section-title">3. ข้อมูลครุภัณฑ์</div>
        <table class="form-table">
          ${buildTableHeader([
            { label: 'ลำดับ', width: '8%' },
            { label: 'เลขครุภัณฑ์', width: '15%' },
            { label: 'ชื่อครุภัณฑ์', width: '30%' },
            { label: 'สภาพ', width: '12%' },
            { label: 'หมายเหตุ', width: '25%' },
            { label: 'ตรวจคืน', width: '10%' },
          ])}
          <tbody>${assetRows}</tbody>
        </table>
      </div>

      <div class="section-rule"></div>

      <div class="form-block__section">
        <div class="form-block__section-title">4. บันทึกการคืน</div>
        ${buildDottedField('วันที่คืนจริง', '')}
        <div class="form-row">
          <div class="form-row__label">สภาพครุภัณฑ์</div>
          <div class="form-row__value">
            <span class="checkbox"></span> ทุกรายการปกติ ครบถ้วน
            <span style="display:inline-block; width:8mm;"></span>
            <span class="checkbox"></span> มีรายการชำรุด/เสียหาย
          </div>
        </div>
        ${buildDottedField('รายการที่ชำรุด', '')}
        ${buildDottedField('หมายเหตุ', '')}
      </div>
    </div>

    ${buildSignatureSection([
      { title: 'ผู้ยืม' },
      { title: data.studentName ? 'อาจารย์/เจ้าหน้าที่ผู้รับรอง' : 'ผู้อนุมัติ' },
      { title: 'เจ้าหน้าที่พัสดุผู้ส่งมอบ' },
    ])}

    ${buildOfficialFooter()}
  `;

  return buildHtmlDocument({
    title: 'แบบฟอร์มยืมคืนครุภัณฑ์หลายรายการ',
    body,
  });
}

/* ====================== 7) รายงานครุภัณฑ์ทั้งหมด ====================== */

export function generateFixedAssetReportHTML(data: {
  assetNumber: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  condition: string;
  location: string;
  purchaseDate?: string;
  purchasePrice?: number;
  borrowStatus: string;
}[]): string {
  const conditionLabel = (c: string) => {
    switch (c) {
      case 'GOOD': return 'ดี';
      case 'DAMAGED': return 'ชำรุด';
      case 'NEEDS_REPAIR': return 'รอซ่อม';
      case 'DISPOSED': return 'จำหน่ายแล้ว';
      default: return c;
    }
  };

  const conditionGroups = {
    GOOD: data.filter(a => a.condition === 'GOOD').length,
    NEEDS_REPAIR: data.filter(a => a.condition === 'NEEDS_REPAIR').length,
    DAMAGED: data.filter(a => a.condition === 'DAMAGED').length,
    DISPOSED: data.filter(a => a.condition === 'DISPOSED').length,
    BORROWED: data.filter(a => a.borrowStatus === 'กำลังถูกยืม').length,
  };

  const rows = data.map((asset, index) => `
    <tr>
      <td class="official-table__center">${index + 1}</td>
      <td class="official-table__center"><strong>${escapeHtml(asset.assetNumber)}</strong></td>
      <td>${escapeHtml(asset.name)}</td>
      <td>${escapeHtml(asset.category)}</td>
      <td>${escapeHtml(asset.brand || '-')}</td>
      <td>${escapeHtml(conditionLabel(asset.condition))}</td>
      <td>${escapeHtml(asset.location)}</td>
      <td>${asset.purchaseDate ? escapeHtml(formatThaiDate(asset.purchaseDate)) : '-'}</td>
      <td class="official-table__center">${escapeHtml(asset.borrowStatus)}</td>
    </tr>
  `).join('');

  const body = `
    ${buildOfficialHeader({
      title: 'รายงานครุภัณฑ์ทั้งหมด',
      orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
      emblemUrl: EMBLEM_URL,
      monochrome: true,
      docMeta: `วันที่พิมพ์ ${formatThaiDateTime()}`,
    })}

    ${buildSummary([
      { label: 'ครุภัณฑ์ทั้งหมด', value: String(data.length) },
      { label: 'สภาพดี', value: String(conditionGroups.GOOD) },
      { label: 'รอซ่อม', value: String(conditionGroups.NEEDS_REPAIR) },
      { label: 'ชำรุด', value: String(conditionGroups.DAMAGED) },
      { label: 'กำลังถูกยืม', value: String(conditionGroups.BORROWED) },
    ])}

    <table class="official-table">
      ${buildTableHeader([
        { label: 'ลำดับ', width: '5%' },
        { label: 'เลขครุภัณฑ์', width: '13%' },
        { label: 'ชื่อครุภัณฑ์', width: '22%' },
        { label: 'หมวดหมู่', width: '12%' },
        { label: 'ยี่ห้อ', width: '10%' },
        { label: 'สภาพ', width: '9%' },
        { label: 'ตำแหน่ง', width: '13%' },
        { label: 'วันที่ซื้อ', width: '10%' },
        { label: 'สถานะ', width: '6%' },
      ])}
      <tbody>${rows}</tbody>
    </table>

    ${buildOfficialFooter()}
  `;

  return buildHtmlDocument({
    title: 'รายงานครุภัณฑ์ทั้งหมด',
    body,
    pageMargin: '10mm',
  });
}

/* ====================== 8) รายงานการยืม-คืนครุภัณฑ์ ====================== */

export function generateBorrowReportHTML(
  data: {
    borrowDate: string;
    assetNumber: string;
    assetName: string;
    borrowerType: string;
    borrowerName: string;
    studentName?: string;
    studentId?: string;
    borrowOnBehalfOf?: string;
    expectedReturnDate?: string;
    actualReturnDate?: string;
    status: string;
    purpose?: string;
  }[],
  filters?: { startDate?: string; endDate?: string; status?: string; borrowerType?: string }
): string {
  const statusLabel = (s: string) => {
    switch (s) {
      case 'BORROWED': return 'กำลังยืม';
      case 'RETURNED': return 'คืนแล้ว';
      case 'OVERDUE': return 'เกินกำหนด';
      case 'LOST': return 'สูญหาย';
      default: return s;
    }
  };

  const borrowerTypeLabel = (t: string) => {
    switch (t) {
      case 'STUDENT': return 'นักศึกษา';
      case 'LECTURER': return 'อาจารย์';
      case 'FACULTY': return 'คณะ';
      case 'STAFF': return 'เจ้าหน้าที่';
      default: return t;
    }
  };

  const stats = {
    total: data.length,
    borrowed: data.filter(b => b.status === 'BORROWED').length,
    returned: data.filter(b => b.status === 'RETURNED').length,
    overdue: data.filter(b => {
      if (b.status !== 'BORROWED' || !b.expectedReturnDate) return false;
      return new Date(b.expectedReturnDate) < new Date();
    }).length,
  };

  const rows = data.map((borrow, index) => {
    const primaryName = borrow.studentName || borrow.borrowerName;
    const subInfo = borrow.studentName
      ? `${borrow.studentId || ''} / รับรองโดย ${borrow.borrowerName}`
      : borrow.borrowOnBehalfOf
      ? `ในนาม: ${borrow.borrowOnBehalfOf}`
      : '';

    return `
      <tr>
        <td class="official-table__center">${index + 1}</td>
        <td>${escapeHtml(formatThaiDate(borrow.borrowDate))}</td>
        <td class="official-table__center"><strong>${escapeHtml(borrow.assetNumber)}</strong></td>
        <td>${escapeHtml(borrow.assetName)}</td>
        <td class="official-table__center">${escapeHtml(borrowerTypeLabel(borrow.borrowerType))}</td>
        <td>${escapeHtml(primaryName)}${subInfo ? `<br/><small style="color:#64748b">${escapeHtml(subInfo)}</small>` : ''}</td>
        <td class="official-table__center">${borrow.expectedReturnDate ? escapeHtml(formatThaiDate(borrow.expectedReturnDate)) : '-'}</td>
        <td class="official-table__center">${borrow.actualReturnDate ? escapeHtml(formatThaiDate(borrow.actualReturnDate)) : '-'}</td>
        <td class="official-table__center">${escapeHtml(statusLabel(borrow.status))}</td>
      </tr>
    `;
  }).join('');

  const filterMeta = filters
    ? [
        filters.startDate && filters.endDate
          ? `ช่วงวันที่: ${formatThaiDate(filters.startDate)} – ${formatThaiDate(filters.endDate)}`
          : '',
        filters.status && filters.status !== 'ALL' ? `สถานะ: ${statusLabel(filters.status)}` : '',
        filters.borrowerType && filters.borrowerType !== 'ALL' ? `ประเภทผู้ยืม: ${borrowerTypeLabel(filters.borrowerType)}` : '',
      ].filter(Boolean).join('  |  ')
    : '';

  const body = `
    ${buildOfficialHeader({
      title: 'รายงานการยืม-คืนครุภัณฑ์',
      orgLines: ['สาขาวิชาเทคโนโลยีสารสนเทศ', 'มหาวิทยาลัยราชภัฏพิบูลสงคราม'],
      emblemUrl: EMBLEM_URL,
      monochrome: true,
      docMeta: `วันที่พิมพ์ ${formatThaiDateTime()}${filterMeta ? `<br/>${filterMeta}` : ''}`,
    })}

    ${buildSummary([
      { label: 'รายการทั้งหมด', value: String(stats.total) },
      { label: 'กำลังยืม', value: String(stats.borrowed) },
      { label: 'คืนแล้ว', value: String(stats.returned) },
      { label: 'เกินกำหนด', value: String(stats.overdue) },
    ])}

    <table class="official-table">
      ${buildTableHeader([
        { label: 'ลำดับ', width: '5%' },
        { label: 'วันที่ยืม', width: '11%' },
        { label: 'เลขครุภัณฑ์', width: '11%' },
        { label: 'ชื่อครุภัณฑ์', width: '20%' },
        { label: 'ประเภท', width: '8%' },
        { label: 'ผู้ยืม', width: '18%' },
        { label: 'กำหนดคืน', width: '11%' },
        { label: 'คืนจริง', width: '10%' },
        { label: 'สถานะ', width: '6%' },
      ])}
      <tbody>${rows}</tbody>
    </table>

    ${buildOfficialFooter()}
  `;

  return buildHtmlDocument({
    title: 'รายงานการยืม-คืนครุภัณฑ์',
    body,
    pageMargin: '10mm',
  });
}