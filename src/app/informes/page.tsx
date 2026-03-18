'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, FileText, Download, Pencil, Trash2, Search, CheckCircle2, Clock, FileClock } from 'lucide-react'
import { store } from '@/lib/store'
import { generarPDF } from '@/lib/pdf'
import type { InformeTecnico, InformeFormData } from '@/types/informe'
import InformeForm from '@/components/ui/InformeForm'

function Logo(){
  return(
    <div style={{display:'flex',alignItems:'center',gap:2}}>
      <span style={{fontSize:22,fontWeight:900,letterSpacing:'-1px',color:'#fff'}}>IN</span>
      <svg width="18" height="26" viewBox="0 0 18 26" fill="none" style={{margin:'0 2px'}}>
        <polyline points="2,24 7,2 12,24 17,2" stroke="#C8102E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{fontSize:22,fontWeight:900,letterSpacing:'-1px',color:'#fff'}}>ADE</span>
    </div>
  )
}

const ESTADO={
  borrador:{label:'Borrador',pill:'pill-gray',Icon:FileClock},
  generado:{label:'Generado',pill:'pill-blue',Icon:Clock},
  firmado: {label:'Firmado', pill:'pill-green',Icon:CheckCircle2},
} as const
const TIPO_PILL:Record<string,string>={
  'Reparación':'pill-red','Instalación':'pill-blue',
  'Mantención Preventiva':'pill-amber','Soporte Técnico':'pill-blue','Diagnóstico':'pill-gray',
}
function fmt(iso:string){ return new Date(iso).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}) }

export default function InformesPage(){
  const [informes,setInformes]=useState<InformeTecnico[]>([])
  const [query,setQuery]=useState('')
  const [fEstado,setFEstado]=useState('')
  const [fTipo,setFTipo]=useState('')
  const [modal,setModal]=useState(false)
  const [editing,setEditing]=useState<InformeTecnico|null>(null)

  const reload=useCallback(()=>{store.seed();setInformes(store.getAll())},[])
  useEffect(()=>{reload()},[reload])

  const lista=informes.filter(i=>{
    const txt=[i.numero,i.numero_reg,i.cliente_razon_social,i.tecnico_nombre,i.nombre_proyecto,i.contacto_reporte].join(' ').toLowerCase()
    return(!query||txt.includes(query.toLowerCase()))&&(!fEstado||i.estado===fEstado)&&(!fTipo||i.tipo_atencion===fTipo)
  })
  const hoy=new Date().toISOString().slice(0,10)
  const S={
    total:informes.length,
    firmados:informes.filter(i=>i.estado==='firmado').length,
    borradores:informes.filter(i=>i.estado==='borrador').length,
    hoy:informes.filter(i=>i.created_at.slice(0,10)===hoy).length,
  }

  function handleSave(data:InformeFormData,estado:InformeTecnico['estado']){
    if(editing) store.update(editing.id,{...data,estado})
    else store.create(data,estado)
    setModal(false);setEditing(null);reload()
  }
  function del(id:string){
    if(!confirm('¿Eliminar este informe? No se puede deshacer.'))return
    store.delete(id);reload()
  }

  return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <header style={{background:'#1A1A1A',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Logo/>
          <span style={{width:1,height:18,background:'rgba(255,255,255,0.12)'}}/>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.38)',fontWeight:500,letterSpacing:'0.04em'}}>Informes Técnicos</span>
        </div>
        <button onClick={()=>{setEditing(null);setModal(true)}} className="btn btn-primary btn-sm">
          <Plus size={14}/> Nuevo informe
        </button>
      </header>

      <main style={{flex:1,maxWidth:900,margin:'0 auto',width:'100%',padding:'32px 24px'}}>
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111',marginBottom:4}}>Informes técnicos</h1>
          <p style={{fontSize:13,color:'#6B7280'}}>Historial de informes — busca por cliente, N° de registro o técnico</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:28}}>
          {[
            {label:'Total',value:S.total,color:'#111'},
            {label:'Firmados',value:S.firmados,color:'#1A7A4A'},
            {label:'Borradores',value:S.borradores,color:'#B06010'},
            {label:'Hoy',value:S.hoy,color:'#C8102E'},
          ].map(k=>(
            <div key={k.label} className="card" style={{padding:'16px 20px',borderLeft:'3px solid #C8102E',borderRadius:'0 14px 14px 0'}}>
              <p style={{fontSize:10,fontWeight:600,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{k.label}</p>
              <p style={{fontSize:28,fontWeight:700,color:k.color,lineHeight:1}}>{k.value}</p>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:220,position:'relative'}}>
            <Search size={13} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF'}}/>
            <input className="input" style={{paddingLeft:34}} value={query}
              onChange={e=>setQuery(e.target.value)} placeholder="Buscar cliente, N° registro, técnico..."/>
          </div>
          <select className="input" style={{width:'auto',background:'#fff'}} value={fEstado} onChange={e=>setFEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="generado">Generado</option>
            <option value="firmado">Firmado</option>
          </select>
          <select className="input" style={{width:'auto',background:'#fff'}} value={fTipo} onChange={e=>setFTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            {['Reparación','Instalación','Mantención Preventiva','Soporte Técnico','Diagnóstico'].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {lista.length===0?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'80px 20px',textAlign:'center'}}>
            <FileText size={52} style={{color:'#E5E7EB',marginBottom:16}}/>
            <p style={{fontSize:15,fontWeight:600,color:'#6B7280'}}>No hay informes</p>
            <p style={{fontSize:13,color:'#9CA3AF',marginTop:4}}>
              {query||fEstado||fTipo?'Prueba con otros filtros':'Crea el primer informe con el botón de arriba'}
            </p>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {lista.map(inf=>{
              const cfg=ESTADO[inf.estado]??ESTADO.generado
              return(
                <div key={inf.id} className="card" style={{padding:20,display:'flex',alignItems:'flex-start',gap:16}}>
                  <div style={{width:46,height:46,borderRadius:12,background:'#F9E8EB',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <FileText size={22} style={{color:'#C8102E'}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                      <span style={{fontFamily:'monospace',fontSize:11,fontWeight:600,color:'#9CA3AF'}}>{inf.numero}</span>
                      <span style={{color:'#E5E7EB'}}>·</span>
                      <span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:'#C8102E'}}>Reg: {inf.numero_reg}</span>
                    </div>
                    <p style={{fontSize:16,fontWeight:700,color:'#111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {inf.cliente_razon_social||'Sin cliente'}
                    </p>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6,flexWrap:'wrap'}}>
                      <span style={{fontSize:11,color:'#9CA3AF'}}>{fmt(inf.created_at)}</span>
                      {inf.tecnico_nombre&&<><span style={{color:'#E5E7EB'}}>·</span><span style={{fontSize:11,color:'#9CA3AF'}}>{inf.tecnico_nombre}</span></>}
                      {inf.nombre_proyecto&&<><span style={{color:'#E5E7EB'}}>·</span><span style={{fontSize:11,color:'#9CA3AF'}}>{inf.nombre_proyecto}</span></>}
                      <span className={cfg.pill}>{cfg.label}</span>
                      {inf.tipo_atencion&&<span className={TIPO_PILL[inf.tipo_atencion]??'pill-gray'}>{inf.tipo_atencion}</span>}
                    </div>
                    {inf.trabajos_realizados?.filter(Boolean).length>0&&(
                      <div style={{marginTop:10}}>
                        {inf.trabajos_realizados.filter(Boolean).slice(0,2).map((t,i)=>(
                          <p key={i} style={{display:'flex',alignItems:'flex-start',gap:6,fontSize:11,color:'#6B7280',marginBottom:3}}>
                            <span style={{color:'#C8102E',fontWeight:700,flexShrink:0}}>·</span>
                            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t}</span>
                          </p>
                        ))}
                        {inf.trabajos_realizados.filter(Boolean).length>2&&(
                          <p style={{fontSize:11,color:'#9CA3AF',paddingLeft:12}}>+{inf.trabajos_realizados.filter(Boolean).length-2} más</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
                    <button onClick={()=>generarPDF(inf)} className="btn btn-danger btn-sm" style={{display:'flex',alignItems:'center',gap:6}}>
                      <Download size={12}/> PDF
                    </button>
                    <button onClick={()=>{setEditing(inf);setModal(true)}} className="btn btn-secondary btn-sm" style={{display:'flex',alignItems:'center',gap:6}}>
                      <Pencil size={12}/> Editar
                    </button>
                    <button onClick={()=>del(inf.id)} className="btn btn-ghost btn-sm" style={{display:'flex',alignItems:'center',gap:6,color:'#9CA3AF'}}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {modal&&<InformeForm initial={editing} onClose={()=>{setModal(false);setEditing(null)}} onSave={handleSave}/>}
    </div>
  )
}
