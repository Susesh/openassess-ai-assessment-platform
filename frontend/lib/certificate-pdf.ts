import { jsPDF } from "jspdf";
import type { Certificate } from "./types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB");
}

function getCertificateContent(certificate: Certificate) {
  if (certificate.certificate_type === "achievement") {
    return {
      title: "Certificate of Achievement",
      mainText: "has successfully achieved",
      subtitle: `a score of ${certificate.percentage}% in the ${certificate.topic_name} assessment and demonstrated proficiency in the subject`,
      textColor: [34, 197, 94] as [number, number, number], // emerald-600
    };
  } else {
    return {
      title: "Certificate of Participation",
      mainText: "participated in and completed",
      subtitle: `the ${certificate.topic_name} assessment on OpenAssess`,
      textColor: [79, 70, 229] as [number, number, number], // indigo-600
    };
  }
}

export function downloadCertificatePdf(certificate: Certificate): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const content = getCertificateContent(certificate);

  // Background
  doc.setFillColor(245, 247, 255);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");

  // Border
  doc.setDrawColor(...content.textColor);
  doc.setLineWidth(1.5);
  doc.rect(14, 14, pageWidth - 28, 182);

  // Logo/Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...content.textColor);
  doc.text("OpenAssess", pageWidth / 2, 34, { align: "center" });

  // Certificate Title
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.text(content.title, pageWidth / 2, 56, { align: "center" });

  // "This certifies that"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(71, 85, 105);
  doc.text("This certifies that", pageWidth / 2, 76, { align: "center" });

  // Student Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(certificate.student_name, pageWidth / 2, 93, { align: "center" });

  // Main text (achievement/participation)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(71, 85, 105);
  doc.text(content.mainText, pageWidth / 2, 110, { align: "center" });

  // Achievement/Participation details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(content.subtitle, pageWidth / 2, 125, { align: "center", maxWidth: 150 });

  // Score and Percentage
  doc.setFontSize(12);
  doc.text(
    `Score: ${certificate.score}/${certificate.total}    Percentage: ${certificate.percentage}%`,
    pageWidth / 2,
    146,
    { align: "center" }
  );

  // Certificate ID and Date
  doc.setFontSize(10);
  doc.text(`Certificate ID: ${certificate.certificate_id}`, 28, 174);
  doc.text(`Date: ${formatDate(certificate.issued_at)}`, 28, 184);

  // QR block (real QR image when available, otherwise graceful placeholder)
  const qrX = pageWidth - 55;
  const qrY = 164;
  const qrSize = 28;
  doc.setDrawColor(148, 163, 184);
  doc.rect(qrX, qrY, qrSize, qrSize);

  if (certificate.qr_code_data_url) {
    try {
      doc.addImage(certificate.qr_code_data_url, "PNG", qrX + 1, qrY + 1, qrSize - 2, qrSize - 2);
    } catch {
      doc.setFontSize(8);
      doc.text("QR Error", qrX + qrSize / 2, qrY + 14, { align: "center" });
    }
  } else {
    doc.setFontSize(8);
    doc.text("QR Unavailable", qrX + qrSize / 2, qrY + 14, { align: "center" });
  }

  doc.save(`${certificate.certificate_id}.pdf`);
}
