import Joi from 'joi';
import { badRequest } from '../utils/errorHandler.js';

export function validate(schema) {
  return (req, res, next) => {
    const toValidate = {
      body: req.body,
      params: req.params,
      query: req.query
    };
    const { error, value } = schema.validate(toValidate, { abortEarly: false, allowUnknown: true });
    if (error) return next(badRequest(error?.details[0].message));
    req.body = value.body;
    req.params = value.params;
    req.query = value.query;
    next();
  };
}

export const schemas = {
  pagination: Joi.object({
    query: Joi.object({ page: Joi.number().min(1).default(1), limit: Joi.number().min(1).max(100).default(10) })
  })
};
