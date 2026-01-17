export type PlataformaDelivery = 'Uber Eats' | 'Glovo' | 'Just Eat' | 'Propio';

export interface DeliveryOrder {
  id: string;
  plataforma: PlataformaDelivery;
  fecha: string;
  ventasBrutas: number;
  comisionPct: number;
  comisionImporte: number;
  ingresoNeto: number;
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryFormData {
  plataforma: PlataformaDelivery;
  fecha: string;
  ventasBrutas: number;
  comisionPct: number;
  notas: string;
}

export interface DeliveryStats {
  totalVentas: number;
  totalComisiones: number;
  ingresoNeto: number;
  ordenesTotales: number;
  ticketPromedio: number;
}
