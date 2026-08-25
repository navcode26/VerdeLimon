import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatMoney = (value: number, currencySymbol: string = "$"): string => {
  if (typeof value !== "number" || isNaN(value)) return `${currencySymbol}0`;
  return `${currencySymbol}${value.toLocaleString("es-AR")}`;
};

/**
 * Normaliza números de teléfono para enlaces de WhatsApp (ej. wa.me).
 * Limpia caracteres no numéricos y asegura el código de país.
 */
export function normalizeWhatsAppNumber(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");

  // Si comienza con 0, remover el cero inicial (ej. 0341 -> 341)
  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }

  // Si no tiene código de país (ej. 10 dígitos en Argentina: 3411234567)
  if (digits.length === 10) {
    return `549${digits}`;
  }

  // Si tiene código de Argentina 54 pero le falta el 9 móvil (ej. 543411234567 - 12 dígitos)
  if (digits.startsWith("54") && !digits.startsWith("549") && digits.length === 12) {
    return `549${digits.substring(2)}`;
  }

  return digits;
}

