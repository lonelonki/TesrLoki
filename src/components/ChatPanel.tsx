import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Code,
  FileCode,
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  codeSnippets?: CodeSnippet[];
}

interface CodeSnippet {
  code: string;
  language: string;
  fileName?: string;
}

interface ChatPanelProps {
  apiKey?: string;
  selectedModel?: string;
  onCodeGenerated?: (code: string, fileName?: string) => void;
  onCodeAnalysisRequested?: (code: string) => void;
  currentCode?: string;
  currentFileName?: string;
}

type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

export default function ChatPanel({
  apiKey = "",
  selectedModel = "gemini-2.0-pro-exp-02-05",
  onCodeGenerated = () => {},
  onCodeAnalysisRequested = () => {},
  currentCode = "",
  currentFileName = "App.jsx",
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Привет! Я ИИ-ассистент для создания веб-сайтов. Опишите, какой сайт вы хотите создать, и я помогу вам с кодом.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to call Gemini API
  const callGeminiAPI = async (prompt: string): Promise<string> => {
    if (!apiKey) {
      throw new Error(
        "API ключ не указан. Пожалуйста, добавьте API ключ в настройках.",
      );
    }

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API Error: ${errorData.error?.message || response.statusText}`,
        );
      }

      const data = (await response.json()) as GeminiResponse;
      return (
        data.candidates[0]?.content.parts[0]?.text ||
        "Извините, не удалось получить ответ от API."
      );
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  };

  // Extract code snippets from AI response
  const extractCodeSnippets = (
    text: string,
  ): { content: string; snippets: CodeSnippet[] } => {
    const codeBlockRegex = /```([\w-]+)?\n([\s\S]*?)```/g;
    const snippets: CodeSnippet[] = [];
    let modifiedContent = text;

    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1]?.trim() || "text";
      const code = match[2];

      // Try to extract filename from comments at the beginning of the code
      let fileName;
      const fileNameMatch =
        code.match(/^\/\/\s*([\w.-]+\.\w+)/m) ||
        code.match(/^#\s*([\w.-]+\.\w+)/m) ||
        code.match(/^\s*\/\*\s*([\w.-]+\.\w+)\s*\*\//m);

      if (fileNameMatch) {
        fileName = fileNameMatch[1];
      } else if (language === "jsx" || language === "tsx") {
        // Try to infer filename from component name for React components
        const componentNameMatch =
          code.match(/function\s+([A-Z][\w]+)\s*\(/) ||
          code.match(/class\s+([A-Z][\w]+)\s+extends/) ||
          code.match(/const\s+([A-Z][\w]+)\s*=\s*\(/);
        if (componentNameMatch) {
          fileName = `${componentNameMatch[1]}.${language}`;
        }
      }

      // If we still don't have a filename but have a language, create a generic one
      if (!fileName && language && language !== "text") {
        fileName = `code.${language}`;
      }

      snippets.push({ code, language, fileName });
    }

    return { content: modifiedContent, snippets };
  };

  // Process AI response
  const processAIResponse = async (userMessage: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare context for the AI
      let prompt = userMessage;

      // Add current code context if available and relevant
      if (
        currentCode &&
        (userMessage.toLowerCase().includes("код") ||
          userMessage.toLowerCase().includes("исправ") ||
          userMessage.toLowerCase().includes("анализ") ||
          userMessage.toLowerCase().includes("добав") ||
          userMessage.toLowerCase().includes("создай") ||
          userMessage.toLowerCase().includes("сделай"))
      ) {
        prompt += `\n\nТекущий код (${currentFileName}):\n\`\`\`${currentFileName.split(".").pop()}\n${currentCode}\n\`\`\``;
      }

      // Add instruction for code generation
      prompt +=
        "\n\nЕсли ты генерируешь код, пожалуйста, используй формат ```язык\n// имя_файла.расширение\nкод\n``` чтобы я мог определить язык и имя файла. Пожалуйста, предоставь полный код компонента или файла, а не только изменения.";

      // Call API
      const aiResponse = await callGeminiAPI(prompt);

      // Extract code snippets
      const { content, snippets } = extractCodeSnippets(aiResponse);

      // Add response to messages
      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
        codeSnippets: snippets,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If there are code snippets, pass the first one to the code editor
      if (snippets.length > 0) {
        // Add visual feedback that code is being applied
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Применяю код в редактор: ${snippets[0].fileName || currentFileName}`,
            timestamp: new Date(),
          },
        ]);

        // Apply the code to the editor
        onCodeGenerated(snippets[0].code, snippets[0].fileName);
      }

      // If user asked for code analysis
      if (userMessage.toLowerCase().includes("анализ") && currentCode) {
        onCodeAnalysisRequested(currentCode);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Произошла неизвестная ошибка",
      );

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Ошибка: ${error instanceof Error ? error.message : "Произошла неизвестная ошибка"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    await processAIResponse(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle code snippet click
  const handleCodeSnippetClick = (snippet: CodeSnippet) => {
    onCodeGenerated(snippet.code, snippet.fileName);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-950 to-purple-950 border border-blue-500/30 rounded-md overflow-hidden">
      <div className="p-3 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-blue-500/30 flex items-center justify-between">
        <div className="flex items-center">
          <Bot className="h-5 w-5 text-blue-400 mr-2" />
          <h2 className="text-lg font-medium text-blue-300">Чат с ИИ</h2>
        </div>

        {!apiKey && (
          <div className="flex items-center text-amber-400 text-xs">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>API ключ не указан</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-600/70 text-white"
                    : "bg-purple-900/70 text-blue-100 border border-blue-500/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    {message.role === "assistant" ? (
                      <Sparkles className="h-4 w-4 text-blue-400 mr-1" />
                    ) : (
                      <User className="h-4 w-4 text-blue-300 mr-1" />
                    )}
                    <span className="text-xs font-medium">
                      {message.role === "user" ? "Вы" : "ИИ Ассистент"}
                    </span>
                  </div>
                  {message.timestamp && (
                    <span className="text-xs opacity-70 ml-2">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-wrap">
                  {message.content.split("```").map((part, i) => {
                    if (i % 2 === 0) {
                      return <p key={i}>{part}</p>;
                    } else {
                      const [language, ...codeParts] = part.split("\n");
                      const code = codeParts.join("\n");

                      // Try to extract filename from comments
                      const fileNameMatch =
                        code.match(/^\/\/\s*([\w.-]+\.\w+)/m) ||
                        code.match(/^#\s*([\w.-]+\.\w+)/m);
                      const fileName = fileNameMatch
                        ? fileNameMatch[1]
                        : undefined;

                      return (
                        <div
                          key={i}
                          className="my-2 bg-blue-950/80 p-2 rounded border border-blue-500/30 overflow-x-auto relative group"
                        >
                          {fileName && (
                            <div className="text-xs text-blue-400 mb-1 font-mono">
                              {fileName}
                            </div>
                          )}
                          <pre>
                            <code>{code}</code>
                          </pre>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="absolute top-2 right-2 p-1 rounded-md bg-blue-800/50 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    handleCodeSnippetClick({
                                      code,
                                      language,
                                      fileName,
                                    })
                                  }
                                >
                                  <FileCode className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Использовать этот код</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-purple-900/70 text-blue-100 border border-blue-500/30">
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 text-blue-400 mr-1" />
                  <span className="text-xs font-medium">ИИ Ассистент</span>
                </div>
                <div className="mt-1 flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-150"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
              <div className="max-w-[80%] p-2 rounded-lg bg-red-900/50 text-red-200 border border-red-500/30 text-xs flex items-center">
                <AlertCircle className="h-4 w-4 mr-1 text-red-400" />
                {error}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-blue-500/30 bg-blue-900/20">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            className="flex-grow bg-blue-950/50 border-blue-500/30 text-blue-100 placeholder:text-blue-400/50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
