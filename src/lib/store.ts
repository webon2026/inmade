import type { InformeTecnico, InformeFormData, EstadoInforme } from '@/types/informe'
const KEY = 'inmade_v2'
function getAll(): InformeTecnico[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function saveAll(l: InformeTecnico[]) { localStorage.setItem(KEY, JSON.stringify(l)) }
function nextNum(all: InformeTecnico[]) {
  const m = all.reduce((a, i) => Math.max(a, parseInt(i.numero.replace('N°','') || '0')), 5963)
  return `N°${m+1}`
}
export const store = {
  getAll,
  create(data: InformeFormData, estado: EstadoInforme): InformeTecnico {
    const all = getAll(); const now = new Date().toISOString()
    const inf: InformeTecnico = { ...data, estado, id:`inf-${Date.now()}`, numero:nextNum(all), created_at:now, updated_at:now }
    saveAll([inf,...all]); return inf
  },
  update(id: string, data: Partial<InformeTecnico>) {
    const all = getAll(); const i = all.findIndex(x => x.id===id); if(i===-1) return
    all[i] = {...all[i],...data,updated_at:new Date().toISOString()}; saveAll(all)
  },
  delete(id: string) { saveAll(getAll().filter(i => i.id!==id)) },
  seed() {
    if(getAll().length > 0) return
    const now = '2026-03-17T00:00:00.000Z'
    saveAll([{
      id:'seed-1', numero:'N°5964', numero_reg:'364312',
      cliente_razon_social:'Banco Falabella', cliente_nombre_fantasia:'Banco Falabella',
      cliente_rut:'96.509.660-4', cliente_telefono:'+56 2 2345 6789',
      cliente_direccion:'Rosario Norte 660', cliente_ciudad:'Las Condes',
      fecha_atencion:'17-03-2026',
      tecnico_nombre:'César Castro Suazo', tecnico_telefono:'+56 9 8765 4321', zona_atencion:'Santiago Centro',
      nombre_proyecto:'Rosario Norte', tipo_atencion:'Reparación',
      contacto_reporte:'David Medina', reporte:'Revisión de enlace panel de control piso 22',
      falla_observada:'Panel de control de acceso marca ZKTeco debido a pérdida de comunicación con el servidor.',
      trabajos_realizados:[
        'Se revisa panel de ZKTeco por falla de comunicación con servidor.',
        'Se detecta switch de comunicación reemplazado, el cual no presenta link en el puerto conectado al panel.',
        'Se realiza prueba de link con cable de red, resultando operativa (cableado OK).',
      ],
      conclusion:'Falla no asociada a cableado. Posible problema en configuración de red, switch o puerto del panel.',
      hora_inicio:'16:05', hora_termino:'17:35',
      materiales_simples:[], equipos:[], fotos:[],
      trabajo_completado:false, pendiente:'Re conexión de panel 460', observaciones:'Chapa pendiente cambio',
      receptor_nombre:'Christian Mellado', receptor_email:'inmade@inmade.cl', firma_dataUrl:'',
      estado:'generado', created_at:now, updated_at:now,
    }])
  },
}
