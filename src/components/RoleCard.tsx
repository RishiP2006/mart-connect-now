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
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0" />
      <CardHeader>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
          <Icon className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              {feature}
            </li>
          ))}
        </ul>
        <Button 
          onClick={onSelect}
          className="w-full transition-all hover:scale-105"
          size="lg"
        >
          Get Started as {title}
        </Button>
      </CardContent>
    </Card>
  );
};