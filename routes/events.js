const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// GET /api/events - Get all events
router.get('/', async (req, res) => {
    try {
        const { upcoming } = req.query;

        let query = supabaseAdmin
            .from('events')
            .select('*')
            .order('event_date', { ascending: true });

        // Filter for upcoming events only
        if (upcoming === 'true') {
            query = query.gte('event_date', new Date().toISOString());
        }

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch event' });
    }
});

// POST /api/events - Create new event (admin)
router.post('/', [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('eventDate').isISO8601().withMessage('Valid date is required'),
    body('location').trim().notEmpty().withMessage('Location is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { title, description, eventDate, location, imageUrl, registrationLink } = req.body;

        const { data, error } = await supabaseAdmin
            .from('events')
            .insert([{
                title,
                description,
                event_date: eventDate,
                location,
                image_url: imageUrl,
                registration_link: registrationLink
            }])
            .select()
            .single();

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.status(201).json({ success: true, data, message: 'Event created successfully' });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ success: false, message: 'Failed to create event' });
    }
});

// PUT /api/events/:id - Update event (admin)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, eventDate, location, imageUrl, registrationLink } = req.body;

        const { data, error } = await supabaseAdmin
            .from('events')
            .update({
                title,
                description,
                event_date: eventDate,
                location,
                image_url: imageUrl,
                registration_link: registrationLink
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, data, message: 'Event updated successfully' });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ success: false, message: 'Failed to update event' });
    }
});

// DELETE /api/events/:id - Delete event (admin)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('events')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
});

// POST /api/events/:id/register - Register for an event
router.post('/:id/register', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('fullName').trim().notEmpty().withMessage('Full name is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { id } = req.params;
        const { email, fullName, phone } = req.body;

        // Check if event exists
        const { data: event, error: eventError } = await supabaseAdmin
            .from('events')
            .select('id, title')
            .eq('id', id)
            .single();

        if (eventError || !event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Check if already registered
        const { data: existing } = await supabaseAdmin
            .from('event_registrations')
            .select('id')
            .eq('event_id', id)
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event.'
            });
        }

        // Create registration
        const { data, error } = await supabaseAdmin
            .from('event_registrations')
            .insert([{
                event_id: id,
                email,
                full_name: fullName,
                phone
            }])
            .select()
            .single();

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.status(201).json({
            success: true,
            message: `Successfully registered for "${event.title}"!`,
            data
        });
    } catch (error) {
        console.error('Event registration error:', error);
        res.status(500).json({ success: false, message: 'Failed to register for event' });
    }
});

module.exports = router;
