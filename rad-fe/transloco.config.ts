import { TranslocoGlobalConfig } from "@jsverse/transloco-utils";

const config: TranslocoGlobalConfig = {
  rootTranslationsPath: "./src/assets/i18n",
  langs: ["en"],
  keysManager: {
    input: "./src/",
    output: "./temp/",
    fileFormat: "json",
    marker: "t",
    addMissingKeys: true,
    emitErrorOnExtraKeys: true,
    replace: false,
    defaultValue: "_TRANSLATE_",
    unflat: false,
  }
};

export default config;