const Joi = require("joi");
exports.signupSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().required(),
    role: Joi.string().valid("doctor", "patient")
});
//# sourceMappingURL=authValidation.js.map