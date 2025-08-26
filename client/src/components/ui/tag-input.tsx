import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ className, value, onChange, placeholder, maxTags, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    const addTag = (tag: string) => {
      const trimmedTag = tag.trim();
      if (trimmedTag && !value.includes(trimmedTag) && (!maxTags || value.length < maxTags)) {
        onChange([...value, trimmedTag]);
      }
      setInputValue("");
    };

    const removeTag = (tagToRemove: string) => {
      onChange(value.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
        removeTag(value[value.length - 1]);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const paste = e.clipboardData.getData("text");
      const tagsToAdd = paste.split(/[,\n]/).map(tag => tag.trim()).filter(Boolean);
      
      const newTags = [...value];
      tagsToAdd.forEach(tag => {
        if (!newTags.includes(tag) && (!maxTags || newTags.length < maxTags)) {
          newTags.push(tag);
        }
      });
      onChange(newTags);
    };

    return (
      <div className={cn(
        "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}>
        <div className="flex flex-wrap gap-1 mr-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeTag(tag)}
                data-testid={`remove-tag-${tag}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? placeholder : ""}
          className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
          data-testid="tag-input"
          {...props}
        />
      </div>
    );
  }
);

TagInput.displayName = "TagInput";

export { TagInput };