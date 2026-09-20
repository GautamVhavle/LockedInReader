import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils.js';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex gap-1 rounded-lg bg-muted p-1', className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'rounded-md px-3 py-1.5 text-sm text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
