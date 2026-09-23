import React from 'react';

const steps = ['Preparing', 'To Ship', 'To Receive', 'Completed'];

const OrderStatusTracker = ({ status }: { status: string }) => {
  const currentIndex = steps.indexOf(status);
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                i <= currentIndex ? 'bg-oliveDark border-oliveDark text-paper' : 'bg-paper border-tan/50 text-bark/40'
              }`}
            >
              {i < currentIndex ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] sm:text-xs font-semibold text-center w-16 ${i <= currentIndex ? 'text-ink' : 'text-bark/40'}`}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 ${i < currentIndex ? 'bg-oliveDark' : 'bg-tan/30'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default OrderStatusTracker;
