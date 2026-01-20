import Joi from 'joi';

export const createSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().allow('').optional()
  })
});

export const assignSchema = Joi.object({
  body: Joi.object({
    role_id: Joi.number().integer().required(),
    permission_id: Joi.number().integer().required()
  })
});
