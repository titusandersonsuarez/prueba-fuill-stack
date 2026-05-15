import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

interface PrescriptionItem {
  medicationName: string;
  dosage?: string | null;
  frequency?: string | null;
  quantity?: number | null;
  instructions?: string | null;
}

interface PrescriptionForPdf {
  code: string;
  status: string;
  notes?: string | null;
  consumedAt?: Date | null;
  createdAt: Date;
  author: {
    firstName: string;
    lastName: string;
    speciality: string;
    licenseNumber: string;
  };
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date | null;
  };
  items: PrescriptionItem[];
}

@Injectable()
export class PdfService {
  async generatePrescriptionPdf(prescription: PrescriptionForPdf): Promise<Buffer> {
    const qrBuffer = await QRCode.toBuffer(prescription.code, {
      type: 'png',
      width: 120,
      margin: 1,
    });

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.buildDocument(doc, prescription, qrBuffer);
      doc.end();
    });
  }

  private buildDocument(
    doc: InstanceType<typeof PDFDocument>,
    p: PrescriptionForPdf,
    qrBuffer: Buffer,
  ): void {
    const BLUE = '#1a56db';
    const GRAY = '#6b7280';
    const LIGHT = '#f3f4f6';
    const pageWidth = doc.page.width - 100; // 50 margin each side

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(50, 50, pageWidth, 70).fill(BLUE);
    doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text('PRESCRIPCIÓN MÉDICA', 60, 68);
    doc.fontSize(10).font('Helvetica').text('Sistema de Gestión de Prescripciones', 60, 93);

    // QR code (top-right inside header)
    doc.image(qrBuffer, pageWidth - 30, 52, { width: 66 });

    // Code below QR
    doc
      .fillColor(GRAY)
      .fontSize(8)
      .text(p.code, pageWidth - 30, 120, { width: 80, align: 'center' });

    doc.fillColor('black');
    let y = 145;

    // ── Doctor info ──────────────────────────────────────────────────────────
    y = this.section(doc, 'MÉDICO', y, BLUE);
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text(`Dr. ${p.author.firstName} ${p.author.lastName}`, 60, y);
    y += 18;
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(GRAY)
      .text(
        `Especialidad: ${p.author.speciality}   ·   Licencia: ${p.author.licenseNumber}`,
        60,
        y,
      );
    y += 28;

    // ── Patient info ─────────────────────────────────────────────────────────
    y = this.section(doc, 'PACIENTE', y, BLUE);
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text(`${p.patient.firstName} ${p.patient.lastName}`, 60, y);
    y += 18;

    const dateStr = p.createdAt.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.fontSize(10).font('Helvetica').fillColor(GRAY).text(`Fecha de emisión: ${dateStr}`, 60, y);

    if (p.patient.dateOfBirth) {
      const dob = p.patient.dateOfBirth.toLocaleDateString('es-ES');
      doc.text(`  ·  Fecha de nacimiento: ${dob}`, { continued: false });
    }
    y += 28;

    // ── Items table ───────────────────────────────────────────────────────────
    y = this.section(doc, 'MEDICAMENTOS', y, BLUE);

    p.items.forEach((item, idx) => {
      // Row background
      if (idx % 2 === 0) {
        doc.rect(50, y - 4, pageWidth, 46).fill(LIGHT);
      }

      doc
        .fillColor('black')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`${idx + 1}. ${item.medicationName}`, 60, y);
      y += 16;

      const meta: string[] = [];
      if (item.dosage) meta.push(`Dosis: ${item.dosage}`);
      if (item.frequency) meta.push(`Frecuencia: ${item.frequency}`);
      if (item.quantity != null) meta.push(`Cantidad: ${item.quantity}`);
      if (meta.length) {
        doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(meta.join('   ·   '), 68, y);
        y += 13;
      }
      if (item.instructions) {
        doc
          .fontSize(9)
          .font('Helvetica-Oblique')
          .fillColor(GRAY)
          .text(`Indicaciones: ${item.instructions}`, 68, y, { width: pageWidth - 20 });
        y += 13;
      }
      y += 8;
    });

    y += 4;

    // ── Notes ─────────────────────────────────────────────────────────────────
    if (p.notes) {
      y = this.section(doc, 'NOTAS', y, BLUE);
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('black')
        .text(p.notes, 60, y, { width: pageWidth });
      y += doc.heightOfString(p.notes, { width: pageWidth }) + 16;
    }

    // ── Status ────────────────────────────────────────────────────────────────
    y += 10;
    const statusLabel = p.status === 'consumed' ? 'CONSUMIDA' : 'PENDIENTE';
    const statusColor = p.status === 'consumed' ? '#059669' : '#d97706';
    doc.roundedRect(50, y, 140, 28, 4).fill(statusColor);
    doc
      .fillColor('white')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(statusLabel, 50, y + 8, { width: 140, align: 'center' });

    if (p.consumedAt) {
      const consumedStr = p.consumedAt.toLocaleDateString('es-ES');
      doc
        .fillColor(GRAY)
        .fontSize(9)
        .font('Helvetica')
        .text(`Consumida el ${consumedStr}`, 205, y + 10);
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    doc
      .fillColor(GRAY)
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Documento generado el ${new Date().toLocaleString('es-ES')}`,
        50,
        doc.page.height - 60,
        { align: 'center', width: pageWidth },
      );
  }

  private section(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    y: number,
    color: string,
  ): number {
    doc
      .moveTo(50, y)
      .lineTo(doc.page.width - 50, y)
      .strokeColor(color)
      .lineWidth(1.5)
      .stroke();
    y += 6;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(color).text(title, 50, y);
    y += 16;
    return y;
  }
}
