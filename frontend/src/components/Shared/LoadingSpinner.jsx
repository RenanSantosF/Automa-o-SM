const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
