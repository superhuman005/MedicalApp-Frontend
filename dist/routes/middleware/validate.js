const { validationResult } = require('express-validator');
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
module.exports = {
    validate,
    asyncHandler
};
//# sourceMappingURL=validate.js.map