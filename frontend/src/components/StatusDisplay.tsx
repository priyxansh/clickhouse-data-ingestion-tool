import React from "react";

interface StatusDisplayProps {
  error: string;
  status: string;
  recordCount: number | null;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({
  error,
  status,
  recordCount,
}) => {
  return (
    <>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          {error}
        </div>
      )}
      {status && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded">
          {status}
        </div>
      )}
      {recordCount !== null && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
          Ingestion completed: {recordCount} records processed
        </div>
      )}
    </>
  );
};

export default StatusDisplay;
