import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Link as MuiLink,
  InputAdornment,
  IconButton,
  Alert,
  Fade,
  CircularProgress,
  useTheme,
  LinearProgress
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import zxcvbn from 'zxcvbn';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 480,
  margin: '0 auto',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[10],
  background: theme.palette.background.paper,
}));

const StyledAvatar = styled(Box)(({ theme, error }) => ({
  margin: theme.spacing(1),
  backgroundColor: error ? theme.palette.error.main : theme.palette.primary.main,
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

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [tokenValid, setTokenValid] = useState(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  
  const { validateResetToken, resetPasswordWithToken } = useAuth();
  
  // Password requirements
  const passwordRequirements = [
    { id: 1, text: 'At least 8 characters', validate: (pwd) => pwd.length >= 8 },
    { id: 2, text: 'At least one uppercase letter', validate: (pwd) => /[A-Z]/.test(pwd) },
    { id: 3, text: 'At least one lowercase letter', validate: (pwd) => /[a-z]/.test(pwd) },
    { id: 4, text: 'At least one number', validate: (pwd) => /[0-9]/.test(pwd) },
    { id: 5, text: 'At least one special character', validate: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];
  
  // Check if token is valid on component mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        setIsLoading(true);
        await validateResetToken(token);
        setTokenValid(true);
      } catch (err) {
        console.error('Invalid or expired token:', err);
        setTokenValid(false);
      } finally {
        setTokenChecked(true);
        setIsLoading(false);
      }
    };
    
    if (token) {
      checkToken();
    } else {
      setTokenValid(false);
      setTokenChecked(true);
    }
  }, [token, validateResetToken]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
    
    // Check password strength in real-time
    if (name === 'password') {
      const result = zxcvbn(value);
      setPasswordStrength((result.score / 4) * 100);
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
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Call reset password with token
      await resetPasswordWithToken(token, formData.password);
      
      // Show success state
      setPasswordReset(true);
      
      // Show success message
      toast.success('Your password has been reset successfully!');
      
      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
      
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
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
    
    return errors;
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
  
  // Show loading state while checking token
  if (!tokenChecked) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <IconButton 
            onClick={() => navigate('/login')} 
            sx={{ alignSelf: 'flex-start', mb: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <StyledPaper elevation={3}>
            <StyledAvatar error>
              <ErrorIcon />
            </StyledAvatar>
            
            <Typography component="h1" variant="h5" gutterBottom align="center">
              Invalid or Expired Link
            </Typography>
            
            <Typography variant="body1" color="textSecondary" align="center" paragraph>
              The password reset link you're trying to use is invalid or has expired.
            </Typography>
            
            <Typography variant="body2" color="textSecondary" align="center" paragraph>
              Please request a new password reset link from the login page.
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => navigate('/login')}
              sx={{ mt: 3, mb: 2 }}
            >
              Back to Login
            </Button>
            
            <Box textAlign="center" mt={2}>
              <MuiLink 
                component={RouterLink} 
                to="/forgot-password" 
                variant="body2"
                sx={{ textDecoration: 'none' }}
              >
                Request New Reset Link
              </MuiLink>
            </Box>
          </StyledPaper>
        </Box>
      </Container>
    );
  }
  
  // Show success state after password reset
  if (passwordReset) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <StyledPaper elevation={3}>
            <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
              <CheckCircleIcon 
                sx={{ 
                  fontSize: 80, 
                  color: 'success.main',
                  mb: 2
                }} 
              />
              
              <Typography variant="h5" gutterBottom>
                Password Reset Successful!
              </Typography>
              
              <Typography variant="body1" color="textSecondary" paragraph>
                Your password has been updated successfully.
              </Typography>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                You will be redirected to the login page in a few seconds...
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/login')}
                sx={{ mt: 2 }}
              >
                Go to Login
              </Button>
            </Box>
          </StyledPaper>
        </Box>
      </Container>
    );
  }
  
  // Show reset password form
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ alignSelf: 'flex-start', mb: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <StyledPaper elevation={3}>
          <StyledAvatar>
            <LockIcon />
          </StyledAvatar>
          
          <Typography component="h1" variant="h5" gutterBottom>
            Create New Password
          </Typography>
          
          <Typography variant="body2" color="textSecondary" align="center" paragraph>
            Please enter your new password below.
          </Typography>
          
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ mt: 1, width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="New Password"
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
                        {isValid ? <CheckCircleIcon fontSize="small" /> : <ErrorIcon fontSize="small" />}
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
              label="Confirm New Password"
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
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading || !isPasswordValid(formData.password) || formData.password !== formData.confirmPassword}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Reset Password'
              )}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <MuiLink 
                component={RouterLink} 
                to="/login" 
                variant="body2"
                sx={{ textDecoration: 'none' }}
              >
                Back to Sign In
              </MuiLink>
            </Box>
          </Box>
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

export default ResetPasswordPage;
