import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma.js';

const PRIMARY = '#2A9D8F';
const GRAY_DARK = '#333333';
const GRAY_MEDIUM = '#666666';
const GRAY_LIGHT = '#bbbbbb';

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

function formatAge(birthDate) {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = (now.getMonth() - birth.getMonth() + 12) % 12;
  if (years === 0) return `${months} meses`;
  return `${years} ano(s) e ${months} meses`;
}

function section(doc, title) {
  if (doc.y > doc.page.height - 120) doc.addPage();
  doc.moveDown(0.5);
  doc.fillColor(PRIMARY).fontSize(13).font('Helvetica-Bold').text(title);
  doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - doc.page.margins.right, doc.y + 2).strokeColor(PRIMARY).lineWidth(1).stroke();
  doc.moveDown(0.5);
  doc.fillColor(GRAY_DARK).fontSize(10).font('Helvetica');
}

function keyValue(doc, key, value) {
  doc.font('Helvetica-Bold').fillColor(GRAY_MEDIUM).text(`${key}: `, { continued: true });
  doc.font('Helvetica').fillColor(GRAY_DARK).text(String(value ?? '—'));
}

export async function generatePetPdf(petId, userId) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, userId, deletedAt: null },
    include: {
      foodConfig: true,
      vaccines: { orderBy: { nextDue: 'asc' } },
      medications: { orderBy: { createdAt: 'desc' } },
      consultations: { orderBy: { date: 'desc' } },
      dewormings: { orderBy: { nextDue: 'asc' } },
      weightEntries: { orderBy: { date: 'desc' }, take: 20 },
    },
  });
  if (!pet) throw new Error('Pet not found');

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `Prontuário — ${pet.name}`,
      Author: 'PetLife',
      Subject: 'Prontuário do pet',
    },
  });

  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Header
  doc.fillColor(PRIMARY).fontSize(22).font('Helvetica-Bold').text('PetLife');
  doc.fillColor(GRAY_MEDIUM).fontSize(10).font('Helvetica').text('Prontuário completo do pet');
  doc.moveDown(0.5);
  doc.strokeColor(GRAY_LIGHT).lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // Pet identity
  doc.fillColor(GRAY_DARK).fontSize(18).font('Helvetica-Bold').text(pet.name);
  doc.fontSize(10).font('Helvetica').fillColor(GRAY_MEDIUM).text(
    `${pet.species === 'DOG' ? 'Cão' : 'Gato'} • ${pet.breed || 'SRD'} • ${formatAge(pet.birthDate)}`
  );
  doc.moveDown(0.8);

  // Identificação
  section(doc, 'Identificação');
  keyValue(doc, 'Tutor', user?.name || '—');
  keyValue(doc, 'Contato', user?.email || '—');
  keyValue(doc, 'Sexo', pet.sex === 'FEMALE' ? 'Fêmea' : pet.sex === 'MALE' ? 'Macho' : '—');
  keyValue(doc, 'Nascimento', formatDate(pet.birthDate));
  keyValue(doc, 'Peso atual', pet.weight ? `${pet.weight} kg` : '—');
  keyValue(doc, 'Microchip', pet.microchip || 'Não informado');
  keyValue(doc, 'Castrado', pet.neutered ? `Sim${pet.neuteredDate ? ` (${formatDate(pet.neuteredDate)})` : ''}` : 'Não');
  keyValue(doc, 'Nível de atividade', pet.activityLevel || '—');
  keyValue(doc, 'Plano de saúde', pet.healthPlan || 'Nenhum');
  if (pet.allergies?.length) keyValue(doc, 'Alergias', pet.allergies.join(', '));
  if (pet.conditions?.length) keyValue(doc, 'Condições', pet.conditions.join(', '));

  // Alimentação
  if (pet.foodConfig) {
    section(doc, 'Alimentação');
    keyValue(doc, 'Marca', pet.foodConfig.brand || '—');
    keyValue(doc, 'Linha', pet.foodConfig.line || '—');
    keyValue(doc, 'Tipo', pet.foodConfig.type || '—');
    keyValue(doc, 'Porção', pet.foodConfig.portionGrams ? `${pet.foodConfig.portionGrams}g` : '—');
    keyValue(doc, 'Refeições/dia', pet.foodConfig.mealsPerDay || '—');
    if (pet.foodConfig.schedule?.length) {
      keyValue(doc, 'Horários', pet.foodConfig.schedule.join(', '));
    }
  }

  // Vacinas
  section(doc, 'Vacinas');
  if (!pet.vaccines.length) {
    doc.fillColor(GRAY_MEDIUM).text('Nenhuma vacina registrada.');
  } else {
    pet.vaccines.forEach((v) => {
      doc.font('Helvetica-Bold').fillColor(GRAY_DARK).text(`• ${v.name}`);
      doc.font('Helvetica').fillColor(GRAY_MEDIUM)
        .text(`   Última: ${formatDate(v.lastDone)}  |  Próxima: ${formatDate(v.nextDue)}`)
        .text(`   Clínica: ${v.clinic || '—'}  |  Vet: ${v.vet || '—'}`);
      doc.moveDown(0.3);
    });
  }

  // Vermífugos
  section(doc, 'Vermífugos');
  if (!pet.dewormings.length) {
    doc.fillColor(GRAY_MEDIUM).text('Nenhum vermífugo registrado.');
  } else {
    pet.dewormings.forEach((d) => {
      doc.font('Helvetica-Bold').fillColor(GRAY_DARK).text(`• ${d.name}${d.product ? ` (${d.product})` : ''}`);
      doc.font('Helvetica').fillColor(GRAY_MEDIUM)
        .text(`   Última: ${formatDate(d.lastDone)}  |  Próxima: ${formatDate(d.nextDue)}`);
      doc.moveDown(0.3);
    });
  }

  // Medicações
  section(doc, 'Medicações');
  if (!pet.medications.length) {
    doc.fillColor(GRAY_MEDIUM).text('Nenhuma medicação registrada.');
  } else {
    pet.medications.forEach((m) => {
      doc.font('Helvetica-Bold').fillColor(GRAY_DARK).text(`• ${m.name}${m.active ? ' (ativa)' : ''}`);
      doc.font('Helvetica').fillColor(GRAY_MEDIUM)
        .text(`   Dose: ${m.dose || '—'}  |  Frequência: ${m.frequency || '—'}`)
        .text(`   Próxima dose: ${formatDate(m.nextDue)}`);
      doc.moveDown(0.3);
    });
  }

  // Consultas
  section(doc, 'Consultas');
  if (!pet.consultations.length) {
    doc.fillColor(GRAY_MEDIUM).text('Nenhuma consulta registrada.');
  } else {
    pet.consultations.slice(0, 15).forEach((c) => {
      doc.font('Helvetica-Bold').fillColor(GRAY_DARK).text(`• ${formatDate(c.date)} — ${c.type || 'Consulta'}`);
      doc.font('Helvetica').fillColor(GRAY_MEDIUM)
        .text(`   Clínica: ${c.clinic || '—'}  |  Vet: ${c.vet || '—'}`);
      if (c.notes) doc.text(`   Notas: ${c.notes}`);
      doc.moveDown(0.3);
    });
  }

  // Histórico de peso
  section(doc, 'Histórico de peso');
  if (!pet.weightEntries.length) {
    doc.fillColor(GRAY_MEDIUM).text('Sem registros de peso.');
  } else {
    pet.weightEntries.forEach((w) => {
      doc.fillColor(GRAY_DARK).text(`• ${formatDate(w.date)}  —  ${w.value} kg`);
    });
  }

  // Footer
  doc.moveDown(2);
  doc.fillColor(GRAY_LIGHT).fontSize(8).font('Helvetica').text(
    `Gerado por PetLife em ${new Date().toLocaleString('pt-BR')}`,
    { align: 'center' }
  );

  doc.end();
  return done;
}
