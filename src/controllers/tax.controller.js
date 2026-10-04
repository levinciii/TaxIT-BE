import * as taxService from '../services/tax.service.js';

export const income = async (req, res) => res.json(await taxService.incomeTax(req.user.id, req.valid.query.year));
