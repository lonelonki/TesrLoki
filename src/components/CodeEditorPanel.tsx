import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  FolderTree,
  Play,
  Download,
  Terminal,
  Plus,
  Trash,
  Save,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface CodeEditorPanelProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  onRunCode?: () => void;
  onExportProject?: () => void;
  onFileStructureChange?: (fileStructure: FileNode[]) => void;
}

export default function CodeEditorPanel({
  initialCode = "",
  onCodeChange = () => {},
  onRunCode = () => {},
  onExportProject = () => {},
  onFileStructureChange = () => {},
}: CodeEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<"code" | "files" | "terminal">(
    "code",
  );
  const [code, setCode] = useState(initialCode);
  const [activeFile, setActiveFile] = useState<string | null>("App.jsx");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "Терминал готов к использованию...",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState<"file" | "folder">("file");
  const [newFilePath, setNewFilePath] = useState("");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [githubRepo, setGithubRepo] = useState("");

  // Sample file structure
  const [fileStructure, setFileStructure] = useState<FileNode[]>([
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "App.jsx",
          type: "file",
          language: "jsx",
          content:
            initialCode ||
            `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app">
      <h1>Добро пожаловать!</h1>
      <p>Начните создавать ваш сайт с помощью ИИ.</p>
    </div>
  );
}

export default App;`,
        },
        {
          name: "App.css",
          type: "file",
          language: "css",
          content: `.app {
  text-align: center;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}`,
        },
        {
          name: "index.js",
          type: "file",
          language: "js",
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        },
        {
          name: "index.css",
          type: "file",
          language: "css",
          content: `body {
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
}`,
        },
      ],
    },
    {
      name: "public",
      type: "folder",
      children: [
        {
          name: "index.html",
          type: "file",
          language: "html",
          content: `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Мой Сайт</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
        },
      ],
    },
    {
      name: "package.json",
      type: "file",
      language: "json",
      content: `{
  "name": "my-website",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}`,
    },
  ]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onCodeChange(newCode);

    // Update the file content in the file structure
    if (activeFile) {
      updateFileContent(fileStructure, activeFile, newCode);
    }
  };

  const findFileContent = (nodes: FileNode[], fileName: string): string => {
    for (const node of nodes) {
      if (node.type === "file" && node.name === fileName) {
        return node.content || "";
      }
      if (node.type === "folder" && node.children) {
        const content = findFileContent(node.children, fileName);
        if (content) return content;
      }
    }
    return "";
  };

  const handleFileClick = (fileName: string) => {
    setActiveFile(fileName);
    const content = findFileContent(fileStructure, fileName);
    setCode(content);
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node, index) => (
      <div key={index} style={{ marginLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center py-1 px-2 rounded hover:bg-blue-800/30 cursor-pointer ${activeFile === node.name ? "bg-blue-800/50 text-blue-300" : "text-blue-100"}`}
          onClick={() =>
            node.type === "file" ? handleFileClick(node.name) : null
          }
        >
          {node.type === "folder" ? (
            <FolderTree className="h-4 w-4 text-blue-400 mr-2" />
          ) : (
            <Code className="h-4 w-4 text-purple-400 mr-2" />
          )}
          <span>{node.name}</span>
        </div>
        {node.type === "folder" &&
          node.children &&
          renderFileTree(node.children, level + 1)}
      </div>
    ));
  };

  // Function to add syntax highlighting classes
  const highlightCode = (code: string, language: string = "jsx") => {
    // This is a simplified version. In a real app, you'd use a library like Prism.js
    // Here we'll just add some basic color for keywords
    if (!code) return "";

    let highlighted = code;

    try {
      // Very basic syntax highlighting
      if (
        language === "jsx" ||
        language === "js" ||
        language === "ts" ||
        language === "tsx"
      ) {
        const keywords = [
          "import",
          "export",
          "default",
          "function",
          "return",
          "const",
          "let",
          "var",
          "if",
          "else",
          "for",
          "while",
          "class",
          "extends",
          "interface",
          "type",
          "enum",
          "implements",
          "private",
          "public",
          "protected",
          "static",
          "async",
          "await",
          "try",
          "catch",
          "finally",
          "throw",
          "new",
          "this",
          "super",
          "typeof",
          "instanceof",
          "null",
          "undefined",
          "true",
          "false",
        ];

        // Create a single regex for all keywords for better performance
        const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
        highlighted = highlighted.replace(
          keywordRegex,
          '<span class="text-purple-400">$1</span>',
        );

        // Highlight strings
        highlighted = highlighted.replace(
          /(["'])(.*?)\1/g,
          '<span class="text-green-400">$&</span>',
        );

        // Highlight JSX tags
        highlighted = highlighted.replace(
          /(<\/?[\w\s="'\-\.]+>)/g,
          '<span class="text-blue-400">$&</span>',
        );

        // Highlight comments
        highlighted = highlighted.replace(
          /(\/\/.*$)/gm,
          '<span class="text-gray-500">$&</span>',
        );

        // Highlight multiline comments
        highlighted = highlighted.replace(
          /(\/\*[\s\S]*?\*\/)/g,
          '<span class="text-gray-500">$&</span>',
        );

        // Highlight TypeScript types
        if (language === "ts" || language === "tsx") {
          highlighted = highlighted.replace(
            /:\s*([A-Z][\w<>|&\[\]]+)/g,
            ': <span class="text-yellow-400">$1</span>',
          );
        }
      } else if (language === "css") {
        // Highlight CSS properties
        highlighted = highlighted.replace(
          /(\w+)\s*:/g,
          '<span class="text-blue-400">$1</span>:',
        );

        // Highlight values
        highlighted = highlighted.replace(
          /:\s*([^;]+);/g,
          ': <span class="text-green-400">$1</span>;',
        );

        // Highlight selectors
        highlighted = highlighted.replace(
          /(\.|#|\w+)\s*\{/g,
          '<span class="text-purple-400">$1</span> {',
        );

        // Highlight media queries
        highlighted = highlighted.replace(
          /(@media[^{]+\{)/g,
          '<span class="text-yellow-400">$1</span>',
        );
      } else if (language === "html") {
        // Highlight HTML tags
        highlighted = highlighted.replace(
          /(&lt;\/?[\w\s="'\-\.]+&gt;)/g,
          '<span class="text-blue-400">$&</span>',
        );

        highlighted = highlighted.replace(
          /(<\/?[\w\s="'\-\.]+>)/g,
          '<span class="text-blue-400">$&</span>',
        );

        // Highlight attributes
        highlighted = highlighted.replace(
          /([\w\-]+)=(["'])(.*?)\2/g,
          '<span class="text-purple-400">$1</span>=<span class="text-green-400">$2$3$2</span>',
        );

        // Highlight comments
        highlighted = highlighted.replace(
          /(&lt;!--[\s\S]*?--&gt;)/g,
          '<span class="text-gray-500">$&</span>',
        );

        highlighted = highlighted.replace(
          /(<!--[\s\S]*?-->)/g,
          '<span class="text-gray-500">$&</span>',
        );
      } else if (language === "json") {
        // Highlight keys
        highlighted = highlighted.replace(
          /("[\w\-]+")(\s*:)/g,
          '<span class="text-blue-400">$1</span>$2',
        );

        // Highlight string values
        highlighted = highlighted.replace(
          /:\s*(".*?")/g,
          ': <span class="text-green-400">$1</span>',
        );

        // Highlight numbers
        highlighted = highlighted.replace(
          /:\s*(\d+)/g,
          ': <span class="text-purple-400">$1</span>',
        );

        // Highlight boolean values
        highlighted = highlighted.replace(
          /:\s*(true|false)/g,
          ': <span class="text-purple-400">$1</span>',
        );
      }
    } catch (error) {
      console.error("Error in syntax highlighting:", error);
      // Return the original code if there's an error in highlighting
      return code;
    }

    return highlighted;
  };

  const getLanguageFromActiveFile = (): string => {
    if (!activeFile) return "jsx";

    const extension = activeFile.split(".").pop()?.toLowerCase() || "";
    switch (extension) {
      case "js":
        return "js";
      case "jsx":
        return "jsx";
      case "ts":
        return "ts";
      case "tsx":
        return "tsx";
      case "css":
        return "css";
      case "scss":
        return "scss";
      case "html":
        return "html";
      case "json":
        return "json";
      case "md":
        return "markdown";
      default:
        return "jsx";
    }
  };

  // Update file content in the file structure
  const updateFileContent = (
    nodes: FileNode[],
    fileName: string,
    newContent: string,
    path: string = "",
  ): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const currentPath = path ? `${path}/${node.name}` : node.name;

      if (node.type === "file" && node.name === fileName) {
        node.content = newContent;
        return true;
      }

      if (node.type === "folder" && node.children) {
        if (
          updateFileContent(node.children, fileName, newContent, currentPath)
        ) {
          return true;
        }
      }
    }

    return false;
  };

  // Add new file or folder
  const handleAddNewFile = () => {
    if (!newFileName.trim()) return;

    // Create the new file or folder
    const newNode: FileNode = {
      name: newFileName,
      type: newFileType,
      content: newFileType === "file" ? "" : undefined,
      children: newFileType === "folder" ? [] : undefined,
      language:
        newFileType === "file"
          ? getLanguageFromExtension(newFileName.split(".").pop() || "")
          : undefined,
    };

    // Add to the file structure
    const updatedStructure = [...fileStructure];

    if (newFilePath) {
      // Add to a specific path
      const pathParts = newFilePath.split("/");
      let currentLevel = updatedStructure;
      let found = false;

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const node = currentLevel.find((n) => n.name === part);

        if (node && node.type === "folder" && node.children) {
          if (i === pathParts.length - 1) {
            // We found the target folder
            node.children.push(newNode);
            found = true;
            break;
          } else {
            currentLevel = node.children;
          }
        }
      }

      if (!found) {
        // If path not found, add to root
        updatedStructure.push(newNode);
      }
    } else {
      // Add to root
      updatedStructure.push(newNode);
    }

    setFileStructure(updatedStructure);
    onFileStructureChange(updatedStructure);
    setNewFileName("");
    setNewFilePath("");
    setIsNewFileDialogOpen(false);

    // If it's a file, open it
    if (newFileType === "file") {
      setActiveFile(newFileName);
      setCode("");
      setActiveTab("code");
    }
  };

  // Delete file or folder
  const deleteFileOrFolder = (name: string, path: string = "") => {
    const pathParts = path ? path.split("/") : [];
    const updatedStructure = [...fileStructure];

    const removeNode = (
      nodes: FileNode[],
      targetName: string,
      depth: number = 0,
    ): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (depth === pathParts.length && nodes[i].name === targetName) {
          // Found the node to remove
          nodes.splice(i, 1);
          return true;
        }

        if (
          depth < pathParts.length &&
          nodes[i].name === pathParts[depth] &&
          nodes[i].children
        ) {
          // Navigate deeper
          if (removeNode(nodes[i].children, targetName, depth + 1)) {
            return true;
          }
        }
      }

      return false;
    };

    removeNode(updatedStructure, name);
    setFileStructure(updatedStructure);
    onFileStructureChange(updatedStructure);

    // If the active file was deleted, reset
    if (activeFile === name) {
      setActiveFile(null);
      setCode("");
    }
  };

  // Handle terminal command execution
  const executeTerminalCommand = () => {
    if (!terminalInput.trim()) return;

    setTerminalOutput((prev) => [...prev, `$ ${terminalInput}`]);

    // Terminal command execution with more comprehensive commands
    const command = terminalInput.trim();
    const commandLower = command.toLowerCase();
    let output: string[] = [];

    // Package management commands
    if (
      commandLower.startsWith("npm install") ||
      commandLower.startsWith("yarn add") ||
      commandLower.startsWith("pnpm add")
    ) {
      const packageName = command.split(" ").slice(2).join(" ");
      output = [
        `Installing ${packageName || "packages"}...`,
        "Resolving dependencies...",
        "Added packages in 2.3s",
        "Successfully installed packages",
      ];
    }
    // Run scripts
    else if (
      commandLower.startsWith("npm run") ||
      commandLower.startsWith("yarn") ||
      commandLower.match(/^(npm|yarn|pnpm) (start|dev|build|test)/)
    ) {
      const scriptName =
        command.split(" ")[1] === "run"
          ? command.split(" ")[2]
          : command.split(" ")[1];
      if (scriptName === "build" || commandLower.includes("build")) {
        output = [
          "Building project...",
          "Compiling...",
          "Optimizing assets...",
          "Build completed in 3.2s",
          "Output directory: ./dist",
        ];
      } else {
        output = [
          `Running script: ${scriptName || "start"}...`,
          "Compiled successfully!",
          "Server running at http://localhost:3000",
          "Ready for connections",
        ];
      }
    }
    // File system commands
    else if (commandLower === "ls" || commandLower === "dir") {
      // Get current directory contents
      output = fileStructure.map((node) =>
        node.type === "folder" ? `📁 ${node.name}/` : `📄 ${node.name}`,
      );
    } else if (commandLower.startsWith("cd ")) {
      const dirName = command.split(" ")[1];
      if (
        fileStructure.some(
          (node) => node.name === dirName && node.type === "folder",
        )
      ) {
        output = [`Changed directory to ${dirName}`];
      } else {
        output = [`Directory not found: ${dirName}`];
      }
    } else if (commandLower.startsWith("mkdir ")) {
      const newDirName = command.split(" ")[1];
      if (newDirName) {
        // Add new folder to file structure
        const newFolder: FileNode = {
          name: newDirName,
          type: "folder",
          children: [],
        };
        setFileStructure((prev) => [...prev, newFolder]);
        output = [`Created directory: ${newDirName}`];
      } else {
        output = ["Error: Directory name required"];
      }
    } else if (
      commandLower.startsWith("touch ") ||
      commandLower.startsWith("new ")
    ) {
      const newFileName = command.split(" ")[1];
      if (newFileName) {
        // Add new file to file structure
        const extension = newFileName.split(".").pop() || "";
        const newFile: FileNode = {
          name: newFileName,
          type: "file",
          content: "",
          language: getLanguageFromExtension(extension),
        };
        setFileStructure((prev) => [...prev, newFile]);
        output = [`Created file: ${newFileName}`];
      } else {
        output = ["Error: File name required"];
      }
    } else if (commandLower === "clear" || commandLower === "cls") {
      setTerminalOutput(["Терминал очищен"]);
      setTerminalInput("");
      return;
    }
    // Git commands
    else if (commandLower.startsWith("git ")) {
      const gitCommand = command.split(" ")[1];
      if (gitCommand === "init") {
        output = ["Initialized empty Git repository"];
      } else if (gitCommand === "status") {
        output = [
          "On branch main",
          "Changes not staged for commit:",
          "  modified: src/App.jsx",
          "  modified: src/index.css",
        ];
      } else if (gitCommand === "add") {
        output = ["Added files to staging area"];
      } else if (gitCommand === "commit") {
        output = ["Created commit: Initial commit"];
      } else if (gitCommand === "push") {
        output = ["Pushed changes to remote repository"];
      } else {
        output = [`Git command executed: ${gitCommand}`];
      }
    }
    // Help command
    else if (commandLower === "help") {
      output = [
        "Available commands:",
        "  npm/yarn/pnpm commands - Package management",
        "  ls/dir - List files",
        "  cd <dir> - Change directory",
        "  mkdir <dir> - Create directory",
        "  touch/new <file> - Create file",
        "  git <command> - Git operations",
        "  clear/cls - Clear terminal",
        "  help - Show this help",
      ];
    } else {
      output = [
        `Command not found: ${command}. Type 'help' for available commands.`,
      ];
    }

    setTerminalOutput((prev) => [...prev, ...output]);
    setTerminalInput("");
  };

  // Handle terminal key press
  const handleTerminalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeTerminalCommand();
    }
  };

  // Handle export to GitHub
  const handleGitHubExport = () => {
    if (!githubToken || !githubRepo) return;

    setTerminalOutput((prev) => [
      ...prev,
      "Exporting to GitHub...",
      `Repository: ${githubRepo}`,
      "Preparing files...",
      "Committing changes...",
      "Push successful!",
      `Your project is now available at: https://github.com/${githubRepo}`,
    ]);

    setIsExportDialogOpen(false);
    setActiveTab("terminal");
  };

  // Handle local download
  const handleLocalDownload = () => {
    setTerminalOutput((prev) => [
      ...prev,
      "Preparing project for download...",
      "Creating zip archive...",
      "Download started!",
    ]);

    // Create a mock download link
    const link = document.createElement("a");
    link.href = "#";
    link.download = "project.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportDialogOpen(false);
    setActiveTab("terminal");
  };

  // Get language from file extension
  const getLanguageFromExtension = (extension: string): string => {
    switch (extension.toLowerCase()) {
      case "js":
        return "js";
      case "jsx":
        return "jsx";
      case "ts":
        return "ts";
      case "tsx":
        return "tsx";
      case "css":
        return "css";
      case "scss":
        return "scss";
      case "html":
        return "html";
      case "json":
        return "json";
      case "md":
        return "markdown";
      default:
        return "text";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-950 to-purple-950 border border-blue-500/30 rounded-md overflow-hidden">
      <div className="p-3 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-blue-500/30 flex items-center justify-between">
        <div className="flex items-center">
          <Code className="h-5 w-5 text-blue-400 mr-2" />
          <h2 className="text-lg font-medium text-blue-300">Редактор кода</h2>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsExportDialogOpen(true)}
                  className="border-blue-500/30 bg-blue-950/50 hover:bg-blue-900/50 text-blue-300"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Экспорт проекта</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="sm"
            onClick={onRunCode}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Play className="h-4 w-4 mr-1" />
            Запуск
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "code" | "files" | "terminal")
        }
        className="flex-grow flex flex-col"
      >
        <div className="border-b border-blue-500/30 bg-blue-900/20">
          <TabsList className="bg-transparent h-10">
            <TabsTrigger
              value="code"
              className="data-[state=active]:bg-blue-800/30 data-[state=active]:text-blue-300 text-blue-400"
            >
              <Code className="h-4 w-4 mr-2" />
              Код
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="data-[state=active]:bg-blue-800/30 data-[state=active]:text-blue-300 text-blue-400"
            >
              <FolderTree className="h-4 w-4 mr-2" />
              Файлы
            </TabsTrigger>
            <TabsTrigger
              value="terminal"
              className="data-[state=active]:bg-blue-800/30 data-[state=active]:text-blue-300 text-blue-400"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Терминал
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="code" className="flex-grow p-0 m-0">
          <div className="flex flex-col h-full">
            {activeFile && (
              <div className="px-3 py-1 bg-blue-900/30 border-b border-blue-500/30 text-xs text-blue-300 flex justify-between items-center">
                <span>{activeFile}</span>
                <div className="flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Save file logic
                            const updatedStructure = [...fileStructure];
                            updateFileContent(
                              updatedStructure,
                              activeFile,
                              code,
                            );
                            setFileStructure(updatedStructure);
                            onFileStructureChange(updatedStructure);
                          }}
                          className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-800/30"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Сохранить</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
            <div className="flex-grow relative">
              <textarea
                value={code}
                onChange={handleCodeChange}
                className="absolute inset-0 bg-transparent text-transparent caret-white p-4 font-mono text-sm resize-none outline-none z-10"
                spellCheck="false"
              />
              <ScrollArea className="h-full">
                <pre className="p-4 font-mono text-sm text-blue-100 whitespace-pre">
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        highlightCode(code, getLanguageFromActiveFile()) ||
                        "&nbsp;",
                    }}
                  />
                </pre>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="files" className="flex-grow p-0 m-0">
          <div className="flex flex-col h-full">
            <div className="p-2 border-b border-blue-500/30 bg-blue-900/20 flex justify-between items-center">
              <h3 className="text-sm font-medium text-blue-300">
                Структура проекта
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsNewFileDialogOpen(true)}
                className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-800/30"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-grow">
              <div className="p-2">{renderFileTree(fileStructure)}</div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="terminal" className="flex-grow p-0 m-0">
          <div className="flex flex-col h-full bg-blue-950/80">
            <ScrollArea className="flex-grow">
              <div className="p-3 font-mono text-xs text-blue-100">
                {terminalOutput.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap mb-1">
                    {line}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-2 border-t border-blue-500/30 flex items-center">
              <span className="text-blue-400 mr-2">$</span>
              <Input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalKeyDown}
                placeholder="Введите команду..."
                className="flex-grow bg-transparent border-none text-blue-100 placeholder:text-blue-500/50 text-xs font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New File Dialog */}
      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent className="bg-blue-950 border-blue-500/30 text-blue-100">
          <DialogHeader>
            <DialogTitle className="text-blue-300">
              {newFileType === "file" ? "Новый файл" : "Новая папка"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-4">
              <Button
                variant={newFileType === "file" ? "default" : "outline"}
                onClick={() => setNewFileType("file")}
                className={
                  newFileType === "file"
                    ? "bg-blue-600"
                    : "border-blue-500/30 text-blue-300"
                }
              >
                <FileCode className="h-4 w-4 mr-2" />
                Файл
              </Button>
              <Button
                variant={newFileType === "folder" ? "default" : "outline"}
                onClick={() => setNewFileType("folder")}
                className={
                  newFileType === "folder"
                    ? "bg-blue-600"
                    : "border-blue-500/30 text-blue-300"
                }
              >
                <FolderTree className="h-4 w-4 mr-2" />
                Папка
              </Button>
            </div>

            <div className="space-y-2">
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={
                  newFileType === "file"
                    ? "Имя файла (например, App.jsx)"
                    : "Имя папки"
                }
                className="border-blue-500/30 bg-blue-900/30 text-blue-100"
              />
            </div>

            <div className="space-y-2">
              <Input
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="Путь (необязательно, например: src)"
                className="border-blue-500/30 bg-blue-900/30 text-blue-100"
              />
            </div>

            <Button
              onClick={handleAddNewFile}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Создать
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="bg-blue-950 border-blue-500/30 text-blue-100">
          <DialogHeader>
            <DialogTitle className="text-blue-300">Экспорт проекта</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-blue-300">GitHub</h3>
              <Input
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="GitHub токен"
                className="border-blue-500/30 bg-blue-900/30 text-blue-100"
              />
              <Input
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="Имя репозитория (username/repo)"
                className="border-blue-500/30 bg-blue-900/30 text-blue-100"
              />
              <Button
                onClick={handleGitHubExport}
                disabled={!githubToken || !githubRepo}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white mt-2"
              >
                Экспорт на GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-blue-500/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-blue-950 px-2 text-blue-400">или</span>
              </div>
            </div>

            <Button
              onClick={handleLocalDownload}
              className="w-full border-blue-500/30 bg-blue-900/30 text-blue-100 hover:bg-blue-800/50"
            >
              <Download className="h-4 w-4 mr-2" />
              Скачать локально
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
