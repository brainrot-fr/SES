import { useState } from "react";
import { Button } from "../../components/shadcn/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/shadcn/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/shadcn/popover";
import { Check, ChevronsUpDown } from "lucide-react";

export default function AccountCountryPicker({
  id = "account-country",
  options,
  value,
  onChange,
  disabled,
  label,
  placeholder,
  searchPlaceholder,
  noResults,
}) {
  const [open, setOpen] = useState(false);
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;

  return (
    <>
      <span className="account-onboarding__label" id={labelId}>{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full justify-between"
            aria-labelledby={labelId}
            aria-describedby={helpId}
            disabled={disabled}
          >
            {options.find(({ code }) => code === value)?.name || placeholder}
            <ChevronsUpDown className="ms-2 size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(250px,calc(100vw-2rem))] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{noResults}</CommandEmpty>
              <CommandGroup>
                {options.map(({ code, name }) => (
                  <CommandItem
                    key={code}
                    value={name}
                    onSelect={() => {
                      onChange(code);
                      setOpen(false);
                    }}
                  >
                    <Check className={value === code ? "opacity-100" : "opacity-0"} />
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
