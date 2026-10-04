import * as categoryService from '../services/category.service.js';

export const list = async (req, res) => res.json(await categoryService.list(req.user.id));
export const create = async (req, res) => res.status(201).json(await categoryService.create(req.user.id, req.valid.body));
