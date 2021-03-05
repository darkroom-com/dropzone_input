import filesize from "rollup-plugin-filesize";
import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";

const pkg = require("./package.json");

const name = pkg.name;

export default {
  input: "src/index.js",
  external: ["stimulus", "dropzone", "@rails/activestorage", "utif"],
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true
    },
    {
      file: "dist/index.m.js",
      format: "es",
      sourcemap: true
    },
    {
      file: "dist/index.umd.js",
      format: "umd",
      name,
      sourcemap: true,
      globals: {
        stimulus: "Stimulus",
        dropzone: "Dropzone",
        activestorage: "DirectUpload"
      }
    }
  ],
  plugins: [resolve(), babel(), filesize()]
};
