import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@doscientos/ui'
import { Phone } from 'lucide-react'

import { useOperations } from '../application/operations-context'

export function DriversPage() {
  const { state } = useOperations()
  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Conductores</PageHeaderTitle>
          <PageHeaderDescription>
            Gestiona los conductores. Solo necesitamos su teléfono para avisarles por WhatsApp.
          </PageHeaderDescription>
        </PageHeaderHeading>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.drivers.map((driver) => (
          <Card key={driver.id}>
            <CardHeader>
              <CardTitle>{driver.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <a className="flex items-center gap-2 text-sm" href={`tel:${driver.phone}`}>
                <Phone className="size-4" />
                {driver.phone}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
