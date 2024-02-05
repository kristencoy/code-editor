import * as esbuild from 'esbuild-wasm';
import localforage from 'localforage';
import axios from 'axios';

export const fetchPlugin = (inputCode: string) => {
  // use to set an item in indexeddb
  const fileCache = localforage.createInstance({
    name: 'fileCache',
  });

  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onLoad(
        { filter: /.*/ },
        async (args: esbuild.OnLoadArgs): Promise<esbuild.OnLoadResult> => {
          if (args.path === 'index.js') {
            return {
              loader: 'jsx',
              contents: inputCode,
            };
          }
          // check if file already received and in cache
          const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
          if (cachedResult) return cachedResult;

          const { request, data } = await axios.get(args.path);
          const loader = args.path.match(/.css$/) ? 'css' : 'jsx';
          const result: esbuild.OnLoadResult = {
            loader: loader,
            contents: data,
            resolveDir: new URL('./', request.responseURL).pathname,
          };
          // store result in cache
          await fileCache.setItem(args.path, result);

          return result;
        }
      );
    },
  };
};
