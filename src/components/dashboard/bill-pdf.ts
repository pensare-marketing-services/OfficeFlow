import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Client, Bill } from '@/lib/data';

export const generateBillPDF = (bill: Bill, client: Client): Blob => {
    const doc = new jsPDF();
    let finalY = 20;

    // Header
    // Note: The logo path is hardcoded. Ensure '/avatars/app-logo-black.png' exists in your public folder.
    // As we cannot add binary files, this will only work if the image is already present.
    // doc.addImage('/avatars/app-logo-black.png', 'PNG', 14, 15, 50, 20);
    
    doc.setFontSize(10);
    doc.text('Your Company Name', 195, 15, { align: 'right' });
    doc.text('123 Business Rd.', 195, 20, { align: 'right' });
    doc.text('Business City, BC 12345', 195, 25, { align: 'right' });
    doc.text('contact@yourcompany.com', 195, 30, { align: 'right' });
    
    finalY += 25;
    doc.setDrawColor(200);
    doc.line(14, finalY, 196, finalY);
    finalY += 10;

    // Bill To
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(client.name, 14, finalY + 5);
    // Add more client details if available
    // doc.text(client.address, 14, finalY + 10);
    finalY += 20;

    // Bill Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`INVOICE #${bill.slNo}`, 195, finalY, { align: 'right' });
    finalY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
        startY: finalY,
        body: [
            ['Bill Status:', bill.status],
            ['Date of Issue:', format(new Date(bill.issuedDate), 'MMM dd, yyyy')],
            ['Service Duration:', bill.duration],
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1 },
        columnStyles: { 0: { fontStyle: 'bold', halign: 'right' }, 1: { halign: 'left' } },
        tableWidth: 'wrap',
        margin: { left: 120 }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Bill Items Table
    autoTable(doc, {
        startY: finalY,
        head: [['Description', 'Amount']],
        body: [
            [`Services for the period: ${bill.duration}`, bill.billAmount.toFixed(2)],
            // Add more items here if they exist in the bill data model
        ],
        foot: [
            [{ content: 'Total Amount', colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } }, bill.billAmount.toFixed(2)],
            [{ content: 'Balance Due', colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } }, bill.balance.toFixed(2)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [33, 37, 41] },
        footStyles: { fillColor: [248, 249, 250], textColor: 0 },
    });
    finalY = (doc as any).lastAutoTable.finalY + 20;

    // Footer / Notes
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 14, finalY);
    doc.text('Please make payments to the details provided separately.', 14, finalY + 5);

    return doc.output('blob');
};
