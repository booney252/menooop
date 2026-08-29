/** No framework. Assertions, a count, and an exit code. */
export type Harness = {
  test: (name: string, fn: () => void) => void;
  done: (label: string) => void;
};

export function harness(): Harness {
  let passed = 0;
  const failures: string[] = [];

  return {
    test(name, fn) {
      try {
        fn();
        passed++;
      } catch (error) {
        failures.push(`${name}\n    ${(error as Error).message.split("\n")[0]}`);
      }
    },
    done(label) {
      console.log(`\n  ${label}: ${passed} passed, ${failures.length} failed\n`);
      for (const f of failures) console.error(`  ✗ ${f}\n`);
      if (failures.length) process.exitCode = 1;
    },
  };
}
