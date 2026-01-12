
import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

// Defined an interface for CodeBlock props to ensure compatibility with standard React props like 'key'
interface CodeBlockProps {
  code: string;
  language?: string;
}

// Fixed the TypeScript error by using React.FC to wrap the component function
const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => { 
    navigator.clipboard.writeText(code); 
    setCopied(true); 
    setTimeout(() => setCopied(false), 2000); 
  };

  return (
    <div className="my-8 rounded-[24px] overflow-hidden bg-[#030712] border border-white/10 shadow-xl">
      <div className="flex items-center justify-between px-6 py-4 bg-[#0a0f1d] border-b border-white/5">
        <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px] font-black uppercase tracking-widest">
          <Terminal size={14} className="text-blue-500" /> {language || 'code'}
        </div>
        <button 
          onClick={handleCopy} 
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
            copied ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          {copied ? (
            <>
              <Check size={12} className="inline mr-1"/> Copied
            </>
          ) : (
            <>
              <Copy size={12} className="inline mr-1"/> Copy
            </>
          )}
        </button>
      </div>
      <div className="p-6 overflow-x-auto">
        <pre className="font-mono text-sm text-slate-300 leading-6">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
