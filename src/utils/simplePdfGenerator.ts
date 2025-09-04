// src/utils/simplePdfGenerator.ts
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type {
  MaterialReportData,
  TransactionReportData,
  PurchaseRequestReportData,
} from "./excelGenerator";

/* ----------------------------- Constants ----------------------------- */
const A4_MM = { w: 210, h: 297 } as const;
const A4_LANDSCAPE_MM = { w: 297, h: 210 } as const;

// ความกว้าง/สูงของพื้นที่เรนเดอร์ HTML (px) ให้ตรงสัดส่วน A4
// ใช้ 1123x794 เดิม แต่ยกเป็นค่าคงที่ และปรับ scale ตาม DPR เพื่อความคมชัด
const RENDER_PX = { w: 1123, h: 794 } as const;

const DEFAULT_TIMEOUT_MS = 10_000;
const FONT_WAIT_MS = 1_500; // กันกรณี browser ไม่มี document.fonts
const HTML_CONTAINER_ID = "pdf-temp-container";

/* ----------------------------- Utilities ----------------------------- */
const safeJsonArray = (json: string) => {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
};

const parseItemsToNames = (itemsJson: string): string => {
  const arr = safeJsonArray(itemsJson);
  if (!arr) return itemsJson || "-";
  return arr.map((it: any) => it?.name || "").filter(Boolean).join(", ") || "-";
};

// รอให้ webfont โหลด (รองรับ browser ที่มี/ไม่มี Font Loading API)
const waitForFonts = async (extraDelayMs = FONT_WAIT_MS) => {
  // @ts-ignore
  const fonts = (document as any).fonts;
  if (fonts?.ready) {
    try {
      await fonts.ready;
      return;
    } catch {
      // ตกมาที่ setTimeout ด้านล่าง
    }
  }
  await new Promise((r) => setTimeout(r, extraDelayMs));
};

// สร้าง container ชั่วคราวใน DOM
const createTempContainer = (html: string, widthPx: number) => {
  const existing = document.getElementById(HTML_CONTAINER_ID);
  if (existing) existing.remove();

  const div = document.createElement("div");
  div.id = HTML_CONTAINER_ID;
  div.innerHTML = html;
  Object.assign(div.style, {
    position: "absolute",
    left: "-10000px",
    top: "0",
    width: `${widthPx}px`,
    background: "#fff",
    contain: "layout style size",
    zIndex: "-1",
  } as CSSStyleDeclaration);
  document.body.appendChild(div);
  return div;
};

// ตัดภาพเป็นหน้า ๆ เพื่อความคมชัดและเลี่ยงการ addImage ติด offset ลบ
const addCanvasAsMultipage = async (
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  pageWmm: number,
  pageHmm: number
) => {
  const pageRatio = pageWmm / pageHmm; // landscape จะกว้างกว่า
  const imgRatio = canvas.width / canvas.height;

  // คำนวณสเกลภาพ -> ให้พอดีกว้างหน้า
  const pdfImgWidthMM = pageWmm;
  const pdfImgHeightMM = pdfImgWidthMM / imgRatio;

  // แปลง mm -> px ตามสัดส่วนเดียวกันเพื่อหา "ความสูงภาพต่อหน้า"
  // อัตราส่วนเทียบจากความกว้าง
  const pxPerMM = canvas.width / pdfImgWidthMM;
  const pageHeightPx = pageHmm * pxPerMM;

  const tmp = document.createElement("canvas");
  const ctx = tmp.getContext("2d")!;
  tmp.width = canvas.width;
  tmp.height = Math.min(canvas.height, Math.ceil(pageHeightPx));

  let y = 0;
  let firstPage = true;

  while (y < canvas.height) {
    const sliceHeight = Math.min(tmp.height, canvas.height - y);
    // ล้างและวาด slice
    ctx.clearRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(
      canvas,
      0,
      y,
      tmp.width,
      sliceHeight,
      0,
      0,
      tmp.width,
      sliceHeight
    );

    const imgData = tmp.toDataURL("image/png");

    if (!firstPage) pdf.addPage();
    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      pdfImgWidthMM,
      (sliceHeight / tmp.width) * pdfImgWidthMM
    );

    firstPage = false;
    y += sliceHeight;
  }
};

/* ------------------------------ HTMLs ------------------------------ */
// หมายเหตุ: ใช้ Google Fonts Noto Sans Thai เพื่อความสวยงาม
// ถ้าต้องการ offline 100% ให้เปลี่ยนไปใช้ @font-face แบบ base64 ในโปรเจกต์
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700&display=swap');
  :root {
    --bg-even:#f8f9fa; 
    --bg-odd:#ffffff;
    --bg-hover:#e8f4fd;
    --gradA:#667eea; --gradB:#764ba2;
    --txt:#333; --muted:#666; --bd:#e5e5e5; --cell:#ddd;
  }
  *{ box-sizing: border-box; }
  body{
    margin:30px; font-size:12px; line-height:1.5;
    background:#fff;
    font-family:'Noto Sans Thai',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
    width: 90%;
  }
  .header{
    text-align:center; margin-bottom:25px; padding:15px; border-bottom:2px solid var(--bd);
  }
  .title{ font-size:20px; font-weight:700; margin-bottom:10px; color:var(--txt); }
  .date, .date-range{ font-size:12px; color:var(--muted); }
  .date-range{ margin-bottom:5px; font-weight:500; }
  table{
    width:100%; border-collapse:collapse; margin-top:20px; font-size:11px;
    box-shadow:0 2px 8px rgba(0,0,0,.1); border-radius:8px; overflow:hidden;
  }
  th,td{ border:1px solid var(--cell); padding:10px 8px; text-align:left; }
  th{
    background:#fff;
    color:#000; font-weight:700; text-align:center; font-size:12px;
  }
  tbody tr:nth-child(even){ background:var(--bg-even); }
  tbody tr:nth-child(odd){ background:var(--bg-odd); }
  tbody tr:hover{ background:var(--bg-hover); }
  .number-cell{ text-align:center; font-weight:500; }
  .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
  .chip{
    font-weight:700; padding:4px 8px; border-radius:4px; display:inline-block;
  }
  .chip--ok{ color:#28a745; background:#d4edda; }
  .chip--bad{ color:#dc3545; background:#f8d7da; }
  .chip--warn{ color:#fd7e14; background:#fff3cd; }
`;

const createSimpleStockReportHTML = (materials: MaterialReportData[]) => `
<!DOCTYPE html><html><head><meta charset="UTF-8" />
<style>${baseStyles}</style></head>
<body>
  <div class="header">
    <div class="title">รายงานสต็อกวัสดุ</div>
    <div class="date">วันที่: ${new Date().toLocaleDateString("th-TH")}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:12%;">รหัส</th>
        <th style="width:35%;">ชื่อวัสดุ</th>
        <th style="width:20%;">หมวดหมู่</th>
        <th style="width:10%;">สต็อก</th>
        <th style="width:8%;">ขั้นต่ำ</th>
        <th style="width:15%;">สถานะ</th>
      </tr>
    </thead>
    <tbody>
      ${materials
        .map(
          (m) => `
        <tr>
          <td class="mono" style="font-weight:500;">${m.code || "-"}</td>
          <td style="font-weight:500;">${m.name}</td>
          <td>${m.category}</td>
          <td class="number-cell">${m.currentStock} ${m.unit}</td>
          <td class="number-cell">${m.minStock}</td>
          <td>
            <span class="chip ${m.currentStock <= m.minStock ? "chip--bad" : "chip--ok"}">
              ${m.currentStock <= m.minStock ? "ต่ำกว่าขั้นต่ำ" : "ปกติ"}
            </span>
          </td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
</body></html>
`;

const createSimpleTransactionReportHTML = (
  transactions: TransactionReportData[],
  startDate: string,
  endDate: string
) => `
<!DOCTYPE html><html><head><meta charset="UTF-8" />
<style>${baseStyles}</style></head>
<body>
  <div class="header">
    <div class="title">รายงานการเบิก-จ่ายวัสดุ</div>
    <div class="date-range">ระหว่างวันที่: ${startDate} - ${endDate}</div>
    <div class="date">วันที่สร้างรายงาน: ${new Date().toLocaleDateString("th-TH")}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:10%;">วันที่</th>
        <th style="width:30%;">ชื่อวัสดุ</th>
        <th style="width:8%;">ประเภท</th>
        <th style="width:10%;">จำนวน</th>
        <th style="width:8%;">หน่วย</th>
        <th style="width:20%;">ผู้ทำรายการ</th>
        <th style="width:14%;">หน่วยงาน</th>
      </tr>
    </thead>
    <tbody>
      ${transactions
        .map(
          (t) => `
        <tr>
          <td class="mono">${t.date.substring(0, 10)}</td>
          <td style="font-weight:500;">${t.materialName}</td>
          <td style="text-align:center;">
            <span class="chip ${t.type === "OUT" ? "chip--bad" : "chip--ok"}">
              ${t.type === "OUT" ? "เบิก" : "เพิ่ม"}
            </span>
          </td>
          <td class="number-cell">${t.quantity}</td>
          <td class="number-cell">${t.unit}</td>
          <td>${t.userName}</td>
          <td>${t.department || "-"}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
</body></html>
`;

const createSimplePurchaseRequestReportHTML = (
  requests: PurchaseRequestReportData[]
) => `
<!DOCTYPE html><html><head><meta charset="UTF-8" />
<style>${baseStyles}</style></head>
<body>
  <div class="header">
    <div class="title">รายงานคำขอซื้อ</div>
    <div class="date">วันที่: ${new Date().toLocaleDateString("th-TH")}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:10%;">วันที่ขอ</th>
        <th style="width:15%;">ผู้ขอ</th>
        <th style="width:12%;">หน่วยงาน</th>
        <th style="width:10%;">สถานะ</th>
        <th style="width:40%;">รายการที่ขอ</th>
        <th style="width:13%;">เหตุผล</th>
      </tr>
    </thead>
    <tbody>
      ${requests
        .map(
          (r) => `
        <tr>
          <td class="mono">${r.requestDate.substring(0, 10)}</td>
          <td style="font-weight:500;">${r.requesterName}</td>
          <td>${r.department || "-"}</td>
          <td style="text-align:center;">
            <span class="chip ${
              r.status === "PENDING"
                ? "chip--warn"
                : r.status === "APPROVED"
                ? "chip--ok"
                : "chip--bad"
            }">
              ${
                r.status === "PENDING"
                  ? "รออนุมัติ"
                  : r.status === "APPROVED"
                  ? "อนุมัติ"
                  : "ปฏิเสธ"
              }
            </span>
          </td>
          <td style="max-width:300px; word-wrap:break-word; font-size:10px; line-height:1.4;">
            ${parseItemsToNames(r.items)}
          </td>
          <td style="font-size:10px; max-width:120px; word-wrap:break-word;">
            ${r.reason?.length > 30 ? r.reason.substring(0, 30) + "..." : r.reason || "-"}
          </td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
</body></html>
`;

/* --------------------------- Core Rendering --------------------------- */
type Orientation = "p" | "l";

/**
 * แปลง HTML → PDF ด้วย html2canvas + jsPDF
 * - รองรับฟอนต์ไทย (รอโหลด webfont)
 * - เรนเดอร์คมชัดด้วย DPR
 * - ตัดเป็นหลายหน้า A4 อัตโนมัติ
 */
const renderHtmlToPdf = async (html: string, orientation: Orientation = "l") => {
  const isLandscape = orientation === "l";
  const pageSize = isLandscape ? A4_LANDSCAPE_MM : A4_MM;

  const container = createTempContainer(html, RENDER_PX.w);

  const timeoutId = setTimeout(() => {
    // ป้องกันแขวน
    throw new Error("PDF generation timeout");
  }, DEFAULT_TIMEOUT_MS);

  try {
    await waitForFonts();

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // จำกัดไม่ให้ใหญ่เกิน (ไฟล์จะบวม)
    const canvas = await html2canvas(container, {
      width: RENDER_PX.w,
      height: RENDER_PX.h,
      scale: dpr,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const pdf = new jsPDF(orientation, "mm", "a4");
    await addCanvasAsMultipage(pdf, canvas, pageSize.w, pageSize.h);
    return pdf;
  } finally {
    clearTimeout(timeoutId);
    container.remove();
  }
};

/* --------------------------- Public API --------------------------- */
export const generateSimpleStockPDF = async (materials: MaterialReportData[]) => {
  const html = createSimpleStockReportHTML(materials);
  return renderHtmlToPdf(html, "l");
};

export const generateSimpleTransactionPDF = async (
  transactions: TransactionReportData[],
  startDate: string,
  endDate: string
) => {
  const html = createSimpleTransactionReportHTML(transactions, startDate, endDate);
  return renderHtmlToPdf(html, "l");
};

export const generateSimplePurchaseRequestPDF = async (
  requests: PurchaseRequestReportData[]
) => {
  const html = createSimplePurchaseRequestReportHTML(requests);
  return renderHtmlToPdf(html, "l");
};

export const downloadPDF = (pdf: jsPDF, filename: string) => {
  pdf.save(filename);
};
