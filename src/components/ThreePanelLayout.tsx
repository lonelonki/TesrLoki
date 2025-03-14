import { useState, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ChatPanel from "./ChatPanel";
import CodeEditorPanel from "./CodeEditorPanel";
import PreviewPanel from "./PreviewPanel";
import Header from "./Header";
import { FileNode } from "../types/editor";

export default function ThreePanelLayout() {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    "gemini-2.0-pro-exp-02-05",
  );
  const [code, setCode] = useState("");
  const [currentFileName, setCurrentFileName] = useState("App.jsx");
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);

  const handleCodeGenerated = (generatedCode: string, fileName?: string) => {
    setCode(generatedCode);
    if (fileName) {
      setCurrentFileName(fileName);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleRunCode = () => {
    // Create a visual feedback that code is running
    const previewPanel = document.querySelector(".preview-panel");
    if (previewPanel) {
      const overlay = document.createElement("div");
      overlay.className =
        "absolute inset-0 bg-blue-950/80 flex items-center justify-center z-10 run-overlay";
      overlay.innerHTML = `
        <div class="flex flex-col items-center">
          <svg class="animate-spin h-8 w-8 text-blue-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-blue-300">Запуск кода...</p>
        </div>
      `;

      // Remove any existing overlay
      const existingOverlay = previewPanel.querySelector(".run-overlay");
      if (existingOverlay) {
        existingOverlay.remove();
      }

      previewPanel.appendChild(overlay);

      // Remove the overlay after a short delay
      setTimeout(() => {
        overlay.remove();
      }, 1500);
    }
  };

  const togglePreviewFullscreen = () => {
    setIsPreviewFullscreen(!isPreviewFullscreen);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-950 to-purple-950">
      <Header
        apiKey={apiKey}
        selectedModel={selectedModel}
        onApiKeyChange={setApiKey}
        onModelChange={setSelectedModel}
      />

      <div className="flex-grow overflow-hidden p-4">
        {isPreviewFullscreen ? (
          <div className="w-full h-full">
            <PreviewPanel
              code={code}
              isFullscreen={true}
              onToggleFullscreen={togglePreviewFullscreen}
            />
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={25} minSize={20}>
              <ChatPanel
                apiKey={apiKey}
                selectedModel={selectedModel}
                onCodeGenerated={handleCodeGenerated}
                currentCode={code}
                currentFileName={currentFileName}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={40} minSize={30}>
              <CodeEditorPanel
                initialCode={code}
                onCodeChange={handleCodeChange}
                onRunCode={handleRunCode}
                onFileStructureChange={setFileStructure}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={35} minSize={25}>
              <PreviewPanel
                code={code}
                isFullscreen={false}
                onToggleFullscreen={togglePreviewFullscreen}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
