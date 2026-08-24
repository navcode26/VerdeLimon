import { AdminDashboard } from "@/components/admin-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de Administración | Verde Limón Bakery",
  description: "Gestión de catálogo, productos y pedidos para Verde Limón Bakery.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
