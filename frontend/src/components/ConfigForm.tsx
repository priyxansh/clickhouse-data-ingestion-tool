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
    if (key === "database" && value !== "default") {
      setError("Database must be 'default'");
      return;
    }

    setChConfig({ ...chConfig, [key]: value });
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        ClickHouse Configuration
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {Object.keys(chConfig).slice(0, -1).map((key) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {key}
            </label>
            <input
              type={key === "password" || key === "jwt" ? "password" : "text"}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={chConfig[key as keyof ClickHouseConfig]}
              onChange={(e) =>
                handleConfigChange(
                  key as keyof ClickHouseConfig,
                  e.target.value
                )
              }
              disabled={key === "database"}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigForm;
