import { useRef } from 'react'

export default function OTPInput({ value = '', onChange, hasError = false }) {
  const inputs = useRef([])

  // Split the stored string into 6 individual chars
  const digits = value.split('')

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newDigits = [...digits]
      if (digits[index]) {
        // Clear current box
        newDigits[index] = ''
        onChange(newDigits.join(''))
      } else if (index > 0) {
        // Move back to previous box and clear it
        newDigits[index - 1] = ''
        onChange(newDigits.join(''))
        inputs.current[index - 1]?.focus()
      }
    }
  }

  const handleChange = (e, index) => {
    // Only take the last character typed (in case of fast typing)
    const char = e.target.value.slice(-1)
    if (!char || !/\d/.test(char)) return // digits only

    const newDigits = [...digits]
    newDigits[index] = char
    onChange(newDigits.join(''))

    // Auto-advance to next box
    if (index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    // Focus last filled box
    const lastIndex = Math.min(pasted.length, 5)
    inputs.current[lastIndex]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => (inputs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`
            w-11 h-12 text-center text-xl font-bold font-display rounded-2xl border-2
            outline-none transition-all duration-200
            ${hasError
              ? 'border-accent-coral bg-accent-coral/5 text-accent-coral'
              : digits[index]
                ? 'border-crimson-400 bg-crimson-50 text-crimson-800'
                : 'border-cream-300 bg-cream-50 text-text-primary focus:border-crimson-400 focus:bg-white'
            }
          `}
        />
      ))}
    </div>
  )
}