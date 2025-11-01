import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  Divider,
  InputAdornment,
  Alert,
  Fade,
  CircularProgress,
  useTheme,
  IconButton
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Call reset password function from auth context
      await resetPassword(email);
      
      // Show success state
      setEmailSent(true);
      startCountdown();
      
      // Show success message
      toast.success('Password reset link sent to your email!');
      
    } catch (err) {
      console.error('Error sending reset email:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start countdown for resend email
  const startCountdown = () => {
    setCountdown(60); // 60 seconds
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Handle resend email
  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      // Call reset password function again
      await resetPassword(email);
      
      // Restart countdown
      startCountdown();
      
      // Show success message
      toast.success('Password reset link resent to your email!');
      
    } catch (err) {
      console.error('Error resending reset email:', err);
      setError(err.message || 'Failed to resend reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
          {!emailSent ? (
            <>
              <StyledAvatar>
                <EmailIcon />
              </StyledAvatar>
              
              <Typography component="h1" variant="h5" gutterBottom>
                Forgot Password?
              </Typography>
              
              <Typography variant="body2" color="textSecondary" align="center" paragraph>
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
              
              {error && (
                <Fade in={!!error}>
                  <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                    {error}
                  </Alert>
                </Fade>
              )}
              
              <Box 
                component="form" 
                onSubmit={handleSubmit} 
                sx={{ mt: 1, width: '100%' }}
              >
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  error={!!error}
                  helperText={error}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
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
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Send Reset Link'
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
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
              <CheckCircleIcon 
                sx={{ 
                  fontSize: 80, 
                  color: 'success.main',
                  mb: 2
                }} 
              />
              
              <Typography variant="h5" gutterBottom>
                Check Your Email
              </Typography>
              
              <Typography variant="body1" color="textSecondary" paragraph>
                We've sent a password reset link to:
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  wordBreak: 'break-word',
                  mb: 3
                }}
              >
                {email}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                Please check your email and click on the link to reset your password.
              </Typography>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                If you don't see the email, please check your spam folder.
              </Typography>
              
              <Box sx={{ mt: 3, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleResendEmail}
                  disabled={countdown > 0 || isLoading}
                  sx={{ mr: 2 }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
              </Box>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
                Didn't receive the email? Check your spam folder or{' '}
                <MuiLink 
                  component="button" 
                  variant="body2"
                  onClick={handleResendEmail}
                  disabled={countdown > 0}
                  sx={{ 
                    cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    opacity: countdown > 0 ? 0.7 : 1
                  }}
                >
                  click here to resend
                </MuiLink>
              </Typography>
            </Box>
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

export default ForgotPasswordPage;
