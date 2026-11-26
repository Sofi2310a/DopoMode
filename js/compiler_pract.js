const UK = document.documentElement.lang === 'uk';
const T = UK ? {
  running: 'ВИКОНУЄТЬСЯ…',
  compiling: 'Компіляція…',
  run: '▶ ЗАПУСТИТИ',
  idle: 'Натисни ЗАПУСТИТИ (або Ctrl + Enter), щоб скомпілювати й запустити код.',
  noOutput: '(немає виводу)',
  failed: 'Компіляція не вдалася.',
  noServer: 'Не вдалося підключитися до сервера компілятора. Перевір підключення до інтернету та спробуй ще раз.',
  c1: 'Напиши тут код простого калькулятора',
  c2: 'Напиши тут код перевірки віку',
  c3: 'Напиши тут код калькулятора оцінок',
  c4: 'Напиши тут код розумного калькулятора'
} : {
  running: 'RUNNING…',
  compiling: 'Compiling…',
  run: '▶ RUN',
  idle: 'Press RUN (or Ctrl + Enter) to compile and run your code.',
  noOutput: '(no output)',
  failed: 'Compilation failed.',
  noServer: 'Could not reach the compiler server. Check your internet connection and try again.',
  c1: 'Write your Simple Calculator code here',
  c2: 'Write your Age Checker code here',
  c3: 'Write your Grade Calculator code here',
  c4: 'Write your Smart Calculator code here'
};

const DEFAULT_CODES = {
      1: `#include <iostream>

int main() {
    double a = 10, b = 5;
    // ${T.c1}

    return 0;
}
`,
      2: `#include <iostream>

int main() {
    int age = 16;
    // ${T.c2}

    return 0;
}
`,
      3: `#include <iostream>

int main() {
    int score = 85;
    // ${T.c3}

    return 0;
}
`,
      4: `#include <iostream>

int main() {
    int choice = 3;
    double a = 8, b = 5;
    // ${T.c4}

    return 0;
}
`
    };

    async function runWandbox(code, std) {
      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        signal: AbortSignal.timeout(20000),
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
      if (d.compiler_error && String(d.status) !== '0' && !d.program_output) {
        return { text: d.compiler_error, ok: false };
      }
      let text = (d.program_output || '') + (d.program_error ? '\n' + d.program_error : '');
      if (d.compiler_error && String(d.status) !== '0') text = d.compiler_error + '\n' + text;
      if (d.signal) text += '\n' + d.signal;
      if (!text.trim()) text = String(d.status) === '0' ? T.noOutput : T.failed;
      return { text: text, ok: String(d.status) === '0' };
    }

    async function runGodbolt(code, std) {
      const res = await fetch('https://godbolt.org/api/compiler/g142/compile', {
        method: 'POST',
        signal: AbortSignal.timeout(20000),
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
        return { text: lines(d.buildResult.stderr) || T.failed, ok: false };
      }
      const text = lines(d.stdout) + (d.stderr && d.stderr.length ? '\n' + lines(d.stderr) : '');
      return { text: text.trim() ? text : T.noOutput, ok: d.code === 0 };
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
      if (runBtn.disabled) return;
        const code = codeEl.value;
        const std = stdSelect.value;
        runBtn.disabled = true;
      resetBtn.disabled = true;
        runBtn.textContent = T.running;
        show(T.compiling);
        try {
          let r;
          try { r = await runWandbox(code, std); }
          catch (e) { r = await runGodbolt(code, std); }
          show(r.text, r.ok ? 'ok' : 'err');
        } catch (e) {
          show(T.noServer, 'err');
        } finally {
          runBtn.disabled = false;
        resetBtn.disabled = false;
          runBtn.textContent = T.run;
        }
      }

      runBtn.addEventListener('click', run);
      resetBtn.addEventListener('click', () => {
        codeEl.value = defaultCode;
        show(T.idle);
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