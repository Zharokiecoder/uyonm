const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { sendNewsletterNotification } = require('../config/email');

const router = express.Router();

// POST /api/newsletter/subscribe - Subscribe to newsletter
router.post('/subscribe', [
    body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Check if already subscribed
        const { data: existing } = await supabaseAdmin
            .from('newsletter_subscribers')
            .select('id, is_active')
            .eq('email', email)
            .single();

        if (existing) {
            if (existing.is_active) {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already subscribed to our newsletter.'
                });
            } else {
                // Reactivate subscription
                await supabaseAdmin
                    .from('newsletter_subscribers')
                    .update({ is_active: true })
                    .eq('id', existing.id);

                // Send email notification (async)
                sendNewsletterNotification(email)
                    .catch(err => console.error('Email notification failed:', err));

                return res.json({
                    success: true,
                    message: 'Welcome back! Your subscription has been reactivated.'
                });
            }
        }

        // Create new subscription
        const { error } = await supabaseAdmin
            .from('newsletter_subscribers')
            .insert([{ email, is_active: true }]);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to subscribe. Please try again.'
            });
        }

        // Send email notification (async, don't wait)
        sendNewsletterNotification(email)
            .catch(err => console.error('Email notification failed:', err));

        res.status(201).json({
            success: true,
            message: 'Thank you for subscribing! Stay tuned for updates.'
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
});

// DELETE /api/newsletter/unsubscribe - Unsubscribe from newsletter
router.delete('/unsubscribe', [
    body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email } = req.body;

        const { error } = await supabaseAdmin
            .from('newsletter_subscribers')
            .update({ is_active: false })
            .eq('email', email);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({
            success: true,
            message: 'You have been unsubscribed from our newsletter.'
        });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ success: false, message: 'Failed to unsubscribe' });
    }
});

// GET /api/newsletter/subscribers - Get all subscribers (admin)
router.get('/subscribers', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('newsletter_subscribers')
            .select('*')
            .order('subscribed_at', { ascending: false });

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({
            success: true,
            data,
            total: data.length,
            active: data.filter(s => s.is_active).length
        });
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subscribers' });
    }
});

module.exports = router;
