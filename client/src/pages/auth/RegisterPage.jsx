import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  Link as MuiLink,
  Divider,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Alert,
  Fade,
  CircularProgress,
  FormHelperText,
  Collapse,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import zxcvbn from 'zxcvbn';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 520,
  margin: '0 auto',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[10],
  background: theme.palette.background.paper,
}));

const StyledAvatar = styled(Box)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  width: 60,
  height: 60,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  '& svg': {
    color: theme.palette.primary.contrastText,
    fontSize: 32,
  },
}));

const PasswordStrength = styled(LinearProgress)(({ theme, value }) => {
  let color = theme.palette.error.main;
  if (value > 30) color = theme.palette.warning.main;
  if (value > 70) color = theme.palette.success.main;
  
  return {
    marginTop: theme.spacing(1),
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.palette.grey[200],
    '& .MuiLinearProgress-bar': {
      backgroundColor: color,
    },
  };
});

const PasswordRequirement = styled('div')(({ theme, valid }) => ({
  display: 'flex',
  alignItems: 'center',
  color: valid ? theme.palette.success.main : theme.palette.text.secondary,
  fontSize: '0.8rem',
  marginBottom: theme.spacing(0.5),
  '& svg': {
    marginRight: theme.spacing(1),
    fontSize: '1rem',
  },
}));

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    subscribeNewsletter: true,
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordSuggestions, setPasswordSuggestions] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Password requirements
  const passwordRequirements = [
    { id: 1, text: 'At least 8 characters', validate: (pwd) => pwd.length >= 8 },
    { id: 2, text: 'At least one uppercase letter', validate: (pwd) => /[A-Z]/.test(pwd) },
    { id: 3, text: 'At least one lowercase letter', validate: (pwd) => /[a-z]/.test(pwd) },
    { id: 4, text: 'At least one number', validate: (pwd) => /[0-9]/.test(pwd) },
    { id: 5, text: 'At least one special character', validate: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];
  
  // Steps for multi-step form
  const steps = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'account', label: 'Account Details' },
    { id: 'complete', label: 'Complete Registration' },
  ];
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
    
    // Clear register error when user starts typing
    if (registerError) {
      setRegisterError('');
    }
    
    // Check password strength in real-time
    if (name === 'password') {
      const result = zxcvbn(value);
      setPasswordStrength((result.score / 4) * 100);
      setPasswordSuggestions(result.feedback.suggestions);
    }
  };
  
  // Toggle password visibility
  const handleTogglePassword = (field) => {
    if (field === 'password') {
      setShowPassword(prev => !prev);
    } else {
      setShowConfirmPassword(prev => !prev);
    }
  };
  
  // Handle next step in multi-step form
  const handleNext = () => {
    // Validate current step before proceeding
    const validationErrors = validateStep(activeStep);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };
  
  // Handle previous step in multi-step form
  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };
  
  // Validate current step
  const validateStep = (step) => {
    const errors = {};
    
    if (step === 0) {
      // Personal info validation
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      }
      
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      }
      
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      if (formData.phone && !/^[+]?[\s.-]?(?:\(?\d{1,3}\)?[\s.-]?)?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    } 
    
    if (step === 1) {
      // Account details validation
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (passwordStrength < 50) {
        errors.password = 'Please choose a stronger password';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.acceptTerms) {
        errors.acceptTerms = 'You must accept the terms and conditions';
      }
    }
    
    return errors;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    const validationErrors = {};
    steps.forEach((_, index) => {
      const stepErrors = validateStep(index);
      Object.assign(validationErrors, stepErrors);
    });
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      setIsLoading(true);
      setRegisterError('');
      
      // Prepare user data for registration
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        subscribeNewsletter: formData.subscribeNewsletter,
      };
      
      // Call register function from auth context
      await register(userData);
      
      // Show success message and redirect to login or dashboard
      toast.success('Registration successful! Please check your email to verify your account.');
      
      // Move to completion step
      setActiveStep(steps.length - 1);
      
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if all password requirements are met
  const isPasswordValid = (password) => {
    return passwordRequirements.every(req => req.validate(password));
  };
  
  // Get password strength label
  const getPasswordStrengthLabel = (score) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[Math.round((score / 100) * (labels.length - 1))] || '';
  };
  
  // Render step content based on active step
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="phone"
                  label="Phone Number (Optional)"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!errors.phone}
                  helperText={errors.phone || 'Include country code (e.g., +90)'}
                  placeholder="+90 555 123 45 67"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, width: '100%' }}>
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
                disabled={isLoading}
              >
                Next
              </Button>
            </Box>
          </>
        );
        
      case 1:
        return (
          <>
            <Box sx={{ width: '100%', mb: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleTogglePassword('password')}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {formData.password && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="textSecondary">
                      Password Strength: {getPasswordStrengthLabel(passwordStrength)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {Math.round(passwordStrength)}%
                    </Typography>
                  </Box>
                  <PasswordStrength 
                    variant="determinate" 
                    value={passwordStrength} 
                  />
                  
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Password Requirements:
                    </Typography>
                    {passwordRequirements.map((req) => {
                      const isValid = req.validate(formData.password);
                      return (
                        <PasswordRequirement key={req.id} valid={isValid}>
                          {isValid ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
                          {req.text}
                        </PasswordRequirement>
                      );
                    })}
                  </Box>
                </Box>
              )}
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => handleTogglePassword('confirmPassword')}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox 
                    name="acceptTerms" 
                    color="primary" 
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <MuiLink href="/terms" target="_blank" rel="noopener">
                      Terms of Service
                    </MuiLink>{' '}
                    and{' '}
                    <MuiLink href="/privacy" target="_blank" rel="noopener">
                      Privacy Policy
                    </MuiLink>
                  </Typography>
                }
                sx={{ mt: 2 }}
              />
              {errors.acceptTerms && (
                <FormHelperText error>{errors.acceptTerms}</FormHelperText>
              )}
              
              <FormControlLabel
                control={
                  <Checkbox 
                    name="subscribeNewsletter" 
                    color="primary" 
                    checked={formData.subscribeNewsletter}
                    onChange={handleChange}
                  />
                }
                label={
                  <Typography variant="body2">
                    Subscribe to our newsletter
                  </Typography>
                }
                sx={{ mt: 1 }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, width: '100%' }}>
              <Button
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading || !isPasswordValid(formData.password) || formData.password !== formData.confirmPassword || !formData.acceptTerms}
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Create Account'
                )}
              </Button>
            </Box>
          </>
        );
        
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleOutlineIcon 
              sx={{ 
                fontSize: 80, 
                color: 'success.main',
                mb: 2
              }} 
            />
            <Typography variant="h5" gutterBottom>
              Registration Successful!
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Thank you for registering, {formData.firstName}!
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              We've sent a verification link to <strong>{formData.email}</strong>.
              Please check your email and click the link to verify your account.
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              If you don't see the email, please check your spam folder.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <StyledPaper elevation={3}>
          {activeStep < steps.length - 1 && (
            <>
              <StyledAvatar>
                <PersonIcon />
              </StyledAvatar>
              
              <Typography component="h1" variant="h5" gutterBottom>
                Create an account
              </Typography>
              
              <Typography variant="body2" color="textSecondary" align="center" paragraph>
                Join our community today. It's quick and easy!
              </Typography>
              
              {/* Progress Stepper */}
              <Box sx={{ width: '100%', mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <Box 
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          zIndex: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: activeStep >= index ? 'primary.main' : 'action.disabledBackground',
                            color: activeStep >= index ? 'primary.contrastText' : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'medium',
                            mb: 1,
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Typography 
                          variant="caption" 
                          align="center"
                          sx={{
                            color: activeStep >= index ? 'text.primary' : 'text.secondary',
                            fontWeight: activeStep >= index ? 'medium' : 'regular',
                            fontSize: '0.7rem',
                            maxWidth: 80,
                            lineHeight: 1.2,
                          }}
                        >
                          {step.label}
                        </Typography>
                      </Box>
                      
                      {index < steps.length - 1 && (
                        <Box 
                          sx={{
                            position: 'absolute',
                            top: 18,
                            left: `calc(${(index + 1) * (100 / steps.length)}% - 18px)`,
                            right: `calc(${(steps.length - index - 1) * (100 / steps.length)}% - 18px)`,
                            height: 2,
                            backgroundColor: activeStep > index ? 'primary.main' : 'action.disabledBackground',
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </Box>
              </Box>
            </>
          )}
          
          {registerError && (
            <Fade in={!!registerError}>
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {registerError}
              </Alert>
            </Fade>
          )}
          
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            {renderStepContent(activeStep)}
          </Box>
          
          {activeStep < steps.length - 1 && (
            <Grid container justifyContent="center" sx={{ mt: 3 }}>
              <Grid item>
                <Typography variant="body2" color="textSecondary">
                  Already have an account?{' '}
                  <MuiLink 
                    component={Link} 
                    to="/login" 
                    variant="body2"
                    sx={{ textDecoration: 'none' }}
                  >
                    Sign in
                  </MuiLink>
                </Typography>
              </Grid>
            </Grid>
          )}
        </StyledPaper>
        
        <Box mt={5} textAlign="center">
          <Typography variant="body2" color="textSecondary">
            © {new Date().getFullYear()} EV Charging Network. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;
