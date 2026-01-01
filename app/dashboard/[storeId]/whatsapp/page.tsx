'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCw, Copy, Check, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface WhatsAppQRData {
  store: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  whatsapp: {
    code: string;
    number: string;
    link: string;
    qrCodeUrl: string;
    qrCodeSvg: string;
  };
  instructions: {
    es: string[];
  };
}

export default function WhatsAppConfigPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;

  const [data, setData] = useState<WhatsAppQRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchQRData();
  }, [storeId]);

  const fetchQRData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeId}/whatsapp-qr`);
      if (!response.ok) throw new Error('Error cargando datos');
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const regenerateCode = async () => {
    try {
      setRegenerating(true);
      const response = await fetch(`/api/stores/${storeId}/whatsapp-qr`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Error regenerando código');
      await fetchQRData();
    } catch (err) {
      setError(String(err));
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadQR = async () => {
    if (!data) return;

    const response = await fetch(data.whatsapp.qrCodeUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-whatsapp-${data.store.slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="border-2 border-destructive bg-destructive/10 text-destructive p-6">
          <p className="font-medium">Error: {error || 'No se pudieron cargar los datos'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-sm underline"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver al dashboard</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl">WhatsApp</h1>
              <p className="text-muted-foreground">Configura WhatsApp para {data.store.name}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* QR Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-border p-8"
          >
            <h2 className="font-display font-bold text-xl mb-6 text-center">Código QR</h2>

            {/* QR Image */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 border-2 border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.whatsapp.qrCodeUrl}
                  alt="WhatsApp QR Code"
                  width={220}
                  height={220}
                />
              </div>
            </div>

            {/* Store Code */}
            <div className="text-center mb-6">
              <p className="label-mono text-muted-foreground mb-2">Código de tienda</p>
              <div className="inline-flex items-center gap-3 bg-muted px-4 py-2">
                <span className="font-mono font-bold text-2xl tracking-wider">
                  {data.whatsapp.code}
                </span>
                <button
                  onClick={() => copyToClipboard(data.whatsapp.code, 'code')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === 'code' ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={downloadQR}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Descargar QR
              </button>

              <button
                onClick={regenerateCode}
                disabled={regenerating}
                className="w-full border-2 border-border hover:border-foreground text-foreground font-medium py-3 px-4 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerando...' : 'Regenerar código'}
              </button>
            </div>
          </motion.div>

          {/* Info Cards */}
          <div className="space-y-6">
            {/* Link directo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border-2 border-border p-6"
            >
              <h3 className="font-display font-bold text-lg mb-4">Link directo</h3>
              <div className="bg-muted p-3 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={data.whatsapp.link}
                  className="flex-1 bg-transparent text-sm text-muted-foreground outline-none font-mono"
                />
                <button
                  onClick={() => copyToClipboard(data.whatsapp.link, 'link')}
                  className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1"
                >
                  {copied === 'link' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Comparte este link en tus redes sociales o página web
              </p>
            </motion.div>

            {/* Instrucciones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border-2 border-border p-6"
            >
              <h3 className="font-display font-bold text-lg mb-4">Cómo usar</h3>
              <ul className="space-y-3">
                {data.instructions.es.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground text-sm">{instruction}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* WhatsApp Number */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border-2 border-green-500 bg-green-500/10 p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="label-mono text-green-600">Número de WhatsApp</p>
                  <p className="font-display font-bold text-xl">{data.whatsapp.number}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
