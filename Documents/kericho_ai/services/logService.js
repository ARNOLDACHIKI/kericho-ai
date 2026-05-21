const fs = require("fs");
const path = require("path");

const logsDir = path.join(process.cwd(), "logs");

/**
 * Read recent log lines from a file
 */
function readLogFile(filename, maxLines = 100) {
  const filepath = path.join(logsDir, filename);
  if (!fs.existsSync(filepath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filepath, "utf8");
    const lines = content.split("\n").filter((line) => line.trim());
    return lines.slice(-maxLines);
  } catch (err) {
    return [`Error reading ${filename}: ${err.message}`];
  }
}

/**
 * Get all log files in the logs directory
 */
function getLogFiles() {
  if (!fs.existsSync(logsDir)) {
    return [];
  }

  try {
    const files = fs.readdirSync(logsDir);
    return files
      .filter((f) => f.endsWith(".log"))
      .map((filename) => {
        const filepath = path.join(logsDir, filename);
        const stat = fs.statSync(filepath);
        return {
          filename,
          size: stat.size,
          sizeKB: Math.round(stat.size / 1024),
          modified: stat.mtime,
        };
      })
      .sort((a, b) => b.modified - a.modified);
  } catch (err) {
    return [];
  }
}

/**
 * Get log summary with recent entries and error count
 */
function getLogSummary(limit = 50) {
  const logFiles = getLogFiles();
  const summary = {
    active: logFiles.length > 0,
    logCount: logFiles.length,
    files: logFiles,
    recentErrors: [],
    recentCombined: [],
  };

  // Get the most recent error log file
  const errorLog = logFiles.find((f) => f.filename.includes("error"));
  if (errorLog) {
    const errorLines = readLogFile(errorLog.filename, limit);
    summary.recentErrors = errorLines;
    summary.errorCount = errorLines.length;
  }

  // Get the most recent combined log file
  const combinedLog = logFiles.find((f) => f.filename.includes("combined"));
  if (combinedLog) {
    const combinedLines = readLogFile(combinedLog.filename, limit);
    summary.recentCombined = combinedLines;
  }

  return summary;
}

/**
 * Count errors in log files
 */
function getErrorStats() {
  const logFiles = getLogFiles();
  const errorFile = logFiles.find((f) => f.filename.includes("error"));

  if (!errorFile) {
    return { totalErrors: 0, files: 0 };
  }

  const content = fs.readFileSync(path.join(logsDir, errorFile.filename), "utf8");
  const lines = content.split("\n").filter((line) => line.trim());

  return {
    totalErrors: lines.length,
    files: logFiles.length,
    errorFileSizeKB: errorFile.sizeKB,
  };
}

module.exports = {
  readLogFile,
  getLogFiles,
  getLogSummary,
  getErrorStats,
};
