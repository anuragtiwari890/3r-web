import { IncomingForm } from 'formidable';
import nodemailer from 'nodemailer';
import fs from 'fs';

export const config = {
    api: { bodyParser: false } // Required for formidable to handle file uploads
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: 'Form parsing failed' });

        try {
            console.log("My email is - ", process.env.EMAIL_USER)
            console.log("My password is - ", process.env.EMAIL_PASS?.slice(0,5))
            // 1. Setup Email Transporter using your Gmail
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // 2. Determine which form was submitted (Scrap or Career)
            const isCareer = fields.formType?.[0] === 'career';
            let mailOptions = {
                from: process.env.EMAIL_USER,
                to: "info@3rautomobile.com", // Sends email to yourself
                subject: isCareer ? `New Job Application: ${fields.name}` : `New Scrap Lead: ${fields.name}`,
            };

            // 3. Format the email content based on the form
            if (isCareer) {
                mailOptions.text = `
                    New Career Application:
                    Name: ${fields.name}
                    Email: ${fields.email}
                    Phone: ${fields.phone}
                    Position: ${fields.position}
                `;
                // Attach the resume if uploaded
                if (files.resume) {
                    const file = files.resume[0];
                    mailOptions.attachments = [{
                        filename: file.originalFilename,
                        content: fs.createReadStream(file.filepath)
                    }];
                }
            } else {
                mailOptions.text = `
                    New Scrap Request:
                    Name: ${fields.name}
                    Phone: ${fields.phone}
                    Vehicle Type: ${fields.vehicleType}
                    Vehicle Age: ${fields.vehicleAge}
                `;
            }

            // 4. Send the email
            await transporter.sendMail(mailOptions);
            res.status(200).json({ success: true, message: 'Sent successfully' });

        } catch (error) {
            console.error("Email error:", error);
            res.status(500).json({ error: 'Failed to send email' });
        }
    });
}