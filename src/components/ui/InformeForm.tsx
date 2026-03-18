'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ChevronRight, Camera, Trash2, Info, Plus, Package, Wrench } from 'lucide-react'
import FirmaCanvas, { type FirmaRef } from '@/components/firma/FirmaCanvas'
import type { InformeTecnico, InformeFormData, FotoInforme, MaterialSimple, Equipo, TipoAtencion } from '@/types/informe'
import { informeVacio } from '@/types/informe'
import { formatRut, validarRut, formatTelefono, formatFecha, validarFecha, formatHora, validarHora } from '@/lib/formato'

const TIPOS: TipoAtencion[] = ['Reparación','Instalación','Mantención Preventiva','Soporte Técnico','Diagnóstico']
const UNIDADES = ['m','ml','cm','kg','g','unid','par','rollo','caja','otro']

const STEPS = [
  {id:'inicio',     label:'N° Reg'},
  {id:'cliente',    label:'Cliente'},
  {id:'solicitud',  label:'Solicitud'},
  {id:'trabajo',    label:'Trabajo'},
  {id:'materiales', label:'Materiales'},
  {id:'fotos',      label:'Fotos'},
  {id:'recepcion',  label:'Recepción'},
  {id:'firma',      label:'Firma'},
] as const
type StepId = typeof STEPS[number]['id']
type EstadoInforme = InformeTecnico['estado']

interface Props {
  initial?: InformeTecnico | null
  onClose: () => void
  onSave:  (data: InformeFormData, estado: EstadoInforme) => void
}

function F({label,hint,error,children}:{label:string;hint?:string;error?:string;children:React.ReactNode}){
  return(
    <div style={{marginBottom:16}}>
      <label className="label">{label}</label>
      {children}
      {hint  && <p className="hint">{hint}</p>}
      {error && <p className="err">{error}</p>}
    </div>
  )
}
function G2({children}:{children:React.ReactNode}){
  return <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{children}</div>
}
function ST({children}:{children:React.ReactNode}){
  return <p style={{fontSize:10,fontWeight:700,color:'#C8102E',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12,marginTop:20,paddingBottom:8,borderBottom:'1px solid #F9E8EB'}}>{children}</p>
}

export default function InformeForm({initial,onClose,onSave}:Props){
  const [step,  setStep]  = useState(0)
  const [form,  setForm]  = useState<InformeFormData>(()=> initial?{...initial}:informeVacio())
  const [fotos, setFotos] = useState<FotoInforme[]>(initial?.fotos??[])
  const [mats,  setMats]  = useState<MaterialSimple[]>(initial?.materiales_simples??[])
  const [equips,setEquips]= useState<Equipo[]>(initial?.equipos??[])
  const [errors,setErrors]= useState<Record<string,string>>({})
  const firmaRef  = useRef<FirmaRef>(null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const serieRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const bodyRef   = useRef<HTMLDivElement>(null)

  useEffect(()=>{ bodyRef.current?.scrollTo({top:0,behavior:'smooth'}) },[step])

  const set = useCallback(<K extends keyof InformeFormData>(k:K,v:InformeFormData[K])=>{
    setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''}))
  },[])

  function setErr(field:string,msg:string){ setErrors(e=>({...e,[field]:msg})) }
  function clrErr(field:string){ setErrors(e=>({...e,[field]:''})) }

  function validate():boolean{
    const id=STEPS[step].id as StepId; let ok=true
    if(id==='inicio'){
      if(!form.numero_reg.trim()){ setErr('numero_reg','El número de registro es obligatorio'); ok=false }
    }
    if(id==='cliente'){
      if(!form.cliente_razon_social.trim()){ setErr('cliente_razon_social','Campo obligatorio'); ok=false }
      if(form.cliente_rut&&!validarRut(form.cliente_rut)){ setErr('cliente_rut','RUT inválido'); ok=false }
      if(form.fecha_atencion&&!validarFecha(form.fecha_atencion)){ setErr('fecha_atencion','Fecha inválida (DD-MM-YYYY)'); ok=false }
    }
    if(id==='trabajo'){
      if(form.hora_inicio&&!validarHora(form.hora_inicio)){ setErr('hora_inicio','Hora inválida (HH:MM)'); ok=false }
      if(form.hora_termino&&!validarHora(form.hora_termino)){ setErr('hora_termino','Hora inválida (HH:MM)'); ok=false }
    }
    if(id==='solicitud'){
      if(!form.tecnico_nombre.trim()){ setErr('tecnico_nombre','El técnico es obligatorio'); ok=false }
    }
    return ok
  }

  function buildPayload(estado:EstadoInforme):InformeFormData{
    const hasFirma=firmaRef.current&&!firmaRef.current.isEmpty()
    const firma=(step===STEPS.length-1&&hasFirma)?firmaRef.current!.getDataUrl():form.firma_dataUrl
    return{...form,fotos,materiales_simples:mats,equipos:equips,firma_dataUrl:firma??'',estado}
  }

  function next(){
    if(!validate()) return
    if(step===STEPS.length-1){
      const hasFirma=firmaRef.current&&!firmaRef.current.isEmpty()
      onSave(buildPayload(hasFirma?'firmado':'generado'),hasFirma?'firmado':'generado')
    } else setStep(s=>s+1)
  }
  function prev(){ setStep(s=>Math.max(0,s-1)) }
  function draft(){ onSave(buildPayload('borrador'),'borrador') }

  function addFotos(files:FileList|null){
    if(!files) return
    Array.from(files).slice(0,10-fotos.length).forEach(file=>{
      const r=new FileReader()
      r.onload=e=>setFotos(p=>[...p,{dataUrl:e.target!.result as string,descripcion:''}])
      r.readAsDataURL(file)
    })
    if(fileRef.current) fileRef.current.value=''
  }

  function addFotoSerie(idx:number,files:FileList|null){
    if(!files||!files[0]) return
    const r=new FileReader()
    r.onload=e=>setEquips(p=>p.map((eq,i)=>i===idx?{...eq,fotoSerie:e.target!.result as string}:eq))
    r.readAsDataURL(files[0])
  }

  function addMat(){ setMats(p=>[...p,{descripcion:'',cantidad:'1',unidad:'unid'}]) }
  function updMat(i:number,k:keyof MaterialSimple,v:string){ setMats(p=>p.map((m,j)=>j===i?{...m,[k]:v}:m)) }
  function delMat(i:number){ setMats(p=>p.filter((_,j)=>j!==i)) }

  function addEquipo(){ setEquips(p=>[...p,{nombre:'',marca:'',modelo:'',serie:'',fotoSerie:''}]) }
  function updEquipo(i:number,k:keyof Equipo,v:string){ setEquips(p=>p.map((e,j)=>j===i?{...e,[k]:v}:e)) }
  function delEquipo(i:number){ setEquips(p=>p.filter((_,j)=>j!==i)) }

  const inp=(extra?:string)=>`input${extra?' '+extra:''}`

  function renderBody(){
    const id=STEPS[step].id as StepId

    if(id==='inicio') return(
      <>
        <div style={{textAlign:'center',marginBottom:28,paddingTop:12}}>
          <div style={{width:60,height:60,background:'#F9E8EB',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
            <Package size={28} style={{color:'#C8102E'}}/>
          </div>
          <p style={{fontSize:17,fontWeight:700,color:'#111',marginBottom:8}}>Número de registro</p>
          <p style={{fontSize:13,color:'#6B7280',maxWidth:340,margin:'0 auto',lineHeight:1.6}}>
            Ingresa el N° de registro o de OT. Más adelante los datos del cliente se cargarán automáticamente desde Google Sheets.
          </p>
        </div>
        <F label="N° de registro / OT *" error={errors.numero_reg}>
          <input className={inp(errors.numero_reg?'input-error':'')}
            style={{fontSize:24,fontWeight:700,textAlign:'center',letterSpacing:'0.05em',padding:'14px 12px'}}
            value={form.numero_reg} autoFocus
            onChange={e=>set('numero_reg',e.target.value)}
            placeholder="364312"/>
        </F>
        <div style={{background:'#EFF6FF',borderRadius:12,padding:14,display:'flex',gap:10,marginTop:4}}>
          <Info size={14} style={{color:'#1A4A8A',marginTop:1,flexShrink:0}}/>
          <p style={{fontSize:12,color:'#1A4A8A',lineHeight:1.6}}>
            <strong>Próximamente:</strong> al ingresar el N° de registro, los datos del cliente y proyecto se cargarán automáticamente desde Google Sheets.
          </p>
        </div>
      </>
    )

    if(id==='cliente') return(
      <>
        <ST>Datos del cliente</ST>
        <F label="Razón social *" error={errors.cliente_razon_social}>
          <input className={inp(errors.cliente_razon_social?'input-error':'')}
            value={form.cliente_razon_social} autoFocus
            onChange={e=>set('cliente_razon_social',e.target.value)} placeholder="Banco Falabella"/>
        </F>
        <F label="Nombre fantasía">
          <input className="input" value={form.cliente_nombre_fantasia}
            onChange={e=>set('cliente_nombre_fantasia',e.target.value)} placeholder="Banco Falabella"/>
        </F>
        <G2>
          <F label="RUT cliente" hint="00.000.000-0" error={errors.cliente_rut}>
            <input className={inp(errors.cliente_rut?'input-error':'')} maxLength={12}
              value={form.cliente_rut}
              onChange={e=>set('cliente_rut',formatRut(e.target.value))}
              onBlur={()=>{ if(form.cliente_rut&&!validarRut(form.cliente_rut)) setErr('cliente_rut','RUT inválido'); else clrErr('cliente_rut') }}
              placeholder="96.509.660-4"/>
          </F>
          <F label="Teléfono" hint="+56 9 XXXX XXXX">
            <input className="input" maxLength={15} value={form.cliente_telefono}
              onChange={e=>set('cliente_telefono',formatTelefono(e.target.value))}
              placeholder="+56 9 1234 5678"/>
          </F>
        </G2>
        <F label="Dirección">
          <input className="input" value={form.cliente_direccion}
            onChange={e=>set('cliente_direccion',e.target.value)} placeholder="Rosario Norte 660"/>
        </F>
        <G2>
          <F label="Ciudad / Comuna">
            <input className="input" value={form.cliente_ciudad}
              onChange={e=>set('cliente_ciudad',e.target.value)} placeholder="Las Condes"/>
          </F>
          <F label="Fecha de atención" hint="DD-MM-YYYY" error={errors.fecha_atencion}>
            <input className={inp(errors.fecha_atencion?'input-error':'')} maxLength={10}
              value={form.fecha_atencion}
              onChange={e=>set('fecha_atencion',formatFecha(e.target.value))}
              onBlur={()=>{ if(form.fecha_atencion&&!validarFecha(form.fecha_atencion)) setErr('fecha_atencion','Fecha inválida'); else clrErr('fecha_atencion') }}
              placeholder="17-03-2026"/>
          </F>
        </G2>
      </>
    )

    if(id==='solicitud') return(
      <>
        <ST>Técnico asignado</ST>
        <G2>
          <F label="Nombre técnico *" error={errors.tecnico_nombre}>
            <input className={inp(errors.tecnico_nombre?'input-error':'')}
              value={form.tecnico_nombre} autoFocus
              onChange={e=>set('tecnico_nombre',e.target.value)} placeholder="César Castro Suazo"/>
          </F>
          <F label="Teléfono técnico" hint="+56 9 XXXX XXXX">
            <input className="input" maxLength={15} value={form.tecnico_telefono}
              onChange={e=>set('tecnico_telefono',formatTelefono(e.target.value))}
              placeholder="+56 9 8765 4321"/>
          </F>
        </G2>
        <F label="Zona de atención">
          <input className="input" value={form.zona_atencion}
            onChange={e=>set('zona_atencion',e.target.value)} placeholder="Santiago Centro"/>
        </F>
        <div style={{height:1,background:'#F3F4F6',margin:'8px 0 20px'}}/>
        <ST>Detalle de solicitud</ST>
        <G2>
          <F label="Nombre del proyecto">
            <input className="input" value={form.nombre_proyecto}
              onChange={e=>set('nombre_proyecto',e.target.value)} placeholder="Rosario Norte"/>
          </F>
          <F label="Tipo de atención">
            <select className="input" style={{background:'#fff'}} value={form.tipo_atencion}
              onChange={e=>set('tipo_atencion',e.target.value as TipoAtencion)}>
              <option value="">Seleccionar...</option>
              {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </F>
        </G2>
        <F label="Contacto de reporte">
          <input className="input" value={form.contacto_reporte}
            onChange={e=>set('contacto_reporte',e.target.value)} placeholder="David Medina"/>
        </F>
        <F label="Reporte">
          <textarea className="input" rows={3} style={{resize:'none'}} value={form.reporte}
            onChange={e=>set('reporte',e.target.value)}
            placeholder="Revisión de enlace panel de control piso 22..."/>
        </F>
      </>
    )

    if(id==='trabajo') return(
      <>
        <ST>Procedimiento realizado</ST>
        <F label="Falla observada">
          <textarea className="input" rows={3} style={{resize:'none'}} value={form.falla_observada}
            onChange={e=>set('falla_observada',e.target.value)}
            placeholder="Panel de control ZKTeco con pérdida de comunicación con el servidor..."/>
        </F>
        <F label="Trabajos realizados" hint="Un trabajo por línea">
          <textarea className="input" rows={6} style={{resize:'none'}}
            value={form.trabajos_realizados.join('\n')}
            onChange={e=>set('trabajos_realizados',e.target.value===''?[]:e.target.value.split('\n'))}
            placeholder={'Se revisa panel ZKTeco por falla de comunicación.\nSe detecta switch reemplazado sin link en el puerto.\nSe prueba enlace físico — cableado OK.'}/>
        </F>
        <F label="Conclusión">
          <textarea className="input" rows={3} style={{resize:'none'}} value={form.conclusion}
            onChange={e=>set('conclusion',e.target.value)}
            placeholder="Falla no asociada a cableado. Posible problema en configuración de red..."/>
        </F>
        <ST>Horas de trabajo</ST>
        <G2>
          <F label="Hora de inicio" hint="HH:MM — ej: 16:05" error={errors.hora_inicio}>
            <input className={inp(errors.hora_inicio?'input-error':'')} maxLength={5}
              value={form.hora_inicio}
              onChange={e=>set('hora_inicio',formatHora(e.target.value))}
              onBlur={()=>{ if(form.hora_inicio&&!validarHora(form.hora_inicio)) setErr('hora_inicio','Hora inválida (HH:MM)'); else clrErr('hora_inicio') }}
              placeholder="16:05"/>
          </F>
          <F label="Hora de término" hint="HH:MM — ej: 17:35" error={errors.hora_termino}>
            <input className={inp(errors.hora_termino?'input-error':'')} maxLength={5}
              value={form.hora_termino}
              onChange={e=>set('hora_termino',formatHora(e.target.value))}
              onBlur={()=>{ if(form.hora_termino&&!validarHora(form.hora_termino)) setErr('hora_termino','Hora inválida (HH:MM)'); else clrErr('hora_termino') }}
              placeholder="17:35"/>
          </F>
        </G2>
      </>
    )

    if(id==='materiales') return(
      <>
        {/* MATERIALES SIMPLES */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div>
            <p style={{fontSize:14,fontWeight:700,color:'#111'}}>Materiales</p>
            <p style={{fontSize:11,color:'#9CA3AF',marginTop:2}}>PVC, cable, tubería, consumibles — sin serie</p>
          </div>
          <button type="button" onClick={addMat} className="btn btn-secondary btn-sm" style={{display:'flex',alignItems:'center',gap:6}}>
            <Plus size={12}/> Agregar
          </button>
        </div>
        {mats.length===0&&(
          <div style={{border:'1.5px dashed #E5E7EB',borderRadius:12,padding:20,textAlign:'center',marginBottom:16}}>
            <p style={{fontSize:12,color:'#9CA3AF'}}>Sin materiales · toca <strong>Agregar</strong> si se usaron</p>
          </div>
        )}
        {mats.map((m,i)=>(
          <div key={i} style={{background:'#FAFAFA',borderRadius:12,border:'1px solid #EDEEF1',padding:14,marginBottom:10}}>
            <div style={{display:'flex',gap:10}}>
              <div style={{flex:1}}>
                <F label="Descripción">
                  <input className="input" value={m.descripcion}
                    onChange={e=>updMat(i,'descripcion',e.target.value)}
                    placeholder="Ej: Tubo PVC 3/4, Cable UTP Cat6, Tornillos M6..."/>
                </F>
                <G2>
                  <F label="Cantidad">
                    <input className="input" type="number" min="0" step="0.01"
                      value={m.cantidad} onChange={e=>updMat(i,'cantidad',e.target.value)} placeholder="1"/>
                  </F>
                  <F label="Unidad">
                    <select className="input" style={{background:'#fff'}} value={m.unidad} onChange={e=>updMat(i,'unidad',e.target.value)}>
                      {UNIDADES.map(u=><option key={u} value={u}>{u}</option>)}
                    </select>
                  </F>
                </G2>
              </div>
              <button type="button" onClick={()=>delMat(i)} style={{marginTop:28,width:30,height:30,borderRadius:8,background:'#FEE2E2',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Trash2 size={13} style={{color:'#EF4444'}}/>
              </button>
            </div>
          </div>
        ))}

        {/* EQUIPOS */}
        <div style={{height:1,background:'#EDEEF1',margin:'20px 0'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div>
            <p style={{fontSize:14,fontWeight:700,color:'#111'}}>Equipos / Repuestos</p>
            <p style={{fontSize:11,color:'#9CA3AF',marginTop:2}}>Paneles, lectores, switches — requieren N° de serie</p>
          </div>
          <button type="button" onClick={addEquipo} className="btn btn-secondary btn-sm" style={{display:'flex',alignItems:'center',gap:6}}>
            <Plus size={12}/> Agregar equipo
          </button>
        </div>
        {equips.length===0&&(
          <div style={{border:'1.5px dashed #E5E7EB',borderRadius:12,padding:20,textAlign:'center'}}>
            <p style={{fontSize:12,color:'#9CA3AF'}}>Sin equipos · toca <strong>Agregar equipo</strong> si se instalaron</p>
          </div>
        )}
        {equips.map((eq,i)=>(
          <div key={i} style={{background:'#FAFAFA',borderRadius:12,border:'1px solid #EDEEF1',padding:14,marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:34,height:34,background:'#F9E8EB',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Wrench size={16} style={{color:'#C8102E'}}/>
                </div>
                <p style={{fontSize:13,fontWeight:700,color:'#111'}}>Equipo {i+1}</p>
              </div>
              <button type="button" onClick={()=>delEquipo(i)} style={{width:30,height:30,borderRadius:8,background:'#FEE2E2',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Trash2 size={13} style={{color:'#EF4444'}}/>
              </button>
            </div>
            <F label="Nombre del equipo">
              <input className="input" value={eq.nombre}
                onChange={e=>updEquipo(i,'nombre',e.target.value)}
                placeholder="Ej: Lector biométrico, Panel de control, Switch..."/>
            </F>
            <G2>
              <F label="Marca">
                <input className="input" value={eq.marca}
                  onChange={e=>updEquipo(i,'marca',e.target.value)} placeholder="ZKTeco, Dahua..."/>
              </F>
              <F label="Modelo">
                <input className="input" value={eq.modelo}
                  onChange={e=>updEquipo(i,'modelo',e.target.value)} placeholder="InBio Pro, C3-400..."/>
              </F>
            </G2>
            <F label="N° de serie" hint="Ingresa el número de la placa del equipo">
              <input className="input" value={eq.serie}
                style={{fontFamily:'monospace',letterSpacing:'0.06em'}}
                onChange={e=>updEquipo(i,'serie',e.target.value.toUpperCase())}
                placeholder="FVI2849PBZH"/>
            </F>
            <label className="label" style={{marginBottom:8}}>Foto del N° de serie</label>
            <input type="file" accept="image/*" capture="environment" style={{display:'none'}}
              ref={el=>{serieRefs.current[i]=el}}
              onChange={e=>addFotoSerie(i,e.target.files)}/>
            {eq.fotoSerie?(
              <div style={{position:'relative',display:'inline-block'}}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={eq.fotoSerie} alt="serie" style={{height:90,borderRadius:8,border:'1px solid #EDEEF1',display:'block'}}/>
                <button type="button" onClick={()=>updEquipo(i,'fotoSerie','')}
                  style={{position:'absolute',top:4,right:4,width:22,height:22,borderRadius:'50%',background:'rgba(0,0,0,0.65)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Trash2 size={11}/>
                </button>
              </div>
            ):(
              <button type="button" onClick={()=>serieRefs.current[i]?.click()}
                style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',border:'1.5px dashed #E5E7EB',borderRadius:10,background:'#fff',cursor:'pointer',color:'#9CA3AF',fontSize:12,fontFamily:'inherit',transition:'all 0.15s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#C8102E';(e.currentTarget as HTMLElement).style.color='#C8102E'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#E5E7EB';(e.currentTarget as HTMLElement).style.color='#9CA3AF'}}>
                <Camera size={15}/> Fotografiar placa / serie
              </button>
            )}
          </div>
        ))}
      </>
    )

    if(id==='fotos') return(
      <>
        <ST>Fotografías del trabajo</ST>
        <p style={{fontSize:12,color:'#9CA3AF',marginBottom:16}}>
          Agrega fotos del trabajo realizado. Escribe una descripción clara de lo que muestra cada imagen. Máximo 10.
        </p>
        <input ref={fileRef} type="file" accept="image/*" multiple capture="environment"
          style={{display:'none'}} onChange={e=>addFotos(e.target.files)}/>
        {fotos.length<10&&(
          <button type="button" onClick={()=>fileRef.current?.click()} style={{
            width:'100%',border:'2px dashed #E5E7EB',borderRadius:14,padding:'28px 20px',
            display:'flex',flexDirection:'column',alignItems:'center',gap:8,
            color:'#9CA3AF',background:'#FAFAFA',cursor:'pointer',marginBottom:16,
            transition:'all 0.15s',fontFamily:'inherit',
          }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#C8102E';(e.currentTarget as HTMLElement).style.color='#C8102E'}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#E5E7EB';(e.currentTarget as HTMLElement).style.color='#9CA3AF'}}>
            <Camera size={30}/>
            <span style={{fontSize:14,fontWeight:600}}>Toca para agregar fotos</span>
            <span style={{fontSize:12}}>{fotos.length} / 10 · cámara o galería</span>
          </button>
        )}
        {fotos.length>0&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {fotos.map((foto,i)=>(
              <div key={i} style={{display:'flex',gap:0,background:'#FAFAFA',borderRadius:12,border:'1px solid #EDEEF1',overflow:'hidden',alignItems:'flex-start'}}>
                <div style={{position:'relative',flexShrink:0,width:110}}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto.dataUrl} alt="" style={{width:'100%',aspectRatio:'4/3',objectFit:'cover',display:'block'}}/>
                  <button type="button" onClick={()=>setFotos(p=>p.filter((_,j)=>j!==i))}
                    style={{position:'absolute',top:4,right:4,width:22,height:22,borderRadius:'50%',background:'rgba(0,0,0,0.65)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Trash2 size={11}/>
                  </button>
                  <span style={{position:'absolute',bottom:4,left:4,background:'rgba(0,0,0,0.55)',color:'#fff',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4}}>{i+1}</span>
                </div>
                <div style={{flex:1,padding:'12px'}}>
                  <label style={{fontSize:10,fontWeight:600,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:6}}>Descripción</label>
                  <textarea value={foto.descripcion}
                    onChange={e=>setFotos(p=>p.map((f,j)=>j===i?{...f,descripcion:e.target.value}:f))}
                    rows={3} placeholder="Ej: Panel de control identificado, Sin enlace desde switch boca 23, Prueba de enlace físico con PC..."
                    style={{width:'100%',fontSize:12,color:'#374151',border:'1px solid #E5E7EB',borderRadius:8,padding:'8px 10px',outline:'none',fontFamily:'inherit',resize:'none',background:'#fff',transition:'border-color 0.15s'}}
                    onFocus={e=>{e.currentTarget.style.borderColor='#C8102E'}}
                    onBlur={e=>{e.currentTarget.style.borderColor='#E5E7EB'}}/>
                </div>
              </div>
            ))}
          </div>
        )}
        {fotos.length===0&&<p style={{textAlign:'center',fontSize:12,color:'#D1D5DB',paddingTop:8}}>Aún no hay fotos agregadas</p>}
      </>
    )

    if(id==='recepcion') return(
      <>
        <ST>Conclusiones</ST>
        <F label="¿Trabajo completado?">
          <div style={{display:'flex',gap:12}}>
            {([true,false] as const).map(v=>(
              <button key={String(v)} type="button" onClick={()=>set('trabajo_completado',v)} style={{
                flex:1,padding:'10px 0',borderRadius:10,fontFamily:'inherit',
                border:`1px solid ${form.trabajo_completado===v?(v?'#1A7A4A':'#C8102E'):'#E5E7EB'}`,
                background:form.trabajo_completado===v?(v?'#E6F4EC':'#F9E8EB'):'#fff',
                color:form.trabajo_completado===v?(v?'#1A7A4A':'#C8102E'):'#9CA3AF',
                fontSize:13,fontWeight:700,cursor:'pointer',transition:'all 0.15s',
              }}>{v?'✓ Sí':'✗ No'}</button>
            ))}
          </div>
        </F>
        <F label="¿Qué quedó pendiente?">
          <textarea className="input" rows={2} style={{resize:'none'}} value={form.pendiente}
            onChange={e=>set('pendiente',e.target.value)} placeholder="Re conexión de panel 460..."/>
        </F>
        <F label="Observaciones">
          <textarea className="input" rows={2} style={{resize:'none'}} value={form.observaciones}
            onChange={e=>set('observaciones',e.target.value)} placeholder="Chapa pendiente cambio..."/>
        </F>
        <ST>Recepción del trabajo</ST>
        <F label="Nombre de quien recibe *">
          <input className="input" value={form.receptor_nombre}
            onChange={e=>set('receptor_nombre',e.target.value)} placeholder="Christian Mellado"/>
        </F>
        <F label="Email del receptor">
          <input className="input" type="email" value={form.receptor_email}
            onChange={e=>set('receptor_email',e.target.value)} placeholder="inmade@inmade.cl"/>
        </F>
      </>
    )

    if(id==='firma') return(
      <>
        <ST>Firma digital del cliente</ST>
        <p style={{fontSize:12,color:'#6B7280',marginBottom:16}}>Pide al cliente que firme en el recuadro con el dedo o mouse.</p>
        <FirmaCanvas ref={firmaRef} initial={form.firma_dataUrl}/>
        <div style={{marginTop:16,display:'flex',alignItems:'flex-start',gap:10,background:'#F9E8EB',borderRadius:12,padding:14}}>
          <Info size={14} style={{color:'#C8102E',marginTop:1,flexShrink:0}}/>
          <p style={{fontSize:12,color:'#C8102E',lineHeight:1.5}}>
            Al presionar <strong>Generar informe</strong> el estado será <strong>Firmado</strong> si hay firma, o <strong>Generado</strong> si no.
          </p>
        </div>
      </>
    )
  }

  const pct=Math.round((step/(STEPS.length-1))*100)

  return(
    <div style={{position:'fixed',inset:0,zIndex:50,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
      <div style={{background:'#fff',width:'100%',maxWidth:700,height:'100%',display:'flex',flexDirection:'column',boxShadow:'0 25px 60px rgba(0,0,0,0.2)'}}>

        <div style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',borderBottom:'1px solid #EDEEF1',flexShrink:0}}>
          <div style={{flex:1}}>
            <p style={{fontSize:15,fontWeight:700,color:'#111'}}>{initial?'Editar informe':'Nuevo informe técnico'}</p>
            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:8}}>
              <div style={{flex:1,height:4,background:'#EDEEF1',borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',background:'#C8102E',borderRadius:99,width:`${pct}%`,transition:'width 0.3s'}}/>
              </div>
              <span style={{fontSize:11,color:'#9CA3AF',whiteSpace:'nowrap'}}>{step+1} / {STEPS.length}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:6,borderRadius:8,flexShrink:0}}><X size={18}/></button>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:3,padding:'10px 20px',background:'#F6F7F9',borderBottom:'1px solid #EDEEF1',overflowX:'auto',flexShrink:0}}>
          {STEPS.map((s,i)=>{
            const done=i<step,active=i===step
            return(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
                {i>0&&<ChevronRight size={10} style={{color:'#D1D5DB'}}/>}
                <span style={{display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:99,fontSize:10,fontWeight:700,background:done?'#E6F4EC':active?'#C8102E':'#EDEEF1',color:done?'#1A7A4A':active?'#fff':'#9CA3AF',transition:'all 0.2s'}}>
                  {done?'✓':i+1} {s.label}
                </span>
              </div>
            )
          })}
        </div>

        <div ref={bodyRef} style={{flex:1,overflowY:'auto',padding:'20px 20px'}}>{renderBody()}</div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderTop:'1px solid #EDEEF1',background:'#fff',flexShrink:0}}>
          <button onClick={prev} className="btn btn-secondary btn-sm" style={{visibility:step===0?'hidden':'visible'}}>← Anterior</button>
          <div style={{display:'flex',gap:8}}>
            <button onClick={draft} className="btn btn-secondary btn-sm">Guardar borrador</button>
            <button onClick={next} className="btn btn-primary btn-sm">{step===STEPS.length-1?'Generar informe ✓':'Siguiente →'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
