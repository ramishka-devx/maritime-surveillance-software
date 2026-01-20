import Joi from 'joi';

export const listSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    user_id: Joi.number().integer().optional(),
    permission_id: Joi.number().integer().optional(),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').optional(),
    path: Joi.string().optional(),
    status_code: Joi.number().integer().min(100).max(599).optional(),
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional(),
    sort_by: Joi.string().valid('created_at', 'method', 'path', 'status_code').default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc')
  })
});

export const getByIdSchema = Joi.object({
  params: Joi.object({
    activity_id: Joi.number().integer().required()
  })
});