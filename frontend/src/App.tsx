import React, { useState, useEffect } from "react";
import ConfigForm from "./components/ConfigForm";
import TableSelector from "./components/TableSelector";
import ColumnSelector from "./components/ColumnSelector";
import PreviewTable from "./components/PreviewTable";
import StatusDisplay from "./components/StatusDisplay";
import useClickHouseApi from "./hooks/useClickHouseApi";
import FlatFileIngest from "./components/FlatFileIngest";
import FlatFileUpload from "./components/FlatFileUpload";
import FlatFileConnect from "./components/FlatFileConnect";
import FlatFileTableSelector from "./components/FlatFileTableSelector";

import "./App.css";

export interface ClickHouseConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  jwt: string;
}

const App: React.FC = () => {
  const [source, setSource] = useState<"clickhouse" | "flatfile">("clickhouse");
  const [chConfig, setChConfig] = useState<ClickHouseConfig>({
    host: import.meta.env.VITE_CH_HOST as string,
    port: import.meta.env.VITE_CH_PORT as string,
    database: import.meta.env.VITE_CH_DATABASE as string,
    user: import.meta.env.VITE_CH_USER as string,
    password: import.meta.env.VITE_CH_PASSWORD as string,
    jwt: import.meta.env.VITE_CH_JWT as string,
  });
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [fileLoaded, setFileLoaded] = useState(false);

  const resetState = () => {
    setSelectedTable("");
    setSelectedColumns([]);
    setApiState((prev) => ({
      ...prev,
      tables: [],
      columns: [],
      previewData: null,
      recordCount: null,
      error: "",
      status: "",
    }));
  };

  const { apiState, setApiState, connect, fetchColumns, preview, ingest } =
    useClickHouseApi();

  const [file, _] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");

  useEffect(() => {
    console.log({ file, fileContent });
    if (file) setFileLoaded(true);
  }, [file, fileContent]);

  const toggleColumn = (col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
    setApiState((prev) => ({ ...prev, previewData: null }));
  };

  useEffect(() => {
    resetState();
  }, [source]);

  useEffect(() => {
    console.log(apiState);
  }, [apiState]);

  const handleConnectWithFile = () => {
    if (!fileLoaded && source === "flatfile") {
      console.warn("File not loaded yet. Please wait or re-upload.");
      return;
    }
    connect(source, chConfig, source === "flatfile" ? file?.name || "" : "");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl space-y-6 border border-gray-200">
        <h1 className="text-4xl font-semibold text-gray-800 text-center tracking-tight">
          ClickHouse + Flat File Ingestion
        </h1>

        <StatusDisplay
          error={apiState.error}
          status={apiState.status}
          recordCount={apiState.recordCount}
        />

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Data Source
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={source}
            onChange={(e) =>
              setSource(e.target.value as "clickhouse" | "flatfile")
            }
          >
            <option value="clickhouse">ClickHouse</option>
            <option value="flatfile">Flat File</option>
          </select>
        </div>

        <ConfigForm
          chConfig={chConfig}
          setChConfig={setChConfig}
          setError={(error) =>
            setApiState((prev) => ({ ...prev, error: error as string }))
          }
        />

        {source === "flatfile" && (
          <div className="space-y-4">
            <FlatFileConnect
              handleConnect={() => {
                connect("clickhouse", chConfig, file?.name || "");
              }}
            />
            <FlatFileTableSelector
              tables={apiState.tables}
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
              handleFetchColumns={() => {
                fetchColumns(
                  "clickhouse",
                  selectedTable,
                  chConfig,
                  "",
                  fileContent
                );
              }}
            />
            <FlatFileUpload
              onFileChange={(fileContent, _) => {
                setFileContent(fileContent);
                setFileLoaded(true);
              }}
            />
            <FlatFileIngest
              chConfig={chConfig}
              fileContent={fileContent}
              status={apiState.status}
              columns={selectedColumns}
              selectedTable={selectedTable}
              setApiState={setApiState}
            />
          </div>
        )}

        {source === "clickhouse" && (
          <TableSelector
            tables={apiState.tables}
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            setColumns={(columns) =>
              setApiState((prev) => ({
                ...prev,
                columns: Array.isArray(columns) ? columns : [],
              }))
            }
            setSelectedColumns={setSelectedColumns}
            setPreviewData={(data) =>
              setApiState((prev) => ({
                ...prev,
                previewData:
                  typeof data === "function" ? data(prev.previewData) : data,
              }))
            }
            handleConnect={handleConnectWithFile}
            handleFetchColumns={() =>
              fetchColumns(source, selectedTable, chConfig, "", fileContent)
            }
            status={apiState.status}
          />
        )}

        {apiState.columns.length > 0 && (
          <ColumnSelector
            columns={apiState.columns}
            selectedColumns={selectedColumns}
            toggleColumn={toggleColumn}
          />
        )}

        {source === "clickhouse" && selectedColumns.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6 justify-center">
            <button
              onClick={() =>
                preview(
                  source,
                  selectedTable,
                  selectedColumns,
                  chConfig,
                  file?.name || "",
                  fileContent
                )
              }
              className="bg-green-500 hover:bg-green-600 text-white font-medium px-5 py-2.5 rounded-lg transition disabled:bg-gray-400"
              disabled={apiState.status === "Fetching preview..."}
            >
              Preview
            </button>
            <button
              onClick={() =>
                ingest(
                  source,
                  selectedTable,
                  selectedColumns,
                  chConfig,
                  file?.name || "",
                  fileContent
                )
              }
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium px-5 py-2.5 rounded-lg transition disabled:bg-gray-400"
              disabled={apiState.status === "Ingesting..."}
            >
              Start Ingestion
            </button>
          </div>
        )}

        <PreviewTable
          previewData={apiState.previewData}
          selectedColumns={selectedColumns}
        />
      </div>
    </div>
  );
};

export default App;
