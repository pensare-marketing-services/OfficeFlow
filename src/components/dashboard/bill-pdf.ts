
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Client, Bill } from '@/lib/data';

export const generateBillPDF = (bill: Bill, client: Client): Blob => {
    const doc = new jsPDF();
    let finalY = 20;
    const pageMargin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- HEADER ---
    try {
        doc.addImage('/avatars/app-logo-black.png', 'PNG', pageMargin, 15, 50, 15);
    } catch(e) {
        console.error("Error adding logo to PDF.", e);
        doc.setFontSize(14).setFont('helvetica', 'bold');
        doc.text('OfficeFlow', pageMargin, 25);
    }
    
    doc.setFontSize(9).setFont('helvetica', 'normal');
    const companyAddress = [
        'First Floor, #1301, TK Tower',
        'Above Chicking Koduvally',
        'Calicut, Kerala-673572'
    ];
    doc.text(companyAddress, pageWidth - pageMargin, 15, { align: 'right' });

    finalY = 40;
    doc.setDrawColor(220, 220, 220);
    doc.line(pageMargin, finalY, pageWidth - pageMargin, finalY);
    
    finalY += 15;

    // --- INVOICE TITLE ---
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50); // Dark grey text
    doc.text('INVOICE', pageWidth / 2, finalY, { align: 'center' });
    finalY += 20;
    doc.setTextColor(0, 0, 0); // Reset text color

    // --- BILL TO & DETAILS ---
    const billToStartY = finalY;
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('BILL TO', pageMargin, billToStartY);
    doc.setFontSize(10).setFont('helvetica', 'normal');
    const billToLines = [client.name];
    if (client.address) {
        billToLines.push(...doc.splitTextToSize(client.address, 80));
    }
    doc.text(billToLines, pageMargin, billToStartY + 7);
    
    // Details section (right aligned table)
    autoTable(doc, {
        body: [
            ['Invoice #:', `${bill.slNo}`],
            ['Date of Issue:', format(new Date(bill.issuedDate), 'MMM dd, yyyy')],
            ['Service Duration:', bill.duration],
        ],
        theme: 'plain',
        startY: billToStartY - 1, // Align top of this table with "BILL TO"
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: { 0: { fontStyle: 'bold', halign: 'left' }, 1: { halign: 'left' } },
        tableWidth: 'wrap',
        margin: { left: pageWidth - pageMargin - 95 } // Position it from the right edge
    });

    finalY = Math.max(
        (doc as any).lastAutoTable.finalY, 
        billToStartY + 7 + (billToLines.length * 5)
    ) + 15;


    // --- ITEMS TABLE ---
    const tableBody = bill.items && bill.items.length > 0
        ? bill.items.map(item => [item.description, item.amount.toFixed(2)])
        : [['No items specified', '0.00']];

    autoTable(doc, {
        startY: finalY,
        head: [['Description', 'Amount']],
        body: tableBody,
        foot: [
            [{ content: 'Total Amount', styles: { halign: 'right', fontStyle: 'bold' } }, { content: bill.billAmount.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }],
            [{ content: 'Balance Due', styles: { halign: 'right', fontStyle: 'bold' } }, { content: bill.balance.toFixed(2), styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } }],
        ],
        theme: 'striped',
        headStyles: { fillColor: [33, 37, 41], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        footStyles: { fillColor: false, textColor: 0, fontStyle: 'normal', cellPadding: {top: 4, bottom: 4}, HlineColor: [33,37,41]},
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: { 1: { halign: 'right' } },
        didDrawPage: (data) => {
            // Redraw header on new page
            if (data.pageNumber > 1) {
                 // You can add headers for subsequent pages here if needed
            }
        }
    });
    finalY = (doc as any).lastAutoTable.finalY + 20;

    // --- FOOTER / NOTES ---
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8).setFont('helvetica', 'bold');
    doc.text('Bank Details:', pageMargin, pageHeight - 40);
    
    doc.setFont('helvetica', 'normal');
    const bankDetails = [
        'PENSARE MARKETING',
        'State Bank of India, Koduvally Branch',
        'A/C No: 39003560642',
        'IFSC Code: SBIN0001442',
        'GPay: 9745600523'
    ];
    doc.text(bankDetails, pageMargin, pageHeight - 36);

    doc.setFontSize(9).setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    return doc.output('blob');
};
