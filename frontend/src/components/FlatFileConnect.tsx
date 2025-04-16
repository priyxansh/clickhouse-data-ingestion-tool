type FlatFileConnectProps = {
  handleConnect: () => void;
};

const FlatFileConnect = ({ handleConnect }: FlatFileConnectProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={handleConnect}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
      >
        Connect
      </button>
    </div>
  );
};

export default FlatFileConnect;
