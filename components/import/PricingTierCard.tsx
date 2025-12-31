'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { PricingTierCardProps } from './types';

/**
 * Standalone card for managing pricing tier column mappings.
 * Used specifically for parts import to map quantity/price column pairs.
 */
export default function PricingTierCard({
  pricingTiers,
  csvHeaders,
  onPricingTierChange,
  onPricingTierAdd,
  onPricingTierRemove,
}: PricingTierCardProps) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Pricing Tier Mappings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Map quantity and price column pairs for each pricing tier
            </Typography>
          </Box>
          <Button startIcon={<AddIcon />} onClick={onPricingTierAdd} size="small">
            Add Tier
          </Button>
        </Box>

        {pricingTiers.length === 0 ? (
          <Alert severity="info">
            No pricing columns detected. Click &quot;Add Tier&quot; to manually map pricing columns,
            or leave empty if parts don&apos;t have volume pricing.
          </Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 80 }}>Tier</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Quantity Column</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 40 }}></TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Price Column</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pricingTiers.map((pair, index) => (
                <TableRow key={index}>
                  <TableCell>Tier {index + 1}</TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={pair.qty_column}
                        onChange={(e) => onPricingTierChange(index, 'qty_column', e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Select column</em>
                        </MenuItem>
                        {csvHeaders.map((h) => (
                          <MenuItem key={h} value={h}>
                            {h}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <ArrowForwardIcon color="disabled" />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={pair.price_column}
                        onChange={(e) => onPricingTierChange(index, 'price_column', e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Select column</em>
                        </MenuItem>
                        {csvHeaders.map((h) => (
                          <MenuItem key={h} value={h}>
                            {h}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => onPricingTierRemove(index)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
