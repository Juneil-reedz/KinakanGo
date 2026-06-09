export default function Loader({ size = 'md', fullScreen = false }) {
  const sizes = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
  };

  const loader = (
    <img
      src="/assets/KINAKAN-loading.gif"
      alt="Loading..."
      className={`${sizes[size]} object-contain`}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50 pt-48">
        {loader}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-8">
      {loader}
    </div>
  );
}
