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
    username: Joi.string()
      .min(3)
      .max(50)
      .pattern(/^[a-zA-Z0-9._-]+$/)
      .required()
      .messages({
        'string.base': 'Username must be a text value.',
        'string.min': 'Username must be at least 3 characters long.',
        'string.max': 'Username cannot exceed 50 characters.',
        'string.pattern.base': 'Username can only contain letters, numbers, dot, underscore, and dash.',
        'any.required': 'Username is required.'
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
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
    role: Joi.any().forbidden(),
    admin_registration_secret: Joi.any().forbidden(),
  })
});

export const loginSchema = Joi.object({
  body: Joi.object({
    identifier: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.base': 'Username/email must be a text value.',
        'any.required': 'Username/email is required.'
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.base': 'Password must be a text value.',
        'any.required': 'Password is required.'
      }),
    role: Joi.any().forbidden(),
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
      .valid('pending', 'verified', 'disabled')
      .required()
      .messages({
        'any.only': 'Status must be one of: pending, verified, disabled.',
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

export const userPermissionListSchema = Joi.object({
  params: Joi.object({
    user_id: Joi.number().integer().required().messages({
      'number.base': 'User ID must be a number.',
      'number.integer': 'User ID must be an integer.',
      'any.required': 'User ID is required.'
    })
  })
});

export const userPermissionMutateSchema = Joi.object({
  params: Joi.object({
    user_id: Joi.number().integer().required().messages({
      'number.base': 'User ID must be a number.',
      'number.integer': 'User ID must be an integer.',
      'any.required': 'User ID is required.'
    })
  }),
  body: Joi.object({
    permission_id: Joi.number().integer().required().messages({
      'number.base': 'Permission ID must be a number.',
      'number.integer': 'Permission ID must be an integer.',
      'any.required': 'Permission ID is required.'
    })
  })
});

export const userRoleMutateSchema = Joi.object({
  params: Joi.object({
    user_id: Joi.number().integer().positive().required().messages({
      'number.base': 'User ID must be a number.',
      'number.integer': 'User ID must be an integer.',
      'number.positive': 'User ID must be positive.',
      'any.required': 'User ID is required.'
    })
  }),
  body: Joi.object({
    role_id: Joi.number().integer().positive().required().messages({
      'number.base': 'Role ID must be a number.',
      'number.integer': 'Role ID must be an integer.',
      'number.positive': 'Role ID must be positive.',
      'any.required': 'Role ID is required.'
    })
  })
});

export const userRoleSyncSchema = Joi.object({
  params: Joi.object({
    user_id: Joi.number().integer().positive().required().messages({
      'number.base': 'User ID must be a number.',
      'number.integer': 'User ID must be an integer.',
      'number.positive': 'User ID must be positive.',
      'any.required': 'User ID is required.'
    })
  }),
  body: Joi.object({
    role_ids: Joi.array()
      .items(
        Joi.number().integer().positive().messages({
          'number.base': 'Each role ID must be a number.',
          'number.integer': 'Each role ID must be an integer.',
          'number.positive': 'Each role ID must be positive.'
        })
      )
      .min(1)
      .required()
      .messages({
        'array.base': 'Role IDs must be an array.',
        'array.min': 'At least one role is required.',
        'any.required': 'Role IDs are required.'
      })
  })
});
