import React from "react";

interface PreviewTableProps {
  previewData: Array<Record<string, any>> | null;
  selectedColumns: string[];
}

const PreviewTable: React.FC<PreviewTableProps> = ({
  previewData,
  selectedColumns,
}) => {
  if (!previewData || previewData.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Preview (First 100 Rows)
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              {selectedColumns.map((col) => (
                <th key={col} className="border p-2 text-left">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {selectedColumns.map((col) => (
                  <td key={col} className="border p-2">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreviewTable;
