import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { WebsiteEntry } from '@/lib/data';

/**
 * Generates a comprehensive PDF report of the Website Directory.
 * Includes all data columns and uses A3 landscape format.
 */
export const generateWebsiteDirectoryPDF = (entries: WebsiteEntry[]): Blob => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
    });

    const title = "Website Directory & Credentials Master Report";
    const date = format(new Date(), 'PPP');

    // --- Header ---
    doc.setFontSize(24);
    doc.setTextColor(40);
    doc.text(title, 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Total Records: ${entries.length} | Generated on: ${date}`, 14, 28);

    // --- Multi-Row Headers for PDF ---
    const headers = [
        [
            { content: 'Sl.', rowSpan: 2 },
            { content: 'Client Info', colSpan: 4, styles: { halign: 'center' } },
            { content: 'Domain & Hosting Details', colSpan: 8, styles: { halign: 'center' } },
            { content: 'Access Credentials', colSpan: 4, styles: { halign: 'center' } },
            { content: 'DB Credentials', colSpan: 3, styles: { halign: 'center', fillColor: [250, 240, 180], textColor: [100, 80, 0] } },
            { content: 'WordPress', colSpan: 2, styles: { halign: 'center', fillColor: [210, 230, 255], textColor: [0, 50, 150] } },
            { content: 'Webmail', colSpan: 2, styles: { halign: 'center', fillColor: [220, 250, 230], textColor: [0, 80, 40] } }
        ],
        [
            'Client', 'Address', 'Contact', 'Phone', // Client Info
            'Domain Name', 'Domain A/c', 'Domain E-mail', 'Buyer', 'Dom Exp', 'Host Exp', 'Hoster', 'Remarks', // Domain/Hosting
            'Platform', 'Theme', 'Admin Link', 'Admin User', // Access
            'Name', 'User', 'Pass', // DB
            'User', 'Pass', // WP
            'Mail', 'Pass'  // Webmail
        ]
    ];

    const body = entries.map((site, index) => [
        index + 1,
        // Client Info
        site.clientName || '-',
        site.address || '-',
        site.contactPerson || '-',
        site.contactNo || '-',
        // Domain & Hosting
        site.domainName || '-',
        site.domainAccount || '-',
        site.domainEmail || '-',
        site.purchasedBy || '-',
        site.domainExpiry || '-',
        site.hostingExpiry || '-',
        site.hostingCompany || '-',
        site.hostRemarks || '-',
        // Access
        site.platform || '-',
        site.themeLink || '-',
        site.adminPanelLink || '-',
        site.adminPanelName || '-',
        // DB
        site.dbName || '-',
        site.dbUser || '-',
        site.dbPassword || '-',
        // WP
        site.wpUser || '-',
        site.wpPassword || '-',
        // Webmail
        site.webmailUser || '-',
        site.webmailPassword || '-'
    ]);

    autoTable(doc, {
        startY: 35,
        head: headers,
        body: body,
        theme: 'grid',
        styles: { 
            fontSize: 6, 
            cellPadding: 2,
            overflow: 'linebreak',
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        headStyles: { 
            fillColor: [40, 40, 40], 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'left',
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' }, // Sl.
            1: { cellWidth: 25 }, // Client
            5: { cellWidth: 35 }, // Domain Name
            12: { cellWidth: 30 }, // Host Remarks
            15: { cellWidth: 35 }, // Admin Link
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250]
        },
        margin: { left: 10, right: 10 },
        tableWidth: 'auto'
    });

    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `OfficeFlow Master Website Directory - Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    return doc.output('blob');
};
