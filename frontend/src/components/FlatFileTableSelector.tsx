type FlatFileTableSelectorProps = {
  tables: string[];
  selectedTable: string;
  setSelectedTable: (table: string) => void;
  handleFetchColumns: () => void;
};

const FlatFileTableSelector = ({
  tables,
  selectedTable,
  setSelectedTable,
  handleFetchColumns,
}: FlatFileTableSelectorProps) => {
  return (
    <div className="flex flex-col mb-6">
      <label className="mb-2 text-sm font-medium text-gray-700">
        Select a table:
      </label>
      <select
        value={selectedTable}
        defaultValue={tables[0] || ""}
        onChange={(e) => setSelectedTable(e.target.value)}
        className="border border-gray-300 rounded-md p-2"
      >
        {tables.map((table) => (
          <option key={table} value={table}>
            {table}
          </option>
        ))}
      </select>

      {selectedTable && (
        <button
          onClick={handleFetchColumns}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          Load Columns
        </button>
      )}
    </div>
  );
};

export default FlatFileTableSelector;
