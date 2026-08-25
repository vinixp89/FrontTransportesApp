import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../context/ThemeContext'

const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
}

// Ajusta o zoom/centro do mapa pra sempre enquadrar a rota inteira, com uma margem.
function AjustarEnquadramento({ pontos }) {
  const map = useMap()

  useEffect(() => {
    if (pontos.length < 2) return
    map.fitBounds(pontos, { padding: [32, 32], maxZoom: 15 })
  }, [map, pontos])

  return null
}

// Busca o trajeto real (seguindo ruas) no servidor de demonstração público do OSRM — gratuito, sem
// chave de API, igual ao resto do mapa. Não é garantido pra uso pesado/produção (é só o demo
// público deles), então se falhar ou demorar, cai de volta pra uma linha reta entre os pontos.
function useTrajetoRodovia(origem, destino) {
  const [pontos, setPontos] = useState(null)

  useEffect(() => {
    let cancelado = false
    setPontos(null)

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}` +
      `?overview=full&geometries=geojson`

    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('OSRM falhou'))))
      .then((data) => {
        if (cancelado) return
        const coordenadas = data?.routes?.[0]?.geometry?.coordinates
        if (Array.isArray(coordenadas) && coordenadas.length > 1) {
          // GeoJSON vem como [longitude, latitude] — o Leaflet espera [latitude, longitude].
          setPontos(coordenadas.map(([lon, lat]) => [lat, lon]))
        }
      })
      .catch(() => {
        // Sem sorte com o trajeto real — quem usa esse hook trata `null` caindo pra linha reta.
      })

    return () => {
      cancelado = true
    }
  }, [origem.latitude, origem.longitude, destino.latitude, destino.longitude])

  return pontos
}

// Mapa (Leaflet + OpenStreetMap/CARTO, sem chave de API) mostrando origem, destino e o trajeto
// entre eles seguindo as ruas (via OSRM). Se o trajeto real não carregar a tempo, mostra uma linha
// reta entre os dois pontos como alternativa, em vez de deixar o mapa vazio.
//
// motoristaPos (opcional) é [latitude, longitude] do motorista a caminho — usado pela tela de
// acompanhar corrida (AcompanharCorridaPage) pra mostrar ele se deslocando em tempo real, sempre
// dentro do enquadramento junto com origem/destino.
export default function RideMap({ origem, destino, corHex, motoristaPos = null }) {
  const { tema } = useTheme()

  const origemLatLng = [origem.latitude, origem.longitude]
  const destinoLatLng = [destino.latitude, destino.longitude]

  const trajetoRodovia = useTrajetoRodovia(origem, destino)
  const linha = trajetoRodovia ?? [origemLatLng, destinoLatLng]
  const pontosEnquadramento = motoristaPos ? [...linha, motoristaPos] : linha

  return (
    <div className="h-40 w-full overflow-hidden rounded-xl">
      <MapContainer
        center={origemLatLng}
        zoom={13}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer url={TILES[tema]} />
        <CircleMarker center={origemLatLng} radius={7} pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 1 }} />
        <CircleMarker center={destinoLatLng} radius={7} pathOptions={{ color: corHex, fillColor: corHex, fillOpacity: 1 }} />
        {motoristaPos && (
          <CircleMarker
            center={motoristaPos}
            radius={8}
            pathOptions={{ color: '#9333ea', fillColor: '#9333ea', fillOpacity: 1, weight: 2 }}
          />
        )}
        <Polyline
          positions={linha}
          pathOptions={
            trajetoRodovia
              ? { color: corHex, weight: 4 }
              : { color: corHex, weight: 3, dashArray: '6 6' }
          }
        />
        <AjustarEnquadramento pontos={pontosEnquadramento} />
      </MapContainer>
    </div>
  )
}
