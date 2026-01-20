import Joi from 'joi';

export const listSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    is_read: Joi.boolean().optional()
  })
});

export const getByIdSchema = Joi.object({
  params: Joi.object({
    notification_id: Joi.number().integer().required()
  })
});

export const markAsReadSchema = Joi.object({
  params: Joi.object({
    notification_id: Joi.number().integer().required()
  })
});

export const deleteSchema = Joi.object({
  params: Joi.object({
    notification_id: Joi.number().integer().required()
  })
});