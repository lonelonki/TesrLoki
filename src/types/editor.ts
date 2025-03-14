export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  language?: string;
}

export interface CodeSnippet {
  code: string;
  language: string;
  fileName?: string;
}
