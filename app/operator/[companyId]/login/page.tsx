'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import BackspaceIcon from '@mui/icons-material/Backspace';
import { operatorLogin, isOperatorAuthenticated } from '@/utils/operatorAccess';

/**
 * Operator Login Page.
 *
 * Mobile-first PIN entry with large keypad.
 * Reads station (operation_type_id) from URL query param.
 */
export default function OperatorLoginPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = params.companyId as string;
  const stationId = searchParams.get('station') || undefined;

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isOperatorAuthenticated()) {
      router.push(`/operator/${companyId}/jobs`);
    }
  }, [companyId, router]);

  const handleKeyPress = (key: string) => {
    if (loading) return;

    if (key === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
      setError(null);
    } else if (pin.length < 6) {
      setPin((prev) => prev + key);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await operatorLogin({
        company_id: companyId,
        pin,
        operation_type_id: stationId,
      });

      // Success - redirect to jobs
      router.push(`/operator/${companyId}/jobs`);
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3) {
        setError('Too many failed attempts. Please contact your supervisor.');
      } else {
        setError(
          err instanceof Error ? err.message : 'Invalid PIN. Please try again.'
        );
      }
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when PIN is 4-6 digits and user pauses
  useEffect(() => {
    if (pin.length >= 4 && pin.length <= 6) {
      const timer = setTimeout(() => {
        handleSubmit();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #111439 0%, #4682B4 50%, #111439 100%)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          bgcolor: 'rgba(17, 20, 57, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
        }}
      >
        {/* Logo / Title */}
        <Typography
          variant="h4"
          component="h1"
          sx={{ mb: 1, fontWeight: 700, color: 'primary.main' }}
        >
          Jigged
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Enter your PIN to log in
        </Typography>

        {/* PIN Display */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mb: 3,
            minHeight: 48,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Box
              key={i}
              sx={{
                width: 40,
                height: 48,
                borderRadius: 1,
                bgcolor: pin[i] ? 'primary.main' : 'rgba(255,255,255,0.1)',
                border: '2px solid',
                borderColor: pin[i] ? 'primary.main' : 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {pin[i] && (
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'white',
                  }}
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Keypad */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1.5,
            mb: 3,
          }}
        >
          {keypadKeys.map((key, index) => (
            <Box key={index}>
              {key === '' ? (
                <Box sx={{ height: 64 }} /> // Empty space
              ) : key === 'backspace' ? (
                <Button
                  variant="outlined"
                  onClick={() => handleKeyPress('backspace')}
                  disabled={loading || pin.length === 0}
                  sx={{
                    minHeight: 64,
                    width: '100%',
                    fontSize: 24,
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(70, 130, 180, 0.1)',
                    },
                  }}
                >
                  <BackspaceIcon />
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => handleKeyPress(key)}
                  disabled={loading || attempts >= 3}
                  sx={{
                    minHeight: 64,
                    width: '100%',
                    fontSize: 28,
                    fontWeight: 600,
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(70, 130, 180, 0.1)',
                    },
                  }}
                >
                  {key}
                </Button>
              )}
            </Box>
          ))}
        </Box>

        {/* Loading Indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {/* Station Info */}
        {stationId && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Station: {stationId.slice(0, 8)}...
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
