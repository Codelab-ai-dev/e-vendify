// ============================================================================
// E-VENDIFY: WhatsApp QR Code Generator
// GET /api/stores/[storeId]/whatsapp-qr
// Genera información del QR code para vincular clientes a una tienda
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+13854549920';

// ============================================================================
// GET - Obtener datos del QR
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

    // Buscar tienda por ID o slug
    const { data: store, error } = await supabase
      .from('stores')
      .select('id, name, slug, whatsapp_code, logo_url')
      .or(`id.eq.${storeId},slug.eq.${storeId}`)
      .eq('is_active', true)
      .single();

    if (error || !store) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    // Si no tiene código, generar uno
    if (!store.whatsapp_code) {
      const newCode = generateStoreCode();

      const { error: updateError } = await supabase
        .from('stores')
        .update({ whatsapp_code: newCode })
        .eq('id', store.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Error generando código' },
          { status: 500 }
        );
      }

      store.whatsapp_code = newCode;
    }

    // Formatear número de WhatsApp (sin + para wa.me)
    const whatsappNumber = TWILIO_WHATSAPP_NUMBER.replace('+', '');

    // Construir URLs
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${store.whatsapp_code}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(whatsappLink)}`;

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        logoUrl: store.logo_url,
      },
      whatsapp: {
        code: store.whatsapp_code,
        number: TWILIO_WHATSAPP_NUMBER,
        link: whatsappLink,
        qrCodeUrl,
        qrCodeSvg: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=svg&data=${encodeURIComponent(whatsappLink)}`,
      },
      instructions: {
        es: [
          'Imprime el código QR y colócalo en tu local',
          'Compártelo en tus redes sociales',
          'Agrégalo a tu página web',
          'Los clientes escanean el QR y automáticamente se conectan contigo',
        ],
      },
    });
  } catch (error) {
    console.error('[WhatsApp QR] Error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Regenerar código (por si quieren uno nuevo)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

    // Generar nuevo código
    const newCode = generateStoreCode();

    const { data, error } = await supabase
      .from('stores')
      .update({ whatsapp_code: newCode })
      .eq('id', storeId)
      .select('id, name, whatsapp_code')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Error actualizando código' },
        { status: 500 }
      );
    }

    const whatsappNumber = TWILIO_WHATSAPP_NUMBER.replace('+', '');
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${newCode}`;

    return NextResponse.json({
      message: 'Código regenerado exitosamente',
      store: {
        id: data.id,
        name: data.name,
      },
      whatsapp: {
        code: newCode,
        link: whatsappLink,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(whatsappLink)}`,
      },
    });
  } catch (error) {
    console.error('[WhatsApp QR] Error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// Función auxiliar para generar código
// ============================================================================

function generateStoreCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';

  let code = '';

  // 3 letras
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // 3 números
  for (let i = 0; i < 3; i++) {
    code += nums.charAt(Math.floor(Math.random() * nums.length));
  }

  return code;
}
