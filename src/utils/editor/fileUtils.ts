export const isSupportedFile = (file: File): boolean => {
  const ext = file.name.split('.').pop()?.toLowerCase();

  return ext === 'md' || ext === 'txt';
};

export const getFileSourceSignature = (file: Pick<File, 'name' | 'size' | 'lastModified'>) => {
  return `${file.name}::${file.size}::${file.lastModified}`;
};

export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    md: 'markdown',
    markdown: 'markdown',
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    html: 'html',
    htm: 'html',
    css: 'css',
    py: 'python',
    java: 'java',
    c: 'cpp',
    cpp: 'cpp',
    h: 'cpp',
    hpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    sh: 'shell',
    bash: 'shell',
    sql: 'sql',
  };

  return map[ext] || 'plaintext';
};
