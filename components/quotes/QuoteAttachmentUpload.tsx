'use client';

import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { QuoteAttachment, TempAttachment } from '@/types/quote';
import {
  uploadQuoteAttachment,
  deleteQuoteAttachment,
  replaceQuoteAttachment,
  uploadTempQuoteAttachment,
  deleteTempQuoteAttachment,
} from '@/utils/quotesAccess';

interface QuoteAttachmentUploadProps {
  quoteId: string | null; // null when creating new quote
  companyId: string;
  sessionId: string; // For temp uploads
  existingAttachments: QuoteAttachment[];
  tempAttachment?: TempAttachment | null; // For new quotes
  onAttachmentChange: () => void;
  onTempAttachmentChange?: (attachment: TempAttachment | null) => void; // For temp uploads
  disabled: boolean;
}

export default function QuoteAttachmentUpload({
  quoteId,
  companyId,
  sessionId,
  existingAttachments,
  tempAttachment,
  onAttachmentChange,
  onTempAttachmentChange,
  disabled,
}: QuoteAttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreateMode = quoteId === null;
  const hasAttachment = existingAttachments.length > 0 || !!tempAttachment;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString();
  };

  const handleFileSelect = async (file: File) => {
    if (disabled) return;

    setError(null);
    setUploading(true);

    try {
      if (isCreateMode) {
        // Upload to temp location for new quotes
        const tempAttach = await uploadTempQuoteAttachment(companyId, sessionId, file);
        onTempAttachmentChange?.(tempAttach);
      } else {
        // Upload to permanent location for existing quotes
        await uploadQuoteAttachment(quoteId!, companyId, file);
        onAttachmentChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDelete = async (attachmentId?: string, tempPath?: string) => {
    if (disabled) return;

    setError(null);
    setUploading(true);

    try {
      if (isCreateMode && tempPath) {
        // Delete temp attachment
        await deleteTempQuoteAttachment(tempPath);
        onTempAttachmentChange?.(null);
      } else if (attachmentId) {
        // Delete permanent attachment
        await deleteQuoteAttachment(attachmentId);
        onAttachmentChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attachment');
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (attachmentId: string, file: File) => {
    if (disabled) return;

    setError(null);
    setUploading(true);

    try {
      await replaceQuoteAttachment(attachmentId, companyId, quoteId, file);
      onAttachmentChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace attachment');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerReplaceInput = (attachmentId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleReplace(attachmentId, file);
      }
    };
    input.click();
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {disabled && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Attachments can only be modified in draft quotes.
        </Alert>
      )}

      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {existingAttachments.map((attachment) => (
            <Box
              key={attachment.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 1,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                mb: 1,
              }}
            >
              <PictureAsPdfIcon sx={{ fontSize: 40, color: 'error.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {attachment.file_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(attachment.file_size)} • Uploaded {formatDate(attachment.uploaded_at)}
                </Typography>
              </Box>
              {!disabled && !uploading && (
                <>
                  <IconButton
                    color="primary"
                    onClick={() => triggerReplaceInput(attachment.id)}
                    title="Replace attachment"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(attachment.id)}
                    title="Delete attachment"
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Temp Attachment (for new quotes) */}
      {tempAttachment && (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 1,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <PictureAsPdfIcon sx={{ fontSize: 40, color: 'error.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={500}>
                {tempAttachment.file_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(tempAttachment.file_size)} • Ready to upload
              </Typography>
            </Box>
            {!disabled && !uploading && (
              <IconButton
                color="error"
                onClick={() => handleDelete(undefined, tempAttachment.file_path)}
                title="Delete attachment"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      )}

      {/* Upload Area */}
      {!hasAttachment && !disabled && (
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: 1,
            p: 4,
            textAlign: 'center',
            bgcolor: dragActive ? 'rgba(70, 130, 180, 0.1)' : 'transparent',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: uploading ? 'rgba(255, 255, 255, 0.2)' : 'primary.main',
              bgcolor: uploading ? 'transparent' : 'rgba(70, 130, 180, 0.05)',
            },
          }}
          onClick={uploading ? undefined : triggerFileInput}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={uploading}
          />

          {uploading ? (
            <Box>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="body1">Uploading...</Typography>
            </Box>
          ) : (
            <Box>
              <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                Drag and drop a PDF file here, or click to select
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Maximum file size: 10MB • PDF files only
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
