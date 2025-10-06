import { useState, useCallback, useEffect } from 'react'
import { useDebounce } from './useDebounce'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
  message?: string
}

export interface ValidationRules {
  [field: string]: ValidationRule
}

export interface ValidationErrors {
  [field: string]: string
}

export interface UseFormValidationReturn {
  values: Record<string, string>
  errors: ValidationErrors
  isValid: boolean
  isDirty: boolean
  isValidating: boolean
  setValue: (field: string, value: string) => void
  setValues: (newValues: Record<string, string>) => void
  validateField: (field: string) => Promise<string | null>
  validateForm: () => Promise<boolean>
  resetForm: () => void
  resetErrors: () => void
  getFieldProps: (field: string) => {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    onBlur: () => void
    error?: string
    'data-invalid'?: boolean
  }
}

export function useFormValidation(
  initialValues: Record<string, string> = {},
  validationRules: ValidationRules = {},
  validateOnChange = true,
  debounceMs = 300
): UseFormValidationReturn {
  const [values, setValuesState] = useState<Record<string, string>>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [isValidating, setIsValidating] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Debounce values for validation
  const debouncedValues = useDebounce(values, debounceMs)

  // Validation functions
  const validateCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length !== 11) return false
    
    // Check for known invalid patterns
    if (/^(\d)\1{10}$/.test(cleaned)) return false
    
    // Validate check digits
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i)
    }
    
    let checkDigit = 11 - (sum % 11)
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0
    if (checkDigit !== parseInt(cleaned.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i)
    }
    
    checkDigit = 11 - (sum % 11)
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0
    if (checkDigit !== parseInt(cleaned.charAt(10))) return false
    
    return true
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length === 10 || cleaned.length === 11
  }

  const formatCPF = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
    return match ? `${match[1]}.${match[2]}.${match[3]}-${match[4]}` : cleaned
  }

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 11) {
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
      return match ? `(${match[1]}) ${match[2]}-${match[3]}` : cleaned
    } else if (cleaned.length === 10) {
      const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/)
      return match ? `(${match[1]}) ${match[2]}-${match[3]}` : cleaned
    }
    return cleaned
  }

  const validateField = useCallback(async (field: string): Promise<string | null> => {
    const value = values[field] || ''
    const rule = validationRules[field]
    
    if (!rule) return null

    // Required validation
    if (rule.required && !value.trim()) {
      return rule.message || `${field} é obrigatório`
    }

    // Skip other validations if field is empty and not required
    if (!value.trim()) return null

    // Length validations
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message || `${field} deve ter pelo menos ${rule.minLength} caracteres`
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message || `${field} deve ter no máximo ${rule.maxLength} caracteres`
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || `${field} tem formato inválido`
    }

    // Special validations based on field name
    if (field.toLowerCase().includes('cpf')) {
      if (!validateCPF(value)) {
        return 'CPF inválido'
      }
    }

    if (field.toLowerCase().includes('email')) {
      if (!validateEmail(value)) {
        return 'Email inválido'
      }
    }

    if (field.toLowerCase().includes('phone') || field.toLowerCase().includes('telefone')) {
      if (!validatePhone(value)) {
        return 'Telefone inválido'
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) return customError
    }

    return null
  }, [values, validationRules])

  const setValue = useCallback((field: string, value: string) => {
    setIsDirty(true)
    
    // Apply formatting for special fields
    let formattedValue = value
    if (field.toLowerCase().includes('cpf')) {
      formattedValue = formatCPF(value)
    } else if (field.toLowerCase().includes('phone') || field.toLowerCase().includes('telefone')) {
      formattedValue = formatPhone(value)
    }

    setValuesState(prev => ({
      ...prev,
      [field]: formattedValue
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: removed, ...rest } = prev
        return rest
      })
    }
  }, [errors])

  const setValues = useCallback((newValues: Record<string, string>) => {
    setValuesState(newValues)
    setIsDirty(true)
  }, [])

  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true)
    const newErrors: ValidationErrors = {}
    
    for (const field of Object.keys(validationRules)) {
      const error = await validateField(field)
      if (error) {
        newErrors[field] = error
      }
    }
    
    setErrors(newErrors)
    setIsValidating(false)
    return Object.keys(newErrors).length === 0
  }, [validateField, validationRules])

  const resetForm = useCallback(() => {
    setValuesState(initialValues)
    setErrors({})
    setTouchedFields(new Set())
    setIsDirty(false)
  }, [initialValues])

  const resetErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Real-time validation on value change (debounced)
  useEffect(() => {
    if (!validateOnChange || !isDirty) return

    const validateChangedFields = async () => {
      // Usamos uma função de atualização para evitar a dependência direta de 'errors'
      setErrors(currentErrors => {
        const newErrors: ValidationErrors = { ...currentErrors };
        let hasChanged = false;

        for (const field of Object.keys(validationRules)) {
          if (debouncedValues[field] !== undefined && touchedFields.has(field)) {
            // Esta parte precisa ser síncrona dentro do setErrors ou refatorada.
            // Para uma correção rápida e eficaz, vamos validar e depois setar.
          }
        }
        // A lógica original era assíncrona, o que é complexo dentro de um `setErrors`.
        // Vamos refatorar para ser mais simples e direto.
        return currentErrors; // Placeholder
      });

      // Lógica refatorada para evitar o loop
      const newErrors: ValidationErrors = {};
      for (const field of Object.keys(validationRules)) {
        if (touchedFields.has(field)) {
          const error = await validateField(field);
          if (error) {
            newErrors[field] = error;
          }
        }
      }
      setErrors(newErrors);
    }

    validateChangedFields()
  }, [debouncedValues, validateField, validationRules, validateOnChange, isDirty, touchedFields]);

  const getFieldProps = useCallback((field: string) => {
    const hasError = !!errors[field]
    
    return {
      value: values[field] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValue(field, e.target.value)
      },
      onBlur: () => {
        setTouchedFields(prev => new Set([...prev, field]))
      },
      ...(hasError && { error: errors[field] }),
      'data-invalid': hasError
    }
  }, [values, errors, setValue])

  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    isValid,
    isDirty,
    isValidating,
    setValue,
    setValues,
    validateField,
    validateForm,
    resetForm,
    resetErrors,
    getFieldProps
  }
}

// Predefined validation rules for common Neokids fields
export const neokidsValidationRules: ValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Nome deve ter entre 2 e 100 caracteres'
  },
  cpf: {
    required: true,
    pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    message: 'CPF deve estar no formato 000.000.000-00'
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email deve ter um formato válido'
  },
  phone: {
    required: true,
    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    message: 'Telefone deve estar no formato (00) 00000-0000'
  },
  address: {
    required: true,
    minLength: 10,
    maxLength: 200,
    message: 'Endereço deve ter entre 10 e 200 caracteres'
  },
  birthDate: {
    required: true,
    custom: (value: string) => {
      const date = new Date(value)
      const today = new Date()
      if (date > today) {
        return 'Data de nascimento não pode ser futura'
      }
      const age = today.getFullYear() - date.getFullYear()
      if (age > 18) {
        return 'Paciente deve ter no máximo 18 anos'
      }
      return null
    }
  }
}