import { jsPDF } from 'jspdf';
import { SubjectScore } from './supabase';
import { calculateScaledScore } from './atarCalculation';

export async function exportToPDF(
  atar: number,
  subjectScores: SubjectScore[],
  yearLevel: string,
  studentName?: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  try {
    const logoResponse = await fetch('/HC GriffinAI Logo.png');
    const logoBlob = await logoResponse.blob();
    const logoDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(logoBlob);
    });

    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = logoDataUrl;
    });

    const logoWidth = 60;
    const logoHeight = (img.height / img.width) * logoWidth;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logoDataUrl, 'PNG', logoX, yPosition, logoWidth, logoHeight);
    yPosition += logoHeight + 15;
  } catch (error) {
    console.error('Error loading logo:', error);
    yPosition += 5;
  }

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('WACE ATAR Calculator Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const currentDate = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Generated: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  if (studentName) {
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Student: ${studentName}`, 20, yPosition);
    yPosition += 8;
  }

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Year Level: ${yearLevel}`, 20, yPosition);
  yPosition += 15;

  doc.setFillColor(59, 130, 246);
  doc.rect(0, yPosition, pageWidth, 35, 'F');

  doc.setFontSize(16);
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.text('Predicted ATAR Score', pageWidth / 2, yPosition + 10, { align: 'center' });

  doc.setFontSize(32);
  doc.text(atar.toFixed(2), pageWidth / 2, yPosition + 25, { align: 'center' });
  yPosition += 45;

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 4 Contributing Subjects', 20, yPosition);
  yPosition += 10;

  const sortedScores = [...subjectScores]
    .map(ss => ({
      ...ss,
      scaledScore: calculateScaledScore(ss.rawScore, ss.subject.scaling_factor)
    }))
    .sort((a, b) => b.scaledScore - a.scaledScore);

  const top4 = sortedScores.slice(0, 4);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition, pageWidth - 40, 8, 'F');
  doc.text('Subject', 25, yPosition + 5);
  doc.text('Category', 85, yPosition + 5);
  doc.text('Raw Score', 125, yPosition + 5);
  doc.text('Scaled', 155, yPosition + 5);
  doc.text('Factor', 180, yPosition + 5);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  top4.forEach((ss, index) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPosition, pageWidth - 40, 8, 'F');
    }

    doc.text(ss.subject.name, 25, yPosition + 5);
    doc.text(ss.subject.category, 85, yPosition + 5);
    doc.text(ss.rawScore.toFixed(1), 125, yPosition + 5);
    doc.text(ss.scaledScore.toFixed(2), 155, yPosition + 5);
    doc.text(ss.subject.scaling_factor.toFixed(2) + 'x', 180, yPosition + 5);
    yPosition += 8;
  });

  yPosition += 10;

  const bonusSubjects = subjectScores.filter(ss => ss.subject.has_bonus);
  if (bonusSubjects.length > 0) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(254, 243, 199);
    doc.rect(20, yPosition, pageWidth - 40, 8, 'F');
    doc.text('⭐ Bonus Points Applied', 25, yPosition + 5);
    yPosition += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    bonusSubjects.forEach((ss) => {
      const scaled = calculateScaledScore(ss.rawScore, ss.subject.scaling_factor);
      const bonus = scaled * 0.1;
      doc.text(`${ss.subject.name}: +${bonus.toFixed(2)} points (10% bonus)`, 25, yPosition);
      yPosition += 6;
    });

    yPosition += 8;
  }

  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Notes', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);

  const notes = [
    '• This is an estimate based on historical scaling data from 2024.',
    '• Actual ATAR depends on the cohort strength each year.',
    '• Subject scaling can vary year to year.',
    '• Your school marks and WACE exam results both contribute 50% to your final score.',
    '• Focus on maintaining strong raw scores across all subjects.',
    '• Mathematics and LOTE subjects receive 10% bonus points added to your aggregate.'
  ];

  notes.forEach((note) => {
    if (yPosition > pageHeight - 15) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(note, 20, yPosition);
    yPosition += 5;
  });

  yPosition += 10;
  if (yPosition > pageHeight - 20) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    'For official information, visit the School Curriculum and Standards Authority (SCSA)',
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  doc.text('www.scsa.wa.edu.au', pageWidth / 2, yPosition + 4, { align: 'center' });

  const fileName = studentName
    ? `ATAR_Report_${studentName.replace(/\s+/g, '_')}_${currentDate.replace(/\s+/g, '_')}.pdf`
    : `ATAR_Report_${currentDate.replace(/\s+/g, '_')}.pdf`;

  doc.save(fileName);
}
