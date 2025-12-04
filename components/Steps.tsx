import React from 'react';

interface StepsProps {
  currentStep: number;
}

export const Steps: React.FC<StepsProps> = ({ currentStep }) => {
  const steps = ['Upload', 'Configure', 'Generate', 'Result'];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center space-x-4">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={label} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors duration-300 
                  ${isActive ? 'bg-brand-900 text-white shadow-lg scale-110' : 
                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              <span className={`ml-2 text-sm font-medium ${isActive ? 'text-brand-900' : 'text-gray-400'}`}>
                {label}
              </span>
              {idx < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};