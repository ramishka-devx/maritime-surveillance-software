import Joi from 'joi';

export const listSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    q: Joi.string().max(120).allow('', null)
  })
});

export const getByIdSchema = Joi.object({
  params: Joi.object({
    vessel_id: Joi.number().integer().required()
  })
});

export const createSchema = Joi.object({
  body: Joi.object({
    mmsi: Joi.string().pattern(/^[0-9]{9}$/).required(),
    imo: Joi.string().max(10).allow('', null),
    name: Joi.string().max(120).allow('', null),
    callsign: Joi.string().max(20).allow('', null),
    flag: Joi.string().max(60).allow('', null),
    vessel_type: Joi.string().max(60).allow('', null),
    length_m: Joi.number().min(0).max(9999).allow(null),
    width_m: Joi.number().min(0).max(9999).allow(null),
    status: Joi.string().valid('active', 'inactive').default('active')
  })
});

export const updateSchema = Joi.object({
  params: Joi.object({
    vessel_id: Joi.number().integer().required()
  }),
  body: Joi.object({
    mmsi: Joi.string().pattern(/^[0-9]{9}$/),
    imo: Joi.string().max(10).allow('', null),
    name: Joi.string().max(120).allow('', null),
    callsign: Joi.string().max(20).allow('', null),
    flag: Joi.string().max(60).allow('', null),
    vessel_type: Joi.string().max(60).allow('', null),
    length_m: Joi.number().min(0).max(9999).allow(null),
    width_m: Joi.number().min(0).max(9999).allow(null),
    status: Joi.string().valid('active', 'inactive')
  })
});

export const deleteSchema = Joi.object({
  params: Joi.object({
    vessel_id: Joi.number().integer().required()
  })
});
