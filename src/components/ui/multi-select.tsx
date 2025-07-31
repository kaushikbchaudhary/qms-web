// components/ui/multi-select.tsx
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    selected: string | string[];
    onChange: (value: string | string[]) => void;
    className?: string;
    placeholder?: string;
}

export function MultiSelect({
                                options,
                                selected,
                                onChange,
                                className,
                                placeholder = "Select options...",
                            }: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (optionValue: string) => {
        if (Array.isArray(selected)) {
            if (selected.includes(optionValue)) {
                onChange(selected.filter((v) => v !== optionValue));
            } else {
                onChange([...selected, optionValue]);
            }
        } else {
            onChange([optionValue]);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`w-full justify-between ${className}`}
                >
                    <div className="flex gap-1 flex-wrap">
                        {Array.isArray(selected) && selected.length > 0 ? (
                            selected.map((value) => {
                                const option = options.find((o) => o.value === value);
                                return (
                                    <Badge key={value} variant="secondary">
                                        {option?.label}
                                    </Badge>
                                );
                            })
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search options..." />
                    <CommandEmpty>No option found.</CommandEmpty>
                    <CommandGroup>
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                onSelect={() => handleSelect(option.value)}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        (Array.isArray(selected)
                                                ? selected.includes(option.value)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                : selected === option.value
                                                    ? "opacity-100"
                                                    : "opacity-0")
                                        )}
                                />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}