const DEFAULT_CODE = `#include <iostream>
#include <string>

int main() {
    std::string name = "Alex";
    int age = 18;
    double height = 1.75;
    char grade = 'A';
    bool enrolled = true;

    std::cout << "Student Profile\\n";
    std::cout << "Name: " << name << "\\n";
    std::cout << "Age: " << age << "\\n";
    std::cout << "Height: " << height << "\\n";
    std::cout << "Grade: " << grade << "\\n";
    std::cout << "Enrolled: " << std::boolalpha << enrolled << "\\n";

    return 0;
}
`;

    const codeEl = document.getElementById('code');
    const outEl = document.getElementById('output');
    const runBtn = document.getElementById('run');
    codeEl.value = DEFAULT_CODE;

    function show(text, cls) {
      outEl.textContent = text;
      outEl.className = cls || '';
    }

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

    async function run() {
      const code = codeEl.value;
      const std = document.getElementById('std').value;
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
    document.getElementById('reset').addEventListener('click', () => {
      codeEl.value = DEFAULT_CODE;
      show('Press RUN (or Ctrl + Enter) to compile and run your code.');
    });
    codeEl.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = codeEl.selectionStart, t = codeEl.selectionEnd;
        codeEl.setRangeText('    ', s, t, 'end');
      }
    });