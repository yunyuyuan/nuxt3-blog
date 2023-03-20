import cmd from "child_process";
import colors from "colors";

export async function runCmd (command: string) {
  return await new Promise<void>((resolve, reject) => {
    cmd.exec(command, {
      maxBuffer: 1024 * 1024 * 5
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }).stdout?.pipe(process.stdout);
  });
}

export function nbLog (s: string, head = "generate") {
  // eslint-disable-next-line no-console
  console.log(`[${colors.blue.bold(head)}] ${colors.green(s)}`);
}
