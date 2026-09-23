
const EmptyState = ({ title, message }: { title: string; message?: string }) => (
  <div className="flex flex-col items-center justify-center text-center gap-2 py-16 px-4">
    <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center text-2xl mb-1 text-oliveDark"><i className="fas fa-basket-shopping" /></div>
    <h3 className="font-display text-lg text-bark">{title}</h3>
    {message && <p className="text-sm text-bark/60 max-w-sm">{message}</p>}
  </div>
);

export default EmptyState;
