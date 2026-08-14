import { Badge } from '../../src/Design System'
import './ShipmentList.css'

export type ShipmentStatus = 'Delivered' | 'In Transit' | 'Delayed' | 'RTO'

export interface Shipment {
  awb: string
  destination: string
  courier: string
  status: ShipmentStatus
  priority?: boolean
  courierOnline?: boolean
  /** Supporting copy for a critical state; a badge is never the only signal for one. */
  note?: string
}

export interface ShipmentListProps {
  shipments: Shipment[]
  isLoading: boolean
}

type BadgeVariant = 'success' | 'info' | 'warning' | 'error'

const STATUS_VARIANT: Record<ShipmentStatus, BadgeVariant> = {
  Delivered: 'success',
  'In Transit': 'info',
  Delayed: 'warning',
  RTO: 'error',
}

export const sampleShipments: Shipment[] = [
  {
    awb: '2913470085',
    destination: 'Bengaluru',
    courier: 'Rakesh Menon',
    status: 'Delivered',
  },
  {
    awb: '2913470112',
    destination: 'Pune',
    courier: 'Anita Deshmukh',
    status: 'Delivered',
    priority: true,
  },
  {
    awb: '2913470148',
    destination: 'Ahmedabad',
    courier: 'Imran Qureshi',
    status: 'Delivered',
  },
  {
    awb: '2913470203',
    destination: 'Jaipur',
    courier: 'Sunita Rawat',
    status: 'In Transit',
    courierOnline: true,
  },
  {
    awb: '2913470266',
    destination: 'Guwahati',
    courier: 'Deepak Barman',
    status: 'Delayed',
    priority: true,
    note: 'Held at Guwahati hub since 06:40 — reattempt scheduled today.',
  },
  {
    awb: '2913470319',
    destination: 'Lucknow',
    courier: 'Farhan Ali',
    status: 'RTO',
    note: 'Consignee refused delivery; parcel is on its way back to origin.',
  },
]

export function ShipmentList({ shipments, isLoading }: ShipmentListProps) {
  return (
    <section className="shipment-list" aria-busy={isLoading}>
      <h2 className="shipment-list__title">Shipments</h2>

      <p className="shipment-list__status-region" role="status">
        {isLoading ? 'Loading shipment statuses' : 'Shipment statuses updated'}
      </p>

      <ul className="shipment-list__rows">
        {shipments.map((shipment) => (
          <li className="shipment-list__row" key={shipment.awb}>
            <div className="shipment-list__cell shipment-list__cell--awb">
              <span className="shipment-list__awb">{shipment.awb}</span>
              {shipment.priority ? (
                <Badge variant="black" type="subtle" size="small" label="Priority" />
              ) : null}
            </div>

            <div className="shipment-list__cell">
              <span className="shipment-list__destination">{shipment.destination}</span>
            </div>

            <div className="shipment-list__cell shipment-list__cell--courier">
              <span className="shipment-list__courier">{shipment.courier}</span>
              {shipment.courierOnline ? (
                <Badge variant="coal" type="subtle" size="small" statusDot label="Online" />
              ) : null}
            </div>

            <div className="shipment-list__cell shipment-list__cell--status">
              {isLoading ? (
                <Badge type="ghost" size="small" label="Loading" />
              ) : (
                <>
                  <Badge
                    variant={STATUS_VARIANT[shipment.status]}
                    type="subtle"
                    size="small"
                    label={shipment.status}
                  />
                  {shipment.note ? (
                    <span className="shipment-list__note">{shipment.note}</span>
                  ) : null}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
