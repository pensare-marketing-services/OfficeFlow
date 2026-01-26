
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Client, Bill } from '@/lib/data';

export const generateBillPDF = (bill: Bill, client: Client): Blob => {
    const doc = new jsPDF();
    let finalY = 20;

    // Header
    // Note: The logo path is hardcoded. It MUST exist in `/public/avatars/app-logo-black.png`.
    try {
        doc.addImage('/avatars/app-logo-black.png', 'PNG', 14, 15, 50, 15);
    } catch(e) {
        console.error("Error adding logo to PDF. Make sure the image exists at /public/avatars/app-logo-black.png", e);
        doc.setFontSize(14);
        doc.text('OfficeFlow', 14, 25);
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('First Floor, #1301, TK Tower', 196, 15, { align: 'right' });
    doc.text('Above Chicking Koduvally', 196, 20, { align: 'right' });
    doc.text('Calicut, Kerala-673572', 196, 25, { align: 'right' });
    
    finalY = 35;
    doc.setDrawColor(200);
    doc.line(14, finalY, 196, finalY);
    finalY += 10;

    // Bill To & Invoice Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(client.name, 14, finalY + 5);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`INVOICE #${bill.slNo}`, 196, finalY, { align: 'right' });

    finalY += 8;

    autoTable(doc, {
        startY: finalY,
        body: [
            ['Date of Issue:', format(new Date(bill.issuedDate), 'MMM dd, yyyy')],
            ['Service Duration:', bill.duration],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 0.5 },
        columnStyles: { 0: { fontStyle: 'bold', halign: 'right' }, 1: { halign: 'left' } },
        tableWidth: 'wrap',
        margin: { left: 130 }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Bill Items Table
    const tableBody = bill.items && bill.items.length > 0
        ? bill.items.map(item => [item.description, item.amount.toFixed(2)])
        : [['No items specified', '0.00']];

    autoTable(doc, {
        startY: finalY,
        head: [['Description', 'Amount']],
        body: tableBody,
        foot: [
            [{ content: 'Total Amount', styles: { halign: 'right', fontStyle: 'bold' } }, { content: bill.billAmount.toFixed(2), styles: { halign: 'right' } }],
            [{ content: 'Balance Due', styles: { halign: 'right', fontStyle: 'bold' } }, { content: bill.balance.toFixed(2), styles: { halign: 'right' } }],
        ],
        theme: 'striped',
        headStyles: { fillColor: [33, 37, 41], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        footStyles: { fillColor: false, textColor: 0, fontStyle: 'normal' },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: { 1: { halign: 'right' } }
    });
    finalY = (doc as any).lastAutoTable.finalY + 15;

    // Footer / Notes
    doc.setFontSize(9);
    doc.text('Thank you for your business!', 14, finalY);

    finalY += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Details:', 14, finalY);
    
    finalY += 4;
    doc.setFont('helvetica', 'normal');
    doc.text('PENSARE MARKETING', 14, finalY);
    finalY += 4;
    doc.text('State Bank of India, Koduvally Branch', 14, finalY);
    finalY += 4;
    doc.text('A/C No: 39003560642', 14, finalY);
    finalY += 4;
    doc.text('IFSC Code: SBIN0001442', 14, finalY);
    finalY += 4;
    doc.text('GPay: 9745600523', 14, finalY);

    return doc.output('blob');
};
