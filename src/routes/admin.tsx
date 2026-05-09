import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Inbox, TrendingUp, Users, DollarSign } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Adminpanel — Din Webbpartner" }] }),
  component: Admin,
});

type Order = {
  id: string;
  foretagsnamn: string;
  namn: string;
  epost: string;
  typ: string;
  total: number;
  datum: string;
};

const demoOrders: Order[] = [
  { id: "ORD-A1B2C3", foretagsnamn: "Café Lyckan", namn: "Anna Lind", epost: "anna@cafelyckan.se", typ: "restaurang", total: 538.9, datum: new Date(Date.now() - 86400000).toISOString() },
  { id: "ORD-D4E5F6", foretagsnamn: "NorrBygg AB", namn: "Markus Berg", epost: "markus@norrbygg.se", typ: "tjanst", total: 499, datum: new Date(Date.now() - 172800000).toISOString() },
  { id: "ORD-G7H8I9", foretagsnamn: "Yoga med Lina", namn: "Lina Sjö", epost: "lina@yoga.se", typ: "privatperson", total: 538.9, datum: new Date(Date.now() - 259200000).toISOString() },
];

function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("dwp-orders") || "[]");
    setOrders([...local.reverse(), ...demoOrders]);
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const stats = [
    { icon: Inbox, label: "Beställningar", value: orders.length },
    { icon: Users, label: "Aktiva kunder", value: orders.length + 12 },
    { icon: DollarSign, label: "Intäkter (USD)", value: totalRevenue.toFixed(0) },
    { icon: TrendingUp, label: "Tillväxt", value: "+24%" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Adminpanel</h1>
              <p className="text-muted-foreground mt-1">Översikt över beställningar och kunder.</p>
            </div>
            <Badge variant="secondary" className="rounded-full">Demo</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map(({ icon: Icon, label, value }) => (
              <Card key={label} className="border-border/60">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Senaste beställningar</h2>
                <Button size="sm" variant="outline">Exportera</Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Företag</TableHead>
                      <TableHead>Kund</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead className="text-right">Belopp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o, i) => (
                      <TableRow key={o.id + i}>
                        <TableCell className="font-mono text-xs">{o.id}</TableCell>
                        <TableCell className="font-medium">{o.foretagsnamn}</TableCell>
                        <TableCell className="text-muted-foreground">{o.namn}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{o.typ}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(o.datum).toLocaleDateString("sv-SE")}
                        </TableCell>
                        <TableCell className="text-right">{o.total?.toFixed(2)} USD</TableCell>
                        <TableCell>
                          <Badge variant={i === 0 ? "default" : "secondary"} className="rounded-full">
                            {i === 0 ? "Ny" : i < 3 ? "Pågår" : "Levererad"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
