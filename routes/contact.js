const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { sendContactNotification } = require('../config/email');

const router = express.Router();

// Validation rules
const validateContact = [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
];

// POST /api/contact - Submit contact form
router.post('/', validateContact, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { firstName, lastName, email, subject, message } = req.body;

        // Save to Supabase
        const { data, error } = await supabaseAdmin
            .from('contacts')
            .insert([
                {
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    subject,
                    message,
                    status: 'unread'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to submit contact form'
            });
        }

        // Send email notification (async, don't wait)
        sendContactNotification({ firstName, lastName, email, subject, message })
            .catch(err => console.error('Email notification failed:', err));

        res.status(201).json({
            success: true,
            message: 'Thank you for your message! We will get back to you soon.',
            id: data.id
        });
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
});

// GET /api/contact - Get all contacts (admin only - will add auth middleware later)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
    }
});

// PATCH /api/contact/:id/status - Update contact status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabaseAdmin
            .from('contacts')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ success: false, message: 'Failed to update contact' });
    }
});

module.exports = router;
