import readline from 'node:readline'

/** Ask for a secret on the terminal without echoing it. */
export function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    /* readline has no "silent" mode; suppressing its output writer is the
       standard way to hide what is typed. */
    ;(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = () => {}
    process.stdout.write(question)
    rl.question('', (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}
