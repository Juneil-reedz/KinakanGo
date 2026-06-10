export default function Loader({ size = 'md', fullScreen = false }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} rounded-full border-4 border-forest-800 border-t-ember-500 animate-spin`} />
      <p className="text-forest-200/60 text-sm">Loading…</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: 'rgba(3,15,7,.7)', backdropFilter: 'blur(8px)' }}>
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center items-center py-12">{spinner}</div>;
}
