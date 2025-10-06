import { useState, useCallback, useMemo, useRef } from 'react'

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
  setValue: (field: string, value: string) => void
  handleBlur: (field: string) => void
  validateForm: () => Promise<boolean>
  resetForm: () => void
}

export function useFormValidation(
  initialValues: Record<string, string> = {},
  validationRules: ValidationRules = {},
): UseFormValidationReturn {
  const [values, setValuesState] = useState<Record<string, string>>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [isDirty, setIsDirty] = useState(false)

  // Usar uma ref para manter a versão mais recente dos valores sem causar re-renderizações
  const valuesRef = useRef(values);
  valuesRef.current = values;

  // Memoize validation functions to prevent re-creation
  const validateCPF = useCallback((cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cleaned)) return false
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i)
    }
    let checkDigit = 11 - (sum % 11)
    if (checkDigit >= 10) checkDigit = 0
    if (checkDigit !== parseInt(cleaned.charAt(9))) return false
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i)
    }
    checkDigit = 11 - (sum % 11)
    if (checkDigit >= 10) checkDigit = 0
    if (checkDigit !== parseInt(cleaned.charAt(10))) return false
    return true
  }, [])

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  const validatePhone = useCallback((phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length === 10 || cleaned.length === 11
  }, [])

  const formatCPF = useCallback((value: string): string => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11)
    let match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
    if (match) return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`
    match = cleaned.match(/^(\d{3})(\d{3})(\d{3})$/)
    if (match) return `${match[1]}.${match[2]}.${match[3]}`
    match = cleaned.match(/^(\d{3})(\d{3})$/)
    if (match) return `${match[1]}.${match[2]}`
    return cleaned
  }, [])

  const formatPhone = useCallback((value: string): string => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11)
    if (cleaned.length > 10) {
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
      if (match) return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/)
    if (match) return `(${match[1]}) ${match[2]}-${match[3]}`
    return cleaned
  }, [])

  const validateField = useCallback(async (field: string, value: string): Promise<string | null> => {
    const rule = validationRules[field]
    if (!rule) return null

    if (rule.required && !value.trim()) {
      return rule.message || `${field} é obrigatório`
    }
    if (!value.trim()) return null

    if (rule.minLength && value.length < rule.minLength) {
      return rule.message || `${field} deve ter pelo menos ${rule.minLength} caracteres`
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message || `${field} deve ter no máximo ${rule.maxLength} caracteres`
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || `${field} tem formato inválido`
    }
    if (field.toLowerCase().includes('cpf') && !validateCPF(value)) {
      return 'CPF inválido'
    }
    if (field.toLowerCase().includes('email') && !validateEmail(value)) {
      return 'Email inválido'
    }
    if ((field.toLowerCase().includes('phone') || field.toLowerCase().includes('telefone')) && !validatePhone(value)) {
      return 'Telefone inválido'
    }
    if (rule.custom) {
      return rule.custom(value)
    }
    return null
  }, [validationRules, validateCPF, validateEmail, validatePhone])

  const setValue = useCallback((field: string, value: string) => {
    setIsDirty(true)
    let formattedValue = value
    if (field.toLowerCase().includes('cpf')) {
      formattedValue = formatCPF(value)
    } else if (field.toLowerCase().includes('phone') || field.toLowerCase().includes('telefone')) {
      formattedValue = formatPhone(value)
    }
    setValuesState(prev => ({ ...prev, [field]: formattedValue }))
    setErrors(prev => {
      if (!prev[field]) return prev
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [formatCPF, formatPhone])

  // Função handleBlur estável para validar o campo quando o usuário sai dele.
  const handleBlur = useCallback(async (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    // Usar a ref para obter o valor mais recente sem depender do estado 'values'
    const error = await validateField(field, valuesRef.current[field]);
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  }, [validateField]); // Removida a dependência de 'values'

  const validateForm = useCallback(async (): Promise<boolean> => {
    const newErrors: ValidationErrors = {}
    const allFields = Object.keys(validationRules)
    for (const field of allFields) {
      // Usar a ref para obter os valores mais recentes
      const error = await validateField(field, valuesRef.current[field])
      if (error) {
        newErrors[field] = error
      }
    }
    setErrors(newErrors)
    setTouchedFields(new Set(allFields))
    return Object.keys(newErrors).length === 0
  }, [validateField, validationRules]) // Removida a dependência de 'values'

  const resetForm = useCallback(() => {
    setValuesState(initialValues)
    setErrors({})
    setTouchedFields(new Set())
    setIsDirty(false)
  }, [initialValues])

  const isValid = useMemo(() => {
    if (!isDirty) return false;
    for (const field in validationRules) {
      if (errors[field]) return false;
      const rule = validationRules[field];
      if (rule.required && !values[field]) return false;
    }
    return true;
  }, [values, errors, isDirty, validationRules]);

  return {
    values,
    errors,
    isValid,
    isDirty,
    setValue,
    handleBlur,
    validateForm,
    resetForm,
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