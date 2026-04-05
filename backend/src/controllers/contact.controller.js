const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('../services/email.service');
const emailConfig = require('../config/email.config');

const submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // 1. Save to database
        const inquiry = await prisma.contactInquiry.create({
            data: {
                name,
                email,
                subject,
                message,
                status: 'pending'
            }
        });

        // 2. Send email notification to Admin
        const adminEmail = 'injamamulhaque767@gmail.com';
        const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background: #f9f9f9;">
            <div style="background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <h2 style="color: #333;">New Contact Inquiry: ${subject}</h2>
                <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="white-space: pre-wrap; color: #555;">${message}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #aaa;">Inquiry ID: ${inquiry.id}</p>
            </div>
        </div>
        `;

        try {
            await emailService.transporter.sendMail({
                from: emailConfig.from,
                to: adminEmail,
                subject: `[BookMyGame Contact] ${subject}`,
                html: htmlContent,
                replyTo: email
            });
        } catch (emailError) {
            console.error('Failed to send mail notification for inquiry:', emailError);
            // Even if email fails, inquiry is saved. Don't block success response.
        }

        res.status(201).json({ success: true, message: 'Your message has been received successfully.' });

    } catch (error) {
        console.error('Submit Contact Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error while submitting' });
    }
};

const getInquiries = async (req, res) => {
    try {
        const inquiries = await prisma.contactInquiry.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: inquiries });
    } catch (error) {
        console.error('Get Inquiries Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // should be 'resolved' or 'pending'

        if (!['pending', 'resolved'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updatedInquiry = await prisma.contactInquiry.update({
            where: { id },
            data: { status }
        });

        res.status(200).json({ success: true, data: updatedInquiry });
    } catch (error) {
        console.error('Update Inquiry Status Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    submitContactForm,
    getInquiries,
    updateInquiryStatus
};
