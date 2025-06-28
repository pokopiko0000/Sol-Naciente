export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateEntryForm(data: any): string[] {
  const errors: string[] = []
  
  if (!data.name1?.trim()) {
    errors.push('名義1の名義名は必須です')
  }
  
  if (!data.representative1?.trim()) {
    errors.push('名義1の代表者名は必須です')
  }
  
  if (data.entryNumber === '2') {
    if (!data.name2?.trim()) {
      errors.push('名義2の名義名は必須です')
    }
    
    if (!data.representative2?.trim()) {
      errors.push('名義2の代表者名は必須です')
    }
  }
  
  if (!data.email?.trim()) {
    errors.push('メールアドレスは必須です')
  } else if (!validateEmail(data.email)) {
    errors.push('有効なメールアドレスを入力してください')
  }
  
  return errors
}