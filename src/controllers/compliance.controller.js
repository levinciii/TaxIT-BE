import * as complianceService from '../services/compliance.service.js';

export const deadlines = async (req, res) => res.json(await complianceService.deadlines(req.user.id, req.valid.query.year));
