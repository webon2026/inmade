'use client'
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
export interface FirmaRef { getDataUrl:()=>string; clear:()=>void; isEmpty:()=>boolean }
const FirmaCanvas = forwardRef<FirmaRef,{initial?:string}>(({initial},ref)=>{
  const c=useRef<HTMLCanvasElement>(null); const drawing=useRef(false); const strokes=useRef(false)
  useImperativeHandle(ref,()=>({
    getDataUrl:()=>c.current?.toDataURL()??'',
    isEmpty:()=>!strokes.current,
    clear(){const cv=c.current!;cv.getContext('2d')!.clearRect(0,0,cv.width,cv.height);strokes.current=false},
  }))
  useEffect(()=>{
    const cv=c.current!; const ctx=cv.getContext('2d')!
    ctx.strokeStyle='#111';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round'
    if(initial){const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0);strokes.current=true};img.src=initial}
    const pos=(e:MouseEvent|TouchEvent)=>{const r=cv.getBoundingClientRect();const s='touches'in e?e.touches[0]:e;return{x:(s.clientX-r.left)*(cv.width/r.width),y:(s.clientY-r.top)*(cv.height/r.height)}}
    const dn=(e:MouseEvent|TouchEvent)=>{e.preventDefault();drawing.current=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y)}
    const mv=(e:MouseEvent|TouchEvent)=>{if(!drawing.current)return;e.preventDefault();const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();strokes.current=true}
    const up=()=>{drawing.current=false}
    cv.addEventListener('mousedown',dn);cv.addEventListener('mousemove',mv);cv.addEventListener('mouseup',up)
    cv.addEventListener('touchstart',dn,{passive:false});cv.addEventListener('touchmove',mv,{passive:false});cv.addEventListener('touchend',up)
    return()=>{cv.removeEventListener('mousedown',dn);cv.removeEventListener('mousemove',mv);cv.removeEventListener('mouseup',up);cv.removeEventListener('touchstart',dn);cv.removeEventListener('touchmove',mv);cv.removeEventListener('touchend',up)}
  },[initial])
  return(
    <div>
      <canvas ref={c} width={600} height={160} style={{width:'100%',display:'block',touchAction:'none',cursor:'crosshair',borderRadius:12,border:'2px dashed #E5E7EB',background:'#FAFAFA'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
        <p className="hint">Firmar con dedo o mouse en el recuadro</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={()=>{const cv=c.current!;cv.getContext('2d')!.clearRect(0,0,cv.width,cv.height);strokes.current=false}}>↺ Limpiar</button>
      </div>
    </div>
  )
})
FirmaCanvas.displayName='FirmaCanvas'
export default FirmaCanvas
