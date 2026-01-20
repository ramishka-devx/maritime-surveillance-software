import Joi from 'joi';

export const listSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    status: Joi.string().valid('open', 'acknowledged', 'resolved', 'dismissed').allow('', null),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').allow('', null),
    vessel_id: Joi.number().integer().allow(null)
  })
});

export const getByIdSchema = Joi.object({
  params: Joi.object({
    alert_id: Joi.number().integer().required()
  })
});

export const createSchema = Joi.object({
  body: Joi.object({
    vessel_id: Joi.number().integer().allow(null),
    type: Joi.string().valid('geofence', 'speed', 'collision_risk', 'dark_vessel', 'manual').default('manual'),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    title: Joi.string().max(255).required(),
    description: Joi.string().allow('', null),
    assigned_to: Joi.number().integer().allow(null)
  })
});

export const updateSchema = Joi.object({
  params: Joi.object({
    alert_id: Joi.number().integer().required()
  }),
  body: Joi.object({
    vessel_id: Joi.number().integer().allow(null),
    type: Joi.string().valid('geofence', 'speed', 'collision_risk', 'dark_vessel', 'manual'),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
    title: Joi.string().max(255),
    description: Joi.string().allow('', null),
    assigned_to: Joi.number().integer().allow(null)
  })
});

export const updateStatusSchema = Joi.object({
  params: Joi.object({
    alert_id: Joi.number().integer().required()
  }),
  body: Joi.object({
    status: Joi.string().valid('open', 'acknowledged', 'resolved', 'dismissed').required()
  })
});

export const assignSchema = Joi.object({
  params: Joi.object({
    alert_id: Joi.number().integer().required()
  }),
  body: Joi.object({
    assigned_to: Joi.number().integer().required()
  })
});
