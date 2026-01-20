import Joi from 'joi';

export const registerSchema = Joi.object({
  body: Joi.object({
    first_name: Joi.string()
      .max(50)
      .required()
      .messages({
        'string.base': 'First name must be a text value.',
        'string.max': 'First name cannot exceed 50 characters.',
        'any.required': 'First name is required.'
      }),
    last_name: Joi.string()
      .max(50)
      .required()
      .messages({
        'string.base': 'Last name must be a text value.',
        'string.max': 'Last name cannot exceed 50 characters.',
        'any.required': 'Last name is required.'
      }),
    email: Joi.string()
      .email()
      .max(100)
      .required()
      .messages({
        'string.base': 'Email must be a text value.',
        'string.email': 'Please provide a valid email address.',
        'string.max': 'Email cannot exceed 100 characters.',
        'any.required': 'Email is required.'
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.base': 'Password must be a text value.',
        'string.min': 'Password must be at least 6 characters long.',
        'string.max': 'Password cannot exceed 128 characters.',
        'any.required': 'Password is required.'
      }),
  })
});

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.base': 'Email must be a text value.',
        'string.email': 'Please provide a valid email address.',
        'any.required': 'Email is required.'
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.base': 'Password must be a text value.',
        'any.required': 'Password is required.'
      })
  })
});

export const updateSchema = Joi.object({
  params: Joi.object({
    user_id: Joi.number()
      .integer()
      .required()
      .messages({
        'number.base': 'User ID must be a number.',
        'number.integer': 'User ID must be an integer.',
        'any.required': 'User ID is required.'
      })
  }),
  body: Joi.object({
    first_name: Joi.string()
      .max(50)
      .messages({
        'string.base': 'First name must be a text value.',
        'string.max': 'First name cannot exceed 50 characters.'
      }),
    last_name: Joi.string()
      .max(50)
      .messages({
        'string.base': 'Last name must be a text value.',
        'string.max': 'Last name cannot exceed 50 characters.'
      }),
    role_id: Joi.number()
      .integer()
      .messages({
        'number.base': 'Role ID must be a number.',
        'number.integer': 'Role ID must be an integer.'
      })
  })
});

export const updateStatusSchema = Joi.object({
  params: Joi.object({
    user_id: Joi.number()
      .integer()
      .required()
      .messages({
        'number.base': 'User ID must be a number.',
        'number.integer': 'User ID must be an integer.',
        'any.required': 'User ID is required.'
      })
  }),
  body: Joi.object({
    status: Joi.string()
      .valid('pending', 'verified', 'deleted')
      .required()
      .messages({
        'any.only': 'Status must be one of: pending, verified, deleted.',
        'any.required': 'Status is required.'
      })
  })
});

export const updateRoleSchema = Joi.object({
  params: Joi.object({
    user_id: Joi.number()
      .integer()
      .required()
      .messages({
        'number.base': 'User ID must be a number.',
        'number.integer': 'User ID must be an integer.',
        'any.required': 'User ID is required.'
      })
  }),
  body: Joi.object({
    role_id: Joi.number()
      .integer()
      .required()
      .messages({
        'number.base': 'Role ID must be a number.',
        'number.integer': 'Role ID must be an integer.',
        'any.required': 'Role ID is required.'
      })
  })
});
