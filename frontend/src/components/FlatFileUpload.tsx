import React, { useState } from "react";

interface FlatFileUploadProps {
  onFileChange: (fileContent: string, fileName: string) => void;
}

const FlatFileUpload: React.FC<FlatFileUploadProps> = ({ onFileChange }) => {
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFileName(selectedFile.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onFileChange(content, selectedFile.name);
      };
      reader.readAsText(selectedFile);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload CSV File
      </label>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {fileName && (
        <p className="mt-2 text-sm text-gray-600">Selected: {fileName}</p>
      )}
    </div>
  );
};

export default FlatFileUpload;
