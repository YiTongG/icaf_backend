import { body, param, validationResult, matchedData } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// --- tools ---
const createStringValidator = (
  field: string,
  minLength = 1,
  maxLength = 255,
  optional = false
) => {
  let chain = body(field);
  if (optional) {
    chain = chain.optional();
  }
  return chain
    .isString().withMessage(`${field} must be a string`)
    .trim()
    .isLength({ min: minLength, max: maxLength }).withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
    .escape();
};

const createParamUUIDValidator = (paramName: string) => {
  return param(paramName)
    .isUUID().withMessage(`${paramName} must be a valid UUID string`)
    .isLength({ min: 36, max: 36 }).withMessage(`${paramName} must be exactly 36 characters long`);
};

const createBooleanValidator = (field: string, optional = false) => {
  let chain = body(field).isBoolean().withMessage(`${field} must be a boolean`);
  return optional ? chain.optional() : chain;
};

// --- general validator ---
const nameValidator = [
  createStringValidator('f_name', 1, 50),
  createStringValidator('l_name', 1, 50),
];

const emailValidator = [
  body('email')
    .isEmail().withMessage('email must be a valid email address')
    .isLength({ max: 254 }).withMessage('email must not exceed 254 characters')
    .normalizeEmail(),
];

const blacklistEmailValidator = (domainBlacklist: string[], wildcardBlacklist: string[]) => [
  body('email')
    .isEmail().withMessage('email must be a valid email address')
    .isLength({ max: 254 }).withMessage('email must not exceed 254 characters')
    .custom((value) => {
      if (process.env.ENV !== 'production') return true;
      const domain = value.split('@')[1].toLowerCase();
      if (domainBlacklist.includes(domain)) {
        throw new Error('This email domain is not allowed');
      }
      for (const wildcardDomain of wildcardBlacklist) {
        if (wildcardDomain.startsWith('*.')) {
          const suffix = wildcardDomain.slice(1);
          if (domain.endsWith(suffix)) {
            throw new Error('This email domain is not allowed');
          }
        }
      }
      return true;
    })
    .normalizeEmail()
];

const verificationCodeValidator = [
  body('verificationCode')
    .isNumeric().withMessage('Verification code must be numeric')
    .isLength({ min: 6, max: 6 }).withMessage('Verification code must be exactly six digits'),
];

const passwordValidator = [
  body('password')
    .isString().withMessage('password must be a string')
    .isLength({ min: 8, max: 100 }).withMessage('password must be between 8 and 100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/).withMessage('password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

// --- user ---
export const loginUserValidator = [
  ...emailValidator,
  ...passwordValidator,
];

export const registerUserValidator = [
  ...loginUserValidator,
  ...nameValidator,
  createStringValidator('birthdate', 1, 20),
];

export const verifyUserValidator = [
  ...verificationCodeValidator,
  ...emailValidator,
];

export const refundUserValidator = [
  createParamUUIDValidator('userSk'),
];

export const updateUserValidator = [
  createStringValidator('location', 0, 100, true),
  createStringValidator('g_f_name', 0, 50, true),
  createStringValidator('g_l_name', 0, 50, true),
];

export const volunteerUpdateUserValidator = [
  createParamUUIDValidator('userSk'),
  createBooleanValidator('can_submit_art'),
];

export const forgotPasswordValidator = [...emailValidator];

export const confirmForgotPasswordValidator = [
  ...emailValidator,
  ...passwordValidator,
  createStringValidator('confirmationCode', 6, 6),
];

export const resendVerificationValidator = [...emailValidator];

// --- Artwork ---
export const getArtworkValidator = [
  createParamUUIDValidator('artworkSk'),
];

export const deleteArtworkValidator = [
  createParamUUIDValidator('artworkSk'),
];

export const addArtworkValidator = [
  createStringValidator('f_name', 1, 50),
  body('age').isInt({ min: 0, max: 150 }).withMessage('age must be an integer between 0 and 150'),
  createStringValidator('description', 1, 300),
  createStringValidator('sport', 1, 50),
  createStringValidator('location', 1, 100),
  createBooleanValidator('is_ai_gen'),
  createStringValidator('model', 0, 100, true),
  createStringValidator('prompt', 0, 300, true),
  body('file_type')
    .isString().withMessage('file_type must be a string')
    .isIn(['jpg', 'png', 'jpeg']).withMessage('file_type must be jpg, png, or jpeg'),
];

export const approveArtworkValidator = [
  createParamUUIDValidator('artworkSk'),
  createBooleanValidator('is_approved'),
];

export const generatePresignedValidator = [
  body('file_type')
    .isString().withMessage('file_type must be a string')
    .isIn(['jpg', 'png', 'jpeg']).withMessage('file_type must be jpg, png, or jpeg'),
];

export const voteArtworkValidator = [
  createParamUUIDValidator('artworkSk'),
];

// --- middleware ---
export function validationMiddleware(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: "Validation errors", errors: errors.array() });
      return; 
    }
  
    (req as any).validatedData = matchedData(req, { locations: ['body', 'query', 'params'] });
    next(); 
  }
