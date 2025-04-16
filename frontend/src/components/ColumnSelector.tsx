import React from "react";

interface ColumnSelectorProps {
  columns: string[];
  selectedColumns: string[];
  toggleColumn: (col: string) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  selectedColumns,
  toggleColumn,
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Columns</h2>
      <div className="grid grid-cols-2 gap-2">
        {columns.map((col) => (
          <label key={col} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedColumns.includes(col)}
              onChange={() => toggleColumn(col)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span>{col}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ColumnSelector;
