// rosinbabyy UV proxy config (study-uv)

self.__sp$config = {
  prefix: "/study-uv/s/",
  bare: "/bare/",
  encodeUrl: StudyBrowse.codec.xor.encode,
  decodeUrl: StudyBrowse.codec.xor.decode,
  handler: "/study-uv/handler.js",
  client: "/study-uv/client.js",
  bundle: "/study-uv/bundle.js",
  config: "/study-uv/config.js",
  sw: "/study-uv/rizz.sw.js",
};
