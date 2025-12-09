import PDFDocument from 'pdfkit';
import db from '$lib/server/db.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
        return json({ error: 'Password required' }, { status: 400 });
    }

    try {
        // Get all passwords for the user
        const stmt = db.prepare('SELECT id, title, username, password, updated_at FROM passwords WHERE user_id = ? ORDER BY updated_at DESC');
        const passwords = stmt.all(locals.user.id);

        // Create PDF document with encryption
        const doc = new PDFDocument({
            userPassword: password,
            ownerPassword: password,
            permissions: {
                printing: 'highResolution',
                modifying: false,
                copying: true,
                annotating: false
            }
        });

        // Collect PDF chunks
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => { });

        // Header
        doc.fontSize(24)
            .fillColor('#2563eb')
            .text('My Password Vault', 50, 50);

        doc.fontSize(11)
            .fillColor('#666')
            .text(`Generated on ${new Date().toLocaleDateString()}`, 50, 80);

        // Table
        let y = 120;
        const columnWidths = [150, 120, 150, 100];
        const headers = ['Title', 'Username', 'Password', 'Updated'];

        // Draw header background
        doc.rect(50, y - 5, 520, 25)
            .fillColor('#2563eb')
            .fill();

        // Draw headers
        let x = 60;
        doc.fillColor('#fff')
            .fontSize(11);

        headers.forEach((header, i) => {
            doc.text(header, x, y, { width: columnWidths[i], continued: false });
            x += columnWidths[i];
        });

        y += 30;

        // Draw rows
        passwords.forEach((item, index) => {
            // Check if we need a new page
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            // Alternating background
            if (index % 2 === 0) {
                doc.rect(50, y - 5, 520, 20)
                    .fillColor('#f5f5f5')
                    .fill();
            }

            x = 60;
            doc.fillColor('#000')
                .fontSize(9);

            const rowData = [
                item.title || '-',
                item.username || '-',
                item.password || '-',
                new Date(item.updated_at).toLocaleDateString()
            ];

            rowData.forEach((text, i) => {
                const displayText = String(text).substring(0, 30);
                doc.text(displayText, x, y, { width: columnWidths[i], continued: false });
                x += columnWidths[i];
            });

            y += 25;
        });

        // Finalize PDF
        doc.end();

        // Wait for PDF to finish
        const pdfBuffer = await new Promise((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });

        // Return PDF as response
        return new Response(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="my-passwords.pdf"'
            }
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        return json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
