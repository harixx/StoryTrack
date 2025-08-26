import { useState } from "react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "data-testid"?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter text...",
  "data-testid": testId
}: RichTextEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-slate-300 rounded-lg">
      <div className="border-b border-slate-300 p-3 bg-slate-50">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8"
            data-testid={testId ? `${testId}-bold` : "editor-bold"}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8"
            data-testid={testId ? `${testId}-italic` : "editor-italic"}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8"
            data-testid={testId ? `${testId}-underline` : "editor-underline"}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-slate-300"></div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8"
            data-testid={testId ? `${testId}-ul` : "editor-ul"}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8"
            data-testid={testId ? `${testId}-ol` : "editor-ol"}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="border-0 resize-none focus:ring-0 focus:border-0 rounded-t-none"
        data-testid={testId}
      />
    </div>
  );
}
