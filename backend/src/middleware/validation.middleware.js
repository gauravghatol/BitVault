/**
 * Validation Middleware
 * Express-validator rules for request validation
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    const mainMessage = errorMessages.length === 1 
      ? errorMessages[0] 
      : 'Validation failed: ' + errorMessages.join(', ');
    
    return res.status(400).json({
      success: false,
      message: mainMessage,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Auth validation rules
 */
const authValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters'),
    handleValidationErrors
  ],
  
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ]
};

/**
 * Wallet validation rules
 */
const walletValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Wallet name is required')
      .isLength({ max: 100 })
      .withMessage('Wallet name cannot exceed 100 characters'),
    body('storageType')
      .isIn(['hot', 'cold'])
      .withMessage('Storage type must be either "hot" or "cold"'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Color must be a valid hex color'),
    handleValidationErrors
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid wallet ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Wallet name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    handleValidationErrors
  ],
  
  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid wallet ID'),
    handleValidationErrors
  ]
};

/**
 * Transaction validation rules
 */
const transactionValidation = {
  create: [
    body('walletId')
      .isMongoId()
      .withMessage('Invalid wallet ID'),
    body('toAddress')
      .notEmpty()
      .withMessage('Recipient address is required')
      .isLength({ min: 26, max: 62 })
      .withMessage('Invalid Bitcoin address format'),
    body('amount')
      .isInt({ min: 1 })
      .withMessage('Amount must be at least 1 satoshi'),
    body('memo')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Memo cannot exceed 500 characters'),
    body('privateKey')
      .optional()
      .custom((value) => {
        // Accept WIF format (51-52 chars) or HEX format (64 chars)
        const isWIF = value.length >= 51 && value.length <= 52;
        const isHEX = value.length === 64 && /^[0-9a-fA-F]+$/.test(value);
        return isWIF || isHEX;
      })
      .withMessage('Private key format is invalid. Please enter the complete private key shown when you created this cold wallet'),
    handleValidationErrors
  ],
  
  getById: [
    param('txId')
      .notEmpty()
      .withMessage('Transaction ID is required'),
    handleValidationErrors
  ],
  
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('type')
      .optional()
      .isIn(['send', 'receive', 'internal'])
      .withMessage('Invalid transaction type'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  authValidation,
  walletValidation,
  transactionValidation
};
