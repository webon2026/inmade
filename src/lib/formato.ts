// Formateadores y validadores de entrada

export function formatRut(raw: string): string {
  const v = raw.replace(/[^0-9kK]/g, '').toUpperCase()
  if (v.length < 2) return v
  const dv   = v.slice(-1)
  const body = v.slice(0, -1)
  const fmt  = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${fmt}-${dv}`
}

export function validarRut(rut: string): boolean {
  const v = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (v.length < 2) return false
  const dv   = v.slice(-1)
  const body = v.slice(0, -1)
  let sum = 0; let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const expected = 11 - (sum % 11)
  const dvCalc = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected)
  return dv === dvCalc
}

export function formatTelefono(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // Mantenemos solo dígitos nacionales (9 dígitos) o con 56
  if (digits.startsWith('56')) {
    const local = digits.slice(2)
    return formatLocal(local)
  }
  return formatLocal(digits)
}

function formatLocal(digits: string): string {
  const d = digits.slice(0, 9)
  if (d.length === 0) return ''
  if (d.length <= 1) return `+56 ${d}`
  if (d.length <= 5) return `+56 ${d[0]} ${d.slice(1)}`
  if (d.length <= 9) return `+56 ${d[0]} ${d.slice(1,5)} ${d.slice(5)}`
  return `+56 ${d[0]} ${d.slice(1,5)} ${d.slice(5,9)}`
}

export function formatFecha(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0,2)}-${digits.slice(2)}`
  return `${digits.slice(0,2)}-${digits.slice(2,4)}-${digits.slice(4)}`
}

export function validarFecha(fecha: string): boolean {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(fecha)) return false
  const [d, m, y] = fecha.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export function formatHora(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0,2)}:${digits.slice(2)}`
}

export function validarHora(hora: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(hora)) return false
  const [h, m] = hora.split(':').map(Number)
  return h >= 0 && h <= 23 && m >= 0 && m <= 59
}
