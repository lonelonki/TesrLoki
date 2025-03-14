import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PreviewPanelProps {
  code?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function PreviewPanel({
  code = "",
  isFullscreen = false,
  onToggleFullscreen = () => {},
}: PreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateHTML = (code: string) => {
    // Extract CSS if it exists in the code
    let cssContent = "";
    const cssMatch = code.match(/import ['"]\.\/(.*\.css)['"];/);
    if (cssMatch && cssMatch[1]) {
      const cssFileName = cssMatch[1];
      // Find the CSS file content in our mock file system
      if (cssFileName === "App.css") {
        cssContent = `.app {
  text-align: center;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}`;
      } else if (cssFileName === "index.css") {
        cssContent = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`;
      }
    }

    // Clean up the React code to make it work in the iframe
    let jsContent = code
      .replace(/import React from ["'](react|react)["'];\n?/g, "")
      .replace(/import ReactDOM from ["'](react-dom|react-dom)["'];\n?/g, "")
      .replace(/import ["']\.\/(.*\.css)["'];\n?/g, "")
      .replace(/import App from ["']\.\/(App|\.\/App)["'];\n?/g, "")
      .replace(/ReactDOM\.createRoot\(.*\)\.render\(.*\);/gs, "")
      .replace(/export default (\w+);/, "const App = $1;");

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Предпросмотр</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${jsContent}
    
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  </script>
</body>
</html>
`;
  };

  const refreshPreview = () => {
    setIsLoading(true);

    if (iframeRef.current) {
      // Create a blob URL from the HTML content
      const html = generateHTML(code);
      const blob = new Blob([html], { type: "text/html" });
      const blobURL = URL.createObjectURL(blob);

      // Set the iframe src to the blob URL
      iframeRef.current.src = blobURL;

      // Clean up the blob URL when the iframe loads
      iframeRef.current.onload = () => {
        URL.revokeObjectURL(blobURL);
        setIsLoading(false);
      };
    } else {
      // Fallback if iframe ref is not available
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    refreshPreview();
  }, [code]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-950 to-purple-950 border border-blue-500/30 rounded-md overflow-hidden">
      <div className="p-3 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-blue-500/30 flex items-center justify-between">
        <div className="flex items-center">
          <Eye className="h-5 w-5 text-blue-400 mr-2" />
          <h2 className="text-lg font-medium text-blue-300">Предпросмотр</h2>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Open preview in new window
                    const html = generateHTML(code);
                    const blob = new Blob([html], { type: "text/html" });
                    const blobURL = URL.createObjectURL(blob);
                    window.open(blobURL, "_blank");
                  }}
                  className="border-blue-500/30 bg-blue-950/50 hover:bg-blue-900/50 text-blue-300"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Открыть в новом окне</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshPreview}
                  className="border-blue-500/30 bg-blue-950/50 hover:bg-blue-900/50 text-blue-300"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Обновить</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggleFullscreen}
                  className="border-blue-500/30 bg-blue-950/50 hover:bg-blue-900/50 text-blue-300"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullscreen ? "Свернуть" : "На весь экран"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex-grow relative bg-white">
        {isLoading && (
          <div className="absolute inset-0 bg-blue-950/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mb-2" />
              <p className="text-blue-300">Загрузка предпросмотра...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          title="preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          onError={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
