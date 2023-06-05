
const LOG_LENGTH = 100;

export const logCache: string[] = [];

export function log(message: string) {
  console.log(message);

  // Rotate the log
  if (logCache.length > LOG_LENGTH) {
    logCache.splice(0);
    
  }
  logCache.push(message);
}