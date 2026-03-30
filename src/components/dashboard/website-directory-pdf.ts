import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { WebsiteEntry } from '@/lib/data';

/**
 * Generates a comprehensive PDF report of the Website Directory.
 * Includes all 26 data columns and uses A2 landscape format for maximum readability.
 */
export const generateWebsiteDirectoryPDF = (entries: WebsiteEntry[]): Blob => {
    // Using A2 landscape to provide enough horizontal space for 26 columns
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a2'
    });

    const title = "Website Directory & Credentials Master Report";
    const date = format(new Date(), 'PPP');

    // --- Header ---
    doc.setFontSize(28);
    doc.setTextColor(40);
    doc.text(title, 14, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`Total Records: ${entries.length} | Generated on: ${date}`, 14, 35);

    // --- Multi-Row Headers for PDF ---
    const headers = [
        [
            { content: 'Sl.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Client Info', colSpan: 4, styles: { halign: 'center', fillColor: [60, 60, 60] } },
            { content: 'Domain & Hosting Details', colSpan: 8, styles: { halign: 'center', fillColor: [80, 80, 80] } },
            { content: 'Access Credentials', colSpan: 6, styles: { halign: 'center', fillColor: [100, 100, 100] } },
            { content: 'DB Credentials', colSpan: 3, styles: { halign: 'center', fillColor: [250, 240, 180], textColor: [100, 80, 0] } },
            { content: 'WordPress', colSpan: 2, styles: { halign: 'center', fillColor: [210, 230, 255], textColor: [0, 50, 150] } },
            { content: 'Webmail', colSpan: 2, styles: { halign: 'center', fillColor: [220, 250, 230], textColor: [0, 80, 40] } }
        ],
        [
            // Client Info
            'Client', 'Address', 'Contact', 'Phone',
            // Domain & Hosting
            'Domain Name', 'Domain A/c', 'Domain E-mail', 'Buyer', 'Dom Exp', 'Host Exp', 'Hoster', 'Remarks',
            // Access
            'Platform', 'Theme Link', 'Admin Link', 'Admin User', 'Panel Pass', 'Done By',
            // DB
            'Name', 'User', 'Pass',
            // WP
            'User', 'Pass',
            // Webmail
            'Mail', 'Pass'
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
        site.panelPassword || '-',
        site.workDoneBy || '-',
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
        startY: 45,
        head: headers,
        body: body,
        theme: 'grid',
        styles: { 
            fontSize: 8, // Increased font size for A2
            cellPadding: 3,
            overflow: 'linebreak',
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            valign: 'middle'
        },
        headStyles: { 
            fillColor: [40, 40, 40], 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'left'
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' }, // Sl.
            1: { cellWidth: 35 }, // Client
            2: { cellWidth: 50 }, // Address
            5: { cellWidth: 45 }, // Domain Name
            12: { cellWidth: 50 }, // Host Remarks
            14: { cellWidth: 45 }, // Theme Link
            15: { cellWidth: 45 }, // Admin Link
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
        doc.setFontSize(10);
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
