import { Metadata } from "next"
import StoreClient from "./StoreClient"
import { supabase } from "@/lib/supabase"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

interface Props {
  params: {
    storeId: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeId } = params

  // Fetch store data for metadata
  let query = supabase
    .from('stores')
    .select('business_name, description, logo_url')
    .eq('is_active', true)

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId)

  if (isUuid) {
    query = query.eq('id', storeId)
  } else {
    query = query.eq('slug', storeId)
  }

  const { data: store } = await query.single()

  if (!store) {
    return {
      title: 'Tienda no encontrada | E-Vendify',
      description: 'La tienda que buscas no está disponible.',
    }
  }

  return {
    title: `${store.business_name} | E-Vendify`,
    description: store.description || `Visita la tienda de ${store.business_name} en E-Vendify.`,
    openGraph: {
      title: store.business_name || 'Tienda E-Vendify',
      description: store.description || `Visita la tienda de ${store.business_name} en E-Vendify.`,
      images: store.logo_url ? [store.logo_url] : [],
    },
  }
}

export default function StorePage() {
  return <StoreClient />
}
