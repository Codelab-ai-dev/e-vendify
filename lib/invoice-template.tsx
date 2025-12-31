import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Registrar fuentes personalizadas (opcional, usa Helvetica por defecto)
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#BFFF00',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBox: {
    width: '48%',
  },
  label: {
    fontSize: 8,
    color: '#999999',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#000000',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    padding: 10,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  colProduct: {
    width: '45%',
  },
  colQty: {
    width: '15%',
    textAlign: 'center',
  },
  colPrice: {
    width: '20%',
    textAlign: 'right',
  },
  colTotal: {
    width: '20%',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#000000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  totalLabel: {
    width: 120,
    textAlign: 'right',
    fontSize: 10,
    color: '#666666',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 10,
    color: '#000000',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#BFFF00',
  },
  grandTotalLabel: {
    width: 120,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  grandTotalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#BFFF00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#000000',
  },
  statusPaid: {
    backgroundColor: '#22c55e',
  },
  statusPending: {
    backgroundColor: '#eab308',
  },
  statusCancelled: {
    backgroundColor: '#ef4444',
  },
})

export interface InvoiceData {
  invoiceNumber: string
  orderDate: string
  paymentDate?: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  store: {
    name: string
    email?: string
    phone?: string
    address?: string
  }
  customer: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  discount?: number
  total: number
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'paid':
    case 'shipped':
    case 'delivered':
      return styles.statusPaid
    case 'cancelled':
      return styles.statusCancelled
    default:
      return styles.statusPending
  }
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{data.store.name}</Text>
            {data.store.email && (
              <Text style={styles.invoiceNumber}>{data.store.email}</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceTitle}>Factura</Text>
            <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.badge, getStatusStyle(data.status), { marginBottom: 20 }]}>
          <Text style={[styles.badgeText, data.status === 'paid' || data.status === 'shipped' || data.status === 'delivered' ? { color: '#ffffff' } : {}]}>
            {STATUS_LABELS[data.status] || data.status}
          </Text>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Facturado a</Text>
            <Text style={styles.value}>{data.customer.name}</Text>
            <Text style={[styles.value, { color: '#666666' }]}>{data.customer.email}</Text>
            {data.customer.phone && (
              <Text style={[styles.value, { color: '#666666' }]}>{data.customer.phone}</Text>
            )}
            {data.customer.address && (
              <Text style={[styles.value, { color: '#666666', marginTop: 4 }]}>{data.customer.address}</Text>
            )}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Detalles</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha de orden:</Text>
              <Text style={styles.value}>{formatDate(data.orderDate)}</Text>
            </View>
            {data.paymentDate && (
              <View style={styles.row}>
                <Text style={styles.label}>Fecha de pago:</Text>
                <Text style={styles.value}>{formatDate(data.paymentDate)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colProduct]}>Producto</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Precio</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {/* Table Rows */}
          {data.items.map((item, index) => (
            <View
              key={index}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.colProduct}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.price)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
          </View>
          {data.discount && data.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Descuento:</Text>
              <Text style={[styles.totalValue, { color: '#22c55e' }]}>-{formatCurrency(data.discount)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total MXN:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(data.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Esta factura fue generada automaticamente por e-vendify
          </Text>
          <Text style={[styles.footerText, { marginTop: 4 }]}>
            {data.store.name} | {data.store.email || ''} {data.store.phone ? `| ${data.store.phone}` : ''}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
