import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Registration, Forum, EventMasterInfo, ForumInvitationTemplate } from '../types/index.ts';

export interface GeneratePdfOptions {
  registration: Registration;
  forum: Forum;
  eventInfo: EventMasterInfo;
  template?: ForumInvitationTemplate | null;
}

/**
 * Generates an official, forum-specific formal invitation PDF.
 * Follows exact specifications:
 * - A4 portrait (210 x 297 mm)
 * - Professional white background with navy and purple table headers
 * - Formal typography and section alignment
 * - Real QR code linking to verification URL
 * - Forum-specific template wording and instructions
 */
export async function generateInvitationPdf({
  registration,
  forum,
  eventInfo,
  template,
}: GeneratePdfOptions): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Colors
  const navyDark = [15, 23, 42]; // #0F172A
  const navyDeep = [30, 27, 75]; // #1E1B4B
  const purplePrimary = [99, 102, 241]; // #6366F1
  const purpleDark = [88, 28, 135]; // #581C87
  const borderGrey = [203, 213, 225]; // #CBD5E1
  const bgLightGrey = [248, 250, 252]; // #F8FAFC
  const textMuted = [100, 116, 139]; // #64748B
  const textDark = [15, 23, 42]; // #0F172A

  // Generate QR Code data URL
  let qrCodeDataUrl = '';
  try {
    const verifyUrl = `${window.location.origin}/verify?regId=${encodeURIComponent(registration.registration_number)}`;
    qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.warn('QR Code generation fallback:', err);
  }

  // 1. TOP HEADER & BRANDING BAR
  doc.setFillColor(navyDeep[0], navyDeep[1], navyDeep[2]);
  doc.rect(margin, margin, contentWidth, 22, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('REGISTER TO EVENT (RTE)', margin + 6, margin + 9);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254); // indigo-200
  doc.text('DISCOVER. REGISTER. PARTICIPATE.', margin + 6, margin + 15);

  // Right Header badge: FORUM SPECIFIC IDENTIFIER
  doc.setFillColor(purplePrimary[0], purplePrimary[1], purplePrimary[2]);
  doc.roundedRect(pageWidth - margin - 58, margin + 4.5, 52, 13, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL FORUM INVITATION', pageWidth - margin - 55, margin + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`TRACK: ${forum.category.toUpperCase()}`, pageWidth - margin - 55, margin + 14);

  let currentY = margin + 28;

  // 2. DOCUMENT TITLE & SUBTITLE
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('EVENT INVITATION & PARTICIPANT DETAILS', margin, currentY);

  doc.setTextColor(purpleDark[0], purpleDark[1], purpleDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIAL PARTICIPANT RECORD & FORMAL INVITATION', margin, currentY + 4.5);

  // Registration ID Box on right
  doc.setFillColor(bgLightGrey[0], bgLightGrey[1], bgLightGrey[2]);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.rect(pageWidth - margin - 55, currentY - 5, 55, 12, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('REGISTRATION NUMBER', pageWidth - margin - 52, currentY - 1);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(navyDeep[0], navyDeep[1], navyDeep[2]);
  doc.text(registration.registration_number, pageWidth - margin - 52, currentY + 4.5);

  currentY += 13;

  // Divider line
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // 3. MASTER EVENT & FORUM SUMMARY BAR
  doc.setFillColor(bgLightGrey[0], bgLightGrey[1], bgLightGrey[2]);
  doc.rect(margin, currentY, contentWidth - 32, 23, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(`FORUM: ${forum.name.toUpperCase()}`, margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Event Dates:  03 December 2026 – 06 December 2026`, margin + 4, currentY + 11);
  doc.text(`Venue:           Jamshedpur, Jharkhand, India   (Timezone: Asia/Kolkata)`, margin + 4, currentY + 16.5);
  doc.text(`Forum Venue: ${forum.venue} | Schedule: ${forum.event_dates}`, margin + 4, currentY + 21);

  // Draw QR code on right
  if (qrCodeDataUrl) {
    doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
    doc.rect(pageWidth - margin - 28, currentY, 28, 23, 'FD');
    doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - margin - 26, currentY + 1.5, 20, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('SCAN TO VERIFY', pageWidth - margin - 24, currentY + 22.5);
  }

  currentY += 28;

  // 4. FORMAL INVITATION TEXT (Forum-specific!)
  const salutation = template?.formal_salutation || 'Dear Delegate,';
  const invitationBody =
    template?.invitation_text ||
    `We have the distinct honor of formally inviting you to participate in the ${forum.name} at the National Summit in Jamshedpur. Your application has undergone official review and is formally confirmed on the delegate register.`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(navyDeep[0], navyDeep[1], navyDeep[2]);
  doc.text(salutation, margin, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const splitInvitation = doc.splitTextToSize(invitationBody, contentWidth);
  doc.text(splitInvitation, margin, currentY);
  currentY += splitInvitation.length * 3.8 + 3;

  // 5. PARTICIPANT DETAILS TABLE (Navy Header)
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PARTICIPANT DETAILS', margin + 4, currentY + 4.2);
  currentY += 6;

  // Grid rows
  const participantRows = [
    [
      { label: 'Full Name', value: registration.full_name },
      { label: 'Class / Grade', value: registration.class_grade },
    ],
    [
      { label: 'Participant ID (PID)', value: registration.participant_id_number },
      { label: 'Date of Birth (DOB)', value: registration.date_of_birth },
    ],
    [
      { label: 'Contact Number', value: registration.contact_number },
      { label: 'Email Address', value: registration.email },
    ],
    [
      {
        label: 'ID Verification',
        value: `${registration.masked_id_type === 'school_id' ? 'School ID' : 'Masked Aadhaar'}: ${registration.masked_id_value}`,
      },
      { label: 'Registration Status', value: registration.status.toUpperCase() },
    ],
  ];

  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.2);

  const colWidth = contentWidth / 2;

  participantRows.forEach((row, idx) => {
    const rowHeight = 7.2;
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, currentY, contentWidth, rowHeight, 'FD');

    // Col 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(row[0].label.toUpperCase(), margin + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(row[0].value || 'N/A', margin + 35, currentY + 4.5);

    // Mid separator
    doc.line(margin + colWidth, currentY, margin + colWidth, currentY + rowHeight);

    // Col 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(row[1].label.toUpperCase(), margin + colWidth + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(row[1].value || 'N/A', margin + colWidth + 38, currentY + 4.5);

    currentY += rowHeight;
  });

  currentY += 4;

  // 6. PAYMENT DETAILS TABLE (Purple Header - where applicable)
  if (forum.is_paid || registration.payment_status !== 'free') {
    doc.setFillColor(purpleDark[0], purpleDark[1], purpleDark[2]);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('PAYMENT DETAILS & VERIFICATION RECORD', margin + 4, currentY + 4.2);
    currentY += 6;

    const paymentRows = [
      [
        { label: 'Registration Fee', value: `INR ${forum.registration_fee.toFixed(2)}` },
        { label: 'Payment Status', value: registration.payment_status.toUpperCase().replace('_', ' ') },
      ],
      [
        { label: 'Transaction Reference', value: registration.payment_reference || 'Pending Submission / Verification' },
        { label: 'Verification Method', value: 'Manual Admin Audit Clearance' },
      ],
    ];

    paymentRows.forEach((row, idx) => {
      const rowHeight = 7;
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'FD');

      // Col 1
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(row[0].label.toUpperCase(), margin + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(row[0].value, margin + 40, currentY + 4.5);

      doc.line(margin + colWidth, currentY, margin + colWidth, currentY + rowHeight);

      // Col 2
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(row[1].label.toUpperCase(), margin + colWidth + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(row[1].value, margin + colWidth + 40, currentY + 4.5);

      currentY += rowHeight;
    });

    currentY += 4;
  }

  // 7. TERMS & CONDITIONS (Forum Specific)
  doc.setFillColor(bgLightGrey[0], bgLightGrey[1], bgLightGrey[2]);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.rect(margin, currentY, contentWidth, 27, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(navyDeep[0], navyDeep[1], navyDeep[2]);
  doc.text('TERMS & CONDITIONS FOR PARTICIPATION', margin + 3, currentY + 4.5);

  const defaultTerms = [
    '1. This invitation is personal, strictly non-transferable, and valid only for the named delegate.',
    '2. Physical presentation of this official invitation and matching photo institutional ID is mandatory at entry.',
    '3. Attendees must report to Jamshedpur Summit Center 45 minutes prior to the scheduled session commencement.',
    '4. Full adherence to the RTE Code of Academic & Professional Conduct is required throughout the event.',
  ];

  const terms = template?.terms_and_conditions?.length ? template.terms_and_conditions : defaultTerms;
  let tcY = currentY + 8.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);

  terms.slice(0, 4).forEach((term) => {
    doc.text(term, margin + 3, tcY);
    tcY += 4.2;
  });

  currentY += 31;

  // 8. CONTACT INFORMATION & SIGNATURE ROW
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // Contact info left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('SECRETARIAT & HELPDESK:', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Email: ${eventInfo.contact_email}  |  Phone: ${eventInfo.contact_phone}`, margin, currentY + 4);
  doc.text(`Venue Address: ${eventInfo.venue}`, margin, currentY + 7.5);

  // Official Signature Right
  const signatoryName = template?.signatory_name || 'Director General, RTE Secretariat';
  const signatoryTitle = template?.signatory_designation || 'Secretary General, RTE Committee';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(signatoryName, pageWidth - margin - 50, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(signatoryTitle, pageWidth - margin - 50, currentY + 4);
  doc.text('RTE National Summit Jamshedpur', pageWidth - margin - 50, currentY + 7.5);

  // 9. FOOTER (Bottom of A4 page)
  const footerY = pageHeight - margin + 2;
  doc.setFillColor(bgLightGrey[0], bgLightGrey[1], bgLightGrey[2]);
  doc.rect(margin, footerY - 5, contentWidth, 7, 'F');
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`PARTICIPANT: ${registration.full_name.toUpperCase()}  |  REG NO: ${registration.registration_number}`, margin + 3, footerY - 0.8);

  const timestamp = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`ISSUED: ${timestamp}  |  RTE OFFICIAL DOCUMENT`, pageWidth - margin - 55, footerY - 0.8);

  return doc;
}

/**
 * Convenience helper to download the invitation PDF directly in browser
 */
export async function downloadInvitationPdf(options: GeneratePdfOptions): Promise<void> {
  const doc = await generateInvitationPdf(options);
  const cleanForumSlug = options.forum.slug || 'forum';
  const filename = `RTE_Invitation_${cleanForumSlug}_${options.registration.registration_number}.pdf`;
  doc.save(filename);
}

/**
 * Returns a data URL string of the generated PDF for iframe or preview modal
 */
export async function getPdfDataUrl(options: GeneratePdfOptions): Promise<string> {
  const doc = await generateInvitationPdf(options);
  return doc.output('datauristring');
}
