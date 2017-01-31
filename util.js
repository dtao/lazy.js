function isHarmonySupported() {
  var version = process.version.split('.');

  // We'll only bother checking Node versions 0.10 and greater
  if (version[0] == 'v0' && Number(version[1]) < 10) {
    return false;
  }

  try {
    eval('(function*() {})');
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  isHarmonySupported: isHarmonySupported
};
