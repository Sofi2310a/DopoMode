(function () {
  let doc = document.documentElement;
  let path = location.pathname;

  let lang = 'eng';
  if (path.indexOf('/ukr/') !== -1) {
    lang = 'ukr';
  }
  if (path.indexOf('/eng/') !== -1) {
    lang = 'eng';
  }
  let isUkr = (lang === 'ukr');

  function getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function setItem(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (err) {}
  }

  function delItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {}
  }

  function applyTheme(theme) {
    doc.setAttribute('data-theme', theme);
  }

  let savedTheme = getItem('dopomode-theme');
  if (savedTheme === 'dark') {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  setItem('dopomode-lang', lang);

  let parts = path.split('/');
  let file = parts[parts.length - 1];
  if (file === '') {
    file = 'index.html';
  }

  let inPages = (path.indexOf('/pages/') !== -1);
  let isLangIndex = false;
  if (!inPages && (file === 'index.html') && (path.indexOf('/ukr/') !== -1 || path.indexOf('/eng/') !== -1)) {
    isLangIndex = true;
  }

  let base = '';
  if (inPages) {
    base = '';
  } else {
    base = 'pages/';
  }

  let authed = (getItem('dopomode-auth') === '1');

  if (!authed && file === 'profile.html') {
    location.replace('log_in.html');
    return;
  }
  if (!authed && (file === 'main.html' || file === 'about_1.html')) {
    location.replace(file === 'main.html' ? '../index.html' : 'about.html');
    return;
  }
  if (authed && file === 'about.html') {
    location.replace('about_1.html');
    return;
  }
  if (authed && isLangIndex) {
    location.replace(base + 'main.html');
    return;
  }

  if (file !== 'language.html') {
    if (isLangIndex) {
      setItem('dopomode-last', 'index.html');
    } else {
      setItem('dopomode-last', file);
    }
  }

  window.DopoAuth = {
    login: function () {
      setItem('dopomode-auth', '1');
    },
    logout: function () {
      delItem('dopomode-auth');
    }
  };

  function getHomePage(targetFolder) {
    let homeFile = 'index.html';
    if (authed) {
      homeFile = 'pages/main.html';
    }

    if (path.indexOf('/ukr/') !== -1) {
      let ukrRoot = path.substring(0, path.indexOf('/ukr/') + 1);
      return ukrRoot + targetFolder + '/' + homeFile;
    }

    if (path.indexOf('/eng/') !== -1) {
      let engRoot = path.substring(0, path.indexOf('/eng/') + 1);
      return engRoot + targetFolder + '/' + homeFile;
    }

    let prefix = '';
    if (path.indexOf('/pages/') !== -1) {
      prefix = '../../';
    } else {
      prefix = '../';
    }
    return prefix + targetFolder + '/' + homeFile;
  }

  function openLangFolder(chosenLang, event) {
    let targetFolder = (chosenLang === 'ukr') ? 'ukr' : 'eng';
    let homeUrl = getHomePage(targetFolder);
    const last = getItem('dopomode-last');
    if (last && /^(?:about(?:_1)?|main|profile|log_in|sign_in|forget_pass|theory(?:[2-9]|1[0-5])?)\.html$/.test(last)) {
      // Resolve from the language folder regardless of authentication state.
      homeUrl = new URL('../../' + targetFolder + '/pages/' + last, location.href).href;
    }

    if (event) {
      event.preventDefault();
    }
    setItem('dopomode-lang', targetFolder);
    location.href = homeUrl;
  }

  function getLanguagePageUrl() {
    let prefix = '';
    if (inPages) {
      prefix = '';
    } else {
      prefix = 'pages/';
    }
    return prefix + 'language.html';
  }

  document.addEventListener('DOMContentLoaded', function () {
    let langSwitchBtns = document.querySelectorAll('header .lang-btn, header .btn-language, .open-language-btn');
    for (let i = 0; i < langSwitchBtns.length; i++) {
      let switchBtn = langSwitchBtns[i];
      switchBtn.setAttribute('href', getLanguagePageUrl());
      switchBtn.addEventListener('click', function (e) {
        e.preventDefault();
        location.href = getLanguagePageUrl();
      });
    }

    let langChoices = document.querySelectorAll('[data-lang], .language-card.ua, .language-card.en');
    for (let i = 0; i < langChoices.length; i++) {
      let choiceBtn = langChoices[i];
      choiceBtn.addEventListener('click', function (e) {
        let chosen = choiceBtn.getAttribute('data-lang');
        if (!chosen) {
          if (choiceBtn.classList.contains('ua')) {
            chosen = 'ukr';
          } else {
            chosen = 'eng';
          }
        }
        openLangFolder(chosen, e);
      });
    }

    if (['log_in.html', 'sign_in.html', 'forget_pass.html'].includes(file)) {
      document.addEventListener('submit', function (e) {
        e.preventDefault();
        window.DopoAuth.login(); // Local demo state only, not authentication.
        location.href = 'main.html';
      });
    }

    let out = document.getElementById('logoutBtn');
    if (out) {
      out.addEventListener('click', function (e) {
        e.preventDefault();
        window.DopoAuth.logout();
        location.href = out.getAttribute('href');
      });
    }

    if (!authed) {
      const header = document.querySelector('header');
      if (header) {
        header.querySelectorAll('.profile-link').forEach(function (profile) {
          const login = document.createElement('a');
          login.className = 'btn-login guest-auth';
          login.href = base + 'log_in.html';
          login.textContent = isUkr ? 'Увійти' : 'Log in';
          const signup = document.createElement('a');
          signup.className = 'btn-signin guest-auth';
          signup.href = base + 'sign_in.html';
          signup.textContent = isUkr ? 'Реєстрація' : 'Sign in';
          profile.replaceWith(login, signup);
        });
        header.querySelectorAll('nav a, a.logo, a.header-logo').forEach(function (link) {
          const href = link.getAttribute('href');
          if (href === 'main.html') link.href = '../index.html';
          if (href === 'about_1.html') link.href = 'about.html';
        });
      }
    }

    if (authed) {
      let header = document.querySelector('header');
      if (header) {
        let navLinks = header.querySelectorAll('a.nav-link, nav a, a.logo, a.header-logo');
        for (let i = 0; i < navLinks.length; i++) {
          let href = navLinks[i].getAttribute('href') || '';
          if (href === 'index.html' || href === './index.html' || href.endsWith('/index.html')) {
            navLinks[i].setAttribute('href', base + 'main.html');
          }
        }

        let loginBtn = header.querySelector('.btn-login');
        let signinBtn = header.querySelector('.btn-signin');
        let hasProfile = header.querySelector('.profile-link, #userProfile .user-name');

        if ((loginBtn || signinBtn) && !hasProfile) {
          let chip = document.createElement('a');
          chip.className = 'user-chip';
          chip.href = base + 'profile.html';

          let imgPath = '../images/user.png';
          if (inPages) {
            imgPath = '../../images/user.png';
          }
          const img = document.createElement('img');
          img.alt = '';
          img.src = imgPath;
          const label = document.createElement('span');
          label.textContent = 'User67';
          chip.append(label, img);

          let targetEl = loginBtn || signinBtn;
          targetEl.parentNode.insertBefore(chip, targetEl);
        }

        if (loginBtn) {
          loginBtn.remove();
        }
        if (signinBtn) {
          signinBtn.remove();
        }

        let up = document.getElementById('userProfile');
        let ab = document.getElementById('authButtons');
        if (up) {
          up.style.display = 'flex';
        }
        if (ab) {
          ab.style.display = 'none';
        }
      }
    }

    function updateThemeLabel(btn) {
      let isDark = (doc.getAttribute('data-theme') === 'dark');
      if (isDark) {
        btn.textContent = '☀';
      } else {
        btn.textContent = '☾';
      }

      let titleText = '';
      if (isUkr) {
        titleText = isDark ? 'Світла тема' : 'Темна тема';
      } else {
        titleText = isDark ? 'Light theme' : 'Dark theme';
      }
      btn.title = titleText;
      btn.setAttribute('aria-label', titleText);
    }

    let themeAnchors = document.querySelectorAll('header .lang-btn, header .btn-language');
    for (let i = 0; i < themeAnchors.length; i++) {
      let anchor = themeAnchors[i];
      let btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-btn';
      updateThemeLabel(btn);

      btn.addEventListener('click', function () {
        let current = doc.getAttribute('data-theme');
        let next = (current === 'dark') ? 'light' : 'dark';
        applyTheme(next);
        setItem('dopomode-theme', next);

        let allThemeBtns = document.querySelectorAll('.theme-btn');
        for (let j = 0; j < allThemeBtns.length; j++) {
          updateThemeLabel(allThemeBtns[j]);
        }
      });

      anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    }

    let side = document.querySelector('.sidebar');
    if (side) {
      let tg = document.createElement('button');
      tg.type = 'button';
      tg.className = 'sidebar-toggle';
      if (isUkr) {
        tg.textContent = '☰ Меню курсу';
      } else {
        tg.textContent = '☰ Course menu';
      }
      tg.setAttribute('aria-expanded', 'false');

      tg.addEventListener('click', function () {
        let isOpen = side.classList.toggle('open');
        if (isOpen) {
          tg.setAttribute('aria-expanded', 'true');
        } else {
          tg.setAttribute('aria-expanded', 'false');
        }
      });

      side.parentNode.insertBefore(tg, side);
    }
  });
})();