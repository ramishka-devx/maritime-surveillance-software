import Joi from 'joi';

// Per-key validation happens in the service against the registry.
export const updateSchema = Joi.object({
  body: Joi.object().pattern(Joi.string(), Joi.any()).min(1).required()
});

export const overrideSchema = Joi.object({
  params: Joi.object({
    type_group: Joi.number().integer().min(0).max(99).required()
  }),
  body: Joi.object({
    p99_override: Joi.number().greater(0).max(100).allow(null).required()
  })
});

export const reportComputedSchema = Joi.object({
  body: Joi.object({
    model_version: Joi.string().max(100).allow(null),
    thresholds: Joi.array()
      .items(
        Joi.object({
          type_group: Joi.number().integer().min(0).max(99).required(),
          label: Joi.string().max(100).allow(null),
          p99: Joi.number().min(0).max(200).allow(null).required(),
          sample_count: Joi.number().integer().min(0).required()
        })
      )
      .max(100)
      .required()
  })
});
