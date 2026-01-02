'use client';

import { RefObject, useCallback } from 'react';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import { AgGridReact } from 'ag-grid-react';

interface ExportCsvButtonProps<T> {
  gridRef: RefObject<AgGridReact<T> | null>;
  fileName: string;
  selectedCount: number;
}

export default function ExportCsvButton<T>({
  gridRef,
  fileName,
  selectedCount,
}: ExportCsvButtonProps<T>) {
  const handleExport = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const columnKeys = api
      .getColumns()
      ?.filter((col) => col.getColId() !== 'actions')
      .map((col) => col.getColId())
      .filter((id): id is string => id !== undefined);

    api.exportDataAsCsv({
      fileName: `${fileName}.csv`,
      onlySelected: true,
      columnKeys,
    });
  }, [gridRef, fileName]);

  // Only render when rows are selected
  if (selectedCount === 0) return null;

  return (
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
    >
      Export ({selectedCount})
    </Button>
  );
}
