const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');

// POST /api/v1/links - Create new short URL
router.post('/', (req, res, next) => linkController.createLink(req, res, next));

// GET /api/v1/links/:shortCode - Fetch short URL details
router.get('/:shortCode', (req, res, next) => linkController.getLink(req, res, next));

module.exports = router;
