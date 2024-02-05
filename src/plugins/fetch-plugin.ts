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
      // handle files named index.js
      build.onLoad({ filter: /(^index.js$)/ }, () => {
        return {
          loader: 'jsx',
          contents: inputCode,
        };
      });

      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
        // check if file already received and in cache
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        if (cachedResult) return cachedResult;
      });

      // handle files that are css
      build.onLoad(
        { filter: /.css$/ },
        async (args: esbuild.OnLoadArgs): Promise<esbuild.OnLoadResult> => {
          const { request, data } = await axios.get(args.path);
          // workaround for importing a css file
          // remove quotes, check if css, manually add css to style header
          const escapedCssString = data
            .replace(/\n/g, '')
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'");
          const contents = `
            const style = document.createElement('style);
            style.innerText = '${escapedCssString}'};
            document.head.appendChild(style)
            `;
          const result: esbuild.OnLoadResult = {
            loader: 'jsx',
            contents: contents,
            resolveDir: new URL('./', request.responseURL).pathname,
          };
          // store result in cache
          await fileCache.setItem(args.path, result);

          return result;
        }
      );

      // handle all other javascript files
      build.onLoad(
        { filter: /.*/ },
        async (args: esbuild.OnLoadArgs): Promise<esbuild.OnLoadResult> => {
          const { request, data } = await axios.get(args.path);

          const result: esbuild.OnLoadResult = {
            loader: 'jsx',
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
