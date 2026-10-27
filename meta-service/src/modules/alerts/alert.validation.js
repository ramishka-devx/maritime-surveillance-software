import Joi from 'joi';

export const ALERT_STATUSES = ['open', 'acknowledged', 'escalated', 'resolved', 'dismissed'];
// One status or a comma-separated list of them.
const STATUS_LIST = new RegExp(`^(${ALERT_STATUSES.join('|')})(,(${ALERT_STATUSES.join('|')}))*$`);

export const ALERT_TYPES = [
  'geofence',
  'speed',
  'collision_risk',
  'dark_vessel',
  'manual',
  'loitering',
  'route_deviation'
];

export const listSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(1000).default(10),
    status: Joi.string().pattern(STATUS_LIST).allow('', null),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').allow('', null),
    vessel_id: Joi.number().integer().allow(null),
    sort: Joi.string().valid('newest', 'severity').default('newest'),
    type: Joi.string().valid(...ALERT_TYPES).allow('', null),
    mmsi: Joi.number().integer().allow(null),
    from: Joi.date().iso().allow('', null),
    to: Joi.date().iso().allow('', null)
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
    type: Joi.string().valid(...ALERT_TYPES).default('manual'),
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
    type: Joi.string().valid(...ALERT_TYPES),
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
    status: Joi.string().valid(...ALERT_STATUSES).required()
  })
});

export const escalateSchema = Joi.object({
  params: Joi.object({
    alert_id: Joi.number().integer().required()
  }),
  body: Joi.object({
    note: Joi.string().max(500).allow('', null)
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
