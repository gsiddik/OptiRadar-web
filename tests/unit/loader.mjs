// The sources import each other the way Vite resolves them (without file extensions); Node needs the extension.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && /^\.{1,2}\//.test(specifier)) {
      for (const extension of ['.js', '.jsx']) {
        try {
          return await nextResolve(specifier + extension, context);
        } catch {
          // try the next extension
        }
      }
    }
    throw error;
  }
}
