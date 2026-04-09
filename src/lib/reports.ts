import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CorridaReport {
  motorista: string;
  veiculo: string;
  placa: string;
  destino: string;
  km_inicio: number;
  km_fim: number | null;
  status: string;
  criado_em: string;
  finalizada_em: string | null;
}

interface AbastecimentoReport {
  motorista: string;
  veiculo: string;
  valor: number;
  km: number;
  criado_em: string;
}

interface ZonaAzulReport {
  motorista: string;
  valor: number;
  localizacao: string;
  criado_em: string;
}

export function exportCorridasPDF(corridas: CorridaReport[], titulo: string = 'Relatório de Corridas') {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('NupDrive', 14, 15);
  doc.setFontSize(10);
  doc.text(titulo, 14, 23);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 210 - 14, 23, { align: 'right' });

  // Table
  doc.setTextColor(0, 0, 0);
  autoTable(doc, {
    startY: 36,
    head: [['Motorista', 'Veículo', 'Placa', 'Destino', 'Km Início', 'Km Fim', 'Distância', 'Status', 'Data']],
    body: corridas.map(c => [
      c.motorista,
      c.veiculo,
      c.placa,
      c.destino || '-',
      c.km_inicio?.toString() || '-',
      c.km_fim?.toString() || '-',
      c.km_fim ? `${c.km_fim - c.km_inicio} km` : '-',
      c.status === 'em_andamento' ? 'Em Andamento' : 'Finalizada',
      format(new Date(c.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [124, 58, 237] },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  // Summary
  const totalKm = corridas.reduce((acc, c) => acc + (c.km_fim ? c.km_fim - c.km_inicio : 0), 0);
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  doc.setFontSize(10);
  doc.text(`Total de corridas: ${corridas.length}`, 14, finalY + 10);
  doc.text(`Km total percorrido: ${totalKm.toLocaleString()} km`, 14, finalY + 16);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('© ANUP • NupDrive', 14, 285);

  doc.save(`nupdrive_corridas_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

export function exportCorridasExcel(corridas: CorridaReport[]) {
  const data = corridas.map(c => ({
    'Motorista': c.motorista,
    'Veículo': c.veiculo,
    'Placa': c.placa,
    'Destino': c.destino || '-',
    'Km Início': c.km_inicio,
    'Km Fim': c.km_fim || '-',
    'Distância (km)': c.km_fim ? c.km_fim - c.km_inicio : '-',
    'Status': c.status === 'em_andamento' ? 'Em Andamento' : 'Finalizada',
    'Data': format(new Date(c.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    'Finalizada em': c.finalizada_em ? format(new Date(c.finalizada_em), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Corridas');
  XLSX.writeFile(wb, `nupdrive_corridas_${format(new Date(), 'yyyyMMdd')}.xlsx`);
}

export function exportAbastecimentosPDF(abastecimentos: AbastecimentoReport[]) {
  const doc = new jsPDF();
  
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('NupDrive', 14, 15);
  doc.setFontSize(10);
  doc.text('Relatório de Abastecimentos', 14, 23);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 196, 23, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  autoTable(doc, {
    startY: 36,
    head: [['Motorista', 'Veículo', 'Valor (R$)', 'Km', 'Data']],
    body: abastecimentos.map(a => [
      a.motorista,
      a.veiculo,
      `R$ ${a.valor.toFixed(2)}`,
      a.km.toString(),
      format(new Date(a.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [124, 58, 237] },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  const total = abastecimentos.reduce((acc, a) => acc + a.valor, 0);
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  doc.text(`Total: R$ ${total.toFixed(2)}`, 14, finalY + 10);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('© ANUP • NupDrive', 14, 285);

  doc.save(`nupdrive_abastecimentos_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

export function exportAbastecimentosExcel(abastecimentos: AbastecimentoReport[]) {
  const data = abastecimentos.map(a => ({
    'Motorista': a.motorista,
    'Veículo': a.veiculo,
    'Valor (R$)': a.valor,
    'Km': a.km,
    'Data': format(new Date(a.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Abastecimentos');
  XLSX.writeFile(wb, `nupdrive_abastecimentos_${format(new Date(), 'yyyyMMdd')}.xlsx`);
}

export function exportZonaAzulPDF(zonas: ZonaAzulReport[]) {
  const doc = new jsPDF();
  
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('NupDrive', 14, 15);
  doc.setFontSize(10);
  doc.text('Relatório de Zona Azul', 14, 23);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 196, 23, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  autoTable(doc, {
    startY: 36,
    head: [['Motorista', 'Valor (R$)', 'Localização', 'Data']],
    body: zonas.map(z => [
      z.motorista,
      `R$ ${z.valor.toFixed(2)}`,
      z.localizacao || '-',
      format(new Date(z.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [124, 58, 237] },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  const total = zonas.reduce((acc, z) => acc + z.valor, 0);
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  doc.text(`Total: R$ ${total.toFixed(2)}`, 14, finalY + 10);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('© ANUP • NupDrive', 14, 285);

  doc.save(`nupdrive_zona_azul_${format(new Date(), 'yyyyMMdd')}.pdf`);
}
