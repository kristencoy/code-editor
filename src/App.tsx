import { useEffect, useRef, useState } from 'react';
import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

const App = () => {
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const ref = useRef<esbuild.Service>();

  const startService = async () => {
    // ref for global access - does not cause rerender like useState does
    ref.current = await esbuild.startService({
      worker: true,
      // wasmURL: '/esbuild.wasm', // from public folder, for easy access to binary
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm',
    });
  };

  useEffect(() => {
    startService();
  }, []);

  const onClick = async () => {
    if (!ref.current) return;
    const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        'process.env.NODE_ENV': '"production"', // ensure that it remains a string
        global: 'window', // bundling requires replacement of global with window when in browser
      },
    });
    setCode(result.outputFiles[0].text);
  };

  return (
    <div>
      <h1>code editor</h1>
      <textarea value={input} onChange={(event) => setInput(event.target.value)}></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <pre>{code}</pre>
    </div>
  );
};

export default App;
