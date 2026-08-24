export interface Product {
  id: string;
  nombre: string;
  costoProv: number;
  margen: number;
  precioVenta: number;
  stock: number;
  emoji: string;
}

export interface SaleItem {
  uid: string;
  productoId: string;
  nombre: string;
  emoji: string;
  gramos: number;
  costoProvUnit: number;
  precioVentaUnit: number;
  subtotal: number;
  costoTotal: number;
}

export interface Sale {
  id: string;
  fecha: number;
  items: SaleItem[];
  total: number;
  ganancia: number;
  totalGramos: number;
}

export interface Expense {
  id: string;
  fecha: number;
  concepto: string;
  monto: number;
}

export interface Merma {
  id: string;
  fecha: number;
  productoId: string;
  nombre: string;
  kg: number;
  motivo: string;
}

export interface BoxType {
  id: string;
  precio: number;
  espacios: number;
  color: string;
  label: string;
}
