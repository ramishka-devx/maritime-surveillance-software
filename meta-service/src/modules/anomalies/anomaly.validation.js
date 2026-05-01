import Joi from 'joi';

export const listSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(200).default(25),
    mmsi: Joi.number().integer().allow(null),
    from: Joi.date().iso().allow('', null),
    to: Joi.date().iso().allow('', null),
    anomaly_type: Joi.string().valid('speed', 'route', 'behavoir').allow(null)
  })
});

export const getByIdSchema = Joi.object({
  params: Joi.object({
    anomaly_id: Joi.number().integer().required()
  })
});

export const createSchema = Joi.object({
  body: Joi.object({
    mmsi: Joi.number().integer().required(),
    anomaly_type: Joi.string().valid('speed', 'route', 'behavoir').required(),
    sog: Joi.number().min(0).max(200).allow(null),
    cog: Joi.number().min(0).max(360).allow(null),
    heading: Joi.number().integer().min(0).max(359).allow(null),
    nav_status: Joi.number().integer().min(0).max(255).allow(null),
    p99_speed: Joi.number().min(0).max(200).allow(null),
    details: Joi.object().unknown(true).allow(null),
    lon: Joi.number().min(-180).max(180).allow(null),
    alt: Joi.number().allow(null),
    detected_at: Joi.date().iso().allow(null)
  })
});

export const updateSchema = Joi.object({
  params: Joi.object({
    anomaly_id: Joi.number().integer().required()
  }),
  body: Joi.object({
    mmsi: Joi.number().integer(),
    anomaly_type: Joi.string().valid('speed', 'route', 'behavoir'),
    sog: Joi.number().min(0).max(200).allow(null),
    cog: Joi.number().min(0).max(360).allow(null),
    heading: Joi.number().integer().min(0).max(359).allow(null),
    nav_status: Joi.number().integer().min(0).max(255).allow(null),
    p99_speed: Joi.number().min(0).max(200).allow(null),
    details: Joi.object().unknown(true).allow(null),
    lon: Joi.number().min(-180).max(180).allow(null),
    alt: Joi.number().allow(null),
    detected_at: Joi.date().iso().allow(null)
  })
});

export const deleteSchema = Joi.object({
  params: Joi.object({
    anomaly_id: Joi.number().integer().required()
  })
});
