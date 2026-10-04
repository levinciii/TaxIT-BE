import * as profileService from '../services/profile.service.js';

export const get = async (req, res) => res.json(await profileService.get(req.user.id));
export const update = async (req, res) => res.json(await profileService.update(req.user.id, req.valid.body));
