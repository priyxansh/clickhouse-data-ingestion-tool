package main

import (
	"context"
	"crypto/tls"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
)

type ClickHouseConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Database string `json:"database"`
	User     string `json:"user"`
	Password string `json:"password"`
	JWT      string `json:"jwt"`
}

type ConnectRequest struct {
	Source       string           `json:"source"`
	CHConfig     ClickHouseConfig `json:"chConfig"`
	FlatFileName string           `json:"flatFileName"`
}

type ConnectResponse struct {
	Tables []string `json:"tables"`
	Error  string   `json:"error"`
}

type ColumnsRequest struct {
	Source       string           `json:"source"`
	Table        string           `json:"table"`
	CHConfig     ClickHouseConfig `json:"chConfig"`
	FlatFileName string           `json:"flatFileName"`
}

type ColumnsResponse struct {
	Columns []string `json:"columns"`
	Error   string   `json:"error"`
}

type PreviewRequest struct {
	Source       string           `json:"source"`
	Table        string           `json:"table"`
	Columns      []string         `json:"columns"`
	CHConfig     ClickHouseConfig `json:"chConfig"`
	FlatFileName string           `json:"flatFileName"`
}

type PreviewResponse struct {
	Data  []map[string]interface{} `json:"data"`
	Error string                   `json:"error"`
}

type IngestRequest struct {
	Source       string           `json:"source"`
	Table        string           `json:"table"`
	Columns      []string         `json:"columns"`
	CHConfig     ClickHouseConfig `json:"chConfig"`
	FlatFileName string           `json:"flatFileName"`
	FileContent  string           `json:"fileContent"`
}

type IngestResponse struct {
	RecordCount int    `json:"recordCount"`
	Error       string `json:"error"`
}

func newClickHouseConn(chConfig ClickHouseConfig) (driver.Conn, error) {
	return clickhouse.Open(&clickhouse.Options{
		Addr:     []string{fmt.Sprintf("%s:%s", chConfig.Host, chConfig.Port)},
		Protocol: clickhouse.Native,
		TLS:      &tls.Config{},
		Auth: clickhouse.Auth{
			Database: chConfig.Database,
			Username: chConfig.User,
			Password: chConfig.Password,
		},
	})
}

func getColumnTypes(conn driver.Conn, table string) (map[string]string, error) {
	rows, err := conn.Query(context.Background(), fmt.Sprintf("DESCRIBE TABLE %s", table))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columnTypes := make(map[string]string)
	for rows.Next() {
		var name, typ, defKind, defExpr, comment, codec, ttl string
		err := rows.Scan(&name, &typ, &defKind, &defExpr, &comment, &codec, &ttl)
		if err != nil {
			// Try scanning without the ttl column (for older ClickHouse versions)
			if scanErr := rows.Scan(&name, &typ, &defKind, &defExpr, &comment, &codec); scanErr != nil {
				return nil, scanErr
			}
		}
		columnTypes[name] = typ
	}
	return columnTypes, nil
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/connect", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req ConnectRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		res := ConnectResponse{}

		if req.Source == "clickhouse" {
			conn, err := newClickHouseConn(req.CHConfig)
			if err != nil {
				res.Error = "Failed to connect to ClickHouse: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			defer conn.Close()

			rows, err := conn.Query(context.Background(), "SHOW TABLES")
			if err != nil {
				res.Error = "Failed to fetch tables: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			defer rows.Close()

			var tables []string
			for rows.Next() {
				var table string
				if err := rows.Scan(&table); err != nil {
					res.Error = "Failed to scan table: " + err.Error()
					json.NewEncoder(w).Encode(res)
					return
				}
				tables = append(tables, table)
			}
			res.Tables = tables
		} else {
			log.Printf("Flatfile connect: flatFileName=%s", req.FlatFileName) // Debug
			res.Tables = []string{req.FlatFileName}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	})

	mux.HandleFunc("/api/columns", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req ColumnsRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		res := ColumnsResponse{}

		if req.Source == "clickhouse" {
			conn, err := newClickHouseConn(req.CHConfig)
			if err != nil {
				res.Error = "Failed to connect to ClickHouse: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			defer conn.Close()

			rows, err := conn.Query(context.Background(), fmt.Sprintf("DESCRIBE TABLE %s", req.Table))
			if err != nil {
				res.Error = "Failed to fetch columns: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			defer rows.Close()

			var columns []string
			for rows.Next() {
				var name, typ, defKind, defExpr, comment, codec, ttl string
				err := rows.Scan(&name, &typ, &defKind, &defExpr, &comment, &codec, &ttl)
				if err != nil {
					err = rows.Scan(&name, &typ, &defKind, &defExpr, &comment, &codec)
					if err != nil {
						res.Error = "Failed to scan column: " + err.Error()
						json.NewEncoder(w).Encode(res)
						return
					}
				}
				columns = append(columns, name)
			}
			res.Columns = columns
		} else {
			reader := csv.NewReader(strings.NewReader(req.FlatFileName))
			columns, err := reader.Read()
			if err != nil {
				res.Error = "Failed to parse CSV header: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			res.Columns = columns
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	})

	mux.HandleFunc("/api/preview", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req PreviewRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		res := PreviewResponse{}

		if req.Source == "clickhouse" {
			conn, err := newClickHouseConn(req.CHConfig)
			if err != nil {
				res.Error = "Failed to connect to ClickHouse: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			defer conn.Close()

			columnTypes, err := getColumnTypes(conn, req.Table)
			if err != nil {
				res.Error = "Failed to fetch column types: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}

			query := fmt.Sprintf("SELECT %s FROM %s LIMIT 100", strings.Join(req.Columns, ", "), req.Table)
			rows, err := conn.Query(context.Background(), query)
			if err != nil {
				res.Error = "Failed to fetch preview: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			defer rows.Close()

			var data []map[string]interface{}
			for rows.Next() {
				row := make(map[string]interface{})
				values := make([]interface{}, len(req.Columns))
				for i, col := range req.Columns {
					typ := columnTypes[col]
					switch {
					case strings.HasPrefix(typ, "UInt32"):
						values[i] = new(uint32)
					case typ == "String":
						values[i] = new(string)
					default:
						values[i] = new(string)
					}
				}
				if err := rows.Scan(values...); err != nil {
					res.Error = "Failed to scan row: " + err.Error()
					json.NewEncoder(w).Encode(res)
					return
				}
				for i, col := range req.Columns {
					switch v := values[i].(type) {
					case *uint32:
						row[col] = *v
					case *string:
						row[col] = *v
					}
				}
				data = append(data, row)
			}
			res.Data = data
		} else {
			reader := csv.NewReader(strings.NewReader(req.FlatFileName))
			reader.TrimLeadingSpace = true
			header, err := reader.Read()
			if err != nil {
				res.Error = "Failed to read CSV header: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			var data []map[string]interface{}
			for i := 0; i < 100; i++ {
				record, err := reader.Read()
				if err == io.EOF {
					break
				}
				if err != nil {
					res.Error = "Failed to read CSV row: " + err.Error()
					json.NewEncoder(w).Encode(res)
					return
				}
				row := make(map[string]interface{})
				for j, col := range header {
					if j < len(record) {
						row[col] = record[j]
					}
				}
				data = append(data, row)
			}
			res.Data = data
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	})

	mux.HandleFunc("/api/ingest", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req IngestRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		res := IngestResponse{}

		if req.Source == "clickhouse" {
			conn, err := newClickHouseConn(req.CHConfig)
			if err != nil {
				res.Error = "Failed to connect to ClickHouse: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			defer conn.Close()

			columnTypes, err := getColumnTypes(conn, req.Table)
			if err != nil {
				res.Error = "Failed to fetch column types: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}

			file, err := os.Create("output.csv")
			if err != nil {
				res.Error = "Failed to create CSV: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			defer file.Close()

			writer := csv.NewWriter(file)
			defer writer.Flush()

			if err := writer.Write(req.Columns); err != nil {
				res.Error = "Failed to write CSV header: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}

			query := fmt.Sprintf("SELECT %s FROM %s", strings.Join(req.Columns, ", "), req.Table)
			rows, err := conn.Query(context.Background(), query)
			if err != nil {
				res.Error = "Failed to fetch data: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			defer rows.Close()

			recordCount := 0
			for rows.Next() {
				values := make([]interface{}, len(req.Columns))
				for i, col := range req.Columns {
					typ := columnTypes[col]
					switch {
					case strings.HasPrefix(typ, "UInt32"):
						values[i] = new(uint32)
					case typ == "String":
						values[i] = new(string)
					default:
						values[i] = new(string)
					}
				}
				if err := rows.Scan(values...); err != nil {
					res.Error = "Failed to scan row: " + err.Error()
					json.NewEncoder(w).Encode(res)
					return
				}

				record := make([]string, len(req.Columns))
				for i, val := range values {
					switch v := val.(type) {
					case *uint32:
						record[i] = fmt.Sprintf("%d", *v)
					case *string:
						record[i] = *v
					}
				}
				if err := writer.Write(record); err != nil {
					res.Error = "Failed to write CSV row: " + err.Error()
					json.NewEncoder(w).Encode(res)
					return
				}
				recordCount++
			}
			res.RecordCount = recordCount
		} else {
			conn, err := newClickHouseConn(req.CHConfig)
			if err != nil {
				res.Error = "Failed to connect to ClickHouse: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}
			defer conn.Close()

			if strings.TrimSpace(req.FileContent) == "" {
				res.Error = "Empty CSV content"
				json.NewEncoder(w).Encode(res)
				return
			}

			reader := csv.NewReader(strings.NewReader(req.FileContent))
			reader.TrimLeadingSpace = true
			header, err := reader.Read()
			if err != nil {
				res.Error = "Failed to read CSV header: " + err.Error()
				json.NewEncoder(w).Encode(res)
				return
			}

			if len(header) == 0 {
				res.Error = "No columns in CSV header"
				json.NewEncoder(w).Encode(res)
				return
			}

			selectedIndices := make([]int, 0)
			for _, col := range req.Columns {
				found := false
				for i, h := range header {
					if h == col {
						selectedIndices = append(selectedIndices, i)
						found = true
						break
					}
				}
				if !found {
					res.Error = fmt.Sprintf("Column %s not found in CSV", col)
					json.NewEncoder(w).Encode(res)
					return
				}
			}

			recordCount := 0
			batchSize := 1000
			var batch []string
			for {
				record, err := reader.Read()
				if err == io.EOF {
					break
				}
				if err != nil {
					res.Error = "Failed to read CSV row: " + err.Error()
					json.NewEncoder(w).Encode(res)
					return
				}

				values := make([]string, len(selectedIndices))
				for i, idx := range selectedIndices {
					if idx < len(record) {
						values[i] = strings.TrimSpace(record[idx])
					} else {
						values[i] = ""
					}
				}

				for i, val := range values {
					values[i] = strings.ReplaceAll(val, "'", "''")
				}

				batch = append(batch, fmt.Sprintf("('%s')", strings.Join(values, "', '")))
				recordCount++

				if len(batch) >= batchSize {
					query := fmt.Sprintf("INSERT INTO %s (%s) VALUES %s", req.Table, strings.Join(req.Columns, ", "), strings.Join(batch, ", "))
					if err := conn.Exec(context.Background(), query); err != nil {
						res.Error = "Failed to insert batch: " + err.Error()
						json.NewEncoder(w).Encode(res)
						return
					}
					batch = nil
				}
			}

			if len(batch) > 0 {
				query := fmt.Sprintf("INSERT INTO %s (%s) VALUES %s", req.Table, strings.Join(req.Columns, ", "), strings.Join(batch, ", "))
				if err := conn.Exec(context.Background(), query); err != nil {
					res.Error = "Failed to insert final batch: " + err.Error()
					json.NewEncoder(w).Encode(res)
					return
				}
			}

			res.RecordCount = recordCount
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	})

	log.Println("Server starting on :8080")
	http.ListenAndServe(":8080", corsMiddleware(mux))
}
