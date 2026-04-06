import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { WebsiteEntry } from '@/lib/data';

/**
 * Generates a comprehensive PDF report of the Website Directory.
 * Includes all 26 data columns and uses A2 landscape format for maximum readability.
 */
export const generateWebsiteDirectoryPDF = (entries: WebsiteEntry[]): Blob => {
    // Using A2 landscape to provide enough horizontal space for 26 columns (594mm x 420mm)
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a2'
    });

    const title = "Website Credentials Report";
    const date = format(new Date(), 'PPP');

    // --- Header ---
    doc.setFontSize(28);
    doc.setTextColor(40);
    doc.text(title, 14, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`Total Records: ${entries.length} | Generated on: ${date}`, 14, 35);

    // --- Multi-Row Headers for PDF ---
    const headers: any[][] = [
        [
            { content: 'Sl.', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Client Info', colSpan: 4, styles: { halign: 'center' as const, fillColor: [60, 60, 60] } },
            { content: 'Domain & Hosting Details', colSpan: 8, styles: { halign: 'center' as const, fillColor: [80, 80, 80] } },
            { content: 'Access Credentials', colSpan: 6, styles: { halign: 'center' as const, fillColor: [100, 100, 100] } },
            { content: 'DB Credentials', colSpan: 3, styles: { halign: 'center' as const, fillColor: [250, 240, 180], textColor: [100, 80, 0] } },
            { content: 'WordPress', colSpan: 2, styles: { halign: 'center' as const, fillColor: [210, 230, 255], textColor: [0, 50, 150] } },
            { content: 'Webmail', colSpan: 2, styles: { halign: 'center' as const, fillColor: [220, 250, 230], textColor: [0, 80, 40] } }
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
        site.clientName || '-',
        site.address || '-',
        site.contactPerson || '-',
        site.contactNo || '-',
        site.domainName || '-',
        site.domainAccount || '-',
        site.domainEmail || '-',
        site.purchasedBy || '-',
        site.domainExpiry || '-',
        site.hostingExpiry || '-',
        site.hostingCompany || '-',
        site.hostRemarks || '-',
        site.platform || '-',
        site.themeLink || '-',
        site.adminPanelLink || '-',
        site.adminPanelName || '-',
        site.panelPassword || '-',
        site.workDoneBy || '-',
        site.dbName || '-',
        site.dbUser || '-',
        site.dbPassword || '-',
        site.wpUser || '-',
        site.wpPassword || '-',
        site.webmailUser || '-',
        site.webmailPassword || '-'
    ]);

    autoTable(doc, {
        startY: 45,
        head: headers,
        body: body,
        theme: 'grid',
        styles: { 
            fontSize: 6,
            cellPadding: 2,
            overflow: 'linebreak',
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            valign: 'middle' as const,
            minCellWidth: 10
        },
        headStyles: { 
            fillColor: [40, 40, 40], 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'left' as const
        },
        // Usable width: 574mm. Total of widths below: 574mm.
        columnStyles: {
            0: { cellWidth: 6, halign: 'center' as const }, // Sl.
            1: { cellWidth: 20 }, // Client
            2: { cellWidth: 45 }, // Address
            3: { cellWidth: 15 }, // Contact
            4: { cellWidth: 20 }, // Phone
            5: { cellWidth: 45 }, // Domain Name
            6: { cellWidth: 20 }, // Domain A/c
            7: { cellWidth: 45 }, // Domain Email
            8: { cellWidth: 15 }, // Buyer
            9: { cellWidth: 15 }, // Dom Exp
            10: { cellWidth: 15 }, // Host Exp
            11: { cellWidth: 20 }, // Hoster
            12: { cellWidth: 45 }, // Remarks
            13: { cellWidth: 12 }, // Platform
            14: { cellWidth: 28 }, // Theme Link
            15: { cellWidth: 28 }, // Admin Link
            16: { cellWidth: 18 }, // Admin User
            17: { cellWidth: 18 }, // Panel Pass
            18: { cellWidth: 18 }, // Done By
            19: { cellWidth: 18 }, // DB Name
            20: { cellWidth: 18 }, // DB User
            21: { cellWidth: 18 }, // DB Pass
            22: { cellWidth: 18 }, // WP User
            23: { cellWidth: 18 }, // WP Pass
            24: { cellWidth: 18 }, // Webmail User
            25: { cellWidth: 18 }  // Webmail Pass
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250]
        },
        margin: { left: 10, right: 10 },
        tableWidth: 574 
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
            { align: 'center' as const }
        );
    }

    return doc.output('blob');
};