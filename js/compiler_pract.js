 const DEFAULT_CODES = {
      1: `#include <iostream>

int main() {
    double a = 10, b = 5;
    // Write your Simple Calculator code here

    return 0;
}
`,
      2: `#include <iostream>

int main() {
    int age = 16;
    // Write your Age Checker code here

    return 0;
}
`,
      3: `#include <iostream>

int main() {
    int score = 85;
    // Write your Grade Calculator code here

    return 0;
}
`,
      4: `#include <iostream>

int main() {
    int choice = 3;
    double a = 8, b = 5;
    // Write your Smart Calculator code here

    return 0;
}
`
    };

    async function runWandbox(code, std) {
      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiler: 'gcc-head',
          code: code,
          options: 'warning',
          'compiler-option-raw': '-std=' + std
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const d = await res.json();
      if (d.compiler_error && d.status !== '0' && !d.program_output) {
        return { text: d.compiler_error, ok: false };
      }
      let text = (d.program_output || '') + (d.program_error ? '\n' + d.program_error : '');
      if (d.compiler_error && d.status !== '0') text = d.compiler_error + '\n' + text;
      if (!text.trim()) text = '(no output)';
      return { text: text, ok: d.status === '0' };
    }

    async function runGodbolt(code, std) {
      const res = await fetch('https://godbolt.org/api/compiler/g142/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          source: code,
          options: {
            userArguments: '-std=' + std,
            executeParameters: { args: [], stdin: '' },
            compilerOptions: { executorRequest: true },
            filters: { execute: true }
          }
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const d = await res.json();
      const lines = a => (a || []).map(x => x.text).join('\n');
      if (d.buildResult && d.buildResult.code !== 0) {
        return { text: lines(d.buildResult.stderr) || 'Compilation failed.', ok: false };
      }
      const text = lines(d.stdout) + (d.stderr && d.stderr.length ? '\n' + lines(d.stderr) : '');
      return { text: text.trim() ? text : '(no output)', ok: d.code === 0 };
    }

    document.querySelectorAll('.compiler').forEach(compiler => {
      const taskId = compiler.dataset.task;
      const codeEl = compiler.querySelector('.code-editor');
      const outEl = compiler.querySelector('.console-output');
      const runBtn = compiler.querySelector('.btn-run');
      const resetBtn = compiler.querySelector('.btn-reset');
      const stdSelect = compiler.querySelector('.std-select');

      const defaultCode = DEFAULT_CODES[taskId] || '';
      codeEl.value = defaultCode;

      function show(text, cls) {
        outEl.textContent = text;
        outEl.className = 'console-output ' + (cls || '');
      }

      async function run() {
        const code = codeEl.value;
        const std = stdSelect.value;
        runBtn.disabled = true;
        runBtn.textContent = 'RUNNING…';
        show('Compiling…');
        try {
          let r;
          try { r = await runWandbox(code, std); }
          catch (e) { r = await runGodbolt(code, std); }
          show(r.text, r.ok ? 'ok' : 'err');
        } catch (e) {
          show('Could not reach the compiler server. Check your internet connection and try again.', 'err');
        } finally {
          runBtn.disabled = false;
          runBtn.textContent = '▶ RUN';
        }
      }

      runBtn.addEventListener('click', run);
      resetBtn.addEventListener('click', () => {
        codeEl.value = defaultCode;
        show('Press RUN (or Ctrl + Enter) to compile and run your code.');
      });
      codeEl.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          run();
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const s = codeEl.selectionStart, t = codeEl.selectionEnd;
          codeEl.setRangeText('    ', s, t, 'end');
        }
      });
    });