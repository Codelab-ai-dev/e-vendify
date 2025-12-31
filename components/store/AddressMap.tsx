"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Navigation, Loader2, Search, Map, Edit3 } from "lucide-react"

interface AddressMapProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  initialAddress?: string
}

export function AddressMap({ onLocationSelect, initialAddress }: AddressMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLocating, setIsLocating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'map' | 'manual'>('map')
  const [manualAddress, setManualAddress] = useState({
    street: "",
    number: "",
    colony: "",
    city: "",
    postalCode: "",
    references: ""
  })
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (inputMode !== 'map') return

    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      const L = await import('leaflet')

      if (!mapRef.current || mapInstanceRef.current) return

      const defaultLat = 19.4326
      const defaultLng = -99.1332

      const map = L.default.map(mapRef.current).setView([defaultLat, defaultLng], 13)

      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)

      const customIcon = L.default.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #BFFF00; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid black;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })

      const marker = L.default.marker([defaultLat, defaultLng], {
        icon: customIcon,
        draggable: true
      }).addTo(map)

      marker.on('dragend', async () => {
        const pos = marker.getLatLng()
        const address = await reverseGeocode(pos.lat, pos.lng)
        onLocationSelect({ lat: pos.lat, lng: pos.lng, address })
      })

      map.on('click', async (e: any) => {
        marker.setLatLng(e.latlng)
        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng)
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng, address })
      })

      mapInstanceRef.current = map
      markerRef.current = marker
      setIsLoading(false)
    }

    loadLeaflet()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [onLocationSelect, inputMode])

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  const searchAddress = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0]
        const latitude = parseFloat(lat)
        const longitude = parseFloat(lon)

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16)
          markerRef.current.setLatLng([latitude, longitude])
        }

        onLocationSelect({ lat: latitude, lng: longitude, address: display_name })
        setSearchQuery("")
      } else {
        setError("No se encontro la direccion. Intenta ser mas especifico.")
      }
    } catch {
      setError("Error al buscar la direccion")
    } finally {
      setIsSearching(false)
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalizacion')
      return
    }

    setIsLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16)
          markerRef.current.setLatLng([latitude, longitude])

          const address = await reverseGeocode(latitude, longitude)
          onLocationSelect({ lat: latitude, lng: longitude, address })
        }

        setIsLocating(false)
      },
      (err) => {
        setError('No se pudo obtener tu ubicacion')
        setIsLocating(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleManualAddressChange = (field: string, value: string) => {
    const updated = { ...manualAddress, [field]: value }
    setManualAddress(updated)

    // Build full address string
    const parts = [
      updated.street && updated.number ? `${updated.street} #${updated.number}` : updated.street,
      updated.colony,
      updated.city,
      updated.postalCode ? `C.P. ${updated.postalCode}` : "",
      updated.references ? `(${updated.references})` : ""
    ].filter(Boolean)

    if (parts.length > 0) {
      onLocationSelect({ lat: 0, lng: 0, address: parts.join(", ") })
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex border-2 border-border">
        <button
          type="button"
          onClick={() => setInputMode('map')}
          className={`flex-1 px-4 py-3 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
            inputMode === 'map'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          <Map className="w-4 h-4" />
          Seleccionar en mapa
        </button>
        <button
          type="button"
          onClick={() => setInputMode('manual')}
          className={`flex-1 px-4 py-3 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors border-l-2 border-border ${
            inputMode === 'manual'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Escribir direccion
        </button>
      </div>

      {inputMode === 'map' ? (
        <>
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 border-2 border-border flex items-center">
              <input
                type="text"
                placeholder="Buscar direccion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchAddress())}
                className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={searchAddress}
                disabled={isSearching}
                className="px-4 py-2 border-l-2 border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="px-4 py-2 border-2 border-border hover:border-foreground transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span className="hidden sm:inline text-sm">Mi ubicacion</span>
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Map */}
          <div className="relative border-2 border-border">
            {isLoading && (
              <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-foreground border-t-transparent animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Cargando mapa...</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="h-[250px] w-full" />
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Haz clic en el mapa o arrastra el marcador para seleccionar
          </p>
        </>
      ) : (
        /* Manual Address Form */
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Calle *</label>
              <div className="border-2 border-border">
                <input
                  type="text"
                  placeholder="Av. Insurgentes Sur"
                  value={manualAddress.street}
                  onChange={(e) => handleManualAddressChange('street', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent focus:outline-none text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Numero *</label>
              <div className="border-2 border-border">
                <input
                  type="text"
                  placeholder="123"
                  value={manualAddress.number}
                  onChange={(e) => handleManualAddressChange('number', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Colonia *</label>
              <div className="border-2 border-border">
                <input
                  type="text"
                  placeholder="Roma Norte"
                  value={manualAddress.colony}
                  onChange={(e) => handleManualAddressChange('colony', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent focus:outline-none text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ciudad *</label>
              <div className="border-2 border-border">
                <input
                  type="text"
                  placeholder="Ciudad de Mexico"
                  value={manualAddress.city}
                  onChange={(e) => handleManualAddressChange('city', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Codigo Postal</label>
              <div className="border-2 border-border">
                <input
                  type="text"
                  placeholder="06700"
                  value={manualAddress.postalCode}
                  onChange={(e) => handleManualAddressChange('postalCode', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent focus:outline-none text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Referencias</label>
              <div className="border-2 border-border">
                <input
                  type="text"
                  placeholder="Entre calle X y Y"
                  value={manualAddress.references}
                  onChange={(e) => handleManualAddressChange('references', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            * Campos requeridos para la entrega
          </p>
        </div>
      )}
    </div>
  )
}
