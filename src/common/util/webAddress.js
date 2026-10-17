// Only a plain web address may be followed; anything else (for example a script URL) is ignored.
export default (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};
