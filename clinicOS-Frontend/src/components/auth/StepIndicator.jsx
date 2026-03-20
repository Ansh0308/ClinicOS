export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, index) => {
        const stepNum   = index + 1
        const isActive  = stepNum === currentStep
        const isDone    = stepNum < currentStep

        return (
          <div key={step} className="flex items-center">

            {/* Circle */}
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-body transition-all
                ${isDone   ? 'bg-accent-teal text-white'         : ''}
                ${isActive ? 'bg-crimson-800 text-white shadow-btn' : ''}
                ${!isDone && !isActive ? 'bg-cream-200 text-text-muted' : ''}
              `}>
                {isDone ? '✓' : stepNum}
              </div>
              <span className={`text-xs font-body mt-1 max-w-16 text-center leading-tight
                ${isActive ? 'text-crimson-600 font-semibold' : 'text-text-muted'}
              `}>
                {step}
              </span>
            </div>

            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mb-4 mx-1 transition-all
                ${stepNum < currentStep ? 'bg-accent-teal' : 'bg-cream-300'}
              `} />
            )}

          </div>
        )
      })}
    </div>
  )
}