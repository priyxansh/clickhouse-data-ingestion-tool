import React from "react";

interface TableSelectorProps {
  tables: string[];
  selectedTable: string;
  setSelectedTable: React.Dispatch<React.SetStateAction<string>>;
  setColumns: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedColumns: React.Dispatch<React.SetStateAction<string[]>>;
  setPreviewData: React.Dispatch<
    React.SetStateAction<Array<Record<string, any>> | null>
  >;
  handleConnect: () => void;
  handleFetchColumns: () => void;
  status: string;
}

const TableSelector: React.FC<TableSelectorProps> = ({
  tables,
  selectedTable,
  setSelectedTable,
  setColumns,
  setSelectedColumns,
  setPreviewData,
  handleConnect,
  handleFetchColumns,
  status,
}) => {
  return (
    <div className="flex space-x-4 mb-6">
      <button
        onClick={handleConnect}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
        disabled={status === "Connecting..."}
      >
        Connect
      </button>
      {tables.length > 0 && (
        <select
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedTable}
          onChange={(e) => {
            setSelectedTable(e.target.value);
            setColumns([]);
            setSelectedColumns([]);
            setPreviewData(null);
          }}
        >
          <option value="">Select Table</option>
          {tables.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>
      )}
      {selectedTable && (
        <button
          onClick={handleFetchColumns}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
          disabled={status === "Fetching columns..."}
        >
          Load Columns
        </button>
      )}
    </div>
  );
};

export default TableSelector;
