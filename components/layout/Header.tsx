'use client';

import Box from '@mui/material/Box';

export default function Header() {
  // Sign Out moved to drawer in this design
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        px: 3,
        py: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        bgcolor: 'rgba(17, 20, 57, 0.4)',
        backdropFilter: 'blur(8px)',
        minHeight: 64,
      }}
    >
      {/* Actions moved to drawer - header kept for layout consistency */}
    </Box>
  );
}
