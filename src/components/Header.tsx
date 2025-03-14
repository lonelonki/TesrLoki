import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Sparkles, Code, Play, Settings, Info } from "lucide-react";

interface HeaderProps {
  onApiKeyChange?: (key: string) => void;
  onModelChange?: (model: string) => void;
  apiKey?: string;
  selectedModel?: string;
}

export default function Header({
  onApiKeyChange = () => {},
  onModelChange = () => {},
  apiKey = "",
  selectedModel = "gemini-2.0-pro-exp-02-05",
}: HeaderProps) {
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  const handleSaveApiKey = () => {
    onApiKeyChange(localApiKey);
    setIsApiDialogOpen(false);
  };

  return (
    <header className="w-full h-14 bg-gradient-to-r from-blue-950/90 to-purple-950/90 border-b border-blue-500/30 backdrop-blur-sm flex items-center justify-between px-4 shadow-lg shadow-blue-900/20">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-400" />
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          ИИ Генератор Сайтов
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-500/30 bg-blue-950/50 hover:bg-blue-900/50 text-blue-300"
                onClick={() => setIsApiDialogOpen(true)}
              >
                <Settings className="h-4 w-4 mr-1" />
                API Ключ
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Настроить API ключ для Gemini</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[240px] border-blue-500/30 bg-blue-950/50 text-blue-300">
            <SelectValue placeholder="Выберите модель" />
          </SelectTrigger>
          <SelectContent className="bg-blue-950 border-blue-500/30">
            <SelectItem
              value="gemini-2.0-pro-exp-02-05"
              className="text-blue-300 hover:bg-blue-900/50"
            >
              Gemini 2.0 Pro
            </SelectItem>
            <SelectItem
              value="gemini-2.0-flash-thinking-exp-01-21"
              className="text-blue-300 hover:bg-blue-900/50"
            >
              Gemini 2.0 Flash
            </SelectItem>
          </SelectContent>
        </Select>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-500/30 bg-blue-950/50 hover:bg-blue-900/50 text-blue-300"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Справка по использованию</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
        <DialogContent className="bg-blue-950 border-blue-500/30 text-blue-100">
          <DialogHeader>
            <DialogTitle className="text-blue-300">
              Настройка API ключа
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-blue-300">
                API ключ Gemini
              </Label>
              <Input
                id="api-key"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Введите ваш API ключ"
                className="border-blue-500/30 bg-blue-900/30 text-blue-100"
              />
            </div>
            <Button
              onClick={handleSaveApiKey}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
