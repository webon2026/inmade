export type EstadoInforme = 'borrador' | 'generado' | 'firmado'
export type TipoAtencion  = 'Reparación' | 'Instalación' | 'Mantención Preventiva' | 'Soporte Técnico' | 'Diagnóstico'

export interface FotoInforme {
  dataUrl:     string
  descripcion: string  // texto libre
}

// Material sin serie (PVC, cable, tubería, consumibles, etc.)
export interface MaterialSimple {
  descripcion: string
  cantidad:    string
  unidad:      string   // m, unid, kg, etc.
}

// Equipo/repuesto con serie
export interface Equipo {
  nombre:   string
  marca:    string
  modelo:   string
  serie:    string
  fotoSerie: string  // base64 foto de la placa/serie
}

export interface InformeTecnico {
  id:         string
  numero:     string   // N°5964
  numero_reg: string   // 364312 — ingresado al inicio

  // Cliente
  cliente_razon_social:    string
  cliente_nombre_fantasia: string
  cliente_rut:             string   // formato 00.000.000-0
  cliente_telefono:        string   // formato +56 9 XXXX XXXX
  cliente_direccion:       string
  cliente_ciudad:          string
  fecha_atencion:          string   // DD-MM-YYYY

  // Técnico
  tecnico_nombre:   string
  tecnico_telefono: string
  zona_atencion:    string

  // Solicitud
  nombre_proyecto:  string
  tipo_atencion:    TipoAtencion | ''
  contacto_reporte: string
  reporte:          string

  // Procedimiento
  falla_observada:     string
  trabajos_realizados: string[]
  conclusion:          string
  hora_inicio:         string   // HH:MM
  hora_termino:        string

  // Materiales
  materiales_simples: MaterialSimple[]   // sin serie
  equipos:            Equipo[]           // con serie

  // Fotos
  fotos: FotoInforme[]

  // Conclusiones
  trabajo_completado: boolean
  pendiente:          string
  observaciones:      string

  // Recepción
  receptor_nombre:  string
  receptor_email:   string
  firma_dataUrl:    string

  estado:     EstadoInforme
  created_at: string
  updated_at: string
}

export type InformeFormData = Omit<InformeTecnico, 'id' | 'numero' | 'created_at' | 'updated_at'>

export function informeVacio(): InformeFormData {
  return {
    numero_reg: '',
    cliente_razon_social: '', cliente_nombre_fantasia: '',
    cliente_rut: '', cliente_telefono: '', cliente_direccion: '', cliente_ciudad: '',
    fecha_atencion: '',
    tecnico_nombre: '', tecnico_telefono: '', zona_atencion: '',
    nombre_proyecto: '', tipo_atencion: '', contacto_reporte: '', reporte: '',
    falla_observada: '', trabajos_realizados: [], conclusion: '',
    hora_inicio: '', hora_termino: '',
    materiales_simples: [], equipos: [], fotos: [],
    trabajo_completado: false, pendiente: '', observaciones: '',
    receptor_nombre: '', receptor_email: '', firma_dataUrl: '',
    estado: 'borrador',
  }
}
