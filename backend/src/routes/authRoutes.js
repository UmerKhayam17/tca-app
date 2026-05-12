const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

const router = Router();

router.post('/login', authLimiter, validate(schemas.login), auth.login);
router.post('/refresh', authLimiter, validate(schemas.refresh), auth.refresh);
router.post('/logout', auth.logout);
router.post('/otp/send', authLimiter, validate(schemas.otpSend), auth.sendOtp);
router.post('/otp/verify', authLimiter, validate(schemas.otpVerify), auth.verifyOtp);

module.exports = router;
