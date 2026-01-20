import Joi from 'joi';

export const listSchema = Joi.object({
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Page must be a number.',
        'number.integer': 'Page must be an integer.',
        'number.min': 'Page must be at least 1.'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'number.base': 'Limit must be a number.',
        'number.integer': 'Limit must be an integer.',
        'number.min': 'Limit must be at least 1.',
        'number.max': 'Limit cannot exceed 100.'
      })
  })
});

export const getByIdSchema = Joi.object({
  params: Joi.object({
    role_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Role ID must be a number.',
        'number.integer': 'Role ID must be an integer.',
        'number.positive': 'Role ID must be positive.',
        'any.required': 'Role ID is required.'
      })
  })
});

export const createSchema = Joi.object({
  body: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.base': 'Role name must be a string.',
        'string.empty': 'Role name cannot be empty.',
        'string.min': 'Role name must be at least 2 characters long.',
        'string.max': 'Role name cannot exceed 50 characters.',
        'any.required': 'Role name is required.'
      })
  })
});

export const updateSchema = Joi.object({
  params: Joi.object({
    role_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Role ID must be a number.',
        'number.integer': 'Role ID must be an integer.',
        'number.positive': 'Role ID must be positive.',
        'any.required': 'Role ID is required.'
      })
  }),
  body: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.base': 'Role name must be a string.',
        'string.empty': 'Role name cannot be empty.',
        'string.min': 'Role name must be at least 2 characters long.',
        'string.max': 'Role name cannot exceed 50 characters.',
        'any.required': 'Role name is required.'
      })
  })
});

export const deleteSchema = Joi.object({
  params: Joi.object({
    role_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Role ID must be a number.',
        'number.integer': 'Role ID must be an integer.',
        'number.positive': 'Role ID must be positive.',
        'any.required': 'Role ID is required.'
      })
  })
});