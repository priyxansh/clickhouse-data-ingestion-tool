import React from "react";
import { ClickHouseConfig } from "../App";
import axios from "axios";
import { ApiState } from "../hooks/useClickHouseApi";

interface FlatFileIngestProps {
  chConfig: ClickHouseConfig;
  fileContent: string;
  fileName?: string;
  columns?: string[];
  status: string;
  selectedTable: string;
  setApiState: React.Dispatch<React.SetStateAction<ApiState>>;
}

const FlatFileIngest: React.FC<FlatFileIngestProps> = ({
  chConfig,
  fileContent,
  fileName = "",
  status,
  columns,
  selectedTable: table,
  setApiState,
}) => {
  const handleIngest = async () => {
    if (!fileContent) {
      console.warn("No file content available for ingestion");
      return;
    }

    const payload = {
      source: "flatfile",
      table: table,
      columns: columns || [],
      chConfig: {
        host: chConfig.host,
        port: chConfig.port,
        database: chConfig.database,
        user: chConfig.user,
        password: chConfig.password,
        jwt: chConfig.jwt,
      },
      flatFileName: fileName,
      fileContent: fileContent,
    };

    try {
      const response = await axios.post(
        "http://localhost:8080/api/ingest",
        payload
      );

      const { status, recordCount } = response.data;

      setApiState((prev) => ({
        ...prev,
        status: status,
        recordCount: recordCount,
      }));
    } catch (error: any) {
      console.error("Error during ingestion:", error.message);
    }
  };

  return (
    <div className="flex space-x-4 mb-6">
      <button
        onClick={handleIngest}
        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition disabled:bg-gray-400"
        disabled={status === "Ingesting..." || !fileContent}
      >
        Start Ingestion
      </button>
    </div>
  );
};

export default FlatFileIngest;
