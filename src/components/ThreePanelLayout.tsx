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
    // This would trigger a refresh of the preview
    // In our case, the preview already updates when code changes
    // But in a real app, you might want to have a manual refresh option
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
