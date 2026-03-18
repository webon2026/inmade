import type { InformeTecnico } from '@/types/informe'

export function generarPDF(inf: InformeTecnico) {
  const r = (l:string,v:string) =>
    `<div class="row"><span class="lbl">${l}</span><span class="val">${v||'—'}</span></div>`

  const fotosHTML = inf.fotos?.length ? `
    <div class="sec-hd">FOTOS</div>
    <div class="sec-bd">
      <table class="foto-table">
        <thead><tr><th style="width:210px">Foto</th><th>Descripción</th></tr></thead>
        <tbody>${inf.fotos.map(f=>`
          <tr>
            <td><img src="${f.dataUrl}" class="foto-img"/></td>
            <td class="foto-desc">${f.descripcion||''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''

  const equiposHTML = inf.equipos?.length ? `
    <div style="margin-top:10px">
      <p style="font-weight:700;font-size:10px;color:#555;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Equipos / Repuestos instalados:</p>
      <table class="equipo-table">
        <thead><tr><th>Equipo</th><th>Marca / Modelo</th><th>N° Serie</th><th>Foto serie</th></tr></thead>
        <tbody>${inf.equipos.map(e=>`
          <tr>
            <td>${e.nombre||'—'}</td>
            <td>${[e.marca,e.modelo].filter(Boolean).join(' / ')||'—'}</td>
            <td style="font-family:monospace">${e.serie||'—'}</td>
            <td>${e.fotoSerie?`<img src="${e.fotoSerie}" style="width:80px;border:1px solid #e8e8e8;border-radius:3px"/>`:'—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''

  const matsHTML = inf.materiales_simples?.length ? `
    <div style="margin-bottom:${inf.equipos?.length?'14px':'0'}">
      <p style="font-weight:700;font-size:10px;color:#555;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Materiales instalados:</p>
      <table class="mat-table">
        <thead><tr><th>Descripción</th><th>Cantidad</th><th>Unidad</th></tr></thead>
        <tbody>${inf.materiales_simples.map(m=>`
          <tr><td>${m.descripcion||'—'}</td><td>${m.cantidad||'—'}</td><td>${m.unidad||'—'}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''

  const firmaHTML = inf.firma_dataUrl
    ? `<img src="${inf.firma_dataUrl}" class="firma-img" alt="Firma"/>`
    : '<span style="color:#bbb;font-style:italic;font-size:10px">Sin firma digital</span>'

  const trabajosHTML = inf.trabajos_realizados?.filter(Boolean)
    .map(t=>`<p class="trab">${t}</p>`).join('') || '—'

  const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"/>
<title>Informe Técnico ${inf.numero} — ${inf.cliente_razon_social}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',Arial,sans-serif;font-size:11px;color:#111;background:#fff;padding:40px 48px}
@media print{body{padding:16px 20px}.no-print{display:none!important}@page{margin:15mm}}
.print-btn{position:fixed;top:16px;right:16px;background:#C8102E;color:#fff;border:none;
  padding:10px 24px;border-radius:8px;cursor:pointer;font:700 14px 'Inter',sans-serif;
  box-shadow:0 4px 12px rgba(200,16,46,.35)}
.print-btn:hover{background:#9A0B22}
.logo-wrap{display:flex;align-items:center;margin-bottom:32px}
.logo-txt{font-size:30px;font-weight:900;letter-spacing:-1px;color:#111}
.titulo{font-size:18px;font-weight:700;text-align:center;margin-bottom:4px}
.subtitulo{font-size:13px;color:#777;text-align:center;margin-bottom:28px}
.sec-hd{background:#C8102E;color:#fff;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:6px 14px;margin-top:18px}
.sec-bd{border:1px solid #E8E8E8;border-top:none;padding:12px 14px}
.row{display:flex;gap:12px;margin-bottom:6px;line-height:1.5}
.lbl{font-weight:700;min-width:165px;color:#555;font-size:10px;flex-shrink:0}
.val{flex:1;font-size:10px;color:#111;line-height:1.6}
.trab{font-size:10px;color:#111;margin-bottom:4px;padding-left:14px;position:relative;line-height:1.5}
.trab::before{content:'·';position:absolute;left:0;color:#C8102E;font-size:16px;font-weight:900;line-height:1}
.badge{display:inline-block;padding:2px 10px;border-radius:3px;font-size:10px;font-weight:700}
.si{background:#E6F4EC;color:#1A7A4A}.no{background:#F9E8EB;color:#C8102E}
.foto-table,.mat-table,.equipo-table{width:100%;border-collapse:collapse;margin-top:8px}
.foto-table th,.mat-table th,.equipo-table th{text-align:left;font-size:9px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;padding:5px 8px;border-bottom:1px solid #E8E8E8;background:#FAFAFA}
.foto-table td,.mat-table td,.equipo-table td{padding:8px;border-bottom:1px solid #F0F0F0;vertical-align:top;font-size:10px}
.foto-img{width:190px;border:1px solid #E8E8E8;border-radius:4px;display:block}
.foto-desc{font-size:10px;color:#555;padding-left:8px;vertical-align:middle}
.firma-img{max-height:100px;border:1px solid #E8E8E8;border-radius:4px;margin-top:8px;display:block}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.pie{margin-top:36px;font-size:9px;color:#bbb;text-align:right;border-top:1px solid #F0F0F0;padding-top:10px}
</style></head><body>

<button class="print-btn no-print" onclick="window.print()">↓ Guardar PDF</button>

<div class="logo-wrap">
  <span class="logo-txt">IN</span>
  <svg width="22" height="32" viewBox="0 0 22 32" fill="none" style="margin:0 3px">
    <polyline points="3,30 8,2 14,30 19,2" stroke="#C8102E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <span class="logo-txt">ADE</span>
</div>

<p class="titulo">INFORME TÉCNICO ${inf.numero}</p>
<p class="subtitulo">(Reg: ${inf.numero_reg})</p>

<div class="sec-bd" style="margin-top:4px">
  <p style="font-weight:700;font-size:11px;margin-bottom:10px">Cliente</p>
  <div class="grid2">
    <div>
      ${r('Razón Social:',inf.cliente_razon_social)}
      ${r('Nombre Fantasía:',inf.cliente_nombre_fantasia||inf.cliente_razon_social)}
      ${r('Rut Cliente:',inf.cliente_rut)}
      ${r('Teléfono:',inf.cliente_telefono)}
    </div>
    <div>
      ${r('Fecha de Atención:',inf.fecha_atencion)}
      ${r('Dirección:',inf.cliente_direccion)}
      ${r('Ciudad o Comuna:',inf.cliente_ciudad)}
    </div>
  </div>
  <div style="margin-top:12px;padding-top:12px;border-top:1px solid #F0F0F0">
    <p style="font-weight:700;font-size:11px;margin-bottom:10px">Asignado a</p>
    <div class="grid2">
      ${r('Nombre:',inf.tecnico_nombre)}
      ${r('Teléfono:',inf.tecnico_telefono)}
      ${r('Zona de Atención:',inf.zona_atencion)}
    </div>
  </div>
</div>

<div class="sec-hd">DETALLE DE SOLICITUD</div>
<div class="sec-bd">
  ${r('Numero de Reg/OT:',inf.numero_reg)}
  ${r('Nombre de Proyecto:',inf.nombre_proyecto)}
  ${r('Tipo de Atención:',inf.tipo_atencion)}
  ${r('Contacto de Reporte:',inf.contacto_reporte)}
  ${r('Reporte:',inf.reporte)}
</div>

<div class="sec-hd">PROCEDIMIENTO REALIZADO</div>
<div class="sec-bd">
  <div class="row"><span class="lbl">Falla observada:</span><span class="val">${inf.falla_observada||'—'}</span></div>
  <div class="row"><span class="lbl">Trabajos realizados:</span><span class="val">${trabajosHTML}</span></div>
  <div class="row"><span class="lbl">Conclusión:</span><span class="val">${inf.conclusion||'—'}</span></div>
</div>

<div class="sec-hd">HORAS DE TRABAJO</div>
<div class="sec-bd">
  <div class="row">
    <span class="lbl">Hora de Inicio:</span><span class="val">${inf.hora_inicio||'—'}</span>
    <span class="lbl" style="margin-left:30px">Hora de Termino:</span><span class="val">${inf.hora_termino||'—'}</span>
  </div>
</div>

<div class="sec-hd">MATERIALES</div>
<div class="sec-bd">${matsHTML}${equiposHTML}${!matsHTML&&!equiposHTML?'<p style="font-size:10px;color:#9CA3AF">Sin materiales registrados</p>':''}</div>

<div class="sec-hd">CONCLUSIONES</div>
<div class="sec-bd">
  <div class="row">
    <span class="lbl">Trabajo completado:</span>
    <span class="val"><span class="badge ${inf.trabajo_completado?'si':'no'}">${inf.trabajo_completado?'Sí':'No'}</span></span>
  </div>
  ${inf.pendiente    ? r('¿Que quedo pendiente?',inf.pendiente)  : ''}
  ${inf.observaciones ? r('Observaciones:',inf.observaciones)    : ''}
</div>

${fotosHTML}

<div class="sec-hd">RECEPCIÓN DEL TRABAJO</div>
<div class="sec-bd">
  ${r('Quien recibe (Nombre y Firma):',inf.receptor_nombre)}
  <div class="row"><span class="lbl">Firma del cliente:</span><span class="val">${firmaHTML}</span></div>
  ${r('Email del Receptor:',inf.receptor_email)}
</div>

<p class="pie">Inmade SpA · Informe generado el ${new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'})}</p>
</body></html>`

  const w = window.open('','_blank','width=950,height=1050')
  if(!w){alert('Habilita ventanas emergentes para generar el PDF');return}
  w.document.write(html); w.document.close()
}
