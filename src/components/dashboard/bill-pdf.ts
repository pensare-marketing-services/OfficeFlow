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
        // logo path must be relative to the public folder or a base64 string
        doc.addImage('/avatars/app-logo-black.png', 'PNG', pageMargin, 15, 40, 15);
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
    
    finalY += 8;

    // --- CLIENT ADDRESS & INVOICE HEADING ---
    const blockStartY = finalY;
    
    // Left side: Client Address
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text(client.name, pageMargin, blockStartY);
    
    // Add INVOICE heading in parallel (right aligned) - Size 10 as requested
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('INVOICE', pageWidth - pageMargin, blockStartY, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset color
    
    doc.setFontSize(9).setFont('helvetica', 'normal');
    let addressOffset = 6;
    if (client.address) {
        const addressLines = doc.splitTextToSize(client.address, 80);
        const maxLines = Math.min(addressLines.length, 3);
        for (let i = 0; i < maxLines; i++) {
            doc.text(addressLines[i], pageMargin, blockStartY + addressOffset + (i * 4.5));
        }
        addressOffset += (maxLines * 4.5);
    }
    
    // Right side: Invoice Details (smaller text, moved closer to INVOICE heading)
    doc.setFontSize(8).setFont('helvetica', 'bold');
    const invoiceDetails = [
        `Invoice No: #${bill.slNo}`,
        `Issued Date: ${format(new Date(bill.issuedDate), 'dd/MM/yyyy')}`
    ];
    
    // Tightened the gap significantly here
    const invoiceDetailsY = blockStartY + 6; 
    doc.text(invoiceDetails, pageWidth - pageMargin, invoiceDetailsY, { align: 'right' });
    
    // Update finalY to be after client block with a small gap
    finalY = Math.max(
        blockStartY + addressOffset,
        invoiceDetailsY + (invoiceDetails.length * 4)
    ) + 8;

    // --- ITEMS TABLE ---
    // Changed ₹ to Rs. because standard PDF fonts do not support the Unicode Rupee symbol
    const tableBody = bill.items && bill.items.length > 0
        ? bill.items.map((item, index) => [`${index + 1}`, item.description, `Rs. ${item.amount.toFixed(2)}`])
        : [['1', 'No items specified', 'Rs. 0.00']];

    autoTable(doc, {
        startY: finalY,
        head: [['SI No.', 'Description', 'Amount']],
        body: tableBody,
        theme: 'grid',
        headStyles: { 
            fillColor: [33, 37, 41], 
            textColor: 255, 
            fontStyle: 'bold', 
            fontSize: 9,
            lineWidth: 0.1
        },
        bodyStyles: { 
            fontSize: 9,
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        columnStyles: {
            0: { cellWidth: 20, halign: 'center' }, // SI No.
            1: { halign: 'left' }, // Description
            2: { halign: 'right' } // Amount
        },
        styles: { 
            lineColor: [200, 200, 200],
            lineWidth: 0.1
        },
        margin: { left: pageMargin, right: pageMargin },
        tableWidth: 'auto'
    });
    
    finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- TOTAL & BANK DETAILS BLOCK ---
    const totalBankY = finalY;
    const totalWidth = 60; // Slightly narrower to ensure it fits the amount section properly
    
    // Left side: Bank Details
    doc.setFontSize(9).setFont('helvetica', 'bold');
    doc.text('Bank Details:', pageMargin, totalBankY);
    
    doc.setFontSize(8).setFont('helvetica', 'normal');
    const bankDetails = [
        'PENSARE MARKETING',
        'State Bank of India, Koduvally Branch',
        'A/C No: 39003560642',
        'IFSC Code: SBIN0001442',
        'GPay: 9745600523'
    ];
    doc.text(bankDetails, pageMargin, totalBankY + 5);
    
    // Right side: Total with light blue background
    const totalX = pageWidth - pageMargin - totalWidth;
    const totalHeight = 20;
    
    // Draw background rectangle
    doc.setFillColor(144, 170, 212);
    doc.rect(totalX - 2, totalBankY - 3, totalWidth + 2, totalHeight, 'F');
    
    // Aligned to the right margin to match table Amount column
    const alignX = pageWidth - pageMargin;

    doc.setFontSize(9).setFont('helvetica', 'bold');
    doc.text('Total:', totalX, totalBankY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${bill.billAmount.toFixed(2)}`, alignX, totalBankY + 5, { align: 'right' });
    
    // Balance text
    doc.setFontSize(9).setFont('helvetica', 'bold');
    doc.text('Balance:', totalX, totalBankY + 11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${bill.balance.toFixed(2)}`, alignX, totalBankY + 11, { align: 'right' });
    
    finalY = totalBankY + totalHeight + 10;

    // --- THANK YOU NOTE ---
    doc.setFontSize(10).setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', pageMargin, finalY);
    
    finalY += 8;

    // --- SEPARATOR LINE ---
    doc.setDrawColor(220, 220, 220);
    doc.line(pageMargin, finalY, pageWidth - pageMargin, finalY);
    
    finalY += 8;

    // --- CONTACT FOOTER ---
    doc.setFontSize(8).setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    doc.text('www.pensare.in', pageMargin, finalY, { align: 'left' });
    doc.text('+91 97452006353', pageWidth / 2, finalY, { align: 'center' });
    doc.text('info@pensare.in', pageWidth - pageMargin, finalY, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);

    return doc.output('blob');
};