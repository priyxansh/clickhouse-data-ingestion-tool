import { useState } from "react";
import axios from "axios";

interface ClickHouseConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  jwt: string;
}

export interface ApiState {
  status: string;
  error: string;
  tables: string[];
  columns: string[];
  previewData: Array<Record<string, any>> | null;
  recordCount: number | null;
}

const useClickHouseApi = () => {
  const [apiState, setApiState] = useState<ApiState>({
    status: "",
    error: "",
    tables: [],
    columns: [],
    previewData: null,
    recordCount: null,
  });

  const connect = async (
    source: "clickhouse" | "flatfile",
    chConfig: ClickHouseConfig,
    flatFileName: string
  ) => {
    setApiState((prev) => ({ ...prev, status: "Connecting...", error: "" }));
    try {
      const payload = {
        source,
        chConfig: { ...chConfig, database: "default" },
        flatFileName:
          source === "flatfile" ? flatFileName || "uploaded.csv" : flatFileName,
      };
      console.log("Connect payload:", payload);
      const res = await axios.post(
        "http://localhost:8080/api/connect",
        payload
      );
      if (res.data.error) {
        throw new Error(res.data.error);
      }
      const tables =
        source === "flatfile" && res.data.tables.length === 0 && flatFileName
          ? [flatFileName]
          : res.data.tables || [];
      setApiState((prev) => ({
        ...prev,
        status: "Connected",
        tables,
        error: "",
      }));
    } catch (err: any) {
      setApiState((prev) => ({
        ...prev,
        status: "",
        error: err.message || "Failed to connect",
      }));
    }
  };

  const fetchColumns = async (
    source: "clickhouse" | "flatfile",
    table: string,
    chConfig: ClickHouseConfig,
    flatFileName: string,
    fileContent: string
  ) => {
    if (!table) {
      setApiState((prev) => ({ ...prev, error: "Please select a table" }));
      return;
    }
    setApiState((prev) => ({
      ...prev,
      status: "Fetching columns...",
      error: "",
    }));
    try {
      const payload = {
        source,
        table,
        chConfig: { ...chConfig, database: "default" },
        flatFileName: source === "flatfile" ? fileContent : flatFileName,
      };
      console.log("Columns payload:", payload);
      const res = await axios.post(
        "http://localhost:8080/api/columns",
        payload
      );
      if (res.data.error) {
        throw new Error(res.data.error);
      }
      setApiState((prev) => ({
        ...prev,
        status: "Columns fetched",
        columns: res.data.columns || [],
        error: "",
      }));
    } catch (err: any) {
      setApiState((prev) => ({
        ...prev,
        status: "",
        error: err.message || "Failed to fetch columns",
      }));
    }
  };

  const preview = async (
    source: "clickhouse" | "flatfile",
    table: string,
    columns: string[],
    chConfig: ClickHouseConfig,
    flatFileName: string,
    fileContent: string
  ) => {
    if (!table || columns.length === 0) {
      setApiState((prev) => ({
        ...prev,
        error: "Please select a table and at least one column",
      }));
      return;
    }
    setApiState((prev) => ({
      ...prev,
      status: "Fetching preview...",
      error: "",
    }));
    try {
      const payload = {
        source,
        table,
        columns,
        chConfig: { ...chConfig, database: "default" },
        flatFileName: source === "flatfile" ? fileContent : flatFileName,
      };
      console.log("Preview payload:", payload);
      const res = await axios.post(
        "http://localhost:8080/api/preview",
        payload
      );
      if (res.data.error) {
        throw new Error(res.data.error);
      }
      setApiState((prev) => ({
        ...prev,
        status: "Preview loaded",
        previewData: res.data.data || [],
        error: "",
      }));
    } catch (err: any) {
      setApiState((prev) => ({
        ...prev,
        status: "",
        error: err.message || "Failed to fetch preview",
      }));
    }
  };

  const ingest = async (
    source: "clickhouse" | "flatfile",
    table: string,
    columns: string[],
    chConfig: ClickHouseConfig,
    flatFileName: string,
    fileContent: string
  ) => {
    if (!table || columns.length === 0) {
      setApiState((prev) => ({
        ...prev,
        error: "Please select a table and at least one column",
      }));
      return;
    }
    if (source === "flatfile" && !fileContent) {
      setApiState((prev) => ({ ...prev, error: "Please upload a CSV file" }));
      return;
    }
    setApiState((prev) => ({ ...prev, status: "Ingesting...", error: "" }));
    try {
      const trimmedFileContent = fileContent.trim();
      const payload = {
        source,
        table,
        columns,
        chConfig: { ...chConfig, database: "default" },
        flatFileName,
        fileContent: source === "flatfile" ? trimmedFileContent : "",
      };
      console.log("Ingest payload:", JSON.stringify(payload, null, 2));
      const res = await axios.post("http://localhost:8080/api/ingest", payload);
      if (res.data.error) {
        throw new Error(res.data.error);
      }
      setApiState((prev) => ({
        ...prev,
        status: "Ingestion completed",
        recordCount: res.data.recordCount || 0,
        error: "",
      }));
    } catch (err: any) {
      setApiState((prev) => ({
        ...prev,
        status: "",
        error: err.message || "Failed to ingest data",
      }));
    }
  };

  return { apiState, setApiState, connect, fetchColumns, preview, ingest };
};

export default useClickHouseApi;
