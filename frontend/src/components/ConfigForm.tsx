import React from "react";

interface ClickHouseConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  jwt: string;
}

interface ConfigFormProps {
  chConfig: ClickHouseConfig;
  setChConfig: React.Dispatch<React.SetStateAction<ClickHouseConfig>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  chConfig,
  setChConfig,
  setError,
}) => {
  const handleConfigChange = (key: keyof ClickHouseConfig, value: string) => {
    if (key === "database") {
      if (value !== "default") {
        setError("Database must be 'default'");
        return;
      } else {
        setError(""); // Clear error if corrected
      }
    }
    setChConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        ClickHouse Configuration
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {Object.entries(chConfig).map(([key, value]) => {
          if (key === "jwt") return null; // Skip jwt input
          const isPassword = key === "password";
          const isDisabled = key === "database";
          return (
            <div key={key}>
              <label
                htmlFor={key}
                className="block text-sm font-medium text-gray-700 capitalize"
              >
                {key}
              </label>
              <input
                id={key}
                type={isPassword ? "password" : "text"}
                autoComplete="off"
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                value={value}
                onChange={(e) =>
                  handleConfigChange(
                    key as keyof ClickHouseConfig,
                    e.target.value
                  )
                }
                disabled={isDisabled}
              />
              {key === "database" && chConfig.database !== "default" && (
                <p className="text-sm text-red-500 mt-1">
                  Database must be set to <code>default</code>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConfigForm;
