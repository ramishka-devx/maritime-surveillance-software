import Joi from 'joi';

export const createForVesselSchema = Joi.object({
  params: Joi.object({
    vessel_id: Joi.number().integer().required()
  }),
  body: Joi.object({
    recorded_at: Joi.date().required(),
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required(),
    sog_kn: Joi.number().min(0).max(200).allow(null),
    cog_deg: Joi.number().min(0).max(360).allow(null),
    heading_deg: Joi.number().integer().min(0).max(359).allow(null),
    nav_status: Joi.string().max(50).allow('', null),
    source: Joi.string().valid('ais', 'radar', 'manual', 'fused').default('ais')
  })
});

export const listForVesselSchema = Joi.object({
  params: Joi.object({
    vessel_id: Joi.number().integer().required()
  }),
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(200).default(25),
    from: Joi.date().iso().allow('', null),
    to: Joi.date().iso().allow('', null)
  })
});

export const latestForVesselSchema = Joi.object({
  params: Joi.object({
    vessel_id: Joi.number().integer().required()
  })
});

export const getByIdSchema = Joi.object({
  params: Joi.object({
    position_id: Joi.number().integer().required()
  })
});
