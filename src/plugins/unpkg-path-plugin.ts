import * as esbuild from 'esbuild-wasm';

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    // build represents the entire bundling process
    // override some aspects of the process by overriding this arg
    // override by attaching event listeners to onLoad and onResolve events
    setup(build: esbuild.PluginBuild) {
      // handle imports with root entry file of index.js
      build.onResolve({ filter: /(^index\.js$)/ }, () => {
        return { path: 'index.js', namespace: 'a' };
      });

      // handle relative paths in a module
      // prevent esbuild from mapping to file system location by mapping to a url
      // that uses unpkg for imports, while handling nested modules
      build.onResolve(
        { filter: /^\.+\// },
        (args: esbuild.OnResolveArgs): esbuild.OnResolveResult => {
          return {
            path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href,
            namespace: 'a',
          };
        }
      );

      // handle main file of a module
      build.onResolve(
        { filter: /.*/ },
        async (args: esbuild.OnResolveArgs): Promise<esbuild.OnResolveResult> => {
          return {
            path: `https://unpkg.com/${args.path}`,
            namespace: 'a',
          };
        }
      );
    },
  };
};
