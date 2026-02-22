import Joi from 'joi';

export const createSchema = Joi.object({
  body: Joi.object({
    name: Joi.string()
      .max(100)
      .pattern(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/)
      .required()
      .messages({
        'string.pattern.base': 'Permission name must be in format: module.resource.action (e.g., users.list)',
        'any.required': 'Permission name is required'
      }),
    module: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'Module name cannot exceed 50 characters'
      }),
    description: Joi.string()
      .max(255)
      .allow('')
      .optional()
  })
});

export const updateSchema = Joi.object({
  params: Joi.object({
    permission_id: Joi.number().integer().positive().required()
  }),
  body: Joi.object({
    name: Joi.string()
      .max(100)
      .pattern(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/)
      .optional()
      .messages({
        'string.pattern.base': 'Permission name must be in format: module.resource.action'
      }),
    module: Joi.string().max(50).optional(),
    description: Joi.string().max(255).allow('').optional()
  })
});

export const getByIdSchema = Joi.object({
  params: Joi.object({
    permission_id: Joi.number().integer().positive().required()
  })
});

export const listSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    module: Joi.string().max(50).optional()
  })
});

export const assignSchema = Joi.object({
  body: Joi.object({
    role_id: Joi.number().integer().required(),
    permission_id: Joi.number().integer().required()
  })
});

export const requestAccessSchema = Joi.object({
  body: Joi.object({
    permission: Joi.string()
      .max(100)
      .pattern(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/)
      .required()
      .messages({
        'string.pattern.base': 'Permission name must be in format: module.resource.action (e.g., alerts.list)',
        'any.required': 'Permission name is required'
      }),
    reason: Joi.string().max(255).allow('').optional()
  })
});
