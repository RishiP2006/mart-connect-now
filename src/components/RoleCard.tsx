import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  onSelect: () => void;
}

export const RoleCard = ({ title, description, icon: Icon, features, onSelect }: RoleCardProps) => {
  // Different color schemes for each role
  const colorSchemes = {
    Customer: { gradient: 'from-primary/10 to-primary/5', icon: 'bg-primary/10 text-primary group-hover:bg-primary', dot: 'bg-primary' },
    Retailer: { gradient: 'from-secondary/10 to-secondary/5', icon: 'bg-secondary/10 text-secondary group-hover:bg-secondary', dot: 'bg-secondary' },
    Wholesaler: { gradient: 'from-accent/10 to-accent/5', icon: 'bg-accent/10 text-accent group-hover:bg-accent', dot: 'bg-accent' },
  };
  
  const scheme = colorSchemes[title as keyof typeof colorSchemes] || colorSchemes.Customer;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:-translate-y-1 border-2 hover:border-primary/30">
      <div className={`absolute inset-0 bg-gradient-to-br ${scheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0`} />
      <CardHeader className="relative z-10">
        <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${scheme.icon} group-hover:text-primary-foreground group-hover:scale-110 transition-all shadow-sm`}>
          <Icon className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`h-1.5 w-1.5 rounded-full ${scheme.dot} group-hover:scale-125 transition-transform`} />
              {feature}
            </li>
          ))}
        </ul>
        <Button 
          onClick={onSelect}
          className="w-full transition-all hover:scale-105 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg"
          size="lg"
        >
          Get Started as {title}
        </Button>
      </CardContent>
    </Card>
  );
};