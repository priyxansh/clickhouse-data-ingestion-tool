import React from "react";
import { AlertCircle, Info, CheckCircle } from "lucide-react";

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
    <div className="space-y-4 mb-6">
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg shadow-sm">
          <AlertCircle className="w-5 h-5 mt-1 text-red-500" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      {status && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg shadow-sm">
          <Info className="w-5 h-5 mt-1 text-blue-500" />
          <span className="text-sm font-medium">{status}</span>
        </div>
      )}
      {recordCount !== null && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg shadow-sm">
          <CheckCircle className="w-5 h-5 mt-1 text-green-500" />
          <span className="text-sm font-medium">
            Ingestion completed: {recordCount.toLocaleString()} records
            processed
          </span>
        </div>
      )}
    </div>
  );
};

export default StatusDisplay;
