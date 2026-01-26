import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Client, MonthData, Task, CashInTransaction, PaidPromotion } from '@/lib/data';

interface ReportData {
    client: Client;
    monthData: MonthData;
    dmTasks: Task[];
    otherTasks: Task[];
    cashIn: (CashInTransaction & { id: string })[];
    paidPromotions: (PaidPromotion & { id: string })[];
}

export const generateClientReportPDF = (data: ReportData) => {
    const { client, monthData, dmTasks, otherTasks, cashIn, paidPromotions } = data;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let finalY = 15; // starting Y position

    // Title
    doc.setFontSize(18);
    doc.text(`${client.name} - Report (${monthData.name})`, 14, finalY);
    finalY += 10;
    
    doc.setFontSize(12);
    doc.text('Client Plan Summary', 14, finalY);
    finalY += 5;

    // Client Plan Summary Table
    autoTable(doc, {
        startY: finalY,
        body: [
            ['Plan', monthData.plan || '-'],
            ['Bill Duration', monthData.billDuration || '-'],
            ['Social Platforms', monthData.socialPlatforms || '-'],
            ['Monthly Reach', monthData.monthlyReach || '-'],
        ],
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' } },
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Helper function to add a table
    const addTable = (title: string, head: any, body: any) => {
        if (finalY + 40 > pageHeight) { // check if new page is needed
            doc.addPage();
            finalY = 15;
        }
        doc.setFontSize(12);
        doc.text(title, 14, finalY);
        finalY += 5;

        autoTable(doc, {
            head,
            body,
            startY: finalY,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8 },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    };
    
    // Digital Marketing Tasks
    if (dmTasks.length > 0) {
        addTable(
            'Digital Marketing Tasks',
            [['Date', 'Title', 'Description', 'Type', 'Status']],
            dmTasks.map(task => [
                format(new Date(task.deadline), 'MMM dd, yyyy'),
                task.title,
                task.description,
                task.contentType || '-',
                task.status
            ])
        );
    }
    
    // Other Tasks
    if (otherTasks.length > 0) {
        addTable(
            'Other Tasks',
            [['Date', 'Task', 'Status']],
            otherTasks.map(task => [
                format(new Date(task.deadline), 'MMM dd, yyyy'),
                task.title,
                task.status
            ])
        );
    }
    
    // Paid Promotions
    if (paidPromotions.length > 0) {
         addTable(
            'Paid Promotions',
            [['Date', 'Campaign', 'Type', 'Budget', 'Status', 'Spent']],
            paidPromotions.map(p => [
                format(new Date(p.date), 'MMM dd, yyyy'),
                p.campaign,
                p.adType,
                p.budget.toFixed(2),
                p.status,
                p.spent.toFixed(2),
            ])
        );
    }

    // Paid Ads Budget
    if (cashIn.length > 0 || client.paidPromotionsOldBalance) {
         if (finalY + 40 > pageHeight) {
            doc.addPage();
            finalY = 15;
        }
        doc.setFontSize(12);
        doc.text('Paid Ads - Budget', 14, finalY);
        finalY += 5;

        const totalSpent = paidPromotions.reduce((acc, p) => acc + Number(p.spent || 0), 0);
        const gst = totalSpent * 0.18;
        const grandTotal = totalSpent + gst;
        const totalCashIn = cashIn.reduce((acc, t) => acc + Number(t.amount || 0), 0);
        const oldBalance = client.paidPromotionsOldBalance || 0;
        const balance = (totalCashIn + oldBalance) - grandTotal;

        autoTable(doc, {
            startY: finalY,
            head: [['Date', 'Amount', 'Status']],
            body: cashIn.map(t => [format(new Date(t.date), 'MMM dd, yyyy'), t.amount.toFixed(2), t.status]),
            foot: [
                ['Total Spent', '', totalSpent.toFixed(2)],
                ['Old Balance', '', oldBalance.toFixed(2)],
                ['GST 18%', '', gst.toFixed(2)],
                ['Grand Total', '', grandTotal.toFixed(2)],
                ['Total Cash In', '', totalCashIn.toFixed(2)],
                ['Balance', '', balance.toFixed(2)],
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
            styles: { fontSize: 8 },
            columnStyles: { 2: { halign: 'right' } },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Save the PDF
    doc.save(`${client.name}_Report_${monthData.name}.pdf`);
};
