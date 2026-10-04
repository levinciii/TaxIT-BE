import * as transactionService from '../services/transaction.service.js';

export const list = async (req, res) => res.json(await transactionService.list(req.user.id, req.valid.query));
export const create = async (req, res) => res.status(201).json(await transactionService.create(req.user.id, req.valid.body));
export const update = async (req, res) =>
  res.json(await transactionService.update(req.user.id, req.valid.params.id, req.valid.body));
export const remove = async (req, res) => {
  await transactionService.remove(req.user.id, req.valid.params.id);
  res.status(204).end();
};
