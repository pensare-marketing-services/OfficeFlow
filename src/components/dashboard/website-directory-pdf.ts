import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { WebsiteEntry } from '@/lib/data';

/**
 * Generates a comprehensive PDF report of the Website Directory.
 * Uses A3 landscape format to accommodate the many credential columns.
 */
export const generateWebsiteDirectoryPDF = (entries: WebsiteEntry[]): Blob => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
    });

    const title = "Website Directory & Credentials Report";
    const date = format(new Date(), 'PPP');

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text(title, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Total Entries: ${entries.length} | Generated on: ${date}`, 14, 28);

    // --- Table Definition ---
    // We select the most critical columns for the directory view
    const headers = [
        [
            'Sl.', 
            'Client', 
            'Domain Name', 
            'Platform', 
            'Domain Expiry', 
            'Hosting Expiry', 
            'Admin Panel', 
            'WP User', 
            'WP Pass', 
            'DB User', 
            'DB Pass', 
            'Webmail', 
            'Mail Pass'
        ]
    ];

    const body = entries.map((site, index) => [
        index + 1,
        site.clientName || '-',
        site.domainName || '-',
        site.platform || '-',
        site.domainExpiry || '-',
        site.hostingExpiry || '-',
        site.adminPanelLink || '-',
        site.wpUser || '-',
        site.wpPassword || '-',
        site.dbUser || '-',
        site.dbPassword || '-',
        site.webmailUser || '-',
        site.webmailPassword || '-'
    ]);

    autoTable(doc, {
        startY: 35,
        head: headers,
        body: body,
        theme: 'grid',
        styles: { 
            fontSize: 8, 
            cellPadding: 3,
            overflow: 'linebreak',
            halign: 'left'
        },
        headStyles: { 
            fillColor: [33, 37, 41], 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' }, // Sl.
            1: { cellWidth: 35 }, // Client
            2: { cellWidth: 45 }, // Domain
            3: { cellWidth: 25 }, // Platform
            4: { cellWidth: 25 }, // Domain Exp
            5: { cellWidth: 25 }, // Hosting Exp
            6: { cellWidth: 40 }, // Admin Link
            // Credentials use standard widths
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { left: 14, right: 14 }
    });

    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} of ${pageCount} - OfficeFlow Website Directory`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    return doc.output('blob');
};
