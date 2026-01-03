'use client';

import { SyntheticEvent } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';

export interface SelectOption {
  id: string;
  label: string;
  /** Optional secondary text shown in parentheses */
  secondaryLabel?: string;
}

interface SearchableSelectProps {
  /** The options to display in the dropdown */
  options: SelectOption[];
  /** The currently selected value (option id) */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Label for the input field */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether options are loading */
  loading?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display */
  helperText?: string;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Whether to include a "None" option at the top */
  allowNone?: boolean;
  /** Label for the none option */
  noneLabel?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
}

/**
 * A standardized searchable select component for the Jigged app.
 * Uses MUI Autocomplete with proper dark theme styling.
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  loading = false,
  error,
  helperText,
  placeholder,
  allowNone = false,
  noneLabel = 'None',
  fullWidth = true,
  size = 'medium',
}: SearchableSelectProps) {
  // Build options list with optional "None" at the top
  const allOptions: SelectOption[] = allowNone
    ? [{ id: '', label: noneLabel }, ...options]
    : options;

  // Find the currently selected option
  const selectedOption = allOptions.find((opt) => opt.id === value) || null;

  const handleChange = (_event: SyntheticEvent, newValue: SelectOption | null) => {
    onChange(newValue?.id || '');
  };

  return (
    <Autocomplete
      options={allOptions}
      getOptionLabel={(option) =>
        option.secondaryLabel
          ? `${option.label} (${option.secondaryLabel})`
          : option.label
      }
      value={selectedOption}
      onChange={handleChange}
      loading={loading}
      disabled={disabled}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={!!error}
          helperText={error || helperText}
          placeholder={placeholder}
          size={size}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <li
            key={key}
            {...otherProps}
            style={{
              ...((otherProps as React.HTMLAttributes<HTMLLIElement>).style || {}),
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
            }}
          >
            {option.id === '' ? (
              <em>{option.label}</em>
            ) : option.secondaryLabel ? (
              <span>
                {option.label} <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>({option.secondaryLabel})</span>
              </span>
            ) : (
              option.label
            )}
          </li>
        );
      }}
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#1a1f4a',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          },
        },
        listbox: {
          sx: {
            '& .MuiAutocomplete-option': {
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              },
              '&[aria-selected="true"]': {
                bgcolor: 'rgba(90, 150, 201, 0.2)',
              },
              '&[aria-selected="true"]:hover': {
                bgcolor: 'rgba(90, 150, 201, 0.3)',
              },
            },
          },
        },
      }}
      fullWidth={fullWidth}
      clearOnBlur
      handleHomeEndKeys
      autoHighlight
    />
  );
}
