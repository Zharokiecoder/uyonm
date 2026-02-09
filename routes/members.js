const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { sendMemberNotification } = require('../config/email');

const router = express.Router();

// Validation rules for member registration
const validateMemberRegistration = [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('involvementTrack')
        .isIn(['volunteer', 'partner', 'member', 'mentor'])
        .withMessage('Please select a valid involvement track'),
    body('location').trim().notEmpty().withMessage('Location is required')
];

// POST /api/members/register - Register as a member
router.post('/register', validateMemberRegistration, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { fullName, email, phone, involvementTrack, location, reason } = req.body;

        // Check if already registered
        const { data: existing } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered. Please login or use a different email.'
            });
        }

        // Create member profile
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .insert([{
                full_name: fullName,
                email,
                phone,
                location,
                involvement_track: involvementTrack,
                reason
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                success: false,
                message: 'Registration failed. Please try again.'
            });
        }

        // Send email notification (async)
        sendMemberNotification({ fullName, email, phone, location, involvementTrack, reason })
            .catch(err => console.error('Email notification failed:', err));

        res.status(201).json({
            success: true,
            message: `Welcome to UYNM! Your ${involvementTrack} registration has been received. Our team will contact you within 48 hours.`,
            data: {
                id: data.id,
                fullName: data.full_name,
                track: data.involvement_track
            }
        });
    } catch (error) {
        console.error('Member registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
});

// GET /api/members - Get all members (admin)
router.get('/', async (req, res) => {
    try {
        const { track } = req.query;

        let query = supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (track) {
            query = query.eq('involvement_track', track);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({
            success: true,
            data,
            stats: {
                total: data.length,
                volunteers: data.filter(m => m.involvement_track === 'volunteer').length,
                partners: data.filter(m => m.involvement_track === 'partner').length,
                members: data.filter(m => m.involvement_track === 'member').length,
                mentors: data.filter(m => m.involvement_track === 'mentor').length
            }
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch members' });
    }
});

// GET /api/members/:id - Get single member profile
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get member error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch member' });
    }
});

module.exports = router;
