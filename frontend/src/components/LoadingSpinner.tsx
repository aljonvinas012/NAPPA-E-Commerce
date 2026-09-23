
const LoadingSpinner = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16">
    <div className="w-9 h-9 border-[3px] border-tan border-t-oliveDark rounded-full animate-spin" />
    <p className="text-sm text-bark/70 font-medium">{label}</p>
  </div>
);

export default LoadingSpinner;
