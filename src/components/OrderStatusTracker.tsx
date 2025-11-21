import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Truck, PackageCheck } from "lucide-react";

export type OrderStatus = "pending" | "dispatched" | "on_the_way" | "received";

const steps: {
  key: OrderStatus;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    key: "pending",
    label: "Pending",
    description: "Order placed and awaiting retailer confirmation",
    icon: Circle,
  },
  {
    key: "dispatched",
    label: "Dispatched",
    description: "Retailer confirmed and prepared your package",
    icon: PackageCheck,
  },
  {
    key: "on_the_way",
    label: "On its way",
    description: "Courier picked up the package",
    icon: Truck,
  },
  {
    key: "received",
    label: "Received",
    description: "Order delivered to you",
    icon: CheckCircle2,
  },
];

export const OrderStatusTracker = ({ status }: { status: OrderStatus }) => {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === status)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2",
                    isCompleted
                      ? "border-green-500 bg-green-500/10 text-green-600"
                      : isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p
                    className={cn(
                      "font-semibold",
                      isCompleted || isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="ml-5 hidden h-10 border-l border-dashed border-muted md:block" />
              )}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {steps.map((step, index) => (
          <div
            key={`${step.key}-mobile`}
            className={cn(
              "rounded-lg border p-3 text-sm",
              index <= currentIndex ? "border-primary/50 bg-primary/5" : ""
            )}
          >
            <p className="font-semibold">{step.label}</p>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

