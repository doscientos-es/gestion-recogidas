import {
  Badge,
  Button,
  Card,
  CardContent,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@doscientos/ui'
import { ArrowUpRight, CheckCircle2, CloudUpload, FileText } from 'lucide-react'

import { useOperations } from '../application/operations-context'
import { formatMoney } from '../application/workflow'
import { StatusBadge } from './status-badge'

export function BillingPage() {
  const { state, invoice } = useOperations()
  const orders = state.orders.filter((order) => ['completed', 'invoiced'].includes(order.status))
  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Facturación</PageHeaderTitle>
          <PageHeaderDescription>
            Viajes completados y preparados para el sistema contable.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <a className="action-link" href="https://kabiku.es" target="_blank" rel="noreferrer">
          Abrir Kabiku <ArrowUpRight aria-hidden />
        </a>
      </PageHeader>
      <Card className="kabiku-banner">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="integration-logo">K</div>
            <div>
              <p className="font-semibold">Conexión con Kabiku</p>
              <p className="text-muted-foreground text-sm">
                Flujo visual preparado; falta validar credenciales y contrato de la API.
              </p>
            </div>
          </div>
          <Badge variant="warning">Integración visual</Badge>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <div className="bg-muted flex size-11 items-center justify-center rounded-xl">
                <FileText aria-hidden className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{order.reference}</p>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {order.customer} · {order.pickupCity} → {order.deliveryCity}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:justify-end">
                <p className="font-semibold tabular-nums">{formatMoney(order.amountCents)}</p>
                {order.kabikuState === 'synced' ? (
                  <span className="text-success flex items-center gap-1 text-sm">
                    <CheckCircle2 aria-hidden className="size-4" />
                    Preparado
                  </span>
                ) : (
                  <Button onPress={() => invoice(order.id)}>
                    <CloudUpload aria-hidden />
                    Preparar en Kabiku
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
