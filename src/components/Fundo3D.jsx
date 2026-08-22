import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useTheme } from '../context/ThemeContext'

// Fundo animado leve em 3D (Three.js) — pontinhos de luz flutuando bem devagar, tipo o ar da
// cidade à noite. Fica fixo atrás de todo o conteúdo (z-index negativo) e não captura clique
// (pointer-events: none), então não atrapalha nenhum botão/link por cima. O canvas é transparente
// (alpha), então o fundo com o skyline em CSS continua aparecendo por trás, só que agora com
// partículas se mexendo na frente dele.
export default function Fundo3D() {
  const containerRef = useRef(null)
  const { tema } = useTheme()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animando = true

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 8

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(renderer.domElement)

    // Textura de ponto circular suave, desenhada na hora num canvas — evita ter que carregar
    // um arquivo de imagem só pra isso.
    const tamanhoTextura = 64
    const canvasTextura = document.createElement('canvas')
    canvasTextura.width = tamanhoTextura
    canvasTextura.height = tamanhoTextura
    const ctxTextura = canvasTextura.getContext('2d')
    const gradiente = ctxTextura.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradiente.addColorStop(0, 'rgba(255,255,255,1)')
    gradiente.addColorStop(1, 'rgba(255,255,255,0)')
    ctxTextura.fillStyle = gradiente
    ctxTextura.fillRect(0, 0, tamanhoTextura, tamanhoTextura)
    const textura = new THREE.CanvasTexture(canvasTextura)

    const quantidade = 220
    const posicoes = new Float32Array(quantidade * 3)
    for (let i = 0; i < quantidade; i++) {
      posicoes[i * 3] = (Math.random() - 0.5) * 22
      posicoes[i * 3 + 1] = (Math.random() - 0.5) * 14
      posicoes[i * 3 + 2] = (Math.random() - 0.5) * 10
    }

    const geometria = new THREE.BufferGeometry()
    geometria.setAttribute('position', new THREE.BufferAttribute(posicoes, 3))

    // Amarelo suave (tipo janela iluminada) no escuro, verde da marca no claro.
    const cor = tema === 'dark' ? 0xfbbf24 : 0x22c55e

    const material = new THREE.PointsMaterial({
      size: 0.14,
      map: textura,
      transparent: true,
      opacity: tema === 'dark' ? 0.55 : 0.32,
      color: cor,
      depthWrite: false,
    })

    const pontos = new THREE.Points(geometria, material)
    scene.add(pontos)

    function animar() {
      if (!animando) return
      pontos.rotation.y += 0.0006
      pontos.rotation.x += 0.00015
      renderer.render(scene, camera)
      requestAnimationFrame(animar)
    }
    animar()

    function aoRedimensionar() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', aoRedimensionar)

    return () => {
      animando = false
      window.removeEventListener('resize', aoRedimensionar)
      geometria.dispose()
      material.dispose()
      textura.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [tema])

  return (
    <div
      ref={containerRef}
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ zIndex: -1, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}
