const { src, task, exec, context } = require("fuse-box/sparky")
const { FuseBox, WebIndexPlugin, QuantumPlugin, CSSPlugin, SassPlugin } = require("fuse-box")
const TypeHelper = require('fuse-box-typechecker').TypeHelper

const typeHelper = TypeHelper({
  tsConfig: './tsconfig.json',
  basePath:'./',
  // tsLint:'./tslint.json', //you do not haveto do tslint too.. just here to show how.
  name: 'App typechecker'
})

context(class {
  getConfig() {
    const cssOptions = !this.isProduction ? {} : {
      group: 'bundle.css',
      outFile: 'dist/app.css',
      inject: true
    }

    return FuseBox.init({
      homeDir: "src",
      target : 'browser@es5',
      output: "dist/$name.js",
      plugins: [
        WebIndexPlugin({
          template: 'src/index.html',
          appendBundles: true
        }),
        CSSPlugin(cssOptions),
        [ SassPlugin(), CSSPlugin(cssOptions) ],
        this.isProduction && QuantumPlugin({
          uglify: true,
          treeshake : true,
          bakeApiIntoBundle: "app"
        })
      ]
    })
  }
})

task("default", async context => {
  const fuse = context.getConfig()
  fuse.dev()
  fuse.bundle("app")
    .hmr({reload: true})
    .cache(false)
    .watch()
    .instructions(">index.tsx")
    .sourceMaps(true)
    .completed(() => {
      console.log(`\x1b[36m%s\x1b[0m`, `client bundled`);
      typeHelper.runAsync();
    })
  await fuse.run()
})

task("dist", async context => {
  context.isProduction = true
  const fuse = context.getConfig()
  fuse
    .bundle("app")
    .cache(false)
    .sourceMaps(false)
    .instructions(">index.tsx")
  await fuse.run()
})
